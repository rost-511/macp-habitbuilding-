import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePlanMode } from "./planModes";

export async function getMyProfile(
  supabase: SupabaseClient,
  clerkUserId: string
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function completeOnboarding(
  supabase: SupabaseClient,
  clerkUserId: string,
  answers: Record<string, unknown>
) {
  const fullName = typeof answers.name === "string" ? answers.name : "";

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        clerk_user_id: clerkUserId,
        full_name: fullName,
        onboarding_completed: true,
        // v2 = Project 15 assessment (schedule, intensity, failure pattern, etc.)
        onboarding_version: 2,
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
      clerk_user_id: clerkUserId,
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
  clerkUserId: string,
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

  const promptVersion =
    typeof plan.prompt_version === "string" ? plan.prompt_version : null;

  const planMode =
    typeof plan.plan_mode === "string" ? normalizePlanMode(plan.plan_mode) : null;

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
        clerk_user_id: clerkUserId,
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
          clerk_user_id: clerkUserId,
          plan_version: planVersion,
          plan_reason: planReason,
          plan_generated_at: planGeneratedAt,
          prompt_version: promptVersion,
          plan_mode: planMode,
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
  // Order by updated_at desc and limit 1 so the UI stays usable even if a
  // legacy duplicate row exists for (clerk_user_id, progress_date).
  const { data, error } = await supabase
    .from("daily_progress")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .eq("progress_date", todayKey())
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
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
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}
export async function saveWeeklyReview(
  supabase: SupabaseClient,
  clerkUserId: string,
  payload: {
    week_start: string;
    week_end: string;
    plan_version?: number | null;
    plan_reason?: string | null;
    plan_generated_at?: string | null;
    prompt_version?: string | null;
    plan_snapshot?: Record<string, unknown> | null;
    completion_pct?: number;
    saved_days?: number;
    scores?: Record<string, number>;
    notes?: string;
    insight: string;
  }
) {
  const { data, error } = await supabase
    .from("weekly_reviews")
    .upsert(
      {
        clerk_user_id: clerkUserId,
        week_start: payload.week_start,
        week_end: payload.week_end,
        plan_version: payload.plan_version ?? null,
        plan_reason: payload.plan_reason ?? null,
        plan_generated_at: payload.plan_generated_at ?? null,
        prompt_version: payload.prompt_version ?? null,
        plan_snapshot: payload.plan_snapshot ?? {},
        completion_pct: payload.completion_pct ?? 0,
        saved_days: payload.saved_days ?? 0,
        scores: payload.scores ?? {},
        notes: payload.notes ?? "",
        insight: payload.insight,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clerk_user_id,week_start,plan_version" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  // 42P01 = undefined_table (Postgres); PGRST205 = table not in PostgREST schema cache
  return code === "42P01" || code === "PGRST205";
}

async function deleteUserRows(
  supabase: SupabaseClient,
  table: string,
  clerkUserId: string,
  optional: boolean
) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("clerk_user_id", clerkUserId);

  if (!error) return;

  // A missing optional table should never abort the full reset.
  if (optional && isMissingTableError(error)) {
    console.warn(`Skipping reset of "${table}" (table not present).`);
    return;
  }

  throw error;
}

// Full destructive reset for the signed-in user only. Every delete is scoped by
// clerk_user_id (RLS-backed). Never touches the Clerk auth account or other users.
export async function resetUserAppData(
  supabase: SupabaseClient,
  clerkUserId: string
) {
  if (!clerkUserId) {
    throw new Error("resetUserAppData requires a clerkUserId.");
  }

  // Known user-owned tables — a real failure here must surface.
  await deleteUserRows(supabase, "daily_progress", clerkUserId, false);
  await deleteUserRows(supabase, "weekly_reviews", clerkUserId, false);
  await deleteUserRows(supabase, "plan_history", clerkUserId, false);
  await deleteUserRows(supabase, "app_settings", clerkUserId, false);

  // Optional tables that may not exist in every environment.
  await deleteUserRows(supabase, "progress_events", clerkUserId, true);

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
        cleared_weekly_reviews: true,
        cleared_plan_history: true,
        cleared_app_settings: true,
        cleared_current_plan: true,
        cleared_onboarding_answers: true,
      },
    });
  } catch {
    // Logging the reset is best-effort and must not fail the reset.
  }

  return data;
}
export async function getPlanHistory(
  supabase: SupabaseClient,
  clerkUserId: string
) {
  const { data, error } = await supabase
    .from("plan_history")
    .select(
      "id, plan_version, plan_reason, plan_generated_at, created_at, profile_snapshot, plan"
    )
    .eq("clerk_user_id", clerkUserId)
    .order("plan_version", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getWeeklyReviews(
  supabase: SupabaseClient,
  clerkUserId: string
) {
  const { data, error } = await supabase
    .from("weekly_reviews")
    .select(
      "id, week_start, week_end, plan_version, plan_reason, plan_generated_at, plan_snapshot, completion_pct, saved_days, scores, notes, insight, created_at, updated_at"
    )
    .eq("clerk_user_id", clerkUserId)
    .order("week_start", { ascending: false })
    .limit(12);

  if (error) throw error;
  return data || [];
}