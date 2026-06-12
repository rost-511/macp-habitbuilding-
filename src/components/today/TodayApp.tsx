import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { TODAY_STYLES } from "../../styles/todayStyles";
import {
  buildTodayItems,
  findNowKey,
  isScheduledOn,
  localDateKey,
  type HabitRow,
  type TaskRow,
  type TodayItem as Item,
} from "./todayLogic";
import { TodayList, type SortMode } from "./TodayList";
import { CompletedView } from "./CompletedView";
import { FocusCard } from "./FocusCard";
import { HabitsManager, type HabitDraft } from "./HabitsManager";
import { ReplanModal, type ReplanChange } from "./ReplanModal";
import { ScheduleEditor } from "./ScheduleEditor";
import { TaskEditor } from "./TaskEditor";
import { HelpSheet } from "./HelpSheet";

export function TodayApp({
  profile,
  plan,
  supabase,
  userId,
  data, // every function from src/lib/habitsData.ts, passed by App.tsx
  getTodayProgress,
  saveTodayProgress,
  getProgressMonth,
  getProgressByDate,
  streamClaude,
  buildReplanPrompt,
  replanPromptVersion,
  onNavigate, // (screen: "calendar" | "review" | "settings") => void
}: any) {
  const { getToken } = useAuth();

  const [view, setView] = useState<"today" | "habits" | "completed">("today");
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    try {
      return localStorage.getItem("macp:todaySort") === "priority" ? "priority" : "time";
    } catch {
      return "time";
    }
  });
  const changeSortMode = (mode: SortMode) => {
    setSortMode(mode);
    try {
      localStorage.setItem("macp:todaySort", mode);
    } catch {}
  };
  const [habits, setHabits] = useState<HabitRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [subchecked, setSubchecked] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showReplan, setShowReplan] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [schedule, setSchedule] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [nowMin, setNowMin] = useState(() => new Date().getHours() * 60 + new Date().getMinutes());
  const [toast, setToast] = useState("");

  const [todayKey, setTodayKey] = useState(() => localDateKey());
  const weekday = new Date(todayKey + "T12:00:00").getDay();
  const dateLabel = new Date(todayKey + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  // Keep the NOW highlight fresh; also detect midnight rollover.
  useEffect(() => {
    const t = setInterval(() => {
      setNowMin(new Date().getHours() * 60 + new Date().getMinutes());
      setTodayKey(localDateKey());
    }, 60_000);
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
    const key = `${userId}:${todayKey}`;
    if (!userId || loadedFor.current === key) return;
    loadedFor.current = key;
    (async () => {
      setLoading(true);
      try {
        await data.seedHabitsFromPlan(supabase, userId, plan);
        const [h, t, progress, sched] = await Promise.all([
          data.listHabits(supabase, userId),
          data.listOpenTasks(supabase, userId, todayKey),
          getTodayProgress(supabase, userId, todayKey),
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
  }, [userId, supabase, todayKey]);

  const items = useMemo(
    () => buildTodayItems({ habits, tasks, checked, subchecked, todayKey, weekday }),
    [habits, tasks, checked, subchecked, todayKey, weekday]
  );
  const nowKey = findNowKey(items, nowMin);
  const focusItem = focusKey ? items.find((i) => i.key === focusKey) ?? null : null;

  /* ── Persistence ── */
  // Calendar history keeps rendering from checked + habits_snapshot.
  const saveQueue = useRef(Promise.resolve());
  const persistChecks = (
    nextChecked: Record<string, boolean>,
    nextSubchecked: Record<string, Record<string, boolean>>
  ) => {
    saveQueue.current = saveQueue.current
      .then(() =>
        saveTodayProgress(supabase, userId, {
          checked: nextChecked,
          subchecked: nextSubchecked,
          habits_snapshot: habits
            .filter((h) => isScheduledOn(h, weekday))
            .map((h) => ({ id: h.id, name: h.name, priority: h.priority })),
        }, todayKey)
      )
      .catch(async (e) => {
        console.error("Failed to save daily progress:", e);
        setToast("Saving failed — your last check may not stick.");
        try {
          const fresh = await getTodayProgress(supabase, userId, todayKey);
          setChecked(fresh?.checked || {});
          setSubchecked(fresh?.subchecked || {});
        } catch {}
      });
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

  const saveTaskEdit = async (patch: { name: string; priority: 1 | 2 | 3; time: string | null }) => {
    if (!editingTaskId) return;
    const row = await data.updateTask(supabase, userId, editingTaskId, patch);
    setTasks((ts) => ts.map((t) => (t.id === editingTaskId ? row : t)));
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
    const byDate = new Map(rows.map((r: any) => [r.progress_date, r]));

    const stats = habits.map((h) => {
      let scheduled = 0;
      let done = 0;
      for (let i = 0; i < 14; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const day = d.getDay();
        const key = localDateKey(d);
        if (!h.days.includes(day)) continue;
        scheduled++;
        const row = byDate.get(key);
        if ((row as any)?.checked?.[h.id]) done++;
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
    let ok = 0;
    let failures = 0;
    let firstMsg = "";
    const total = changes.length;
    for (const c of changes) {
      try {
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
          ok++;
        } else if (c.type === "update" && c.id && c.habit) {
          const patch: any = {};
          if (typeof c.habit.name === "string") patch.name = c.habit.name;
          if ([1, 2, 3].includes(c.habit.priority)) patch.priority = c.habit.priority;
          if ("time" in c.habit) {
            patch.time = c.habit.time ?? null;
            if (c.habit.time != null) patch.window = null;
          }
          if ("window" in c.habit) patch.window = c.habit.time ? null : c.habit.window;
          if (Array.isArray(c.habit.days) && c.habit.days.length > 0) patch.days = c.habit.days;
          const row = await data.updateHabit(supabase, userId, c.id, patch);
          setHabits((hs) => hs.map((h) => (h.id === c.id ? row : h)));
          ok++;
        } else if (c.type === "remove" && c.id) {
          await data.archiveHabit(supabase, userId, c.id);
          setHabits((hs) => hs.filter((h) => h.id !== c.id));
          ok++;
        }
      } catch (e) {
        failures++;
        if (!firstMsg) firstMsg = e instanceof Error ? e.message : String(e);
      }
    }
    if (failures > 0) {
      throw new Error(
        `Applied ${ok} of ${total} changes; ${failures} failed (${firstMsg}). Review your habits before replanning again.`
      );
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
          <button className={`td-bar-view ${view === "completed" ? "active" : ""}`} onClick={() => setView("completed")}>
            Completed
          </button>
        </div>
        <div className="td-bar-right">
          <button className="td-replan" onClick={() => setShowReplan(true)}>
            ✦ Replan
          </button>
          <button className="td-menu-btn" aria-label="More" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
            ⋯
          </button>
          {menuOpen && (
            <div className="td-menu" onMouseLeave={() => setMenuOpen(false)}>
              <button onClick={() => { setMenuOpen(false); setShowSchedule(true); }}>My schedule</button>
              <button onClick={() => { setMenuOpen(false); setShowHelp(true); }}>How it works</button>
              <button onClick={() => { setMenuOpen(false); onNavigate("calendar"); }}>Calendar</button>
              <button onClick={() => { setMenuOpen(false); onNavigate("review"); }}>Weekly review</button>
              <button onClick={() => { setMenuOpen(false); onNavigate("settings"); }}>Settings</button>
            </div>
          )}
        </div>
      </div>

      <div className="td-wrap">
        {view === "today" && (
          <TodayList
            items={items}
            nowKey={nowKey}
            nowMin={nowMin}
            loading={loading}
            dateLabel={dateLabel}
            sortMode={sortMode}
            onSortChange={changeSortMode}
            onToggle={toggleItem}
            onOpen={(item) => setFocusKey(item.key)}
            onDeleteTask={deleteTaskItem}
            onEditTask={(item) => setEditingTaskId(item.id)}
            onAddTask={addTask}
          />
        )}
        {view === "habits" && (
          <HabitsManager
            habits={habits}
            onCreate={createHabit}
            onUpdate={updateHabitDraft}
            onArchive={archiveHabitById}
          />
        )}
        {view === "completed" && (
          <CompletedView
            supabase={supabase}
            userId={userId}
            todayKey={todayKey}
            getProgressByDate={getProgressByDate}
            listCompletedTasks={data.listCompletedTasks}
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
        <button className={`td-tab ${view === "completed" ? "active" : ""}`} onClick={() => setView("completed")}>
          Completed
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
          onEdit={focusItem.kind === "task" ? () => setEditingTaskId(focusItem.id) : undefined}
        />
      )}

      {editingTaskId && (() => {
        const task = tasks.find((t) => t.id === editingTaskId);
        if (!task) return null;
        return <TaskEditor task={task} onSave={saveTaskEdit} onClose={() => setEditingTaskId(null)} />;
      })()}

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

      {showHelp && <HelpSheet onClose={() => setShowHelp(false)} />}

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
