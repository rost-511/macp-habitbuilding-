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

export async function saveCurrentPlan(
  supabase: SupabaseClient,
  plan: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        current_plan: plan,
      },
      { onConflict: "clerk_user_id" }
    )
    .select()
    .single();

  if (error) throw error;

  try {
    await supabase.from("change_log").insert({
      change_type: "plan_generated",
      after_data: plan,
    });
  } catch {
    // not fatal
  }

  return data;
}
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function getTodayProgress(
  supabase: SupabaseClient,
  clerkUserId: string
) {
  const { data, error } = await supabase
    .from("daily_progress")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .eq("progress_date", todayKey())
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveTodayProgress(
  supabase: SupabaseClient,
  clerkUserId: string,
  payload: {
    checked?: Record<string, boolean>;
    frog_done?: boolean;
    energy?: string | null;
    habits_snapshot?: unknown[];
    plan_snapshot?: Record<string, unknown> | null;
  }
) {
  const { data, error } = await supabase
    .from("daily_progress")
    .upsert(
      {
        clerk_user_id: clerkUserId,
        progress_date: todayKey(),
        checked: payload.checked ?? {},
        frog_done: payload.frog_done ?? false,
        energy: payload.energy ?? null,
        habits_snapshot: payload.habits_snapshot ?? [],
        plan_snapshot: payload.plan_snapshot ?? {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clerk_user_id,progress_date" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getProgressMonth(
  supabase: SupabaseClient,
  clerkUserId: string,
  year: number,
  month: number
) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0);
  const end = `${year}-${String(month).padStart(2, "0")}-${String(
    endDate.getDate()
  ).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("daily_progress")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .gte("progress_date", start)
    .lte("progress_date", end)
    .order("progress_date", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getProgressByDate(
  supabase: SupabaseClient,
  clerkUserId: string,
  date: string
) {
  const { data, error } = await supabase
    .from("daily_progress")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .eq("progress_date", date)
    .maybeSingle();

  if (error) throw error;
  return data;
}
export async function resetMyAppData(
  supabase: SupabaseClient,
  clerkUserId: string
) {
  const { error: progressError } = await supabase
    .from("daily_progress")
    .delete()
    .eq("clerk_user_id", clerkUserId);

  if (progressError) throw progressError;

  const { data, error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: "",
      onboarding_completed: false,
      onboarding_version: 1,
      onboarding_answers: {},
      current_plan: {},
    })
    .eq("clerk_user_id", clerkUserId)
    .select()
    .maybeSingle();

  if (profileError) throw profileError;

  try {
    await supabase.from("change_log").insert({
      change_type: "start_over",
      before_data: null,
      after_data: {
        cleared_daily_progress: true,
        cleared_current_plan: true,
        cleared_onboarding_answers: true,
      },
    });
  } catch {
    // not fatal
  }

  return data;
}