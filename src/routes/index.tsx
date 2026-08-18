import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Check, CircleDashed, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CreditsBar } from "@/components/CreditsBar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/useAuth";
import { useCredits } from "@/lib/useCredits";
import { createStudyMaterial, finalizeMaterial, generateChapter } from "@/lib/study.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Instituto Underground — Gerador Inteligente de Estudos" },
      {
        name: "description",
        content:
          "Transforme qualquer assunto em uma apostila completa com IA: teoria, exemplos, exercícios, quiz, flashcards e exportação em PDF.",
      },
      { property: "og:title", content: "Instituto Underground — Gerador Inteligente de Estudos" },
      {
        property: "og:description",
        content: "Transforme qualquer assunto em uma experiência completa de aprendizado.",
      },
    ],
  }),
  component: Index,
});

const LEVELS = [
  { id: "iniciante", label: "Iniciante", desc: "Explicações simples, analogias e conceitos fundamentais." },
  { id: "intermediario", label: "Intermediário", desc: "Equilíbrio entre teoria e prática, exemplos e exercícios." },
  { id: "avancado", label: "Avançado", desc: "Técnico e profundo: casos de borda, arquitetura e otimização." },
] as const;

const FOCUSES = [
  { id: "teorico", label: "Teórico e Conceitual", desc: "Definições, modelos mentais e fundamentação." },
  { id: "pratico", label: "Prático e Exercícios", desc: "Aplicação, passo a passo e muitos exercícios." },
  { id: "equilibrado", label: "Equilibrado", desc: "Teoria e prática na mesma proporção." },
] as const;

const SIZES = [
  { id: "resumida", label: "Resumida" },
  { id: "normal", label: "Normal" },
  { id: "completa", label: "Completa" },
  { id: "profunda", label: "Profunda" },
] as const;

const MESSAGES = [
  "Pesquisando conhecimento...",
  "Construindo sua apostila...",
  "Organizando os conceitos...",
  "Preparando exercícios...",
  "Revisando o material...",
];

type StepState = "pending" | "running" | "done" | "error";
type Step = { key: string; label: string; state: StepState };

function Index() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const create = useServerFn(createStudyMaterial);
  const chapter = useServerFn(generateChapter);
  const finalize = useServerFn(finalizeMaterial);

  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number]["id"]>("intermediario");
  const [focus, setFocus] = useState<(typeof FOCUSES)[number]["id"]>("equilibrado");
  const [size, setSize] = useState<(typeof SIZES)[number]["id"]>("completa");

  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [message, setMessage] = useState(MESSAGES[0]);
  const [materialId, setMaterialId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const done = steps.filter((s) => s.state === "done").length;
  const percent = steps.length ? Math.round((done / steps.length) * 100) : 0;

  function setStep(key: string, state: StepState) {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, state } : s)));
  }

  async function run(existingId?: string) {
    setRunning(true);
    setFailed(false);
    let id = existingId ?? null;

    try {
      let sections: { slug: string; title: string }[] = [];

      if (!id) {
        setSteps([
          { key: "analise", label: "Analisando assunto", state: "running" },
          { key: "fontes", label: "Pesquisando fontes", state: "pending" },
          { key: "estrutura", label: "Estruturando conteúdo", state: "pending" },
        ]);
        setMessage(MESSAGES[0]!);
        const result = await create({ data: { topic: topic.trim(), level, focus, size } });
        id = result.materialId;
        setMaterialId(id);
        sections = result.sections;
        setSteps([
          { key: "analise", label: "Analisando assunto", state: "done" },
          { key: "fontes", label: "Pesquisando fontes", state: "done" },
          { key: "estrutura", label: "Estruturando conteúdo", state: "done" },
          ...sections.map((s) => ({ key: s.slug, label: `Gerando ${s.title.toLowerCase()}`, state: "pending" as const })),
          { key: "final", label: "Finalizando apostila", state: "pending" as const },
        ]);
      } else {
        sections = steps
          .filter((s) => !["analise", "fontes", "estrutura", "final"].includes(s.key))
          .map((s) => ({ slug: s.key, title: s.label }));
      }

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i]!;
        setStep(section.slug, "running");
        setMessage(MESSAGES[i % MESSAGES.length]!);
        // Fila sequencial: uma requisição de IA por vez (evita rate limit).
        await chapter({ data: { materialId: id, position: i } });
        setStep(section.slug, "done");
      }

      setStep("final", "running");
      await finalize({ data: { materialId: id } });
      setStep("final", "done");
      navigate({ to: "/estudo/$id", params: { id } });
    } catch (error) {
      setFailed(true);
      setSteps((prev) => prev.map((s) => (s.state === "running" ? { ...s, state: "error" } : s)));
      toast.error(
        error instanceof Error
          ? error.message
          : "A IA está temporariamente ocupada. Tente continuar em alguns instantes.",
      );
    } finally {
      setRunning(false);
    }
  }

  function start() {
    if (!user) {
      toast.info("Entre para gerar sua apostila.");
      navigate({ to: "/auth" });
      return;
    }
    if (topic.trim().length < 2) {
      toast.error("Informe um assunto para estudar.");
      return;
    }
    if (credits.blocked) {
      toast.error("Seus créditos acabaram. Recarregue para gerar novas apostilas.");
      return;
    }
    void run().then(() => credits.refresh());
  }

  const processing = running || failed || steps.length > 0;

  return (
    <Shell>
      <section className="grid-noise border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[11px] tracking-[0.2em] text-primary">
            <Sparkles className="size-3" /> LABORATÓRIO DE ESTUDOS COM IA
          </p>
          <h1 className="font-mono text-3xl font-bold tracking-[0.12em] text-neon sm:text-5xl">
            INSTITUTO UNDERGROUND
          </h1>
          <p className="mt-3 text-lg text-foreground/80">Gerador Inteligente de Estudos</p>
          <p className="mx-auto mt-5 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Transforme qualquer assunto em uma experiência completa de aprendizado
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {!processing ? (
          <div className="panel p-5 shadow-[var(--shadow-panel)] sm:p-8">
            <label htmlFor="topic" className="font-mono text-sm tracking-wide text-primary">
              &gt; O que você deseja estudar?
            </label>
            <Textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={160}
              placeholder="Digite um assunto, por exemplo: Programação em Python"
              className="mt-3 min-h-28 resize-none border-border/70 bg-background/60 font-mono text-base"
            />

            <Group title="Nível do conteúdo">
              {LEVELS.map((option) => (
                <OptionCard
                  key={option.id}
                  active={level === option.id}
                  title={option.label}
                  desc={option.desc}
                  onClick={() => setLevel(option.id)}
                />
              ))}
            </Group>

            <Group title="Foco pedagógico">
              {FOCUSES.map((option) => (
                <OptionCard
                  key={option.id}
                  active={focus === option.id}
                  title={option.label}
                  desc={option.desc}
                  onClick={() => setFocus(option.id)}
                />
              ))}
            </Group>

            <div className="mt-8">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Tamanho da apostila</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {SIZES.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSize(option.id)}
                    className={`rounded-lg border px-4 py-2 text-sm transition-all ${
                      size === option.id
                        ? "border-primary/60 bg-primary/15 text-primary shadow-[var(--shadow-neon)]"
                        : "border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={start}
              disabled={authLoading}
              className="mt-8 h-14 w-full font-mono text-base tracking-[0.2em] shadow-[var(--shadow-neon)]"
            >
              GERAR APOSTILA
            </Button>
            {!user && !authLoading && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                É necessário entrar para salvar e acompanhar seus estudos.
              </p>
            )}
          </div>
        ) : (
          <div className="panel relative overflow-hidden p-5 shadow-[var(--shadow-panel)] sm:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/15 to-transparent animate-scan" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-mono text-sm tracking-[0.18em] text-neon">PROCESSANDO APOSTILA</h2>
              <span className="font-mono text-sm text-primary">{percent}%</span>
            </div>
            <Progress value={percent} className="mt-4" />
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              {running && <Loader2 className="size-4 animate-spin text-primary" />}
              {failed ? "A IA está temporariamente ocupada. Você pode continuar de onde parou." : message}
            </p>

            <ul className="mt-6 space-y-2 font-mono text-sm">
              {steps.map((step) => (
                <li key={step.key} className="flex items-center gap-3">
                  <span className="w-5 text-center">
                    {step.state === "done" && <Check className="size-4 text-primary" />}
                    {step.state === "running" && <Loader2 className="size-4 animate-spin text-primary" />}
                    {step.state === "pending" && <CircleDashed className="size-4 text-muted-foreground/60" />}
                    {step.state === "error" && <TriangleAlert className="size-4 text-destructive" />}
                  </span>
                  <span
                    className={
                      step.state === "done"
                        ? "text-foreground"
                        : step.state === "running"
                          ? "text-primary animate-pulse-neon"
                          : step.state === "error"
                            ? "text-destructive"
                            : "text-muted-foreground/70"
                    }
                  >
                    [{step.state === "done" ? "✓" : step.state === "error" ? "!" : " "}] {step.label}
                  </span>
                </li>
              ))}
            </ul>

            {failed && (
              <div className="mt-6 flex flex-wrap gap-2">
                <Button onClick={() => materialId && void run(materialId)} className="font-mono tracking-wide">
                  CONTINUAR GERAÇÃO
                </Button>
                {materialId && (
                  <Button
                    variant="outline"
                    onClick={() => navigate({ to: "/estudo/$id", params: { id: materialId } })}
                  >
                    Ver o que já foi gerado
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </Shell>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">{children}</div>
    </div>
  );
}

function OptionCard({
  active,
  title,
  desc,
  onClick,
}: {
  active: boolean;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-all ${
        active
          ? "border-primary/60 bg-primary/10 shadow-[var(--shadow-neon)]"
          : "border-border/70 bg-card/40 hover:border-primary/40"
      }`}
    >
      <span className={`block text-sm font-semibold ${active ? "text-primary" : "text-foreground"}`}>{title}</span>
      <span className="mt-1 block text-xs text-muted-foreground">{desc}</span>
    </button>
  );
}
