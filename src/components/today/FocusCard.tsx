import { useEffect, useState } from "react";
import type { TodayItem } from "./todayLogic";
import { PRIORITY_TITLES } from "./TodayItem";

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
  onEdit?: () => void; // tasks only — habits are edited in the Habits tab
}

export function FocusCard({ item, subtasks, onToggleSub, onAddSub, onToggleDone, onExit, onEdit }: Props) {
  const [newSub, setNewSub] = useState("");
  const doneCount = subtasks.filter((s) => s.done).length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onExit]);

  const addSub = () => {
    const trimmed = newSub.trim();
    if (!trimmed) return;
    onAddSub(trimmed);
    setNewSub("");
  };

  const when = item.time ?? (item.window && item.window !== "anytime" ? item.window : null);

  return (
    <div className="td-focus" role="dialog" aria-label={`Focus: ${item.name}`}>
      <div className="td-focus-bar">
        <button className="td-focus-exit" onClick={onExit}>
          ✕ back to Today
        </button>
        <span className="td-focus-meta" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          {onEdit && (
            <button className="td-focus-exit" onClick={onEdit}>
              ✎ Edit
            </button>
          )}
          {when}
          <span style={{ color: ["", "rgba(245,165,36,0.85)", "rgba(56,189,248,0.8)", "rgba(167,139,250,0.8)"][item.priority] }}>
            {when ? "· " : ""}
            {PRIORITY_TITLES[item.priority]}
          </span>
        </span>
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
