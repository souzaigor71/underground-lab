import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCreditsState, rechargeCredits } from "@/lib/credits.functions";
import { useAuth } from "@/lib/useAuth";

export function useCredits() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fetchState = useServerFn(getCreditsState);
  const recharge = useServerFn(rechargeCredits);

  const query = useQuery({
    queryKey: ["credits", user?.id],
    enabled: Boolean(user),
    queryFn: () => fetchState({}),
  });

  return {
    admin: query.data?.admin ?? false,
    balance: query.data?.balance ?? 0,
    history: query.data?.history ?? [],
    loading: query.isLoading,
    blocked: Boolean(user) && !query.isLoading && !(query.data?.admin ?? false) && (query.data?.balance ?? 0) <= 0,
    refresh: () => qc.invalidateQueries({ queryKey: ["credits"] }),
    async recharge() {
      await recharge({});
      await qc.invalidateQueries({ queryKey: ["credits"] });
    },
  };
}
