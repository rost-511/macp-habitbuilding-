import { useEffect, useState } from "react";
import type { TaskRow } from "./todayLogic";
import { PRIORITY_TITLES } from "./TodayItem";

interface CompletedHabit {
  id: string;
  name: string;
  priority?: number;
}

interface DayData {
  habitsDone: CompletedHabit[];
  habitsTotal: number;
  tasksDone: TaskRow[];
}

function shiftDay(dateKey: string, delta: number): string {
  const d = new Date(`${dateKey}T12:00:00`);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function doneAtLabel(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface Props {
  supabase: any;
  userId: string;
  todayKey: string;
  getProgressByDate: (supabase: any, userId: string, date: string) => Promise<any>;
  listCompletedTasks: (supabase: any, userId: string, dateKey: string) => Promise<TaskRow[]>;
}

export function CompletedView({
  supabase,
  userId,
  todayKey,
  getProgressByDate,
  listCompletedTasks,
}: Props) {
  const [dateKey, setDateKey] = useState(todayKey);
  const [day, setDay] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);

  const isToday = dateKey === todayKey;
  const dayName =
    dateKey === todayKey
      ? "Today"
      : dateKey === shiftDay(todayKey, -1)
      ? "Yesterday"
      : new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-US", { weekday: "long" });
  const dateLong = new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [progress, tasksDone] = await Promise.all([
          getProgressByDate(supabase, userId, dateKey),
          listCompletedTasks(supabase, userId, dateKey),
        ]);
        if (cancelled) return;
        const snapshot: CompletedHabit[] = Array.isArray(progress?.habits_snapshot)
          ? progress.habits_snapshot
          : [];
        const checked: Record<string, boolean> = progress?.checked || {};
        setDay({
          habitsDone: snapshot.filter((h) => checked[h.id]),
          habitsTotal: snapshot.length,
          tasksDone,
        });
      } catch (e) {
        console.error("Failed to load completed day:", e);
        if (!cancelled) setDay({ habitsDone: [], habitsTotal: 0, tasksDone: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId, dateKey, getProgressByDate, listCompletedTasks]);

  const empty = !loading && day && day.habitsDone.length === 0 && day.tasksDone.length === 0;

  return (
    <div>
      <div className="td-day-nav">
        <button
          className="td-day-btn"
          aria-label="Previous day"
          onClick={() => setDateKey((k) => shiftDay(k, -1))}
        >
          ‹
        </button>
        <div className="td-day-label">
          <span className="d1">{dayName}</span>
          <span className="d2">{dateLong}</span>
        </div>
        <button
          className="td-day-btn"
          aria-label="Next day"
          disabled={isToday}
          onClick={() => setDateKey((k) => shiftDay(k, 1))}
        >
          ›
        </button>
        <div className="td-day-pick" title="Jump to date">
          <input
            type="date"
            aria-label="Jump to date"
            value={dateKey}
            max={todayKey}
            onChange={(e) => {
              if (e.target.value && e.target.value <= todayKey) setDateKey(e.target.value);
            }}
          />
          <span className="ic">▦</span>
        </div>
      </div>

      {loading && (
        <div>
          <div className="td-skel" />
          <div className="td-skel" />
          <div className="td-skel" />
        </div>
      )}

      {empty && (
        <p className="td-empty">
          Nothing completed on this day{isToday ? " yet — go check something off." : "."}
        </p>
      )}

      {!loading && day && day.habitsDone.length > 0 && (
        <>
          <div className="td-section">
            Habits · {day.habitsDone.length}
            {day.habitsTotal > 0 ? `/${day.habitsTotal}` : ""}
          </div>
          {day.habitsDone.map((h) => (
            <div
              className={`td-done-row${h.priority ? ` pri${h.priority}` : ""}`}
              key={h.id}
              title={h.priority ? PRIORITY_TITLES[h.priority as 1 | 2 | 3] : undefined}
            >
              <span className="td-done-mark">✓</span>
              <span className="td-done-name">{h.name}</span>
            </div>
          ))}
        </>
      )}

      {!loading && day && day.tasksDone.length > 0 && (
        <>
          <div className="td-section">Tasks · {day.tasksDone.length}</div>
          {day.tasksDone.map((t) => (
            <div className={`td-done-row pri${t.priority}`} key={t.id} title={PRIORITY_TITLES[t.priority]}>
              <span className="td-done-mark">✓</span>
              <span className="td-done-name">{t.name}</span>
              {t.date < dateKey && <span className="td-chip missed">carried</span>}
              <span className="td-done-time">{doneAtLabel(t.done_at)}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
