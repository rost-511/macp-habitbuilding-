import { useMemo } from "react";
import { useSession } from "@clerk/clerk-react";
import { createClient } from "@supabase/supabase-js";

export function useSupabase() {
  const { session } = useSession();

  return useMemo(() => {
    return createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      {
        accessToken: async () => {
          return session?.getToken() ?? null;
        },
      }
    );
  }, [session]);
}