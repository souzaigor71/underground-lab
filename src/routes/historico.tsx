import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Play, Search } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { MaterialExport } from "@/routes/meus-estudos";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de estudos — Instituto Underground" },
      {
        name: "description",
        content: "Busque, filtre e reabra qualquer apostila gerada, com progresso, quizzes e anotações.",
      },
      { property: "og:title", content: "Histórico de estudos — Instituto Underground" },
      { property: "og:description", content: "Todo o seu histórico de estudos em um só lugar, com busca e filtros." },
    ],
  }),
  component: History,
});

const LEVELS = ["todos", "iniciante", "intermediario", "avancado"] as const;
const STATUSES = ["todos", "ready", "generating"] as const;
const PERIODS = [
  { id: "todos", label: "Qualquer data" },
  { id: "7", label: "Últimos 7 dias" },
  { id: "30", label: "Últimos 30 dias" },
  { id: "90", label: "Últimos 90 dias" },
] as const;
const ORDERS = [
  { id: "recentes", label: "Mais recentes" },
  { id: "antigos", label: "Mais antigos" },
  { id: "progresso", label: "Maior progresso" },
] as const;

function History() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("todos");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("todos");
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("todos");
  const [order, setOrder] = useState<(typeof ORDERS)[number]["id"]>("recentes");

  const { data: materials = [] } = useQuery({
    queryKey: ["history", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_materials")
        .select(
          "id, topic, title, level, focus, size, status, read_progress, minutes_studied, outline, created_at, last_chapter, last_tab",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const rows = useMemo(() => {
    const q = term.trim().toLowerCase();
    const limit = period === "todos" ? 0 : Date.now() - Number(period) * 86400000;
    const list = materials.filter((m) => {
      if (q && !`${m.title ?? ""} ${m.topic} ${m.level}`.toLowerCase().includes(q)) return false;
      if (level !== "todos" && m.level !== level) return false;
      if (status !== "todos" && m.status !== status) return false;
      if (limit && new Date(m.created_at).getTime() < limit) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (order === "antigos") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (order === "progresso") return (b.read_progress ?? 0) - (a.read_progress ?? 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [materials, term, level, status, period, order]);

  if (!loading && !user) {
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="font-mono text-xl tracking-[0.15em] text-neon">HISTÓRICO</h1>
          <p className="mt-3 text-sm text-muted-foreground">Entre para acessar seu histórico detalhado.</p>
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
        <h1 className="font-mono text-xl tracking-[0.15em] text-neon">HISTÓRICO DETALHADO</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Busque, filtre e reabra qualquer estudo gerado — exatamente de onde você parou.
        </p>

        <div className="panel mt-6 space-y-4 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar no histórico..."
              className="pl-9"
            />
          </div>
          <FilterRow label="Nível">
            {LEVELS.map((l) => (
              <Chip key={l} active={level === l} onClick={() => setLevel(l)} label={l} />
            ))}
          </FilterRow>
          <FilterRow label="Status">
            {STATUSES.map((s) => (
              <Chip
                key={s}
                active={status === s}
                onClick={() => setStatus(s)}
                label={s === "ready" ? "pronta" : s === "generating" ? "em geração" : "todos"}
              />
            ))}
          </FilterRow>
          <FilterRow label="Período">
            {PERIODS.map((p) => (
              <Chip key={p.id} active={period === p.id} onClick={() => setPeriod(p.id)} label={p.label} />
            ))}
          </FilterRow>
          <FilterRow label="Ordenar">
            {ORDERS.map((o) => (
              <Chip key={o.id} active={order === o.id} onClick={() => setOrder(o.id)} label={o.label} />
            ))}
          </FilterRow>
        </div>

        <p className="mt-4 font-mono text-xs text-muted-foreground">
          {rows.length} registro{rows.length === 1 ? "" : "s"}
        </p>

        <div className="mt-4 space-y-3">
          {rows.length === 0 && (
            <div className="panel p-10 text-center text-sm text-muted-foreground">Nenhum estudo encontrado.</div>
          )}
          {rows.map((m) => (
            <article key={m.id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-foreground">{m.title ?? m.topic}</h2>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-primary">
                    {m.topic} · {m.level} · {m.focus} · {m.size}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Criado em {new Date(m.created_at).toLocaleString("pt-BR")} ·{" "}
                    {Array.isArray(m.outline) ? m.outline.length : 0} capítulos · {m.minutes_studied ?? 0} min
                    estudados · retoma no capítulo {(m.last_chapter ?? 0) + 1} ({m.last_tab ?? "leitura"})
                  </p>
                </div>
                <span className="rounded-full border border-border/70 px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground">
                  {m.status === "ready" ? "pronta" : "em geração"}
                </span>
              </div>
              <Progress value={m.read_progress} className="mt-3" />
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/estudo/$id" params={{ id: m.id }}>
                  <Button size="sm" className="font-mono text-xs tracking-wide">
                    <Play className="size-3.5" /> REABRIR
                  </Button>
                </Link>
                <MaterialExport id={m.id} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors ${
        active
          ? "border-primary/60 bg-primary/15 text-primary"
          : "border-border/70 text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
