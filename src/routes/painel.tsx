import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, ListChecks, Target } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [
      { title: "Painel de estudos — Instituto Underground" },
      { name: "description", content: "Acompanhe apostilas criadas, progresso de leitura, quizzes e tempo de estudo." },
      { property: "og:title", content: "Painel de estudos — Instituto Underground" },
      { property: "og:description", content: "Suas estatísticas de aprendizado em um só lugar." },
    ],
  }),
  component: Panel,
});

function Panel() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["panel", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const [materials, quizzes] = await Promise.all([
        supabase.from("study_materials").select("id, topic, title, read_progress, minutes_studied, created_at"),
        supabase.from("quizzes").select("score, total, completed_at"),
      ]);
      return { materials: materials.data ?? [], quizzes: quizzes.data ?? [] };
    },
  });

  const materials = data?.materials ?? [];
  const quizzes = (data?.quizzes ?? []).filter((q) => q.completed_at);
  const minutes = materials.reduce((sum, m) => sum + (m.minutes_studied ?? 0), 0);
  const avgProgress = materials.length
    ? Math.round(materials.reduce((s, m) => s + (m.read_progress ?? 0), 0) / materials.length)
    : 0;
  const avgScore = quizzes.length
    ? Math.round(
        (quizzes.reduce((s, q) => s + (q.score ?? 0) / Math.max(q.total, 1), 0) / quizzes.length) * 100,
      )
    : 0;

  if (!loading && !user) {
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="font-mono text-xl tracking-[0.15em] text-neon">PAINEL</h1>
          <p className="mt-3 text-sm text-muted-foreground">Entre para acompanhar suas estatísticas de estudo.</p>
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
        <h1 className="font-mono text-xl tracking-[0.15em] text-neon">PAINEL DE ESTUDOS</h1>
        <p className="mt-2 text-sm text-muted-foreground">Um raio-x da sua jornada no laboratório.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={<BookOpen className="size-4" />} label="Apostilas criadas" value={String(materials.length)} />
          <Stat icon={<Target className="size-4" />} label="Progresso médio" value={`${avgProgress}%`} />
          <Stat icon={<ListChecks className="size-4" />} label="Quizzes concluídos" value={String(quizzes.length)} />
          <Stat icon={<Clock className="size-4" />} label="Tempo estudado" value={`${minutes} min`} />
        </div>

        {quizzes.length > 0 && (
          <div className="panel mt-6 p-5">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Desempenho médio nos quizzes
            </h2>
            <p className="mt-2 font-mono text-3xl text-neon">{avgScore}%</p>
            <Progress value={avgScore} className="mt-3" />
          </div>
        )}

        <h2 className="mt-10 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Progresso por apostila
        </h2>
        <div className="mt-4 space-y-3">
          {materials.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma apostila ainda.</p>}
          {materials.map((m) => (
            <div key={m.id} className="panel p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground">{m.title ?? m.topic}</span>
                <span className="font-mono text-xs text-primary">{m.read_progress}%</span>
              </div>
              <Progress value={m.read_progress} className="mt-2" />
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="panel p-5">
      <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
        {icon}
        {label}
      </span>
      <p className="mt-3 font-mono text-3xl text-neon">{value}</p>
    </div>
  );
}
