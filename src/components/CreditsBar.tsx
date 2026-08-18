import { useState } from "react";
import { BatteryCharging, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCredits } from "@/lib/useCredits";

const MAX = 20;

export function CreditsBar() {
  const { admin, balance, blocked, loading, recharge } = useCredits();
  const [busy, setBusy] = useState(false);

  if (loading) return null;

  if (admin) {
    return (
      <div className="panel flex items-center gap-3 p-4">
        <ShieldCheck className="size-4 text-primary" />
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Acesso administrador</p>
          <p className="text-xs text-muted-foreground">Gerações ilimitadas, sem consumo de créditos.</p>
        </div>
      </div>
    );
  }

  async function onRecharge() {
    setBusy(true);
    try {
      await recharge();
      toast.success("Créditos recarregados.");
    } catch {
      toast.error("Não foi possível recarregar agora.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <Zap className="size-3.5 text-primary" /> Créditos
        </span>
        <span className="font-mono text-sm text-neon">
          {balance}/{MAX}
        </span>
      </div>
      <Progress value={Math.min(100, (balance / MAX) * 100)} className="mt-2" />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {blocked ? "Saldo esgotado — recarregue para gerar novas apostilas." : "1 crédito por apostila gerada."}
        </p>
        <Button size="sm" variant={blocked ? "default" : "outline"} onClick={onRecharge} disabled={busy}>
          <BatteryCharging className="size-3.5" /> Recarregar
        </Button>
      </div>
    </div>
  );
}
