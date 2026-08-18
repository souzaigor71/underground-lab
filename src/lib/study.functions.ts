import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  buildBlueprint,
  buildFlashcards,
  buildQuiz,
  buildSection,
  sectionsFor,
  type Focus,
  type Level,
  type Size,
} from "./study.server";
import { consumeCredits, isAdminUser } from "./credits.server";

const createSchema = z.object({
  topic: z.string().trim().min(2).max(160),
  level: z.enum(["iniciante", "intermediario", "avancado"]),
  focus: z.enum(["teorico", "pratico", "equilibrado"]),
  size: z.enum(["resumida", "normal", "completa", "profunda"]),
});

export const createStudyMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const sections = sectionsFor(data.level as Level, data.size as Size);

    // Créditos: administradores geram sem consumir saldo.
    const email = typeof claims?.email === "string" ? claims.email : null;
    const admin = await isAdminUser(supabase, userId, email);
    if (!admin) await consumeCredits(supabase, userId, 1, `Geração: ${data.topic}`);

    const { data: material, error } = await supabase
      .from("study_materials")
      .insert({
        user_id: userId,
        topic: data.topic,
        level: data.level,
        focus: data.focus,
        size: data.size,
        status: "generating",
        outline: sections,
      })
      .select("id")
      .single();
    if (error || !material) throw new Error(error?.message ?? "Não foi possível criar a apostila.");

    await supabase.from("generation_jobs").insert({
      user_id: userId,
      material_id: material.id,
      status: "running",
      current_step: "Pesquisando fontes",
      progress: 5,
    });

    const blueprint = await buildBlueprint(data.topic, data.level as Level, data.focus as Focus, data.size as Size);

    await supabase
      .from("study_materials")
      .update({ title: blueprint.title, intro: blueprint.intro, objectives: blueprint.objectives })
      .eq("id", material.id);

    if (blueprint.sources.length) {
      await supabase.from("sources").insert(
        blueprint.sources.map((s) => ({
          user_id: userId,
          material_id: material.id,
          title: String(s.title ?? "Fonte"),
          domain: String(s.domain ?? ""),
          url: String(s.url ?? ""),
        })),
      );
    }

    await supabase.from("chapters").insert(
      sections.map((s, i) => ({
        user_id: userId,
        material_id: material.id,
        position: i,
        slug: s.slug,
        title: s.title,
        content: "",
      })),
    );

    return { materialId: material.id as string, sections, title: blueprint.title };
  });

export const generateChapter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ materialId: z.string().uuid(), position: z.number().int().min(0).max(30) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: material } = await supabase
      .from("study_materials")
      .select("id, topic, level, focus, size")
      .eq("id", data.materialId)
      .single();
    if (!material) throw new Error("Apostila não encontrada.");

    const { data: chapters } = await supabase
      .from("chapters")
      .select("id, position, slug, title, content")
      .eq("material_id", data.materialId)
      .order("position");
    const list = chapters ?? [];
    const chapter = list.find((c) => c.position === data.position);
    if (!chapter) throw new Error("Capítulo não encontrado.");

    // Checkpoint: já gerado, não regenerar.
    if (chapter.content && chapter.content.trim().length > 0) {
      return { skipped: true, title: chapter.title };
    }

    const specs = sectionsFor(material.level as Level, material.size as Size);
    const spec = specs.find((s) => s.slug === chapter.slug) ?? {
      slug: chapter.slug,
      title: chapter.title,
      brief: "Escreva a seção de forma didática.",
    };

    const content = await buildSection(
      material.topic,
      material.level as Level,
      material.focus as Focus,
      material.size as Size,
      spec,
      list.filter((c) => c.position < data.position).map((c) => c.title),
    );

    await supabase.from("chapters").update({ content }).eq("id", chapter.id);

    const progress = Math.round(((data.position + 1) / Math.max(list.length, 1)) * 90) + 5;
    await supabase
      .from("generation_jobs")
      .update({ current_step: `Gerando ${chapter.title}`, progress })
      .eq("material_id", data.materialId);

    return { skipped: false, title: chapter.title };
  });

export const finalizeMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ materialId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await supabase.from("study_materials").update({ status: "ready" }).eq("id", data.materialId);
    await supabase
      .from("generation_jobs")
      .update({ status: "done", current_step: "Finalizando apostila", progress: 100 })
      .eq("material_id", data.materialId);
    return { ok: true };
  });

export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ materialId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: material } = await supabase
      .from("study_materials")
      .select("topic, level")
      .eq("id", data.materialId)
      .single();
    if (!material) throw new Error("Apostila não encontrada.");

    const { data: chapters } = await supabase
      .from("chapters")
      .select("title")
      .eq("material_id", data.materialId)
      .order("position");

    const questions = await buildQuiz(
      material.topic,
      material.level as Level,
      (chapters ?? []).map((c) => c.title),
    );
    if (!questions.length) throw new Error("A IA não conseguiu gerar o quiz agora.");

    const { data: quiz, error } = await supabase
      .from("quizzes")
      .insert({ user_id: userId, material_id: data.materialId, total: questions.length })
      .select("id")
      .single();
    if (error || !quiz) throw new Error(error?.message ?? "Erro ao criar quiz.");

    const { data: rows, error: qErr } = await supabase
      .from("quiz_questions")
      .insert(
        questions.map((q, i) => ({
          user_id: userId,
          quiz_id: quiz.id,
          position: i,
          kind: q.kind ?? "multipla",
          question: q.question,
          options: q.options ?? [],
          answer: String(q.answer ?? ""),
          explanation: q.explanation ?? "",
        })),
      )
      .select("id, position, kind, question, options, answer, explanation")
      .order("position");
    if (qErr) throw new Error(qErr.message);

    return { quizId: quiz.id as string, questions: rows ?? [] };
  });

export const generateFlashcards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ materialId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: material } = await supabase
      .from("study_materials")
      .select("topic, level")
      .eq("id", data.materialId)
      .single();
    if (!material) throw new Error("Apostila não encontrada.");

    const cards = await buildFlashcards(material.topic, material.level as Level);
    if (!cards.length) throw new Error("A IA não conseguiu gerar os flashcards agora.");

    await supabase.from("flashcards").delete().eq("material_id", data.materialId);
    const { data: rows, error } = await supabase
      .from("flashcards")
      .insert(
        cards.map((c, i) => ({
          user_id: userId,
          material_id: data.materialId,
          front: c.front,
          back: c.back,
          position: i,
        })),
      )
      .select("id, front, back, position")
      .order("position");
    if (error) throw new Error(error.message);
    return { cards: rows ?? [] };
  });
