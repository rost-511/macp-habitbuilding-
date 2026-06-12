import { useEffect, useState } from "react";
import type { HabitRow, Window } from "./todayLogic";
import { PRIORITY_TITLES } from "./TodayItem";

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

  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditing(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editing]);

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
        <div className={`td-hab pri${h.priority}`} key={h.id} title={PRIORITY_TITLES[h.priority]}>
          <span className="td-hab-name">
            {h.emoji ? `${h.emoji} ` : ""}
            {h.name}
          </span>
          <span className="td-hab-meta">{describe(h)}</span>
          <button className="td-hab-edit" onClick={() => { setNewSub(""); setEditing({ id: h.id, draft: toDraft(h) }); }}>
            Edit
          </button>
        </div>
      ))}

      {habits.length === 0 && (
        <p style={{ color: "var(--td-mut)", fontSize: ".9rem", padding: "18px 2px" }}>
          No habits yet. Add your first one, or use ✦ Replan to let the AI propose a set.
        </p>
      )}

      <button className="td-new-habit" onClick={() => { setNewSub(""); setEditing({ id: null, draft: emptyDraft() }); }}>
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
                    className={editing.draft.priority === p ? `on sp${p}` : ""}
                    onClick={() => set({ priority: p })}
                  >
                    {PRIORITY_TITLES[p]}
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
