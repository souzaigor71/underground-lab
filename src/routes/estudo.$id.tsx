import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bookmark,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Layers,
  Loader2,
  NotebookPen,
  RotateCcw,
  X,
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { Markdown } from "@/components/Markdown";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { buildMarkdown, downloadFile, exportPdf } from "@/lib/export";
import { generateFlashcards, generateQuiz } from "@/lib/study.functions";

export const Route = createFileRoute("/estudo/$id")({
  validateSearch: (search: Record<string, unknown>): { inicio?: boolean } =>
    search['inicio'] === true || search['inicio'] === "true" ? { inicio: true } : {},
  head: () => ({
    meta: [
      { title: "Apostila de estudo — Instituto Underground" },
      { name: "description", content: "Leia sua apostila gerada por IA com quiz, flashcards, anotações e exportação." },
      { property: "og:title", content: "Apostila de estudo — Instituto Underground" },
      { property: "og:description", content: "Leitura, quiz e flashcards gerados sob medida para o seu assunto." },
    ],
  }),
  component: StudyReader,
});

type Tab = "leitura" | "quiz" | "flashcards" | "anotacoes";
const TABS: Tab[] = ["leitura", "quiz", "flashcards", "anotacoes"];

function StudyReader() {
  const { id } = Route.useParams();
  const { inicio } = Route.useSearch();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("leitura");
  const [current, setCurrent] = useState(0);
  const [sidebar, setSidebar] = useState(false);
  const [resumed, setResumed] = useState(false);
  const startedAt = useRef(Date.now());

  const { data, isLoading } = useQuery({
    queryKey: ["material", id],
    queryFn: async () => {
      const [material, chapters, sources, bookmarks, notes] = await Promise.all([
        supabase.from("study_materials").select("*").eq("id", id).single(),
        supabase.from("chapters").select("id, position, slug, title, content").eq("material_id", id).order("position"),
        supabase.from("sources").select("title, domain, url, accessed_at").eq("material_id", id),
        supabase.from("bookmarks").select("id, section_slug, section_title").eq("material_id", id),
        supabase.from("notes").select("id, section_slug, section_title, body").eq("material_id", id),
      ]);
      return {
        material: material.data,
        chapters: chapters.data ?? [],
        sources: sources.data ?? [],
        bookmarks: bookmarks.data ?? [],
        notes: notes.data ?? [],
      };
    },
  });

  const material = data?.material;
  const chapters = useMemo(() => data?.chapters ?? [], [data]);
  const chapter = chapters[current];
  const progress = chapters.length ? Math.round(((current + 1) / chapters.length) * 100) : 0;

  // Persiste progresso de leitura e tempo estudado.
  useEffect(() => {
    if (!material || !chapters.length) return;
    const minutes = Math.round((Date.now() - startedAt.current) / 60000);
    void supabase
      .from("study_materials")
      .update({
        read_progress: Math.max(progress, material.read_progress ?? 0),
        minutes_studied: (material.minutes_studied ?? 0) + (minutes > 0 ? 1 : 0),
      })
      .eq("id", id);
  }, [current, chapters.length, id, material, progress]);

  if (isLoading) {
    return (
      <Shell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  if (!material) {
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="font-mono text-xl text-neon">APOSTILA NÃO ENCONTRADA</h1>
          <Link to="/meus-estudos">
            <Button className="mt-6">Ver meus estudos</Button>
          </Link>
        </div>
      </Shell>
    );
  }

  const isBookmarked = (slug: string) => (data?.bookmarks ?? []).some((b) => b.section_slug === slug);

  async function toggleBookmark() {
    if (!chapter || !user) return;
    const existing = (data?.bookmarks ?? []).find((b) => b.section_slug === chapter.slug);
    if (existing) {
      await supabase.from("bookmarks").delete().eq("id", existing.id);
    } else {
      await supabase.from("bookmarks").insert({
        user_id: user.id,
        material_id: id,
        section_slug: chapter.slug,
        section_title: chapter.title,
      });
    }
    void qc.invalidateQueries({ queryKey: ["material", id] });
  }

  function exportMarkdown() {
    const md = buildMarkdown(material!, chapters, data?.sources ?? []);
    downloadFile(`${material!.title ?? material!.topic}.md`, md, "text/markdown");
  }

  return (
    <Shell>
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 sm:px-6">
        {/* Sidebar / Sumário */}
        <aside
          className={`${
            sidebar ? "fixed inset-0 z-40 block bg-background/95 p-4 backdrop-blur" : "hidden"
          } lg:sticky lg:top-24 lg:block lg:h-[calc(100vh-8rem)] lg:w-72 lg:shrink-0 lg:bg-transparent lg:p-0`}
        >
          <div className="panel h-full overflow-y-auto p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Sumário</h2>
              <button className="lg:hidden" onClick={() => setSidebar(false)} aria-label="Fechar sumário">
                <X className="size-4" />
              </button>
            </div>
            <ol className="space-y-1">
              {chapters.map((c, i) => (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      setCurrent(i);
                      setTab("leitura");
                      setSidebar(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                      i === current ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="font-mono text-[10px] opacity-70">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex-1">{c.title}</span>
                    {isBookmarked(c.slug) && <Bookmark className="size-3 fill-primary text-primary" />}
                    {c.content ? <Check className="size-3 text-primary/70" /> : null}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="panel p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">{material.topic}</p>
            <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">{material.title ?? material.topic}</h1>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso de leitura</span>
                <span className="font-mono text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="mt-1" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="lg:hidden" onClick={() => setSidebar(true)}>
                <Layers className="size-3.5" /> Sumário
              </Button>
              <Button size="sm" onClick={() => exportPdf(material, chapters, data?.sources ?? [])}>
                <Download className="size-3.5" /> Baixar PDF
              </Button>
              <ExportDialog
                material={material}
                chapters={chapters}
                sources={data?.sources ?? []}
                trigger={
                  <Button size="sm" variant="outline">
                    <FileText className="size-3.5" /> Exportar partes
                  </Button>
                }
              />
              <Button size="sm" variant="ghost" onClick={toggleBookmark}>
                <Bookmark
                  className={`size-3.5 ${chapter && isBookmarked(chapter.slug) ? "fill-primary text-primary" : ""}`}
                />
                Marcar seção
              </Button>
            </div>
          </header>

          <nav className="mt-6 flex flex-wrap gap-2 border-b border-border/60 pb-2">
            {(
              [
                ["leitura", "Leitura", <BookOpen key="a" className="size-3.5" />],
                ["quiz", "Quiz", <Check key="b" className="size-3.5" />],
                ["flashcards", "Flashcards", <Layers key="c" className="size-3.5" />],
                ["anotacoes", "Anotações", <NotebookPen key="d" className="size-3.5" />],
              ] as const
            ).map(([key, label, icon]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`inline-flex items-center gap-2 rounded-t-md px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
                  tab === key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </nav>

          {tab === "leitura" && (
            <article className="panel mt-6 p-5 sm:p-8">
              {current === 0 && material.intro && (
                <div className="mb-8 border-l-2 border-primary/50 pl-4">
                  <Markdown>{material.intro}</Markdown>
                  {material.objectives && (
                    <div className="mt-4">
                      <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
                        Objetivos de aprendizagem
                      </h3>
                      <Markdown>{material.objectives}</Markdown>
                    </div>
                  )}
                </div>
              )}
              {chapter?.content ? (
                <Markdown>{chapter.content}</Markdown>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Este capítulo ainda não foi gerado. Volte à página inicial para continuar a geração.
                </p>
              )}

              <div className="mt-10 flex items-center justify-between gap-3 border-t border-border/60 pt-5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={current === 0}
                  onClick={() => {
                    setCurrent((c) => Math.max(0, c - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <ChevronLeft className="size-4" /> Anterior
                </Button>
                <span className="font-mono text-xs text-muted-foreground">
                  {current + 1} / {chapters.length}
                </span>
                <Button
                  size="sm"
                  disabled={current >= chapters.length - 1}
                  onClick={() => {
                    setCurrent((c) => Math.min(chapters.length - 1, c + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Próximo <ChevronRight className="size-4" />
                </Button>
              </div>

              {(data?.sources ?? []).length > 0 && current === chapters.length - 1 && (
                <div className="mt-8 border-t border-border/60 pt-5">
                  <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Fontes consultadas</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {(data?.sources ?? []).map((s) => (
                      <li key={s.url}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-primary hover:underline"
                        >
                          {s.title}
                        </a>
                        <span className="text-muted-foreground">
                          {" "}
                          — {s.domain} — acesso em {new Date(s.accessed_at).toLocaleDateString("pt-BR")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          )}

          {tab === "quiz" && <QuizPanel materialId={id} />}
          {tab === "flashcards" && <FlashcardsPanel materialId={id} />}
          {tab === "anotacoes" && (
            <NotesPanel
              materialId={id}
              sectionSlug={chapter?.slug ?? "geral"}
              sectionTitle={chapter?.title ?? "Geral"}
              notes={data?.notes ?? []}
            />
          )}
        </main>
      </div>
    </Shell>
  );
}

type QuizQuestion = {
  id: string;
  position: number;
  kind: string;
  question: string;
  options: unknown;
  answer: string;
  explanation: string;
};

function QuizPanel({ materialId }: { materialId: string }) {
  const generate = useServerFn(generateQuiz);
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function build() {
    setLoading(true);
    setSubmitted(false);
    setAnswers({});
    try {
      const result = await generate({ data: { materialId } });
      setQuizId(result.quizId);
      setQuestions(result.questions as QuizQuestion[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o quiz.");
    } finally {
      setLoading(false);
    }
  }

  const score = (questions ?? []).filter(
    (q) => (answers[q.id] ?? "").trim().toLowerCase() === q.answer.trim().toLowerCase(),
  ).length;

  async function submit() {
    setSubmitted(true);
    if (!quizId || !questions) return;
    await supabase
      .from("quizzes")
      .update({ score, total: questions.length, completed_at: new Date().toISOString() })
      .eq("id", quizId);
    await Promise.all(
      questions.map((q) =>
        supabase
          .from("quiz_questions")
          .update({
            user_answer: answers[q.id] ?? "",
            is_correct: (answers[q.id] ?? "").trim().toLowerCase() === q.answer.trim().toLowerCase(),
          })
          .eq("id", q.id),
      ),
    );
  }

  if (!questions) {
    return (
      <div className="panel mt-6 p-8 text-center">
        <h2 className="font-mono text-sm tracking-[0.15em] text-neon">QUIZ INTERATIVO</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Gere um quiz com múltipla escolha, verdadeiro/falso e questões abertas sobre esta apostila.
        </p>
        <Button className="mt-5 font-mono tracking-wide" onClick={build} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null} GERAR QUIZ
        </Button>
      </div>
    );
  }

  return (
    <div className="panel mt-6 p-5 sm:p-8">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-sm tracking-[0.15em] text-neon">QUIZ</h2>
        <Button size="sm" variant="ghost" onClick={build} disabled={loading}>
          <RotateCcw className="size-3.5" /> Novo quiz
        </Button>
      </div>

      <ol className="mt-6 space-y-6">
        {questions.map((q, i) => {
          const options = Array.isArray(q.options) ? (q.options as string[]) : [];
          const userAnswer = answers[q.id] ?? "";
          const correct = userAnswer.trim().toLowerCase() === q.answer.trim().toLowerCase();
          return (
            <li key={q.id} className="border-b border-border/50 pb-5 last:border-0">
              <p className="text-sm font-medium text-foreground">
                <span className="font-mono text-primary">{String(i + 1).padStart(2, "0")}.</span> {q.question}
              </p>
              {options.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {options.map((opt) => (
                    <button
                      key={opt}
                      disabled={submitted}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                      className={`block w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        userAnswer === opt
                          ? "border-primary/60 bg-primary/10 text-primary"
                          : "border-border/70 text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <Textarea
                  disabled={submitted}
                  value={userAnswer}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  placeholder="Sua resposta..."
                  className="mt-3 min-h-20"
                />
              )}
              {submitted && (
                <div
                  className={`mt-3 rounded-lg border p-3 text-sm ${
                    correct ? "border-primary/50 bg-primary/10" : "border-destructive/50 bg-destructive/10"
                  }`}
                >
                  <p className="font-mono text-xs uppercase tracking-widest">
                    {correct ? "Correto" : `Resposta: ${q.answer}`}
                  </p>
                  {q.explanation && <p className="mt-1 text-muted-foreground">{q.explanation}</p>}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {!submitted ? (
        <Button className="mt-6 font-mono tracking-wide" onClick={submit}>
          CORRIGIR QUIZ
        </Button>
      ) : (
        <div className="mt-6 rounded-xl border border-primary/40 bg-primary/10 p-5 text-center">
          <p className="font-mono text-3xl text-neon">
            {score}/{questions.length}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {score === questions.length
              ? "Domínio total do assunto."
              : score >= questions.length / 2
                ? "Bom desempenho — revise os pontos errados."
                : "Vale reler os capítulos antes de tentar de novo."}
          </p>
        </div>
      )}
    </div>
  );
}

function FlashcardsPanel({ materialId }: { materialId: string }) {
  const generate = useServerFn(generateFlashcards);
  const [cards, setCards] = useState<{ id: string; front: string; back: string }[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  async function build() {
    setLoading(true);
    try {
      const result = await generate({ data: { materialId } });
      setCards(result.cards);
      setIndex(0);
      setFlipped(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar os flashcards.");
    } finally {
      setLoading(false);
    }
  }

  if (!cards) {
    return (
      <div className="panel mt-6 p-8 text-center">
        <h2 className="font-mono text-sm tracking-[0.15em] text-neon">FLASHCARDS</h2>
        <p className="mt-2 text-sm text-muted-foreground">Memorize os conceitos-chave com cartões de revisão.</p>
        <Button className="mt-5 font-mono tracking-wide" onClick={build} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null} GERAR FLASHCARDS
        </Button>
      </div>
    );
  }

  const card = cards[index];

  return (
    <div className="panel mt-6 p-5 sm:p-8">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-sm tracking-[0.15em] text-neon">FLASHCARDS</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {index + 1} / {cards.length}
        </span>
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className="mt-6 flex min-h-56 w-full flex-col items-center justify-center rounded-xl border border-primary/40 bg-card/60 p-8 text-center transition-all hover:shadow-[var(--shadow-neon)]"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
          {flipped ? "Resposta" : "Pergunta"}
        </span>
        <span className="mt-4 text-lg text-foreground">{flipped ? card?.back : card?.front}</span>
        <span className="mt-6 text-xs text-muted-foreground">Clique para virar</span>
      </button>

      <div className="mt-5 flex items-center justify-between">
        <Button
          size="sm"
          variant="outline"
          disabled={index === 0}
          onClick={() => {
            setIndex((i) => i - 1);
            setFlipped(false);
          }}
        >
          <ChevronLeft className="size-4" /> Anterior
        </Button>
        <Button size="sm" variant="ghost" onClick={build} disabled={loading}>
          <RotateCcw className="size-3.5" /> Novos cartões
        </Button>
        <Button
          size="sm"
          disabled={index >= cards.length - 1}
          onClick={() => {
            setIndex((i) => i + 1);
            setFlipped(false);
          }}
        >
          Próximo <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function NotesPanel({
  materialId,
  sectionSlug,
  sectionTitle,
  notes,
}: {
  materialId: string;
  sectionSlug: string;
  sectionTitle: string;
  notes: { id: string; section_slug: string; section_title: string; body: string }[];
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  async function save() {
    if (!user || body.trim().length === 0) return;
    const { error } = await supabase.from("notes").insert({
      user_id: user.id,
      material_id: materialId,
      section_slug: sectionSlug,
      section_title: sectionTitle,
      body: body.trim(),
    });
    if (error) {
      toast.error("Não foi possível salvar a anotação.");
      return;
    }
    setBody("");
    toast.success("Anotação salva.");
    void qc.invalidateQueries({ queryKey: ["material", materialId] });
  }

  async function remove(id: string) {
    await supabase.from("notes").delete().eq("id", id);
    void qc.invalidateQueries({ queryKey: ["material", materialId] });
  }

  return (
    <div className="panel mt-6 p-5 sm:p-8">
      <h2 className="font-mono text-sm tracking-[0.15em] text-neon">ANOTAÇÕES</h2>
      <p className="mt-1 text-xs text-muted-foreground">Seção atual: {sectionTitle}</p>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Escreva sua anotação sobre esta seção..."
        className="mt-4 min-h-28"
      />
      <Button className="mt-3 font-mono tracking-wide" onClick={save}>
        SALVAR ANOTAÇÃO
      </Button>

      <div className="mt-6 space-y-3">
        {notes.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma anotação ainda.</p>}
        {notes.map((n) => (
          <div key={n.id} className="rounded-lg border border-border/70 bg-card/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-primary">{n.section_title}</p>
              <button onClick={() => remove(n.id)} aria-label="Excluir anotação">
                <X className="size-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{n.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
