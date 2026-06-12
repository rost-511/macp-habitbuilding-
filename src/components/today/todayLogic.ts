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
  done_at?: string | null;
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
