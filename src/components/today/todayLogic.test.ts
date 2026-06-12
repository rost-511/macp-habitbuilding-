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

  it("excludes archived habits even when scheduled today", () => {
    const items = buildTodayItems({
      habits: [
        habit({ id: "active", days: [weekday] }),
        habit({ id: "archived", days: [weekday], archived_at: "2026-06-01T00:00:00Z" }),
      ],
      tasks: [],
      checked: {},
      subchecked: {},
      todayKey,
      weekday,
    });
    expect(items.map((i) => i.key)).toContain("h:active");
    expect(items.map((i) => i.key)).not.toContain("h:archived");
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

  it("returns the item when its anchor exactly equals nowMinutes", () => {
    // habit time "09:30" → anchor = 570 minutes; nowMinutes = 570
    const items = buildTodayItems({
      habits: [habit({ id: "h930", name: "Deep work", time: "09:30", days: [weekday] })],
      tasks: [],
      checked: {},
      subchecked: {},
      todayKey,
      weekday,
    });
    expect(findNowKey(items, 570)).toBe("h:h930");
  });
});
