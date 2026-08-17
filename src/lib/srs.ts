export type SrsCard = {
  ease: number;
  interval_days: number;
  repetitions: number;
};

export type SrsGrade = "errei" | "dificil" | "bom" | "facil";

const QUALITY: Record<SrsGrade, number> = { errei: 2, dificil: 3, bom: 4, facil: 5 };

export const GRADES: { id: SrsGrade; label: string }[] = [
  { id: "errei", label: "Errei" },
  { id: "dificil", label: "Difícil" },
  { id: "bom", label: "Bom" },
  { id: "facil", label: "Fácil" },
];

/** Algoritmo SM-2 simplificado: devolve o próximo agendamento do cartão. */
export function scheduleCard(card: SrsCard, grade: SrsGrade) {
  const q = QUALITY[grade];
  let ease = card.ease || 2.5;
  let repetitions = card.repetitions || 0;
  let interval: number;

  if (q < 3) {
    repetitions = 0;
    interval = 0; // volta ao ciclo de hoje
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 3;
    else interval = Math.round(Math.max(1, card.interval_days || 1) * ease);
    ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  }

  const due = new Date();
  if (interval === 0) due.setMinutes(due.getMinutes() + 10);
  else due.setDate(due.getDate() + interval);

  return {
    ease: Number(ease.toFixed(2)),
    interval_days: interval,
    repetitions,
    due_at: due.toISOString(),
    last_reviewed_at: new Date().toISOString(),
  };
}

export function formatDue(due: string): string {
  const diff = new Date(due).getTime() - Date.now();
  if (diff <= 0) return "agora";
  const days = Math.round(diff / 86400000);
  if (days >= 1) return `em ${days} dia${days > 1 ? "s" : ""}`;
  const hours = Math.max(1, Math.round(diff / 3600000));
  return `em ${hours}h`;
}
