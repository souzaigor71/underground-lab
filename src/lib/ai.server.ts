// Server-only AI layer. API keys never leave the server.
// Provider chain with automatic fallback + exponential backoff on 429/5xx.

export type ProviderId = "lovable" | "gemini" | "groq";

type ChatArgs = {
  system: string;
  prompt: string;
  maxTokens?: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function availableProviders(): ProviderId[] {
  const preferred = (process.env["AI_PROVIDER"] as ProviderId | undefined) ?? "lovable";
  const all: ProviderId[] = ["lovable", "gemini", "groq"];
  const enabled = all.filter((p) => {
    if (p === "lovable") return Boolean(process.env["LOVABLE_API_KEY"]);
    if (p === "gemini") return Boolean(process.env["GEMINI_API_KEY"]);
    return Boolean(process.env["GROQ_API_KEY"]);
  });
  return [...enabled.filter((p) => p === preferred), ...enabled.filter((p) => p !== preferred)];
}

class RetryableError extends Error {}

async function callProvider(provider: ProviderId, args: ChatArgs): Promise<string> {
  let url: string;
  let headers: Record<string, string>;
  let body: unknown;

  if (provider === "gemini") {
    url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env["GEMINI_API_KEY"]}`;
    headers = { "Content-Type": "application/json" };
    body = {
      systemInstruction: { parts: [{ text: args.system }] },
      contents: [{ role: "user", parts: [{ text: args.prompt }] }],
    };
  } else if (provider === "groq") {
    url = "https://api.groq.com/openai/v1/chat/completions";
    headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env["GROQ_API_KEY"]}`,
    };
    body = {
      model: process.env["GROQ_MODEL"] ?? "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.prompt },
      ],
      max_tokens: args.maxTokens ?? 4000,
    };
  } else {
    url = "https://ai.gateway.lovable.dev/v1/chat/completions";
    headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
    };
    body = {
      model: process.env["LOVABLE_AI_MODEL"] ?? "google/gemini-3.5-flash",
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.prompt },
      ],
    };
  }

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });

  if (res.status === 429 || res.status >= 500) {
    throw new RetryableError(`Provedor ocupado (${res.status})`);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha na IA (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as Record<string, any>;
  const content =
    provider === "gemini"
      ? json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("")
      : json?.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string") throw new RetryableError("Resposta vazia da IA");
  return content;
}

export async function aiComplete(args: ChatArgs): Promise<string> {
  const providers = availableProviders();
  if (providers.length === 0) throw new Error("Nenhum provedor de IA configurado.");

  let lastError: unknown;
  for (const provider of providers) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await callProvider(provider, args);
      } catch (error) {
        lastError = error;
        if (!(error instanceof RetryableError)) break;
        await sleep(2000 * Math.pow(2, attempt)); // 2s, 4s, 8s
      }
    }
  }
  throw new Error(
    lastError instanceof Error
      ? `A IA está temporariamente indisponível. ${lastError.message}`
      : "A IA está temporariamente indisponível.",
  );
}

export function extractJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const start = Math.min(
    ...[cleaned.indexOf("{"), cleaned.indexOf("[")].filter((i) => i >= 0).concat([0]),
  );
  const endObj = cleaned.lastIndexOf("}");
  const endArr = cleaned.lastIndexOf("]");
  const end = Math.max(endObj, endArr);
  const slice = end > start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(slice) as T;
}
