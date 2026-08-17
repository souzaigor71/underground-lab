import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { addCredits, ensureCredits, isAdminUser, RECHARGE_AMOUNT } from "./credits.server";

export const getCreditsState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const email = typeof claims?.email === "string" ? claims.email : null;
    const admin = await isAdminUser(supabase, userId, email);
    const balance = await ensureCredits(supabase, userId);
    const { data: history } = await supabase
      .from("credit_transactions")
      .select("id, amount, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    return { admin, balance, history: history ?? [] };
  });

export const rechargeCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const balance = await addCredits(supabase, userId, RECHARGE_AMOUNT, "Recarga de créditos");
    return { balance };
  });
