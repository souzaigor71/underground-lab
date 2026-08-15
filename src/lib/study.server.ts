import { aiComplete, extractJson } from "./ai.server";

export type Level = "iniciante" | "intermediario" | "avancado";
export type Focus = "teorico" | "pratico" | "equilibrado";
export type Size = "resumida" | "normal" | "completa" | "profunda";

export type SectionSpec = { slug: string; title: string; brief: string };

const ALL_SECTIONS: SectionSpec[] = [
  {
    slug: "fundamentos",
    title: "Fundamentos",
    brief: "Explique os conceitos fundamentais do assunto, com contexto histórico breve e panorama geral.",
  },
  {
    slug: "conceitos-basicos",
    title: "Conceitos básicos",
    brief: "Detalhe os conceitos básicos, um por subtítulo, com definição, explicação e mini-exemplo.",
  },
  {
    slug: "conceitos-intermediarios",
    title: "Conceitos intermediários",
    brief: "Aprofunde os conceitos intermediários, relacionando-os aos básicos.",
  },
  {
    slug: "conceitos-avancados",
    title: "Conceitos avançados",
    brief: "Trate tópicos avançados: arquitetura, otimização, casos de borda e trade-offs.",
  },
  {
    slug: "exemplos",
    title: "Exemplos",
    brief:
      "Traga exemplos claros e comentados. Se for programação/tecnologia, use blocos de código com a linguagem indicada.",
  },
  {
    slug: "exemplos-praticos",
    title: "Exemplos práticos",
    brief: "Mostre situações reais de aplicação, passo a passo, com resultado esperado.",
  },
  { slug: "erros-comuns", title: "Erros comuns", brief: "Liste erros frequentes, por que acontecem e como evitá-los." },
  { slug: "boas-praticas", title: "Boas práticas", brief: "Recomendações profissionais, checklists e padrões." },
  {
    slug: "exercicios",
    title: "Exercícios",
    brief:
      "Crie exercícios progressivos organizados em três subtítulos: `### Fácil`, `### Médio`, `### Difícil`, numerados. NÃO revele respostas aqui.",
  },
  {
    slug: "gabarito",
    title: "Gabarito",
    brief: "Respostas comentadas dos exercícios, na mesma numeração, com explicação do raciocínio.",
  },
  { slug: "faq", title: "Perguntas frequentes", brief: "8 a 12 perguntas frequentes com respostas objetivas." },
  {
    slug: "glossario",
    title: "Glossário",
    brief: "Tabela markdown com termo e definição (no mínimo 15 termos).",
  },
  { slug: "resumo", title: "Resumo", brief: "Revisão geral com os pontos-chave em tópicos." },
  {
    slug: "checklist",
    title: "Checklist de aprendizado",
    brief: "Lista de verificação em markdown (`- [ ] item`) do que o estudante deve dominar.",
  },
];

export function sectionsFor(level: Level, size: Size): SectionSpec[] {
  let slugs: string[];
  if (size === "resumida") {
    slugs = ["fundamentos", "conceitos-basicos", "exemplos", "exercicios", "gabarito", "resumo", "checklist"];
  } else if (size === "normal") {
    slugs = [
      "fundamentos",
      "conceitos-basicos",
      "conceitos-intermediarios",
      "exemplos",
      "erros-comuns",
      "boas-praticas",
      "exercicios",
      "gabarito",
      "glossario",
      "resumo",
      "checklist",
    ];
  } else {
    slugs = ALL_SECTIONS.map((s) => s.slug);
  }
  if (level === "iniciante" && size !== "profunda") {
    slugs = slugs.filter((s) => s !== "conceitos-avancados");
  }
  return ALL_SECTIONS.filter((s) => slugs.includes(s.slug));
}

const LEVEL_HINT: Record<Level, string> = {
  iniciante: "Nível INICIANTE: linguagem simples, analogias do cotidiano, foco em conceitos fundamentais.",
  intermediario: "Nível INTERMEDIÁRIO: equilíbrio entre teoria e prática, exemplos e exercícios consistentes.",
  avancado:
    "Nível AVANÇADO: explicações técnicas profundas, casos de borda, boas práticas, arquitetura e otimização.",
};

const FOCUS_HINT: Record<Focus, string> = {
  teorico: "Foco TEÓRICO E CONCEITUAL: priorize definições, modelos mentais e fundamentação.",
  pratico: "Foco PRÁTICO: priorize exemplos aplicados, exercícios e passo a passo.",
  equilibrado: "Foco EQUILIBRADO: alterne teoria e prática de forma proporcional.",
};

const SIZE_HINT: Record<Size, string> = {
  resumida: "Extensão: enxuta (300-500 palavras por seção).",
  normal: "Extensão: média (500-800 palavras por seção).",
  completa: "Extensão: completa (800-1200 palavras por seção).",
  profunda: "Extensão: profunda e minuciosa (1200-1800 palavras por seção).",
};

export const BASE_SYSTEM =
  "Você é o motor pedagógico do INSTITUTO UNDERGROUND, especialista em criar apostilas didáticas em português do Brasil. " +
  "Escreva sempre em Markdown limpo, com subtítulos, listas, tabelas quando útil, blocos de código com a linguagem indicada quando o assunto for técnico, " +
  "e caixas de destaque usando blockquote (> **Importante:** ...). Nunca invente links falsos dentro do texto.";

export function contextHint(topic: string, level: Level, focus: Focus, size: Size) {
  return `Assunto: ${topic}\n${LEVEL_HINT[level]}\n${FOCUS_HINT[focus]}\n${SIZE_HINT[size]}`;
}

export type Blueprint = {
  title: string;
  intro: string;
  objectives: string;
  sources: { title: string; domain: string; url: string }[];
};

export async function buildBlueprint(topic: string, level: Level, focus: Focus, size: Size): Promise<Blueprint> {
  const raw = await aiComplete({
    system: BASE_SYSTEM,
    prompt: `${contextHint(topic, level, focus, size)}

Gere APENAS um JSON válido (sem comentários, sem markdown ao redor) com o formato:
{
  "title": "Título profissional da apostila",
  "intro": "Introdução em Markdown (3 a 6 parágrafos) explicando o assunto e por que ele é importante",
  "objectives": "Objetivos de aprendizagem em Markdown, como lista de 6 a 10 itens começando com verbo",
  "sources": [
    {"title": "Nome real da fonte", "domain": "dominio.com", "url": "https://url-real-e-existente"}
  ]
}

Regras para "sources": 6 a 10 fontes REAIS e confiáveis que você conhece e que realmente existem.
Para programação priorize documentação oficial; para ciência priorize fontes acadêmicas e institucionais.
Nunca invente URLs improváveis: prefira páginas raiz ou seções estáveis da documentação oficial.`,
  });
  const parsed = extractJson<Blueprint>(raw);
  return {
    title: parsed.title?.trim() || topic,
    intro: parsed.intro ?? "",
    objectives: parsed.objectives ?? "",
    sources: Array.isArray(parsed.sources) ? parsed.sources.slice(0, 12) : [],
  };
}

export async function buildSection(
  topic: string,
  level: Level,
  focus: Focus,
  size: Size,
  section: SectionSpec,
  previousTitles: string[],
): Promise<string> {
  return aiComplete({
    system: BASE_SYSTEM,
    prompt: `${contextHint(topic, level, focus, size)}

Escreva a seção "${section.title}" da apostila.
Orientação da seção: ${section.brief}
Seções já escritas (não repita conteúdo): ${previousTitles.join(", ") || "nenhuma"}

Regras:
- Comece com "## ${section.title}".
- Use subtítulos "###" para organizar.
- Não escreva introduções genéricas sobre a apostila, vá direto ao conteúdo.
- Retorne apenas o Markdown da seção.`,
  });
}

export type QuizQuestion = {
  kind: "multipla" | "vf" | "curta";
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

export async function buildQuiz(topic: string, level: Level, outlineTitles: string[]): Promise<QuizQuestion[]> {
  const raw = await aiComplete({
    system: BASE_SYSTEM,
    prompt: `Crie um quiz de 10 questões sobre "${topic}" (nível ${level}), baseado nestas seções: ${outlineTitles.join(", ")}.
Retorne APENAS JSON válido: {"questions":[{"kind":"multipla|vf|curta","question":"...","options":["a","b","c","d"],"answer":"texto exato da alternativa correta ou Verdadeiro/Falso ou resposta curta","explanation":"..."}]}
Use 5 de múltipla escolha, 3 de verdadeiro ou falso (options: ["Verdadeiro","Falso"]) e 2 de resposta curta (options: []).`,
  });
  const parsed = extractJson<{ questions: QuizQuestion[] }>(raw);
  return (parsed.questions ?? []).slice(0, 10);
}

export async function buildFlashcards(topic: string, level: Level): Promise<{ front: string; back: string }[]> {
  const raw = await aiComplete({
    system: BASE_SYSTEM,
    prompt: `Crie 15 flashcards sobre "${topic}" (nível ${level}).
Retorne APENAS JSON válido: {"cards":[{"front":"pergunta curta","back":"resposta clara em até 3 frases"}]}`,
  });
  const parsed = extractJson<{ cards: { front: string; back: string }[] }>(raw);
  return (parsed.cards ?? []).slice(0, 20);
}
