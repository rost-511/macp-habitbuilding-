import type { SupabaseClient } from "@supabase/supabase-js";
import type { HabitRow, TaskRow, Window } from "../components/today/todayLogic";

export interface ScheduleBlock {
  label: string;
  days: number[]; // 0=Sun .. 6=Sat
  start: string; // "HH:MM"
  end: string;
}

export interface UserSchedule {
  wake: string;
  sleep: string;
  blocks: ScheduleBlock[];
}

export interface HabitInput {
  name: string;
  emoji?: string | null;
  priority: 1 | 2 | 3;
  time?: string | null;
  window?: Window | null;
  days: number[];
  subtasks?: { id: string; name: string }[];
  source?: "ai" | "user";
}

/* ── Habits ── */

export async function listHabits(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<HabitRow[]> {
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .is("archived_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as HabitRow[];
}

export async function createHabit(
  supabase: SupabaseClient,
  clerkUserId: string,
  input: HabitInput
): Promise<HabitRow> {
  const { data, error } = await supabase
    .from("habits")
    .insert({
      clerk_user_id: clerkUserId,
      name: input.name,
      emoji: input.emoji ?? null,
      priority: input.priority,
      time: input.time ?? null,
      window: input.time ? null : input.window ?? "anytime",
      days: input.days,
      subtasks: input.subtasks ?? [],
      source: input.source ?? "user",
    })
    .select()
    .single();
  if (error) throw error;
  return data as HabitRow;
}

export async function updateHabit(
  supabase: SupabaseClient,
  clerkUserId: string,
  habitId: string,
  patch: Partial<HabitInput>
): Promise<HabitRow> {
  const { data, error } = await supabase
    .from("habits")
    .update(patch)
    .eq("clerk_user_id", clerkUserId)
    .eq("id", habitId)
    .select()
    .single();
  if (error) throw error;
  return data as HabitRow;
}

export async function archiveHabit(
  supabase: SupabaseClient,
  clerkUserId: string,
  habitId: string
): Promise<void> {
  const { error } = await supabase
    .from("habits")
    .update({ archived_at: new Date().toISOString() })
    .eq("clerk_user_id", clerkUserId)
    .eq("id", habitId);
  if (error) throw error;
}

/* ── One-off tasks ── */

// Today's tasks (done or not) + every older task still open (= carry-over).
export async function listOpenTasks(
  supabase: SupabaseClient,
  clerkUserId: string,
  todayKey: string
): Promise<TaskRow[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .or(`date.eq.${todayKey},and(date.lt.${todayKey},done.eq.false)`)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as TaskRow[];
}

export async function createTask(
  supabase: SupabaseClient,
  clerkUserId: string,
  input: { date: string; name: string; priority: 1 | 2 | 3; time?: string | null }
): Promise<TaskRow> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      clerk_user_id: clerkUserId,
      date: input.date,
      name: input.name,
      priority: input.priority,
      time: input.time ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as TaskRow;
}

export async function updateTask(
  supabase: SupabaseClient,
  clerkUserId: string,
  taskId: string,
  patch: {
    name?: string;
    priority?: 1 | 2 | 3;
    time?: string | null;
    done?: boolean;
    done_at?: string | null;
    subtasks?: { id: string; name: string; done: boolean }[];
  }
): Promise<TaskRow> {
  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("clerk_user_id", clerkUserId)
    .eq("id", taskId)
    .select()
    .single();
  if (error) throw error;
  return data as TaskRow;
}

export async function deleteTask(
  supabase: SupabaseClient,
  clerkUserId: string,
  taskId: string
): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("clerk_user_id", clerkUserId)
    .eq("id", taskId);
  if (error) throw error;
}

// Tasks completed during one LOCAL calendar day (done_at falls inside it),
// regardless of when they were originally scheduled — carried tasks show up
// on the day they were finally finished.
export async function listCompletedTasks(
  supabase: SupabaseClient,
  clerkUserId: string,
  dateKey: string
): Promise<TaskRow[]> {
  const start = new Date(`${dateKey}T00:00:00`);
  const end = new Date(start.getTime() + 86_400_000);
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .eq("done", true)
    .gte("done_at", start.toISOString())
    .lt("done_at", end.toISOString())
    .order("done_at", { ascending: true });
  if (error) throw error;
  return (data || []) as TaskRow[];
}

/* ── Schedule ── */

export async function getSchedule(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<UserSchedule | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("schedule")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  if (error) throw error;
  return (data?.schedule as UserSchedule) ?? null;
}

export async function saveSchedule(
  supabase: SupabaseClient,
  clerkUserId: string,
  schedule: UserSchedule
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ schedule })
    .eq("clerk_user_id", clerkUserId);
  if (error) throw error;
}

/* ── One-time seed from the AI plan ── */

const TAG_WINDOW: Record<string, Window> = {
  morning: "morning",
  work: "afternoon",
  business: "afternoon",
  health: "anytime",
  evening: "evening",
};

// Imports plan.dashboard.habits into the habits table once. Idempotent: only
// runs when the user has zero habit rows (archived ones count as "has rows" so
// a user who deleted everything isn't re-seeded). h1 (the keystone) gets P1.
export async function seedHabitsFromPlan(
  supabase: SupabaseClient,
  clerkUserId: string,
  plan: Record<string, unknown> | null
): Promise<boolean> {
  const planHabits = (plan as any)?.dashboard?.habits;
  if (!Array.isArray(planHabits) || planHabits.length === 0) return false;

  const { count, error: countError } = await supabase
    .from("habits")
    .select("id", { count: "exact", head: true })
    .eq("clerk_user_id", clerkUserId);
  if (countError) throw countError;
  if ((count ?? 0) > 0) return false;

  const dailyFlow = (plan as any)?.dashboard?.dailyFlow;
  const flow: { time?: string; title?: string }[] = Array.isArray(dailyFlow) ? dailyFlow : [];

  const rows = planHabits.map((h: any, i: number) => {
    const name = String(h.name || "").trim() || `Habit ${i + 1}`;
    // If a dailyFlow block clearly contains this habit, inherit its time.
    const match = flow.find(
      (f) =>
        typeof f.title === "string" &&
        typeof f.time === "string" &&
        (f.title.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(f.title.toLowerCase()))
    );
    return {
      clerk_user_id: clerkUserId,
      name,
      emoji: null,
      priority: i === 0 ? 1 : 2,
      time: match?.time ?? null,
      window: match?.time ? null : TAG_WINDOW[String(h.tag)] ?? "anytime",
      days: [0, 1, 2, 3, 4, 5, 6],
      subtasks: [],
      source: "ai",
    };
  });

  const { error } = await supabase.from("habits").insert(rows);
  if (error) throw error;
  return true;
}
