import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, Download, Trash2 } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { buildMarkdown, downloadFile } from "@/lib/export";

export const Route = createFileRoute("/meus-estudos")({
  head: () => ({
    meta: [
      { title: "Meus estudos — Instituto Underground" },
      { name: "description", content: "Histórico das apostilas geradas, com progresso, nível e exportação." },
      { property: "og:title", content: "Meus estudos — Instituto Underground" },
      { property: "og:description", content: "Continue de onde parou nas suas apostilas geradas por IA." },
    ],
  }),
  component: MyStudies,
});

function MyStudies() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: materials = [] } = useQuery({
    queryKey: ["materials", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_materials")
        .select("id, topic, title, level, status, read_progress, outline, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function remove(id: string) {
    const { error } = await supabase.from("study_materials").delete().eq("id", id);
    if (error) return toast.error("Não foi possível excluir.");
    toast.success("Apostila excluída.");
    void qc.invalidateQueries({ queryKey: ["materials"] });
  }

  async function exportMd(id: string) {
    const [{ data: material }, { data: chapters }, { data: sources }] = await Promise.all([
      supabase.from("study_materials").select("*").eq("id", id).single(),
      supabase.from("chapters").select("title, content").eq("material_id", id).order("position"),
      supabase.from("sources").select("title, domain, url, accessed_at").eq("material_id", id),
    ]);
    if (!material) return toast.error("Apostila não encontrada.");
    const md = buildMarkdown(material, chapters ?? [], sources ?? []);
    downloadFile(`${material.title ?? material.topic}.md`, md, "text/markdown");
  }

  if (!loading && !user) {
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="font-mono text-xl tracking-[0.15em] text-neon">MEUS ESTUDOS</h1>
          <p className="mt-3 text-sm text-muted-foreground">Entre para ver o histórico das suas apostilas.</p>
          <Button className="mt-6" onClick={() => navigate({ to: "/auth" })}>
            Entrar
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="font-mono text-xl tracking-[0.15em] text-neon">MEUS ESTUDOS</h1>
        <p className="mt-2 text-sm text-muted-foreground">Todas as apostilas que você já gerou.</p>

        {materials.length === 0 ? (
          <div className="panel mt-8 p-10 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma apostila ainda.</p>
            <Link to="/">
              <Button className="mt-4 font-mono tracking-wide">GERAR APOSTILA</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {materials.map((m) => {
              const chapters = Array.isArray(m.outline) ? m.outline.length : 0;
              return (
                <article key={m.id} className="panel p-5 transition-colors hover:border-primary/50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">{m.title ?? m.topic}</h2>
                      <p className="mt-1 font-mono text-xs uppercase tracking-widest text-primary">
                        {m.topic} — {m.level}
                      </p>
                    </div>
                    <span className="rounded-full border border-border/70 px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground">
                      {m.status === "ready" ? "pronta" : "em geração"}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {chapters} capítulos · {new Date(m.created_at).toLocaleDateString("pt-BR")}
                  </p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progresso</span>
                      <span>{m.read_progress}%</span>
                    </div>
                    <Progress value={m.read_progress} className="mt-1" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to="/estudo/$id" params={{ id: m.id }}>
                      <Button size="sm" className="font-mono text-xs tracking-wide">
                        <BookOpen className="size-3.5" /> CONTINUAR
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => exportMd(m.id)}>
                      <Download className="size-3.5" /> Markdown
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>
                      <Trash2 className="size-3.5" /> Excluir
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
}
