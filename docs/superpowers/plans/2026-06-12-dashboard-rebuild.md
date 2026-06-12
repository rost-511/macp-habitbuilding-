# Dashboard Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old dashboard with a minimal execution-first experience: a Today list (habits + one-off tasks, priority/time sorted, carry-over for missed tasks), full-takeover focus card with subtasks, a Habits manager, schedule editor, and an explicit AI Replan diff flow.

**Architecture:** New component tree under `src/components/today/` with pure sorting/grouping logic isolated in `todayLogic.ts` (unit-tested). New Supabase tables `habits` and `tasks` are the source of truth; the AI plan seeds them once. Data access lives in `src/lib/habitsData.ts`, passed into components as props from `App.tsx` (project convention — components never import data modules directly).

**Tech Stack:** React 19 + Vite + TypeScript, Supabase (Clerk-authenticated RLS), Vercel function `api/generate-plan.ts` (OpenAI), vitest (added by this plan).

**Spec:** `docs/superpowers/specs/2026-06-12-dashboard-rebuild-design.md` — read it first.

**Commit convention:** This project's owner commits manually between tasks; the executor NEVER runs `git commit` or `git push`. Wherever a task ends, STOP and report "Task N complete — ready for your commit" instead of committing.

**Codebase facts you need (verified 2026-06-12):**
- User id column is `clerk_user_id` everywhere (Clerk user id string, e.g. `user_2x...`). Supabase client (`src/lib/useSupabase.ts`) passes the Clerk session token via `accessToken`, so RLS policies compare `clerk_user_id` to the JWT `sub` claim.
- There is **no migrations directory** — schema changes are SQL the user runs in the Supabase SQL editor (Task 1 hands them the SQL).
- `daily_progress` table: upserted on `(clerk_user_id, progress_date)` with `checked jsonb`, `habits_snapshot jsonb`, `frog_done`, `energy`, plan snapshot columns. `CalendarPage` renders history from `checked` + `habits_snapshot`, so the new dashboard must keep writing both.
- `App.tsx` screen state machine: `screen ∈ {landing, auth, wizard, generating, dashboard, calendar, review, settings, ...trust}`. Dashboard/calendar/review/settings all stay mounted with `display:none` switching (`App.tsx:1267-1326`).
- `streamClaude(prompt, eventType, getToken, onChunk, onDone, onError, promptVersion?)` in `App.tsx:41` POSTs to `/api/generate-plan` (despite the name it's OpenAI `gpt-4.1-mini` server-side). Quota errors arrive via `onError(message, quotaInfo)`.
- `api/generate-plan.ts:13` — `ALLOWED_EVENT_TYPES = ["plan_generation", "weekly_review", "recovery_plan"]`; unknown types silently normalize to `plan_generation`. Task 9 adds `"replan"`.
- Plan JSON shape: `plan.dashboard.habits` = `[{id:"h1".."h5", name, tag: morning|work|health|business|evening, why}]` (no times); `plan.dashboard.dailyFlow` = `[{time:"HH:MM", title, description}]`.
- Profile (onboarding answers JSONB) has `wakeTime`, `sleepTime`, `scheduleText` (free text), `peakFocusTime` — used to seed the schedule editor defaults.
- No test runner exists yet (`package.json` has no test script). Task 2 adds vitest.
- The app scrolls inside `.page`, not the window. Dev server: `npm run dev` → port 5173 (falls back to 5174).
- Styles are namespaced template-literal strings injected via `<style>` (see `src/styles/landingStyles.ts` for the pattern). Brand tokens: bg `#0a0805`, card `#100d09`, line `rgba(224,164,59,0.10)`, text `#f4f1ea`, text2 `#a39c8f`, muted `#8a8275`, faint `#6b6354`, amber `#f5a524`, green `#4ade80`.

---

## File map

| File | Action | Responsibility |
|---|---|---|
| (Supabase SQL editor) | run SQL | `habits` + `tasks` tables, RLS, `daily_progress.subchecked`, `profiles.schedule` |
| `vitest.config.ts`, `package.json` | create/modify | test runner |
| `src/components/today/todayLogic.ts` | create | pure types + anchor/sort/carry-over/now logic |
| `src/components/today/todayLogic.test.ts` | create | unit tests |
| `src/lib/habitsData.ts` | create | habits/tasks/schedule/seed CRUD |
| `src/lib/userData.ts` | modify | `saveTodayProgress` accepts `subchecked` |
| `src/styles/todayStyles.ts` | create | `.td-*` styles |
| `src/components/today/TodayItem.tsx` | create | one list row |
| `src/components/today/TodayList.tsx` | create | list + carried group + composer + counter |
| `src/components/today/FocusCard.tsx` | create | full-takeover focus view |
| `src/components/today/HabitsManager.tsx` | create | habit CRUD UI |
| `src/components/today/ScheduleEditor.tsx` | create | wake/sleep/blocks editor |
| `src/components/today/ReplanModal.tsx` | create | AI replan diff UI |
| `src/components/today/TodayApp.tsx` | create | shell: bar/tabs/views/modals |
| `src/lib/prompts.ts` | modify | add `buildReplanPrompt` + `REPLAN_PROMPT_VERSION` |
| `api/generate-plan.ts` | modify | allow `"replan"` event type |
| `src/App.tsx` | modify | mount TodayApp, delete FocusMode, drop old Dashboard |
| `src/components/app/Dashboard.tsx`, `ProgressRing.tsx` | delete | superseded |

---

### Task 1: Database schema (SQL handed to the user)

**Files:** none in repo — this SQL is run by the project owner in the Supabase SQL editor. The executor's job is to present it and wait for confirmation.

- [ ] **Step 1: Give the user this SQL to run in the Supabase SQL editor**

```sql
-- 1) Habits — user-owned, archive instead of delete
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  name text not null,
  emoji text,
  priority int not null default 2 check (priority between 1 and 3),
  time text,            -- "HH:MM" 24h, or null
  "window" text check ("window" in ('morning','afternoon','evening','anytime')),
  days int[] not null default '{0,1,2,3,4,5,6}',  -- 0=Sun .. 6=Sat
  subtasks jsonb not null default '[]',           -- [{id,name}]
  source text not null default 'user' check (source in ('ai','user')),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
create index if not exists habits_user_idx on public.habits (clerk_user_id) where archived_at is null;
alter table public.habits enable row level security;
create policy "habits_select_own" on public.habits for select
  using (clerk_user_id = (select auth.jwt()->>'sub'));
create policy "habits_insert_own" on public.habits for insert
  with check (clerk_user_id = (select auth.jwt()->>'sub'));
create policy "habits_update_own" on public.habits for update
  using (clerk_user_id = (select auth.jwt()->>'sub'));
create policy "habits_delete_own" on public.habits for delete
  using (clerk_user_id = (select auth.jwt()->>'sub'));

-- 2) One-off tasks — carry over until done or deleted
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  date date not null,
  name text not null,
  priority int not null default 2 check (priority between 1 and 3),
  time text,
  done boolean not null default false,
  done_at timestamptz,
  subtasks jsonb not null default '[]',           -- [{id,name,done}]
  created_at timestamptz not null default now()
);
create index if not exists tasks_user_open_idx on public.tasks (clerk_user_id, date) where done = false;
alter table public.tasks enable row level security;
create policy "tasks_select_own" on public.tasks for select
  using (clerk_user_id = (select auth.jwt()->>'sub'));
create policy "tasks_insert_own" on public.tasks for insert
  with check (clerk_user_id = (select auth.jwt()->>'sub'));
create policy "tasks_update_own" on public.tasks for update
  using (clerk_user_id = (select auth.jwt()->>'sub'));
create policy "tasks_delete_own" on public.tasks for delete
  using (clerk_user_id = (select auth.jwt()->>'sub'));

-- 3) Per-day subtask checks for habits
alter table public.daily_progress add column if not exists subchecked jsonb not null default '{}';

-- 4) User schedule (wake/sleep/busy blocks)
alter table public.profiles add column if not exists schedule jsonb;
```

- [ ] **Step 2: Wait for the user to confirm the SQL ran without errors.** Do not proceed to data-layer tasks until confirmed. (UI-only tasks 2–4 can proceed regardless.)

**STOP — Task 1 complete, user confirms schema.**

---

### Task 2: Add vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install vitest**

Run: `npm install -D vitest`
Expected: exits 0, `vitest` appears in `devDependencies`.

- [ ] **Step 2: Add test script to `package.json` scripts block**

```json
"test": "vitest run"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 4: Verify the runner works (no tests yet is OK)**

Run: `npm test`
Expected: vitest runs and reports "No test files found" (exit code may be 1 — that's fine at this step).

**STOP — Task 2 complete, ready for your commit.**

---

### Task 3: `todayLogic.ts` — pure logic (TDD)

**Files:**
- Create: `src/components/today/todayLogic.test.ts`
- Create: `src/components/today/todayLogic.ts`

- [ ] **Step 1: Write the failing tests — create `src/components/today/todayLogic.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import {
  anchorMinutes,
  isScheduledOn,
  localDateKey,
  daysBetween,
  carriedLabel,
  buildTodayItems,
  findNowKey,
  type HabitRow,
  type TaskRow,
} from "./todayLogic";

const habit = (over: Partial<HabitRow> = {}): HabitRow => ({
  id: "h-1",
  name: "Morning run",
  emoji: null,
  priority: 2,
  time: null,
  window: "anytime",
  days: [0, 1, 2, 3, 4, 5, 6],
  subtasks: [],
  source: "user",
  archived_at: null,
  ...over,
});

const task = (over: Partial<TaskRow> = {}): TaskRow => ({
  id: "t-1",
  date: "2026-06-12",
  name: "Call dentist",
  priority: 2,
  time: null,
  done: false,
  subtasks: [],
  ...over,
});

describe("anchorMinutes", () => {
  it("uses exact time when set", () => {
    expect(anchorMinutes("07:30", null)).toBe(450);
  });
  it("maps windows: morning 480, afternoon 780, evening 1140", () => {
    expect(anchorMinutes(null, "morning")).toBe(480);
    expect(anchorMinutes(null, "afternoon")).toBe(780);
    expect(anchorMinutes(null, "evening")).toBe(1140);
  });
  it("anytime and null sink to 1440", () => {
    expect(anchorMinutes(null, "anytime")).toBe(1440);
    expect(anchorMinutes(null, null)).toBe(1440);
  });
  it("exact time wins over window", () => {
    expect(anchorMinutes("06:00", "evening")).toBe(360);
  });
});

describe("isScheduledOn", () => {
  it("matches when weekday in days", () => {
    expect(isScheduledOn(habit({ days: [1, 3, 5] }), 3)).toBe(true);
    expect(isScheduledOn(habit({ days: [1, 3, 5] }), 0)).toBe(false);
  });
});

describe("date helpers", () => {
  it("localDateKey formats local YYYY-MM-DD", () => {
    expect(localDateKey(new Date(2026, 5, 12, 23, 59))).toBe("2026-06-12");
  });
  it("daysBetween counts calendar days", () => {
    expect(daysBetween("2026-06-10", "2026-06-12")).toBe(2);
  });
  it("carriedLabel", () => {
    expect(carriedLabel(1)).toBe("missed · yesterday");
    expect(carriedLabel(3)).toBe("missed · 3 days ago");
  });
});

describe("buildTodayItems", () => {
  const todayKey = "2026-06-12"; // a Friday → weekday 5
  const weekday = 5;

  it("includes only habits scheduled today and tasks dated today or carried", () => {
    const items = buildTodayItems({
      habits: [
        habit({ id: "a", days: [5] }),
        habit({ id: "b", days: [0] }), // not today
      ],
      tasks: [
        task({ id: "t-today", date: todayKey }),
        task({ id: "t-old", date: "2026-06-10" }),
        task({ id: "t-old-done", date: "2026-06-10", done: true }), // never shown
      ],
      checked: {},
      subchecked: {},
      todayKey,
      weekday,
    });
    expect(items.map((i) => i.key)).toContain("h:a");
    expect(items.map((i) => i.key)).not.toContain("h:b");
    expect(items.map((i) => i.key)).toContain("t:t-today");
    expect(items.map((i) => i.key)).toContain("t:t-old");
    expect(items.map((i) => i.key)).not.toContain("t:t-old-done");
  });

  it("pins carried tasks first (priority, then older first), then sorts by anchor then priority then name", () => {
    const items = buildTodayItems({
      habits: [
        habit({ id: "h9", name: "Gym", time: "18:00", priority: 1, days: [5] }),
        habit({ id: "h7", name: "Run", time: "07:00", priority: 1, days: [5] }),
        habit({ id: "h8", name: "Read", window: "evening", time: null, priority: 2, days: [5] }),
        habit({ id: "hA", name: "Stretch", window: "anytime", time: null, priority: 1, days: [5] }),
      ],
      tasks: [
        task({ id: "c2", date: "2026-06-11", priority: 2 }),
        task({ id: "c1", date: "2026-06-09", priority: 1 }),
        task({ id: "tt", date: todayKey, time: "09:00", priority: 3 }),
      ],
      checked: {},
      subchecked: {},
      todayKey,
      weekday,
    });
    expect(items.map((i) => i.key)).toEqual([
      "t:c1", // carried P1
      "t:c2", // carried P2
      "h:h7", // 07:00
      "t:tt", // 09:00
      "h:h9", // 18:00
      "h:h8", // evening window 19:00
      "h:hA", // anytime
    ]);
    expect(items[0].carried).toBe(true);
    expect(items[0].carriedDays).toBe(3);
    expect(items[2].carried).toBe(false);
  });

  it("marks habit done from checked map and counts subtasks from subchecked", () => {
    const items = buildTodayItems({
      habits: [
        habit({
          id: "a",
          days: [5],
          subtasks: [
            { id: "s1", name: "x" },
            { id: "s2", name: "y" },
          ],
        }),
      ],
      tasks: [],
      checked: { a: true },
      subchecked: { a: { s1: true } },
      todayKey,
      weekday,
    });
    expect(items[0].done).toBe(true);
    expect(items[0].subDone).toBe(1);
    expect(items[0].subTotal).toBe(2);
  });

  it("task done/subtasks come from the task row itself", () => {
    const items = buildTodayItems({
      habits: [],
      tasks: [
        task({
          id: "t",
          date: todayKey,
          done: false,
          subtasks: [
            { id: "s1", name: "x", done: true },
            { id: "s2", name: "y", done: false },
          ],
        }),
      ],
      checked: {},
      subchecked: {},
      todayKey,
      weekday,
    });
    expect(items[0].subDone).toBe(1);
    expect(items[0].subTotal).toBe(2);
  });
});

describe("findNowKey", () => {
  const todayKey = "2026-06-12";
  const weekday = 5;
  const make = () =>
    buildTodayItems({
      habits: [
        habit({ id: "h7", name: "Run", time: "07:00", days: [5] }),
        habit({ id: "h9", name: "Deep work", time: "09:30", days: [5] }),
        habit({ id: "h18", name: "Gym", time: "18:00", days: [5] }),
      ],
      tasks: [task({ id: "c1", date: "2026-06-11" })],
      checked: { h7: true },
      subchecked: {},
      todayKey,
      weekday,
    });

  it("returns first incomplete non-carried item whose anchor has passed", () => {
    expect(findNowKey(make(), 10 * 60)).toBe("h:h9"); // 10:00 → 09:30 passed, 07:00 done
  });
  it("returns null before anything is due", () => {
    expect(findNowKey(make(), 6 * 60)).toBe(null);
  });
  it("never highlights carried or anytime items", () => {
    const items = buildTodayItems({
      habits: [habit({ id: "x", window: "anytime", time: null, days: [5] })],
      tasks: [task({ id: "c1", date: "2026-06-11" })],
      checked: {},
      subchecked: {},
      todayKey,
      weekday,
    });
    expect(findNowKey(items, 23 * 60)).toBe(null);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './todayLogic'` (or unresolved import).

- [ ] **Step 3: Implement `src/components/today/todayLogic.ts`**

```ts
// Pure logic for the Today view — no React, no Supabase, fully unit-tested.
// Spec: docs/superpowers/specs/2026-06-12-dashboard-rebuild-design.md §3

export type Window = "morning" | "afternoon" | "evening" | "anytime";

export interface HabitSubtask {
  id: string;
  name: string;
}

export interface HabitRow {
  id: string;
  name: string;
  emoji: string | null;
  priority: 1 | 2 | 3;
  time: string | null; // "HH:MM"
  window: Window | null;
  days: number[]; // 0=Sun .. 6=Sat
  subtasks: HabitSubtask[];
  source: "ai" | "user";
  archived_at: string | null;
}

export interface TaskSubtask {
  id: string;
  name: string;
  done: boolean;
}

export interface TaskRow {
  id: string;
  date: string; // "YYYY-MM-DD"
  name: string;
  priority: 1 | 2 | 3;
  time: string | null;
  done: boolean;
  subtasks: TaskSubtask[];
}

export interface TodayItem {
  key: string; // "h:<id>" | "t:<id>"
  kind: "habit" | "task";
  id: string;
  name: string;
  emoji: string | null;
  priority: 1 | 2 | 3;
  time: string | null;
  window: Window | null;
  anchor: number; // minutes since midnight; 1440 = anytime
  done: boolean;
  carried: boolean;
  carriedDays: number;
  subDone: number;
  subTotal: number;
}

const WINDOW_ANCHORS: Record<Window, number> = {
  morning: 480,
  afternoon: 780,
  evening: 1140,
  anytime: 1440,
};

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function anchorMinutes(time: string | null, window: Window | null): number {
  if (time) return timeToMinutes(time);
  if (window) return WINDOW_ANCHORS[window];
  return 1440;
}

export function isScheduledOn(habit: Pick<HabitRow, "days">, weekday: number): boolean {
  return habit.days.includes(weekday);
}

export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysBetween(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00`);
  const to = new Date(`${toKey}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

export function carriedLabel(days: number): string {
  return days === 1 ? "missed · yesterday" : `missed · ${days} days ago`;
}

export function buildTodayItems(input: {
  habits: HabitRow[];
  tasks: TaskRow[];
  checked: Record<string, boolean>;
  subchecked: Record<string, Record<string, boolean>>;
  todayKey: string;
  weekday: number;
}): TodayItem[] {
  const { habits, tasks, checked, subchecked, todayKey, weekday } = input;

  const habitItems: TodayItem[] = habits
    .filter((h) => !h.archived_at && isScheduledOn(h, weekday))
    .map((h) => {
      const subs = subchecked[h.id] || {};
      return {
        key: `h:${h.id}`,
        kind: "habit" as const,
        id: h.id,
        name: h.name,
        emoji: h.emoji,
        priority: h.priority,
        time: h.time,
        window: h.window,
        anchor: anchorMinutes(h.time, h.window),
        done: !!checked[h.id],
        carried: false,
        carriedDays: 0,
        subDone: h.subtasks.filter((s) => subs[s.id]).length,
        subTotal: h.subtasks.length,
      };
    });

  const taskItems: TodayItem[] = tasks
    .filter((t) => t.date === todayKey || (t.date < todayKey && !t.done))
    .map((t) => {
      const carriedDays = t.date < todayKey ? daysBetween(t.date, todayKey) : 0;
      return {
        key: `t:${t.id}`,
        kind: "task" as const,
        id: t.id,
        name: t.name,
        emoji: null,
        priority: t.priority,
        time: t.time,
        window: null,
        anchor: anchorMinutes(t.time, null),
        done: t.done,
        carried: carriedDays > 0,
        carriedDays,
        subDone: t.subtasks.filter((s) => s.done).length,
        subTotal: t.subtasks.length,
      };
    });

  const all = [...habitItems, ...taskItems];
  all.sort((a, b) => {
    if (a.carried !== b.carried) return a.carried ? -1 : 1;
    if (a.carried && b.carried) {
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (a.carriedDays !== b.carriedDays) return b.carriedDays - a.carriedDays;
      return a.name.localeCompare(b.name);
    }
    if (a.anchor !== b.anchor) return a.anchor - b.anchor;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.name.localeCompare(b.name);
  });
  return all;
}

// The amber NOW row: first incomplete, non-carried, time-anchored item whose
// anchor has passed. Anytime items (anchor 1440) never qualify.
export function findNowKey(items: TodayItem[], nowMinutes: number): string | null {
  for (const item of items) {
    if (item.carried || item.done || item.anchor >= 1440) continue;
    if (item.anchor <= nowMinutes) return item.key;
  }
  return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all todayLogic tests green.

**STOP — Task 3 complete, ready for your commit.**

---

### Task 4: Data layer — `src/lib/habitsData.ts` + `subchecked` in `userData.ts`

Requires Task 1 (schema) confirmed. No unit tests here (thin Supabase pass-throughs, same as the existing `userData.ts`); they're exercised end-to-end in Task 12.

**Files:**
- Create: `src/lib/habitsData.ts`
- Modify: `src/lib/userData.ts:162-199` (`saveTodayProgress`)

- [ ] **Step 1: Create `src/lib/habitsData.ts`**

```ts
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
```

- [ ] **Step 2: Add `subchecked` to `saveTodayProgress` in `src/lib/userData.ts`**

In the payload type (after `frog_done?: boolean;`) add:

```ts
    subchecked?: Record<string, Record<string, boolean>>;
```

In the upsert object (after the `checked:` line) add:

```ts
        subchecked: payload.subchecked ?? {},
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no NEW errors introduced by these two files (pre-existing errors in untouched files are out of scope — compare against `git stash`-free baseline by checking the error file paths).

**STOP — Task 4 complete, ready for your commit.**

---

### Task 5: `src/styles/todayStyles.ts` — the `.td-*` stylesheet

**Files:**
- Create: `src/styles/todayStyles.ts`

- [ ] **Step 1: Create the file.** Same injected-string pattern as `landingStyles.ts`. This is the complete visual system for every Task 6–11 component — class names here are the contract those tasks code against.

```ts
/* ─────────────────────────────────────────────────────────────────────────────
   TODAY DASHBOARD STYLES (2026-06 rebuild)
   Namespace: .td-* — injected by TodayApp.tsx via <style>{TODAY_STYLES}</style>.
   Warm-dark brand tokens shared with the landing (.lp-*).
   Spec: docs/superpowers/specs/2026-06-12-dashboard-rebuild-design.md
───────────────────────────────────────────────────────────────────────────── */
export const TODAY_STYLES = `
.td-root{
  --td-bg:#0a0805; --td-card:#100d09; --td-card2:#15110b;
  --td-line:rgba(224,164,59,0.10); --td-line2:rgba(224,164,59,0.16);
  --td-text:#f4f1ea; --td-text2:#a39c8f; --td-mut:#8a8275; --td-faint:#6b6354;
  --td-amber:#f5a524; --td-amber-dim:rgba(245,165,36,0.10);
  --td-green:#4ade80; --td-red:#f87171;
  --td-font:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
  min-height:100%; background:var(--td-bg); color:var(--td-text);
  font-family:var(--td-font); -webkit-font-smoothing:antialiased;
}
.td-wrap{max-width:520px;margin:0 auto;padding:0 20px 96px}

/* ── Top bar ── */
.td-bar{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;
  gap:12px;padding:14px 20px;background:rgba(10,8,5,0.92);backdrop-filter:blur(8px);
  border-bottom:1px solid var(--td-line)}
.td-bar-views{display:flex;gap:4px}
.td-bar-view{background:none;border:none;cursor:pointer;font-family:var(--td-font);
  font-size:.9rem;font-weight:600;color:var(--td-faint);padding:6px 10px;border-radius:8px;
  transition:color .15s}
.td-bar-view:hover{color:var(--td-text2)}
.td-bar-view.active{color:var(--td-text)}
.td-bar-right{display:flex;align-items:center;gap:8px}
.td-replan{display:inline-flex;align-items:center;gap:6px;background:transparent;
  color:var(--td-amber);border:1px solid rgba(245,165,36,0.35);border-radius:8px;cursor:pointer;
  font-family:var(--td-font);font-size:.82rem;font-weight:600;padding:7px 12px;
  transition:background .15s}
.td-replan:hover{background:var(--td-amber-dim)}
.td-menu-btn{background:none;border:1px solid var(--td-line);border-radius:8px;cursor:pointer;
  color:var(--td-text2);font-size:1rem;line-height:1;padding:7px 10px}
.td-menu{position:absolute;right:20px;top:52px;background:var(--td-card);border:1px solid var(--td-line2);
  border-radius:10px;padding:6px;min-width:180px;box-shadow:0 12px 40px rgba(0,0,0,0.5);z-index:30}
.td-menu button{display:block;width:100%;text-align:left;background:none;border:none;cursor:pointer;
  font-family:var(--td-font);font-size:.88rem;color:var(--td-text2);padding:9px 12px;border-radius:7px}
.td-menu button:hover{background:var(--td-card2);color:var(--td-text)}

/* ── Today header ── */
.td-head{display:flex;align-items:baseline;justify-content:space-between;margin:22px 0 10px}
.td-date{font-size:.85rem;color:var(--td-mut)}
.td-count{font-size:.85rem;color:var(--td-text2)}
.td-count b{color:var(--td-green);font-weight:700}

/* ── List rows ── */
.td-section{font-size:.68rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;
  color:var(--td-faint);margin:18px 0 6px}
.td-row{display:flex;align-items:center;gap:11px;width:100%;text-align:left;
  background:none;border:none;border-bottom:1px solid rgba(224,164,59,0.06);cursor:pointer;
  font-family:var(--td-font);color:var(--td-text);padding:12px 2px;border-radius:0;
  transition:background .12s}
.td-row:hover{background:rgba(255,255,255,0.02)}
.td-row.now{background:var(--td-amber-dim);border:1px solid rgba(245,165,36,0.3);
  border-radius:10px;padding:12px 10px;margin:4px 0}
.td-row.done{opacity:.45}
.td-row.done .td-row-name{text-decoration:line-through;color:var(--td-mut)}
.td-check{width:19px;height:19px;flex:none;border-radius:6px;border:1.5px solid #4a4336;
  background:transparent;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;
  color:transparent;font-size:.7rem;transition:all .12s}
.td-check:hover{border-color:var(--td-amber)}
.td-check.on{background:var(--td-green);border-color:var(--td-green);color:#06270f}
.td-row-time{width:48px;flex:none;font-size:.74rem;color:var(--td-faint);
  font-variant-numeric:tabular-nums}
.td-row.now .td-row-time{color:var(--td-amber)}
.td-row-name{flex:1;font-size:.92rem;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.td-row.now .td-row-name{font-weight:600}
.td-row-sub{font-size:.72rem;color:var(--td-faint);margin-left:6px}
.td-badge{font-size:.62rem;font-weight:700;letter-spacing:.5px;flex:none}
.td-badge.p1{color:var(--td-amber)}
.td-badge.p2{color:var(--td-mut)}
.td-badge.p3{color:var(--td-faint)}
.td-badge.now-tag{color:var(--td-amber)}
.td-chip{font-size:.64rem;color:var(--td-mut);border:1px solid var(--td-line);border-radius:9px;
  padding:1px 7px;flex:none}
.td-chip.missed{color:var(--td-amber);border-color:rgba(245,165,36,0.3)}
.td-row-del{background:none;border:none;cursor:pointer;color:var(--td-faint);font-size:.95rem;
  padding:2px 6px;flex:none;border-radius:6px}
.td-row-del:hover{color:var(--td-red)}

/* ── Add-task composer ── */
.td-add{display:flex;align-items:center;gap:9px;padding:12px 2px}
.td-add input[type="text"]{flex:1;background:transparent;border:none;outline:none;
  font-family:var(--td-font);font-size:.9rem;color:var(--td-text)}
.td-add input[type="text"]::placeholder{color:var(--td-faint);font-style:italic}
.td-add-plus{color:var(--td-faint);font-size:1rem;flex:none}
.td-add select,.td-add input[type="time"]{background:var(--td-card);border:1px solid var(--td-line);
  border-radius:7px;color:var(--td-text2);font-family:var(--td-font);font-size:.76rem;padding:4px 6px}

/* ── Focus card (full takeover) ── */
.td-focus{position:fixed;inset:0;z-index:50;background:var(--td-bg);display:flex;flex-direction:column}
.td-focus-bar{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;
  border-bottom:1px solid var(--td-line)}
.td-focus-exit{background:none;border:none;cursor:pointer;color:var(--td-mut);
  font-family:var(--td-font);font-size:.88rem}
.td-focus-exit:hover{color:var(--td-text)}
.td-focus-meta{font-size:.8rem;color:var(--td-amber);font-weight:600}
.td-focus-body{flex:1;overflow-y:auto;display:flex;flex-direction:column;align-items:center;
  padding:46px 20px}
.td-focus-inner{width:100%;max-width:420px;text-align:center}
.td-focus-title{font-size:1.5rem;font-weight:700;margin:0 0 6px}
.td-focus-hint{font-size:.85rem;color:var(--td-mut);margin-bottom:22px}
.td-subs{text-align:left;border:1px solid var(--td-line);border-radius:12px;
  background:var(--td-card);margin-bottom:22px;overflow:hidden}
.td-sub{display:flex;align-items:center;gap:10px;padding:11px 14px;
  border-bottom:1px solid rgba(224,164,59,0.06)}
.td-sub:last-child{border-bottom:none}
.td-sub .td-check{width:16px;height:16px;border-radius:5px}
.td-sub-name{flex:1;font-size:.88rem}
.td-sub.done .td-sub-name{text-decoration:line-through;color:var(--td-mut)}
.td-sub-add{display:flex;gap:10px;padding:11px 14px}
.td-sub-add input{flex:1;background:transparent;border:none;outline:none;
  font-family:var(--td-font);font-size:.86rem;color:var(--td-text)}
.td-sub-add input::placeholder{color:var(--td-faint);font-style:italic}
.td-done-btn{display:inline-flex;align-items:center;gap:8px;background:var(--td-amber);color:#161104;
  border:none;border-radius:9px;cursor:pointer;font-family:var(--td-font);font-size:.92rem;
  font-weight:700;padding:12px 26px;box-shadow:0 4px 24px rgba(245,165,36,0.25);
  transition:transform .15s,background .15s}
.td-done-btn:hover{background:#ffb437;transform:translateY(-1px)}
.td-done-btn.undone{background:transparent;color:var(--td-text2);border:1px solid var(--td-line2);
  box-shadow:none}

/* ── Habits manager ── */
.td-hab{display:flex;align-items:center;gap:10px;padding:13px 2px;
  border-bottom:1px solid rgba(224,164,59,0.06)}
.td-hab-name{flex:1;font-size:.92rem;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.td-hab-meta{font-size:.7rem;color:var(--td-mut);flex:none}
.td-hab-edit{background:none;border:1px solid var(--td-line);border-radius:7px;cursor:pointer;
  color:var(--td-text2);font-family:var(--td-font);font-size:.74rem;padding:4px 10px}
.td-hab-edit:hover{border-color:var(--td-line2);color:var(--td-text)}
.td-new-habit{display:inline-flex;align-items:center;gap:7px;background:transparent;
  color:var(--td-amber);border:1px dashed rgba(245,165,36,0.4);border-radius:9px;cursor:pointer;
  font-family:var(--td-font);font-size:.86rem;font-weight:600;padding:10px 16px;margin-top:16px}
.td-new-habit:hover{background:var(--td-amber-dim)}

/* ── Editor / modal shell (habit editor, schedule, replan) ── */
.td-modal-veil{position:fixed;inset:0;z-index:60;background:rgba(5,4,2,0.7);backdrop-filter:blur(3px);
  display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:40px 16px}
.td-modal{width:100%;max-width:480px;background:var(--td-card);border:1px solid var(--td-line2);
  border-radius:14px;padding:22px}
.td-modal h3{margin:0 0 16px;font-size:1.05rem}
.td-field{margin-bottom:14px}
.td-label{display:block;font-size:.68rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;
  color:var(--td-faint);margin-bottom:6px}
.td-input{width:100%;box-sizing:border-box;background:var(--td-card2);border:1px solid var(--td-line);
  border-radius:8px;color:var(--td-text);font-family:var(--td-font);font-size:.9rem;padding:9px 11px;outline:none}
.td-input:focus{border-color:rgba(245,165,36,0.4)}
.td-seg{display:flex;gap:6px;flex-wrap:wrap}
.td-seg button{background:var(--td-card2);border:1px solid var(--td-line);border-radius:8px;cursor:pointer;
  color:var(--td-text2);font-family:var(--td-font);font-size:.8rem;padding:7px 12px}
.td-seg button.on{border-color:var(--td-amber);color:var(--td-amber);background:var(--td-amber-dim)}
.td-daypick{display:flex;gap:5px}
.td-daypick button{width:34px;height:30px;background:var(--td-card2);border:1px solid var(--td-line);
  border-radius:7px;cursor:pointer;color:var(--td-text2);font-family:var(--td-font);font-size:.72rem}
.td-daypick button.on{border-color:var(--td-amber);color:var(--td-amber);background:var(--td-amber-dim)}
.td-modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:18px}
.td-btn{background:var(--td-amber);color:#161104;border:none;border-radius:8px;cursor:pointer;
  font-family:var(--td-font);font-size:.86rem;font-weight:700;padding:9px 18px}
.td-btn:disabled{opacity:.5;cursor:default}
.td-btn-ghost{background:transparent;color:var(--td-text2);border:1px solid var(--td-line);
  border-radius:8px;cursor:pointer;font-family:var(--td-font);font-size:.86rem;padding:9px 16px}
.td-btn-ghost:hover{color:var(--td-text);border-color:var(--td-line2)}
.td-btn-danger{background:none;border:none;cursor:pointer;color:var(--td-red);
  font-family:var(--td-font);font-size:.82rem;margin-right:auto;padding:9px 4px}

/* ── Replan diff ── */
.td-diff{border:1px solid var(--td-line);border-radius:11px;overflow:hidden;margin-top:14px}
.td-diff-row{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;
  border-bottom:1px solid rgba(224,164,59,0.06)}
.td-diff-row:last-child{border-bottom:none}
.td-diff-row.off{opacity:.4}
.td-diff-type{font-size:.62rem;font-weight:800;letter-spacing:.8px;border-radius:5px;
  padding:2px 7px;flex:none;margin-top:2px}
.td-diff-type.add{color:var(--td-green);border:1px solid rgba(74,222,128,0.35)}
.td-diff-type.update{color:var(--td-amber);border:1px solid rgba(245,165,36,0.35)}
.td-diff-type.remove{color:var(--td-red);border:1px solid rgba(248,113,113,0.35)}
.td-diff-body{flex:1;min-width:0}
.td-diff-name{font-size:.88rem;font-weight:600}
.td-diff-reason{font-size:.78rem;color:var(--td-mut);margin-top:2px}
.td-replan-summary{font-size:.86rem;color:var(--td-text2);line-height:1.55;margin-top:8px}
.td-replan-err{font-size:.84rem;color:var(--td-red);margin-top:12px}
.td-spinner{width:15px;height:15px;border-radius:50%;border:2px solid var(--td-line2);
  border-top-color:var(--td-amber);animation:tdSpin .7s linear infinite;display:inline-block;
  vertical-align:-2px;margin-right:8px}
@keyframes tdSpin{to{transform:rotate(360deg)}}

/* ── Skeleton ── */
.td-skel{height:42px;border-radius:9px;background:linear-gradient(90deg,var(--td-card) 25%,var(--td-card2) 50%,var(--td-card) 75%);
  background-size:200% 100%;animation:tdShimmer 1.4s infinite;margin:8px 0}
@keyframes tdShimmer{to{background-position:-200% 0}}

/* ── Mobile bottom tabs ── */
.td-tabs{display:none}
@media (max-width:719px){
  .td-bar-views{display:none}
  .td-tabs{display:flex;position:fixed;bottom:0;left:0;right:0;z-index:40;
    background:rgba(10,8,5,0.96);backdrop-filter:blur(8px);border-top:1px solid var(--td-line)}
  .td-tab{flex:1;background:none;border:none;cursor:pointer;font-family:var(--td-font);
    font-size:.78rem;font-weight:600;color:var(--td-faint);padding:13px 0 max(13px,env(safe-area-inset-bottom))}
  .td-tab.active{color:var(--td-amber)}
}
`;
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: clean for this file (it's a plain exported string).

**STOP — Task 5 complete, ready for your commit.**

---

### Task 6: `TodayItem.tsx` + `TodayList.tsx`

Pure presentational components — all data and mutations arrive as props (project convention). No direct Supabase/userData imports.

**Files:**
- Create: `src/components/today/TodayItem.tsx`
- Create: `src/components/today/TodayList.tsx`

- [ ] **Step 1: Create `src/components/today/TodayItem.tsx`**

```tsx
import type { TodayItem as Item } from "./todayLogic";
import { carriedLabel } from "./todayLogic";

interface Props {
  item: Item;
  isNow: boolean;
  onToggle: (item: Item) => void;
  onOpen: (item: Item) => void;
  onDelete?: (item: Item) => void; // tasks only
}

export function TodayItem({ item, isNow, onToggle, onOpen, onDelete }: Props) {
  const cls = ["td-row", isNow ? "now" : "", item.done ? "done" : ""].filter(Boolean).join(" ");
  return (
    <div
      className={cls}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(item);
      }}
    >
      <button
        className={`td-check ${item.done ? "on" : ""}`}
        aria-label={item.done ? `Mark ${item.name} not done` : `Mark ${item.name} done`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(item);
        }}
      >
        ✓
      </button>
      <span className="td-row-time">{item.time ?? (item.window && item.window !== "anytime" ? item.window.slice(0, 3) : "—")}</span>
      <span className="td-row-name">
        {item.emoji ? `${item.emoji} ` : ""}
        {item.name}
        {item.subTotal > 0 && (
          <span className="td-row-sub">
            {item.subDone}/{item.subTotal}
          </span>
        )}
      </span>
      {item.carried && <span className="td-chip missed">{carriedLabel(item.carriedDays)}</span>}
      {item.kind === "task" && !item.carried && <span className="td-chip">task</span>}
      {isNow && <span className="td-badge now-tag">NOW · </span>}
      <span className={`td-badge p${item.priority}`}>P{item.priority}</span>
      {item.kind === "task" && onDelete && (
        <button
          className="td-row-del"
          aria-label={`Delete ${item.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item);
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/today/TodayList.tsx`**

```tsx
import { useState } from "react";
import type { TodayItem as Item } from "./todayLogic";
import { TodayItem } from "./TodayItem";

interface Props {
  items: Item[];
  nowKey: string | null;
  loading: boolean;
  dateLabel: string; // e.g. "Thursday, Jun 12"
  onToggle: (item: Item) => void;
  onOpen: (item: Item) => void;
  onDeleteTask: (item: Item) => void;
  onAddTask: (input: { name: string; priority: 1 | 2 | 3; time: string | null }) => void;
}

export function TodayList({
  items,
  nowKey,
  loading,
  dateLabel,
  onToggle,
  onOpen,
  onDeleteTask,
  onAddTask,
}: Props) {
  const [name, setName] = useState("");
  const [priority, setPriority] = useState<1 | 2 | 3>(2);
  const [time, setTime] = useState("");

  const carried = items.filter((i) => i.carried);
  const today = items.filter((i) => !i.carried);
  const doneCount = items.filter((i) => i.done).length;

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAddTask({ name: trimmed, priority, time: time || null });
    setName("");
    setTime("");
    setPriority(2);
  };

  if (loading) {
    return (
      <div>
        <div className="td-skel" />
        <div className="td-skel" />
        <div className="td-skel" />
        <div className="td-skel" />
      </div>
    );
  }

  return (
    <div>
      <div className="td-head">
        <span className="td-date">{dateLabel}</span>
        <span className="td-count">
          <b>{doneCount}</b>/{items.length} done
        </span>
      </div>

      {carried.length > 0 && (
        <>
          <div className="td-section">Carried over</div>
          {carried.map((item) => (
            <TodayItem
              key={item.key}
              item={item}
              isNow={false}
              onToggle={onToggle}
              onOpen={onOpen}
              onDelete={onDeleteTask}
            />
          ))}
          <div className="td-section">Today</div>
        </>
      )}

      {today.length === 0 && carried.length === 0 && (
        <p style={{ color: "var(--td-mut)", fontSize: ".9rem", padding: "18px 2px" }}>
          Nothing scheduled today. Add a task below, or set up habits in the Habits tab.
        </p>
      )}

      {today.map((item) => (
        <TodayItem
          key={item.key}
          item={item}
          isNow={item.key === nowKey}
          onToggle={onToggle}
          onOpen={onOpen}
          onDelete={item.kind === "task" ? onDeleteTask : undefined}
        />
      ))}

      <div className="td-add">
        <span className="td-add-plus">+</span>
        <input
          type="text"
          placeholder="add a task for today…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        {name.trim() && (
          <>
            <select
              aria-label="Priority"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value) as 1 | 2 | 3)}
            >
              <option value={1}>P1</option>
              <option value={2}>P2</option>
              <option value={3}>P3</option>
            </select>
            <input
              type="time"
              aria-label="Time (optional)"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <button className="td-btn" onClick={submit}>
              Add
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no new errors.

**STOP — Task 6 complete, ready for your commit.**

---

### Task 7: `FocusCard.tsx` — full-takeover focus view

**Files:**
- Create: `src/components/today/FocusCard.tsx`

Behavior (spec §3): full-screen takeover; subtask checklist with inline add; **Mark done** never auto-fires from subtasks; ✕ returns to Today. Works for both habits (subtask checks live in `subchecked`, passed via `subChecks`) and tasks (subtask `done` flags live on the task row — the parent translates both into the same props).

- [ ] **Step 1: Create `src/components/today/FocusCard.tsx`**

```tsx
import { useState } from "react";
import type { TodayItem } from "./todayLogic";

interface SubtaskView {
  id: string;
  name: string;
  done: boolean;
}

interface Props {
  item: TodayItem;
  subtasks: SubtaskView[];
  onToggleSub: (subId: string, done: boolean) => void;
  onAddSub: (name: string) => void;
  onToggleDone: () => void;
  onExit: () => void;
}

export function FocusCard({ item, subtasks, onToggleSub, onAddSub, onToggleDone, onExit }: Props) {
  const [newSub, setNewSub] = useState("");
  const doneCount = subtasks.filter((s) => s.done).length;

  const addSub = () => {
    const trimmed = newSub.trim();
    if (!trimmed) return;
    onAddSub(trimmed);
    setNewSub("");
  };

  const meta = [
    item.time ?? (item.window && item.window !== "anytime" ? item.window : null),
    `P${item.priority}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="td-focus" role="dialog" aria-label={`Focus: ${item.name}`}>
      <div className="td-focus-bar">
        <button className="td-focus-exit" onClick={onExit}>
          ✕ back to Today
        </button>
        <span className="td-focus-meta">{meta}</span>
      </div>
      <div className="td-focus-body">
        <div className="td-focus-inner">
          <h2 className="td-focus-title">
            {item.emoji ? `${item.emoji} ` : ""}
            {item.name}
          </h2>
          <p className="td-focus-hint">
            {subtasks.length > 0
              ? `${doneCount} of ${subtasks.length} subtasks done`
              : "Break it down if it helps — or just do it."}
          </p>

          <div className="td-subs">
            {subtasks.map((s) => (
              <div key={s.id} className={`td-sub ${s.done ? "done" : ""}`}>
                <button
                  className={`td-check ${s.done ? "on" : ""}`}
                  aria-label={`Toggle ${s.name}`}
                  onClick={() => onToggleSub(s.id, !s.done)}
                >
                  ✓
                </button>
                <span className="td-sub-name">{s.name}</span>
              </div>
            ))}
            <div className="td-sub-add">
              <input
                type="text"
                placeholder="+ add subtask…"
                value={newSub}
                onChange={(e) => setNewSub(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addSub();
                }}
              />
            </div>
          </div>

          <button className={`td-done-btn ${item.done ? "undone" : ""}`} onClick={onToggleDone}>
            {item.done ? "Mark not done" : "Mark done ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no new errors.

**STOP — Task 7 complete, ready for your commit.**

---

### Task 8: `HabitsManager.tsx` — habit CRUD view

**Files:**
- Create: `src/components/today/HabitsManager.tsx`

- [ ] **Step 1: Create `src/components/today/HabitsManager.tsx`**

```tsx
import { useState } from "react";
import type { HabitRow, Window } from "./todayLogic";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"]; // 0=Sun .. 6=Sat
const WINDOWS: Window[] = ["morning", "afternoon", "evening", "anytime"];

export interface HabitDraft {
  name: string;
  emoji: string;
  priority: 1 | 2 | 3;
  time: string; // "" = none
  window: Window;
  days: number[];
  subtasks: { id: string; name: string }[];
}

const emptyDraft = (): HabitDraft => ({
  name: "",
  emoji: "",
  priority: 2,
  time: "",
  window: "anytime",
  days: [0, 1, 2, 3, 4, 5, 6],
  subtasks: [],
});

const toDraft = (h: HabitRow): HabitDraft => ({
  name: h.name,
  emoji: h.emoji ?? "",
  priority: h.priority,
  time: h.time ?? "",
  window: h.window ?? "anytime",
  days: [...h.days],
  subtasks: h.subtasks.map((s) => ({ ...s })),
});

function describe(h: HabitRow): string {
  const days =
    h.days.length === 7
      ? "daily"
      : h.days
          .slice()
          .sort()
          .map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
          .join("/");
  const when = h.time ?? (h.window && h.window !== "anytime" ? h.window : null);
  return when ? `${days} · ${when}` : days;
}

interface Props {
  habits: HabitRow[];
  onCreate: (draft: HabitDraft) => void;
  onUpdate: (id: string, draft: HabitDraft) => void;
  onArchive: (id: string) => void;
}

export function HabitsManager({ habits, onCreate, onUpdate, onArchive }: Props) {
  const [editing, setEditing] = useState<null | { id: string | null; draft: HabitDraft }>(null);
  const [newSub, setNewSub] = useState("");

  const set = (patch: Partial<HabitDraft>) =>
    setEditing((e) => (e ? { ...e, draft: { ...e.draft, ...patch } } : e));

  const save = () => {
    if (!editing || !editing.draft.name.trim() || editing.draft.days.length === 0) return;
    if (editing.id) onUpdate(editing.id, editing.draft);
    else onCreate(editing.draft);
    setEditing(null);
  };

  return (
    <div>
      <div className="td-head">
        <span className="td-date">My habits ({habits.length})</span>
      </div>

      {habits.map((h) => (
        <div className="td-hab" key={h.id}>
          <span className={`td-badge p${h.priority}`}>P{h.priority}</span>
          <span className="td-hab-name">
            {h.emoji ? `${h.emoji} ` : ""}
            {h.name}
          </span>
          <span className="td-hab-meta">{describe(h)}</span>
          <button className="td-hab-edit" onClick={() => setEditing({ id: h.id, draft: toDraft(h) })}>
            Edit
          </button>
        </div>
      ))}

      {habits.length === 0 && (
        <p style={{ color: "var(--td-mut)", fontSize: ".9rem", padding: "18px 2px" }}>
          No habits yet. Add your first one, or use ✦ Replan to let the AI propose a set.
        </p>
      )}

      <button className="td-new-habit" onClick={() => setEditing({ id: null, draft: emptyDraft() })}>
        + New habit
      </button>

      {editing && (
        <div className="td-modal-veil" onClick={(e) => e.target === e.currentTarget && setEditing(null)}>
          <div className="td-modal">
            <h3>{editing.id ? "Edit habit" : "New habit"}</h3>

            <div className="td-field">
              <label className="td-label">Name</label>
              <input
                className="td-input"
                value={editing.draft.name}
                autoFocus
                onChange={(e) => set({ name: e.target.value })}
                placeholder="e.g. Read 20 pages"
              />
            </div>

            <div className="td-field">
              <label className="td-label">Emoji (optional)</label>
              <input
                className="td-input"
                style={{ width: 80 }}
                value={editing.draft.emoji}
                maxLength={4}
                onChange={(e) => set({ emoji: e.target.value })}
                placeholder="📖"
              />
            </div>

            <div className="td-field">
              <label className="td-label">Priority</label>
              <div className="td-seg">
                {([1, 2, 3] as const).map((p) => (
                  <button
                    key={p}
                    className={editing.draft.priority === p ? "on" : ""}
                    onClick={() => set({ priority: p })}
                  >
                    P{p}
                  </button>
                ))}
              </div>
            </div>

            <div className="td-field">
              <label className="td-label">When</label>
              <div className="td-seg">
                {WINDOWS.map((w) => (
                  <button
                    key={w}
                    className={!editing.draft.time && editing.draft.window === w ? "on" : ""}
                    onClick={() => set({ time: "", window: w })}
                  >
                    {w}
                  </button>
                ))}
                <input
                  className="td-input"
                  style={{ width: 110 }}
                  type="time"
                  value={editing.draft.time}
                  onChange={(e) => set({ time: e.target.value })}
                  aria-label="Exact time (overrides window)"
                />
              </div>
            </div>

            <div className="td-field">
              <label className="td-label">Days</label>
              <div className="td-daypick">
                {DAY_LABELS.map((label, d) => (
                  <button
                    key={d}
                    className={editing.draft.days.includes(d) ? "on" : ""}
                    onClick={() =>
                      set({
                        days: editing.draft.days.includes(d)
                          ? editing.draft.days.filter((x) => x !== d)
                          : [...editing.draft.days, d],
                      })
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="td-field">
              <label className="td-label">Subtasks (daily checklist)</label>
              {editing.draft.subtasks.map((s) => (
                <div key={s.id} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span style={{ flex: 1, fontSize: ".86rem" }}>{s.name}</span>
                  <button
                    className="td-row-del"
                    onClick={() =>
                      set({ subtasks: editing.draft.subtasks.filter((x) => x.id !== s.id) })
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
              <input
                className="td-input"
                value={newSub}
                placeholder="+ add subtask, press Enter"
                onChange={(e) => setNewSub(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newSub.trim()) {
                    set({
                      subtasks: [
                        ...editing.draft.subtasks,
                        { id: crypto.randomUUID(), name: newSub.trim() },
                      ],
                    });
                    setNewSub("");
                  }
                }}
              />
            </div>

            <div className="td-modal-actions">
              {editing.id && (
                <button
                  className="td-btn-danger"
                  onClick={() => {
                    onArchive(editing.id as string);
                    setEditing(null);
                  }}
                >
                  Delete habit
                </button>
              )}
              <button className="td-btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="td-btn" disabled={!editing.draft.name.trim() || editing.draft.days.length === 0} onClick={save}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no new errors.

**STOP — Task 8 complete, ready for your commit.**

---

### Task 9: Replan — prompt, API event type, `ReplanModal.tsx`

**Files:**
- Modify: `src/lib/prompts.ts` (append at end)
- Modify: `api/generate-plan.ts:13`
- Create: `src/components/today/ReplanModal.tsx`

- [ ] **Step 1: Allow the `replan` event type in `api/generate-plan.ts`**

Change line 13 from:

```ts
const ALLOWED_EVENT_TYPES = ["plan_generation", "weekly_review", "recovery_plan"] as const;
```

to:

```ts
const ALLOWED_EVENT_TYPES = ["plan_generation", "weekly_review", "recovery_plan", "replan"] as const;
```

- [ ] **Step 2: Append the replan prompt to `src/lib/prompts.ts`**

```ts
export const REPLAN_PROMPT_VERSION = "replan-v1";

export interface ReplanHabitStat {
  id: string;
  name: string;
  priority: number;
  time: string | null;
  window: string | null;
  days: number[];
  completionRate14d: number; // 0..1, only counting days the habit was scheduled
}

export function buildReplanPrompt(
  profile: any,
  schedule: { wake?: string; sleep?: string; blocks?: { label: string; days: number[]; start: string; end: string }[] } | null,
  habits: ReplanHabitStat[]
): string {
  const blocks =
    schedule?.blocks?.length
      ? schedule.blocks
          .map((b) => `${b.label}: days ${b.days.join(",")} ${b.start}-${b.end}`)
          .join("; ")
      : "none specified";

  const habitLines = habits
    .map(
      (h) =>
        `- id=${h.id} | "${h.name}" | P${h.priority} | ${h.time ?? h.window ?? "anytime"} | days ${h.days.join(",")} | 14-day completion ${(h.completionRate14d * 100).toFixed(0)}%`
    )
    .join("\n");

  return `You are MACP's execution coach. The user pressed "Replan": review their habit system and propose targeted changes. You may only ADD, UPDATE, or REMOVE habits — never rewrite everything. Keep what works (high completion), fix what doesn't (low completion: shrink it, retime it, or remove it). Stay within the user's schedule and constraints.

USER CONTEXT:
- Main goal: ${profile?.mainGoal || "Not specified"}
- Constraints (HARD limits): ${profile?.constraints || "None"}
- Typical failure pattern: ${profile?.failurePattern || "Not specified"}
- Wake: ${schedule?.wake || profile?.wakeTime || "?"} | Sleep: ${schedule?.sleep || profile?.sleepTime || "?"}
- Busy blocks (never schedule inside these): ${blocks}

CURRENT HABITS (with 14-day completion rates on scheduled days):
${habitLines || "- none yet — propose a starter set of 3-5 habits"}

Return ONLY this JSON (no markdown fences):
{
  "summary": "<2-3 sentences: what you changed and why, in plain language>",
  "changes": [
    { "type": "add", "habit": { "name": "<specific habit>", "emoji": "<one emoji or null>", "priority": 1, "time": "HH:MM or null", "window": "morning|afternoon|evening|anytime or null", "days": [0,1,2,3,4,5,6], "subtasks": ["<optional subtask names>"] }, "reason": "<max 15 words>" },
    { "type": "update", "id": "<existing habit id>", "habit": { "name": "...", "priority": 2, "time": null, "window": "evening", "days": [1,2,3,4,5] }, "reason": "<max 15 words>" },
    { "type": "remove", "id": "<existing habit id>", "reason": "<max 15 words>" }
  ]
}

Rules:
- 1 to 6 changes total. Days use 0=Sunday..6=Saturday. priority is 1 (must-do), 2, or 3.
- "time" must be HH:MM 24h or null; when time is set, window must be null.
- Never place a timed habit inside a busy block. Respect wake/sleep.
- For "update", include ONLY the habit fields you are changing plus name.
- Prefer shrinking a failing habit over removing it; remove only when it clearly conflicts with the goal or schedule.`;
}
```

- [ ] **Step 3: Create `src/components/today/ReplanModal.tsx`**

```tsx
import { useEffect, useRef, useState } from "react";
import type { HabitRow } from "./todayLogic";

export interface ReplanChange {
  type: "add" | "update" | "remove";
  id?: string;
  habit?: any;
  reason?: string;
}

interface QuotaInfo {
  limit: number;
  used: number;
  resetsAt: string;
}

interface Props {
  habits: HabitRow[];
  buildPrompt: () => Promise<string>;
  streamClaude: (
    prompt: string,
    eventType: string,
    getToken: unknown,
    onChunk: (t: string) => void,
    onDone: (t: string) => void,
    onError: (msg: string, quota?: QuotaInfo) => void,
    promptVersion?: string
  ) => void;
  getToken: unknown;
  promptVersion: string;
  onApply: (changes: ReplanChange[]) => Promise<void>;
  onClose: () => void;
}

function parseChanges(raw: string): { summary: string; changes: ReplanChange[] } {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  const changes = Array.isArray(parsed.changes)
    ? parsed.changes.filter((c: any) => ["add", "update", "remove"].includes(c?.type))
    : [];
  return { summary: String(parsed.summary || ""), changes };
}

export function ReplanModal({
  habits,
  buildPrompt,
  streamClaude,
  getToken,
  promptVersion,
  onApply,
  onClose,
}: Props) {
  const [phase, setPhase] = useState<"loading" | "review" | "applying" | "error">("loading");
  const [summary, setSummary] = useState("");
  const [changes, setChanges] = useState<ReplanChange[]>([]);
  const [accepted, setAccepted] = useState<boolean[]>([]);
  const [err, setErr] = useState("");
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const started = useRef(false);

  const habitName = (id?: string) => habits.find((h) => h.id === id)?.name ?? "(unknown habit)";

  const run = async () => {
    setPhase("loading");
    setErr("");
    setQuota(null);
    try {
      const prompt = await buildPrompt();
      streamClaude(
        prompt,
        "replan",
        getToken,
        () => {},
        (full) => {
          try {
            const { summary: s, changes: c } = parseChanges(full);
            if (c.length === 0) throw new Error("no changes returned");
            setSummary(s);
            setChanges(c);
            setAccepted(c.map(() => true));
            setPhase("review");
          } catch {
            setErr("The AI returned an unreadable plan. Try again.");
            setPhase("error");
          }
        },
        (msg, q) => {
          setErr(msg);
          setQuota(q ?? null);
          setPhase("error");
        },
        promptVersion
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setPhase("error");
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apply = async () => {
    setPhase("applying");
    try {
      await onApply(changes.filter((_, i) => accepted[i]));
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setPhase("error");
    }
  };

  return (
    <div className="td-modal-veil" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="td-modal">
        <h3>✦ Replan proposal</h3>

        {phase === "loading" && (
          <p className="td-replan-summary">
            <span className="td-spinner" />
            Reviewing your schedule, habits, and the last 14 days…
          </p>
        )}

        {phase === "error" && (
          <>
            <p className="td-replan-err">
              {quota
                ? `Daily AI limit reached (${quota.used}/${quota.limit}). Try again after the reset.`
                : err}
            </p>
            <div className="td-modal-actions">
              <button className="td-btn-ghost" onClick={onClose}>
                Close
              </button>
              {!quota && (
                <button className="td-btn" onClick={run}>
                  Retry
                </button>
              )}
            </div>
          </>
        )}

        {(phase === "review" || phase === "applying") && (
          <>
            {summary && <p className="td-replan-summary">{summary}</p>}
            <div className="td-diff">
              {changes.map((c, i) => (
                <div key={i} className={`td-diff-row ${accepted[i] ? "" : "off"}`}>
                  <button
                    className={`td-check ${accepted[i] ? "on" : ""}`}
                    aria-label={accepted[i] ? "Reject this change" : "Accept this change"}
                    onClick={() => setAccepted((a) => a.map((v, j) => (j === i ? !v : v)))}
                  >
                    ✓
                  </button>
                  <span className={`td-diff-type ${c.type}`}>{c.type.toUpperCase()}</span>
                  <div className="td-diff-body">
                    <div className="td-diff-name">
                      {c.type === "add" ? c.habit?.name : habitName(c.id)}
                      {c.type === "update" && c.habit?.name && c.habit.name !== habitName(c.id)
                        ? ` → ${c.habit.name}`
                        : ""}
                    </div>
                    {c.reason && <div className="td-diff-reason">{c.reason}</div>}
                  </div>
                </div>
              ))}
            </div>
            <div className="td-modal-actions">
              <button className="td-btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                className="td-btn"
                disabled={phase === "applying" || accepted.every((a) => !a)}
                onClick={apply}
              >
                {phase === "applying" ? "Applying…" : `Apply selected (${accepted.filter(Boolean).length})`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no new errors.

**STOP — Task 9 complete, ready for your commit.**

---

### Task 10: `ScheduleEditor.tsx`

**Files:**
- Create: `src/components/today/ScheduleEditor.tsx`

- [ ] **Step 1: Create `src/components/today/ScheduleEditor.tsx`**

```tsx
import { useState } from "react";
import type { UserSchedule, ScheduleBlock } from "../../lib/habitsData";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

interface Props {
  initial: UserSchedule | null;
  profile: any; // onboarding answers — used for first-run defaults
  onSave: (schedule: UserSchedule) => Promise<void>;
  onClose: () => void;
}

export function ScheduleEditor({ initial, profile, onSave, onClose }: Props) {
  const [wake, setWake] = useState(initial?.wake || profile?.wakeTime || "07:00");
  const [sleep, setSleep] = useState(initial?.sleep || profile?.sleepTime || "23:00");
  const [blocks, setBlocks] = useState<ScheduleBlock[]>(initial?.blocks ?? []);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const setBlock = (i: number, patch: Partial<ScheduleBlock>) =>
    setBlocks((bs) => bs.map((b, j) => (j === i ? { ...b, ...patch } : b)));

  const save = async () => {
    setSaving(true);
    setErr("");
    try {
      await onSave({
        wake,
        sleep,
        blocks: blocks.filter((b) => b.label.trim() && b.days.length > 0),
      });
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  };

  return (
    <div className="td-modal-veil" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="td-modal">
        <h3>My schedule</h3>
        <p className="td-replan-summary" style={{ marginTop: 0 }}>
          Replan uses this to fit habits around your real day.
        </p>

        <div className="td-field" style={{ display: "flex", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <label className="td-label">Wake</label>
            <input className="td-input" type="time" value={wake} onChange={(e) => setWake(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="td-label">Sleep</label>
            <input className="td-input" type="time" value={sleep} onChange={(e) => setSleep(e.target.value)} />
          </div>
        </div>

        <div className="td-field">
          <label className="td-label">Busy blocks (work, classes…)</label>
          {blocks.map((b, i) => (
            <div key={i} style={{ border: "1px solid var(--td-line)", borderRadius: 9, padding: 10, marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  className="td-input"
                  style={{ flex: 1 }}
                  placeholder="Label, e.g. Work"
                  value={b.label}
                  onChange={(e) => setBlock(i, { label: e.target.value })}
                />
                <button className="td-row-del" onClick={() => setBlocks((bs) => bs.filter((_, j) => j !== i))}>
                  ×
                </button>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input className="td-input" style={{ width: 105 }} type="time" value={b.start} onChange={(e) => setBlock(i, { start: e.target.value })} />
                <span style={{ color: "var(--td-faint)" }}>–</span>
                <input className="td-input" style={{ width: 105 }} type="time" value={b.end} onChange={(e) => setBlock(i, { end: e.target.value })} />
                <div className="td-daypick">
                  {DAY_LABELS.map((label, d) => (
                    <button
                      key={d}
                      className={b.days.includes(d) ? "on" : ""}
                      onClick={() =>
                        setBlock(i, {
                          days: b.days.includes(d) ? b.days.filter((x) => x !== d) : [...b.days, d],
                        })
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <button
            className="td-btn-ghost"
            onClick={() =>
              setBlocks((bs) => [...bs, { label: "", days: [1, 2, 3, 4, 5], start: "09:00", end: "17:00" }])
            }
          >
            + Add block
          </button>
        </div>

        {err && <p className="td-replan-err">{err}</p>}

        <div className="td-modal-actions">
          <button className="td-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="td-btn" disabled={saving} onClick={save}>
            {saving ? "Saving…" : "Save schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no new errors.

**STOP — Task 10 complete, ready for your commit.**

---

### Task 11: `TodayApp.tsx` — the shell that wires everything

This is the only stateful component: it owns habits/tasks/checks state, persists optimistically, and renders the bar, tabs, views, focus card, and modals. All data functions arrive as props from `App.tsx` (Task 12).

**Files:**
- Create: `src/components/today/TodayApp.tsx`

- [ ] **Step 1: Create `src/components/today/TodayApp.tsx`**

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { TODAY_STYLES } from "../../styles/todayStyles";
import {
  buildTodayItems,
  findNowKey,
  localDateKey,
  type HabitRow,
  type TaskRow,
  type TodayItem as Item,
} from "./todayLogic";
import { TodayList } from "./TodayList";
import { FocusCard } from "./FocusCard";
import { HabitsManager, type HabitDraft } from "./HabitsManager";
import { ReplanModal, type ReplanChange } from "./ReplanModal";
import { ScheduleEditor } from "./ScheduleEditor";

export function TodayApp({
  profile,
  plan,
  supabase,
  userId,
  data, // every function from src/lib/habitsData.ts, passed by App.tsx
  getTodayProgress,
  saveTodayProgress,
  getProgressMonth,
  streamClaude,
  buildReplanPrompt,
  replanPromptVersion,
  onNavigate, // (screen: "calendar" | "review" | "settings") => void
}: any) {
  const { getToken } = useAuth();

  const [view, setView] = useState<"today" | "habits">("today");
  const [habits, setHabits] = useState<HabitRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [subchecked, setSubchecked] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [showReplan, setShowReplan] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedule, setSchedule] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [nowMin, setNowMin] = useState(() => new Date().getHours() * 60 + new Date().getMinutes());
  const [toast, setToast] = useState("");

  const todayKey = localDateKey();
  const weekday = new Date().getDay();
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  // Keep the NOW highlight fresh.
  useEffect(() => {
    const t = setInterval(
      () => setNowMin(new Date().getHours() * 60 + new Date().getMinutes()),
      60_000
    );
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ── Load everything (and seed once from the AI plan) ── */
  const loadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!userId || loadedFor.current === userId) return;
    loadedFor.current = userId;
    (async () => {
      setLoading(true);
      try {
        await data.seedHabitsFromPlan(supabase, userId, plan);
        const [h, t, progress, sched] = await Promise.all([
          data.listHabits(supabase, userId),
          data.listOpenTasks(supabase, userId, todayKey),
          getTodayProgress(supabase, userId),
          data.getSchedule(supabase, userId),
        ]);
        setHabits(h);
        setTasks(t);
        setChecked(progress?.checked || {});
        setSubchecked(progress?.subchecked || {});
        setSchedule(sched);
      } catch (e) {
        console.error("TodayApp load failed:", e);
        setToast("Couldn't load your day. Refresh to retry.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, supabase]);

  const items = useMemo(
    () => buildTodayItems({ habits, tasks, checked, subchecked, todayKey, weekday }),
    [habits, tasks, checked, subchecked, todayKey, weekday]
  );
  const nowKey = findNowKey(items, nowMin);
  const focusItem = focusKey ? items.find((i) => i.key === focusKey) ?? null : null;

  /* ── Persistence ── */
  // Calendar history keeps rendering from checked + habits_snapshot.
  const persistChecks = async (
    nextChecked: Record<string, boolean>,
    nextSubchecked: Record<string, Record<string, boolean>>
  ) => {
    try {
      await saveTodayProgress(supabase, userId, {
        checked: nextChecked,
        subchecked: nextSubchecked,
        habits_snapshot: habits.map((h) => ({ id: h.id, name: h.name, priority: h.priority })),
      });
    } catch (e) {
      console.error("Failed to save progress:", e);
      setToast("Saving failed — your last check may not stick.");
    }
  };

  const toggleItem = async (item: Item) => {
    if (item.kind === "habit") {
      const next = { ...checked, [item.id]: !item.done };
      setChecked(next);
      persistChecks(next, subchecked);
    } else {
      const task = tasks.find((t) => t.id === item.id);
      if (!task) return;
      const done = !task.done;
      setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, done } : t)));
      try {
        await data.updateTask(supabase, userId, task.id, {
          done,
          done_at: done ? new Date().toISOString() : null,
        });
      } catch (e) {
        console.error("Failed to save task:", e);
        setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, done: !done } : t)));
        setToast("Saving failed — try again.");
      }
    }
  };

  const toggleSub = async (item: Item, subId: string, done: boolean) => {
    if (item.kind === "habit") {
      const next = { ...subchecked, [item.id]: { ...(subchecked[item.id] || {}), [subId]: done } };
      setSubchecked(next);
      persistChecks(checked, next);
    } else {
      const task = tasks.find((t) => t.id === item.id);
      if (!task) return;
      const subtasks = task.subtasks.map((s) => (s.id === subId ? { ...s, done } : s));
      setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, subtasks } : t)));
      data.updateTask(supabase, userId, task.id, { subtasks }).catch((e: unknown) => {
        console.error("Failed to save subtask:", e);
        setToast("Saving failed — try again.");
      });
    }
  };

  const addSub = async (item: Item, name: string) => {
    if (item.kind === "habit") {
      const habit = habits.find((h) => h.id === item.id);
      if (!habit) return;
      const subtasks = [...habit.subtasks, { id: crypto.randomUUID(), name }];
      setHabits((hs) => hs.map((h) => (h.id === habit.id ? { ...h, subtasks } : h)));
      data.updateHabit(supabase, userId, habit.id, { subtasks }).catch((e: unknown) => {
        console.error("Failed to add subtask:", e);
        setToast("Saving failed — try again.");
      });
    } else {
      const task = tasks.find((t) => t.id === item.id);
      if (!task) return;
      const subtasks = [...task.subtasks, { id: crypto.randomUUID(), name, done: false }];
      setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, subtasks } : t)));
      data.updateTask(supabase, userId, task.id, { subtasks }).catch((e: unknown) => {
        console.error("Failed to add subtask:", e);
        setToast("Saving failed — try again.");
      });
    }
  };

  const addTask = async (input: { name: string; priority: 1 | 2 | 3; time: string | null }) => {
    try {
      const row = await data.createTask(supabase, userId, { date: todayKey, ...input });
      setTasks((ts) => [...ts, row]);
    } catch (e) {
      console.error("Failed to add task:", e);
      setToast("Couldn't add the task — try again.");
    }
  };

  const deleteTaskItem = async (item: Item) => {
    setTasks((ts) => ts.filter((t) => t.id !== item.id));
    if (focusKey === item.key) setFocusKey(null);
    data.deleteTask(supabase, userId, item.id).catch((e: unknown) => {
      console.error("Failed to delete task:", e);
      setToast("Delete failed — refresh and try again.");
    });
  };

  /* ── Habit CRUD (from HabitsManager) ── */
  const draftToInput = (d: HabitDraft) => ({
    name: d.name.trim(),
    emoji: d.emoji.trim() || null,
    priority: d.priority,
    time: d.time || null,
    window: d.time ? null : d.window,
    days: d.days.slice().sort(),
    subtasks: d.subtasks,
  });

  const createHabit = async (d: HabitDraft) => {
    try {
      const row = await data.createHabit(supabase, userId, draftToInput(d));
      setHabits((hs) => [...hs, row]);
    } catch (e) {
      console.error("Failed to create habit:", e);
      setToast("Couldn't save the habit — try again.");
    }
  };

  const updateHabitDraft = async (id: string, d: HabitDraft) => {
    try {
      const row = await data.updateHabit(supabase, userId, id, draftToInput(d));
      setHabits((hs) => hs.map((h) => (h.id === id ? row : h)));
    } catch (e) {
      console.error("Failed to update habit:", e);
      setToast("Couldn't save the habit — try again.");
    }
  };

  const archiveHabitById = async (id: string) => {
    setHabits((hs) => hs.filter((h) => h.id !== id));
    data.archiveHabit(supabase, userId, id).catch((e: unknown) => {
      console.error("Failed to archive habit:", e);
      setToast("Delete failed — refresh and try again.");
    });
  };

  /* ── Replan ── */
  // 14-day completion per habit from daily_progress (checked maps keyed by habit id).
  const buildPromptForReplan = async () => {
    const now = new Date();
    const months = new Set<string>();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      months.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
    }
    const rows: any[] = [];
    for (const key of months) {
      const [y, m] = key.split("-").map(Number);
      try {
        rows.push(...(await getProgressMonth(supabase, userId, y, m)));
      } catch (e) {
        console.error("Replan: month load failed", e);
      }
    }
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 14);
    const recent = rows.filter((r) => new Date(`${r.progress_date}T00:00:00`) >= cutoff);

    const stats = habits.map((h) => {
      let scheduled = 0;
      let done = 0;
      for (const r of recent) {
        const day = new Date(`${r.progress_date}T00:00:00`).getDay();
        if (!h.days.includes(day)) continue;
        scheduled++;
        if (r.checked?.[h.id]) done++;
      }
      return {
        id: h.id,
        name: h.name,
        priority: h.priority,
        time: h.time,
        window: h.window,
        days: h.days,
        completionRate14d: scheduled > 0 ? done / scheduled : 0,
      };
    });
    return buildReplanPrompt(profile, schedule, stats);
  };

  const applyReplan = async (changes: ReplanChange[]) => {
    for (const c of changes) {
      if (c.type === "add" && c.habit?.name) {
        const row = await data.createHabit(supabase, userId, {
          name: String(c.habit.name),
          emoji: c.habit.emoji ?? null,
          priority: [1, 2, 3].includes(c.habit.priority) ? c.habit.priority : 2,
          time: typeof c.habit.time === "string" ? c.habit.time : null,
          window: c.habit.time ? null : c.habit.window ?? "anytime",
          days: Array.isArray(c.habit.days) && c.habit.days.length > 0 ? c.habit.days : [0, 1, 2, 3, 4, 5, 6],
          subtasks: Array.isArray(c.habit.subtasks)
            ? c.habit.subtasks.map((n: string) => ({ id: crypto.randomUUID(), name: String(n) }))
            : [],
          source: "ai",
        });
        setHabits((hs) => [...hs, row]);
      } else if (c.type === "update" && c.id && c.habit) {
        const patch: any = {};
        if (typeof c.habit.name === "string") patch.name = c.habit.name;
        if ([1, 2, 3].includes(c.habit.priority)) patch.priority = c.habit.priority;
        if ("time" in c.habit) patch.time = c.habit.time ?? null;
        if ("window" in c.habit) patch.window = c.habit.time ? null : c.habit.window;
        if (Array.isArray(c.habit.days) && c.habit.days.length > 0) patch.days = c.habit.days;
        const row = await data.updateHabit(supabase, userId, c.id, patch);
        setHabits((hs) => hs.map((h) => (h.id === c.id ? row : h)));
      } else if (c.type === "remove" && c.id) {
        await data.archiveHabit(supabase, userId, c.id);
        setHabits((hs) => hs.filter((h) => h.id !== c.id));
      }
    }
  };

  /* ── Focus card data ── */
  const focusSubtasks = useMemo(() => {
    if (!focusItem) return [];
    if (focusItem.kind === "habit") {
      const habit = habits.find((h) => h.id === focusItem.id);
      const subs = subchecked[focusItem.id] || {};
      return (habit?.subtasks || []).map((s) => ({ id: s.id, name: s.name, done: !!subs[s.id] }));
    }
    const task = tasks.find((t) => t.id === focusItem.id);
    return task?.subtasks || [];
  }, [focusItem, habits, tasks, subchecked]);

  return (
    <div className="td-root">
      <style>{TODAY_STYLES}</style>

      <div className="td-bar">
        <div className="td-bar-views">
          <button className={`td-bar-view ${view === "today" ? "active" : ""}`} onClick={() => setView("today")}>
            Today
          </button>
          <button className={`td-bar-view ${view === "habits" ? "active" : ""}`} onClick={() => setView("habits")}>
            Habits
          </button>
        </div>
        <div className="td-bar-right">
          <button className="td-replan" onClick={() => setShowReplan(true)}>
            ✦ Replan
          </button>
          <button className="td-menu-btn" aria-label="More" onClick={() => setMenuOpen((o) => !o)}>
            ⋯
          </button>
          {menuOpen && (
            <div className="td-menu" onMouseLeave={() => setMenuOpen(false)}>
              <button onClick={() => { setMenuOpen(false); setShowSchedule(true); }}>My schedule</button>
              <button onClick={() => { setMenuOpen(false); onNavigate("calendar"); }}>Calendar</button>
              <button onClick={() => { setMenuOpen(false); onNavigate("review"); }}>Weekly review</button>
              <button onClick={() => { setMenuOpen(false); onNavigate("settings"); }}>Settings</button>
            </div>
          )}
        </div>
      </div>

      <div className="td-wrap">
        {view === "today" ? (
          <TodayList
            items={items}
            nowKey={nowKey}
            loading={loading}
            dateLabel={dateLabel}
            onToggle={toggleItem}
            onOpen={(item) => setFocusKey(item.key)}
            onDeleteTask={deleteTaskItem}
            onAddTask={addTask}
          />
        ) : (
          <HabitsManager
            habits={habits}
            onCreate={createHabit}
            onUpdate={updateHabitDraft}
            onArchive={archiveHabitById}
          />
        )}
      </div>

      <div className="td-tabs">
        <button className={`td-tab ${view === "today" ? "active" : ""}`} onClick={() => setView("today")}>
          Today
        </button>
        <button className={`td-tab ${view === "habits" ? "active" : ""}`} onClick={() => setView("habits")}>
          Habits
        </button>
      </div>

      {focusItem && (
        <FocusCard
          item={focusItem}
          subtasks={focusSubtasks}
          onToggleSub={(subId, done) => toggleSub(focusItem, subId, done)}
          onAddSub={(name) => addSub(focusItem, name)}
          onToggleDone={() => toggleItem(focusItem)}
          onExit={() => setFocusKey(null)}
        />
      )}

      {showReplan && (
        <ReplanModal
          habits={habits}
          buildPrompt={buildPromptForReplan}
          streamClaude={streamClaude}
          getToken={getToken}
          promptVersion={replanPromptVersion}
          onApply={applyReplan}
          onClose={() => setShowReplan(false)}
        />
      )}

      {showSchedule && (
        <ScheduleEditor
          initial={schedule}
          profile={profile}
          onSave={async (s) => {
            await data.saveSchedule(supabase, userId, s);
            setSchedule(s);
          }}
          onClose={() => setShowSchedule(false)}
        />
      )}

      {toast && (
        <div className="macp-toast" role="alert">
          <span className="macp-toast-ic">!</span>
          <div className="macp-toast-body">
            <span className="macp-toast-title">Heads up</span>
            <span className="macp-toast-msg">{toast}</span>
          </div>
          <button className="macp-toast-x" onClick={() => setToast("")} aria-label="Dismiss">×</button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no new errors.

**STOP — Task 11 complete, ready for your commit.**

---

### Task 12: Wire into `App.tsx`, delete the old dashboard

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/components/app/Dashboard.tsx`, `src/components/app/ProgressRing.tsx`

- [ ] **Step 1: Update imports in `App.tsx`**

Remove:

```ts
import { Dashboard } from "./components/app/Dashboard";
```

Add:

```ts
import { TodayApp } from "./components/today/TodayApp";
import * as habitsData from "./lib/habitsData";
import { buildReplanPrompt, REPLAN_PROMPT_VERSION } from "./lib/prompts";
```

(`buildPlanPrompt, PLAN_PROMPT_VERSION` are already imported on line 8 — merge into one import statement.)

- [ ] **Step 2: Replace the Dashboard mount (`App.tsx:1269-1282`)**

Replace:

```tsx
    <div style={{ display: screen === "dashboard" ? "block" : "none" }}>
      <Dashboard
        profile={profile}
        setProfile={setProfile}
        plan={plan}
        supabase={supabase}
        userId={userId}
        saveTodayProgress={saveTodayProgress}
        getTodayProgress={getTodayProgress}
        getProgressMonth={getProgressMonth}
        streamClaude={streamClaude}
        FocusMode={FocusMode}
      />
    </div>
```

with:

```tsx
    <div style={{ display: screen === "dashboard" ? "block" : "none" }}>
      <TodayApp
        profile={profile}
        plan={plan}
        supabase={supabase}
        userId={userId}
        data={habitsData}
        getTodayProgress={getTodayProgress}
        saveTodayProgress={saveTodayProgress}
        getProgressMonth={getProgressMonth}
        streamClaude={streamClaude}
        buildReplanPrompt={buildReplanPrompt}
        replanPromptVersion={REPLAN_PROMPT_VERSION}
        onNavigate={(s: string) => setScreen(s)}
      />
    </div>
```

- [ ] **Step 3: Hide the legacy topbar nav while on the dashboard**

TodayApp ships its own bar, so the old topbar would double up. In `App.tsx`, change (line ~1133):

```ts
const showAppNav = profile && APP_SCREENS.includes(screen);
```

to:

```ts
// TodayApp renders its own bar; the legacy topbar serves the other app screens.
const showAppNav = profile && APP_SCREENS.includes(screen) && screen !== "dashboard";
```

Then also suppress the whole topbar element on the dashboard screen — change the condition wrapping the topbar (line ~1190) from:

```tsx
{!isPublicScreen && (
```

to:

```tsx
{!isPublicScreen && screen !== "dashboard" && (
```

(The Dashboard nav button inside the legacy topbar still works from calendar/review/settings — `NAV` stays unchanged.)

- [ ] **Step 4: Delete the old `FocusMode` component (`App.tsx:87-134`)**

Remove the whole `FocusMode` function and its banner comment. Check nothing else references it: `grep -n "FocusMode" src/App.tsx` must return nothing after the edit. (`fmtSecs` import on line 24 becomes unused — remove `fmtSecs` from the helpers import.)

- [ ] **Step 5: Delete superseded files**

Run: `rm src/components/app/Dashboard.tsx src/components/app/ProgressRing.tsx`
Then verify nothing imports them: `grep -rn "app/Dashboard\|ProgressRing" src/ api/`
Expected: no matches. (`MacpLoader` stays — App.tsx and others use it.)

Also check for now-dead recovery prompt code: `grep -rn "buildRecoveryPrompt\|RECOVERY_PROMPT_VERSION" src/ api/` — if only `src/lib/prompts.ts` defines them with no consumers left, delete those exports from `prompts.ts`. Leave anything `WeeklyReview` still uses.

- [ ] **Step 6: Build + lint + tests**

Run: `npx tsc -p tsconfig.app.json --noEmit && npm run build && npm run lint && npm test`
Expected: build succeeds; lint introduces no NEW errors (the legacy codebase may have pre-existing warnings); all vitest tests pass.

**STOP — Task 12 complete, ready for your commit.**

---

### Task 13: End-to-end verification (Playwright)

No repo files change in this task (throwaway script only). Follow the project's verified recipe (`npm run dev` → port 5173, falls back to 5174; the app scrolls inside `.page`; Playwright via `npm install playwright && npx playwright install chromium` in a throwaway dir — do NOT set `PLAYWRIGHT_BROWSERS_PATH`).

- [ ] **Step 1: Start the dev server** — `npm run dev` (background), note the port.

- [ ] **Step 2: Signed-out smoke test.** Playwright: load `http://localhost:<port>`, assert the landing renders (`.lp-root` exists) and no console errors. The new dashboard needs a signed-in user, which automation can't do (Clerk) — the remaining checks are a guided manual pass.

- [ ] **Step 3: Manual verification checklist (walk the user through it, or use their signed-in session).** Confirm each:

1. Dashboard loads as the Today view: date header, `N/M done` counter, no frog/energy/recovery/analytics UI anywhere.
2. First visit after the rebuild imported plan habits (Habits tab shows ~5 AI-seeded habits with sensible windows/times).
3. Checkbox click completes instantly without opening focus; reload → state persisted.
4. Row click opens the full-takeover focus card; add a subtask; check it; the list shows a `1/N` hint; completing all subtasks does NOT auto-complete; Mark done works; ✕ returns.
5. Add a one-off task with P1 + a time → it sorts into the list correctly; delete (×) works.
6. The item whose time has passed gets the amber NOW treatment.
7. Habits tab: create, edit (priority/window/days/subtasks), delete a habit; Today reflects changes immediately.
8. Carry-over: in Supabase, set an open task's `date` to yesterday → it appears pinned in "Carried over" with `missed · yesterday`; completing or deleting clears it.
9. ⋯ menu: Schedule editor saves; Calendar / Weekly review / Settings navigate (legacy topbar reappears there, Dashboard button returns).
10. ✦ Replan: proposal renders with accept/reject toggles; rejecting one and applying writes only accepted changes; quota/error states show inside the modal.
11. Mobile (<720px viewport): bottom tabs `Today | Habits` appear, top-bar view links hide, safe-area padding OK.
12. Calendar history still renders past days (legacy data) and new days (new `checked`/`habits_snapshot` shape).

- [ ] **Step 4: Report results** — list any failures with reproduction notes; fix before declaring the project done.

**STOP — Task 13 complete. Project done pending user sign-off.**

---

## Self-review notes (already applied)

- Spec coverage: §2 shell/nav → Tasks 5+11+12; §3 list/sort/now/focus/subtasks/carry-over → Tasks 3+6+7+11; §4 habit fields → Task 8; §5 schema → Tasks 1+4; §6 seed+replan → Tasks 4+9+11; §7 architecture/deletions → Tasks 11+12; §8 errors/tests → Tasks 2+3+11+13; §9 out-of-scope respected (no streaks, no auto-AI, no drag-reorder).
- Type consistency: `HabitRow`/`TaskRow`/`TodayItem`/`Window` defined once in `todayLogic.ts` and imported everywhere; `HabitDraft` defined in `HabitsManager.tsx` and imported by `TodayApp.tsx`; `UserSchedule`/`ScheduleBlock` defined in `habitsData.ts` and imported by `ScheduleEditor.tsx`.
- Known judgment call: `TodayApp` props are typed `any` at the boundary (matches the codebase's existing prop style, e.g. old `Dashboard`); internal state and logic are fully typed.
- `window` is a reserved-ish column name — quoted in SQL (`"window"`); PostgREST handles it unquoted in `.update()` payloads since it arrives as a JSON key.
