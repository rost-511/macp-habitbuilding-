import type { SupabaseClient } from "@supabase/supabase-js";

export async function getMyProfile(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function completeOnboarding(
  supabase: SupabaseClient,
  answers: Record<string, unknown>
) {
  const fullName = typeof answers.name === "string" ? answers.name : "";

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        full_name: fullName,
        onboarding_completed: true,
        onboarding_version: 1,
        onboarding_answers: answers,
      },
      { onConflict: "clerk_user_id" }
    )
    .select()
    .single();

  if (error) throw error;

  await supabase.from("change_log").insert({
    change_type: "onboarding_completed",
    after_data: answers,
  });

  await supabase.from("app_settings").upsert(
    {
      settings: {
        theme: "system",
        notifications: true,
      },
    },
    { onConflict: "clerk_user_id" }
  );

  return data;
}