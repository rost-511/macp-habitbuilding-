# Dashboard Rebuild — Execution-First Today View

**Date:** 2026-06-12
**Status:** Approved design, pending implementation plan
**Replaces:** `src/components/app/Dashboard.tsx` (the "personalized dashboard experience", commit e493e55)

## 1. Goal

Replace the current dashboard (habits + frog task + energy check-in + AI recovery brief + smart nudges + analytics) with a minimal, execution-only experience. The product is an AI-planning execution app: the AI does heavy lifting at setup and on explicit request; the daily surface is fast, stable, and fully user-owned.

**Integration model ("AI drafts, you own"):** the user's schedule is captured in onboarding and editable in-app; the AI plan seeds the user's habits once; afterwards habits are plain user-owned data. AI returns only when the user presses **Replan**, and its proposals are applied as an accept/reject diff. Nothing AI-driven ever happens automatically.

## 2. Views & navigation

One shell, two primary views, same mental model on desktop and mobile.

- **Today (default):** single centered column. Header: date + `N/M done` counter (M = everything on today's list, carried-over tasks included). Body: the execution list. Footer row: inline `+ add task for today` composer.
- **Habits:** habit manager — add / edit / archive; fields per §4.
- **Top bar (desktop):** `Today · Habits` view links, `✦ Replan` button, `⋯` overflow menu → Schedule editor, Calendar, Weekly Review, Settings.
- **Mobile (<720px):** bottom tab bar `Today | Habits`; Replan + `⋯` stay in the top bar.
- Calendar, Weekly Review, Settings pages survive untouched; only their entry point moves into `⋯`.

## 3. Today list behavior

**Contents:** habits whose `days` include today + one-off tasks with `date <= today` and not done.

**Sorting:** each item gets an anchor minute:

- exact `time` → that time
- window → morning 08:00, afternoon 13:00, evening 19:00
- anytime / no time → end of list

Order: carried-over tasks first (see below), then by anchor ascending; priority (P1 < P2 < P3) breaks ties; name breaks remaining ties. Done items keep their position, dimmed and struck through.

**Now highlight:** the first incomplete item whose anchor ≤ current time gets the amber "NOW" treatment (amber border/background on the row). If nothing qualifies, no row is highlighted.

**Completion:** clicking the checkbox completes instantly (optimistic update, async persist, quiet retry toast on failure). It never opens the focus card.

**Focus card (full takeover):** tapping anywhere else on a row replaces the whole view: large title, time + priority, subtask checklist with inline `+ add subtask`, **Mark done** button, `✕` back to Today.

**Subtasks:**

- Exist only inside the focus card; the list shows at most a small `2/3` hint.
- Completing all subtasks does **not** auto-complete the item; Mark done is always deliberate.
- Habit subtasks are templates that reset every day; task subtasks are one-shot.

**One-off tasks:** created via the inline composer (name + priority, optional time). No recurrence.

**Carry-over (tasks only):** an incomplete task is never deleted at midnight. It appears the next day — and every day after — in a slim **Carried over** group pinned above the rest of the list, badged `missed · yesterday` / `missed · N days ago`, sorted by priority then age. The only actions are the normal ones: complete it or delete it. No snooze or reschedule UI. Habits are never carried over (they recur on their own schedule; misses are simply visible in Calendar history).

## 4. Habit fields

| Field | Type / values |
|---|---|
| name | text, required |
| emoji | optional, single emoji |
| priority | P1 / P2 / P3 |
| time | exact `HH:MM` **or** window `morning · afternoon · evening · anytime` (mutually exclusive; anytime is the default) |
| days | every day, or a set of weekdays (Mon–Sun) |
| subtasks | ordered list of `{id, name}` templates |

## 5. Data model

New Supabase tables, RLS per existing `src/lib/userData.ts` patterns (Clerk-authenticated `user_id`).

**`habits`**
`id uuid pk, user_id text, name text, emoji text null, priority int (1–3), time text null ("HH:MM"), window text null ('morning'|'afternoon'|'evening'|'anytime'), days int[] (0=Sun…6=Sat; full set = daily), subtasks jsonb ([{id, name}]), source text ('ai'|'user'), created_at timestamptz, archived_at timestamptz null`

Archive instead of hard delete (`archived_at`) so history stays interpretable.

**`tasks`**
`id uuid pk, user_id text, date date, name text, priority int (1–3), time text null, done bool, done_at timestamptz null, subtasks jsonb ([{id, name, done}]), created_at timestamptz`

Carry-over is a query concern (`date <= today AND NOT done`), not a data mutation.

**Daily completion** — reuse the existing daily-progress table:
- `checked` jsonb now keyed by habit id → done flag
- new `subchecked` jsonb: `{habitId: {subtaskId: true}}`
- keep writing a light `habits_snapshot` (id, name, priority) so the existing Calendar history keeps rendering
- legacy `frog_done` / `energy` fields go unused (left in place)

**Schedule** — `schedule` jsonb column on the profile:
`{wake: "HH:MM", sleep: "HH:MM", blocks: [{label, days: int[], start: "HH:MM", end: "HH:MM"}]}`
Seeded from onboarding answers where available; edited via the Schedule editor in `⋯`.

## 6. AI integration

**Seed (one-time import):** on first load of the new dashboard, if the user's `habits` table is empty and a plan exists, import `plan.dashboard.habits` with `source = 'ai'`, inferring times from the plan's daily flow where titles match. Idempotent — guarded by the empty-table check, so it never runs twice and never touches user-created habits.

**Replan (explicit only):** the `✦ Replan` button opens a modal that calls Claude through the existing edge-function + quota infrastructure. Request context: schedule, current habits annotated with last-14-day completion rates, onboarding goals. Response JSON:

```json
{ "summary": "...", "changes": [
  { "type": "add" | "update" | "remove", "habit": { ... }, "reason": "..." }
] }
```

The modal lists each change with its reason and an accept/reject toggle (all accepted by default), then **Apply selected** writes accepted changes to `habits` (`remove` = archive). Quota display and error/retry states live inside the modal, mirroring the old recovery-brief quota UX.

## 7. Architecture

New component tree, replacing the old dashboard wholesale:

```
src/components/today/
  TodayApp.tsx        shell: top bar / bottom tabs, view switching, overflow menu
  TodayList.tsx       execution list + carried-over group + task composer + counter
  TodayItem.tsx       row: checkbox, time, name, priority, subtask hint, now state
  FocusCard.tsx       full-takeover focus view with subtasks
  HabitsManager.tsx   habit list + add/edit/archive editor
  ReplanModal.tsx     AI replan diff proposal UI
  ScheduleEditor.tsx  wake/sleep/busy-blocks editor
  todayLogic.ts       pure functions: anchor mapping, sorting, carry-over grouping,
                      now-highlight (no React imports; unit-testable)
src/lib/habitsData.ts CRUD for habits / tasks / daily checks / schedule
src/styles/todayStyles.ts  .td-* namespaced styles
```

Conventions (existing project rules):

- `App.tsx` imports `habitsData.ts` and passes loaders down as props; components under `components/` never import data modules directly.
- Styles injected via `<style>` block, namespaced `.td-*`, same pattern as `landingStyles.ts`.

**Visual direction:** warm dark, brand-matched to the landing — bg `#0a0805`, cards `#100d09`, amber `#f5a524` (priority, NOW, Replan), green `#4ade80` (done), cream text `#f4f1ea`, muted warm grays, amber-tinted hairline borders. System font stack. Amber is reserved for "what matters right now"; the rest stays quiet.

**Deletions after swap:** `Dashboard.tsx`, `ProgressRing.tsx`, old FocusMode, frog/energy/recovery/nudge logic and their prompt helpers (where unused elsewhere). Wizard, Calendar, WeeklyReview, Settings untouched.

## 8. Errors, loading, verification

- Optimistic completion with async persist; on failure, revert + quiet retry toast.
- Skeleton rows while today's data loads; Replan failures stay inside the modal with retry.
- `todayLogic.ts` unit-tested (vitest; add the dev dependency if absent): anchor mapping, sort order incl. carried-over pinning, now-highlight selection, day-match logic.
- End-to-end check via the existing Playwright run-and-verify recipe: seed import → check off → focus card + subtasks → add one-off task → carry-over appears next day (clock-mock or date override) → habit CRUD → replan diff accept → mobile tab layout.

## 9. Out of scope (deliberate)

- Frog task, energy check-in, AI recovery brief, smart nudges, analytics cards, streaks (a streak signal may return later).
- Automatic daily AI plan generation (Model B) and timeline/calendar dashboard (Model C) — rejected; their best ideas (time ordering, now-card) are folded in.
- Task carry-over for habits, task rescheduling/snooze, flexible weekly habit targets ("3x/week any days"), drag-to-reorder, redesign of Calendar/WeeklyReview/Settings.
