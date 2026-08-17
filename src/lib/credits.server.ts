import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const ADMIN_EMAIL = "igorsouzainformatica@gmail.com";
export const DEFAULT_CREDITS = 20;
export const RECHARGE_AMOUNT = 20;

type DB = SupabaseClient<Database>;

export async function isAdminUser(supabase: DB, userId: string, email?: string | null): Promise<boolean> {
  if (email && email.trim().toLowerCase() === ADMIN_EMAIL) return true;
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return Boolean(data);
}

export async function ensureCredits(supabase: DB, userId: string): Promise<number> {
  const { data } = await supabase.from("user_credits").select("balance").eq("user_id", userId).maybeSingle();
  if (data) return data.balance;
  await supabase.from("user_credits").insert({ user_id: userId, balance: DEFAULT_CREDITS });
  return DEFAULT_CREDITS;
}

export async function consumeCredits(supabase: DB, userId: string, amount: number, reason: string): Promise<number> {
  const balance = await ensureCredits(supabase, userId);
  if (balance < amount) {
    throw new Error("Créditos insuficientes. Recarregue para gerar novas apostilas.");
  }
  const next = balance - amount;
  await supabase.from("user_credits").update({ balance: next }).eq("user_id", userId);
  await supabase.from("credit_transactions").insert({ user_id: userId, amount: -amount, reason });
  return next;
}

export async function addCredits(supabase: DB, userId: string, amount: number, reason: string): Promise<number> {
  const balance = await ensureCredits(supabase, userId);
  const next = balance + amount;
  await supabase.from("user_credits").update({ balance: next }).eq("user_id", userId);
  await supabase.from("credit_transactions").insert({ user_id: userId, amount, reason });
  return next;
}
