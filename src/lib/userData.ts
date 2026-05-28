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
  const planVersion = Number(plan.plan_version || plan.planVersion || 1);

  const planGeneratedAt =
    typeof plan.plan_generated_at === "string"
      ? plan.plan_generated_at
      : typeof plan.generatedAt === "string"
      ? plan.generatedAt
      : new Date().toISOString();

  const planReason =
    typeof plan.plan_reason === "string" ? plan.plan_reason : "initial";

  const profileSnapshot =
    plan.profileSnapshot &&
    typeof plan.profileSnapshot === "object" &&
    !Array.isArray(plan.profileSnapshot)
      ? plan.profileSnapshot
      : {};

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
    const { error: historyError } = await supabase
      .from("plan_history")
      .upsert(
        {
          plan_version: planVersion,
          plan_reason: planReason,
          plan_generated_at: planGeneratedAt,
          plan,
          profile_snapshot: profileSnapshot,
        },
        { onConflict: "clerk_user_id,plan_version" }
      );

    if (historyError) throw historyError;
  } catch (historyError) {
    console.error("Failed to save plan history:", historyError);
  }

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
    plan_version?: number | null;
    plan_generated_at?: string | null;
    plan_reason?: string | null;
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
        plan_version: payload.plan_version ?? null,
        plan_generated_at: payload.plan_generated_at ?? null,
        plan_reason: payload.plan_reason ?? null,
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
  const { error: historyError } = await supabase
    .from("plan_history")
    .delete()
    .eq("clerk_user_id", clerkUserId);

  if (historyError) throw historyError;
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
export async function getPlanHistory(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("plan_history")
    .select(
      "id, plan_version, plan_reason, plan_generated_at, created_at, profile_snapshot, plan"
    )
    .order("plan_version", { ascending: false });

  if (error) throw error;
  return data || [];
}