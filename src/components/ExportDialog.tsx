import { useEffect, useState, type ReactNode } from "react";
import { Download, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  buildMarkdown,
  downloadFile,
  exportPdf,
  type ExportChapter,
  type ExportMaterial,
  type ExportSource,
} from "@/lib/export";

type Props = {
  material: ExportMaterial;
  chapters: (ExportChapter & { id?: string })[];
  sources: ExportSource[];
  trigger?: ReactNode;
};

export function ExportDialog({ material, chapters, sources, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [withIntro, setWithIntro] = useState(true);
  const [withObjectives, setWithObjectives] = useState(true);
  const [withSources, setWithSources] = useState(true);

  useEffect(() => {
    setSelected(chapters.map((_, i) => i));
  }, [chapters]);

  function toggle(i: number) {
    setSelected((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort((a, b) => a - b)));
  }

  function payload() {
    const picked = chapters.filter((_, i) => selected.includes(i)).map((c) => ({ title: c.title, content: c.content }));
    const mat: ExportMaterial = {
      ...material,
      intro: withIntro ? material.intro : null,
      objectives: withObjectives ? material.objectives : null,
    };
    return { mat, picked, srcs: withSources ? sources : [] };
  }

  function toPdf() {
    const { mat, picked, srcs } = payload();
    exportPdf(mat, picked, srcs);
    setOpen(false);
  }

  function toMarkdown() {
    const { mat, picked, srcs } = payload();
    const md = buildMarkdown(mat, picked, srcs);
    downloadFile(`${mat.title ?? mat.topic}.md`, md, "text/markdown");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Download className="size-3.5" /> Exportar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm tracking-[0.15em] text-neon">EXPORTAR APOSTILA</DialogTitle>
          <DialogDescription>Escolha as partes que devem entrar no arquivo gerado.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2 text-sm">
            <Checkbox checked={withIntro} onCheckedChange={(v) => setWithIntro(v === true)} />
            Introdução
          </label>
          <label className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2 text-sm">
            <Checkbox checked={withObjectives} onCheckedChange={(v) => setWithObjectives(v === true)} />
            Objetivos de aprendizagem
          </label>
        </div>

        <div className="mt-2">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Capítulos</p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setSelected(chapters.map((_, i) => i))}>
                Todos
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                Nenhum
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {chapters.map((c, i) => (
              <label
                key={c.id ?? `${c.title}-${i}`}
                className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2 text-sm"
              >
                <Checkbox checked={selected.includes(i)} onCheckedChange={() => toggle(i)} />
                <span className="font-mono text-[10px] text-primary">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1">{c.title}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2 text-sm">
          <Checkbox checked={withSources} onCheckedChange={(v) => setWithSources(v === true)} />
          Fontes consultadas
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button className="font-mono tracking-wide" onClick={toPdf}>
            <Download className="size-4" /> GERAR PDF
          </Button>
          <Button variant="outline" onClick={toMarkdown}>
            <FileText className="size-4" /> Markdown
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
