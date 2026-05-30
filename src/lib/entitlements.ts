import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useSupabase } from "./useSupabase";

export interface Entitlement {
  tier: "free" | "premium";
  status: string;
  aiDailyLimit: number | null;
  isPremium: boolean;
}

export const FREE_DEFAULT: Entitlement = {
  tier: "free",
  status: "active",
  aiDailyLimit: null,
  isPremium: false,
};

export async function getMyEntitlement(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<Entitlement> {
  const { data, error } = await supabase
    .from("user_entitlements")
    .select("tier, status, ai_daily_limit")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (error || !data) return FREE_DEFAULT;

  const premiumActive =
    data.tier === "premium" &&
    (data.status === "active" || data.status === "trialing");

  return {
    tier: data.tier as "free" | "premium",
    status: data.status as string,
    aiDailyLimit: typeof data.ai_daily_limit === "number" ? data.ai_daily_limit : null,
    isPremium: premiumActive,
  };
}

export function useEntitlement() {
  const supabase = useSupabase();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [entitlement, setEntitlement] = useState<Entitlement>(FREE_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !userId) {
      setEntitlement(FREE_DEFAULT);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getMyEntitlement(supabase, userId)
      .then((ent) => {
        if (!cancelled) {
          setEntitlement(ent);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setEntitlement(FREE_DEFAULT);
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, isLoaded, isSignedIn, userId]);

  return { entitlement, isPremium: entitlement.isPremium, loading, error };
}
