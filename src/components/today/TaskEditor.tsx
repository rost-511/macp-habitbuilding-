import { useEffect, useState } from "react";
import type { TaskRow } from "./todayLogic";
import { PRIORITY_TITLES } from "./TodayItem";

interface Props {
  task: TaskRow;
  onSave: (patch: { name: string; priority: 1 | 2 | 3; time: string | null }) => Promise<void>;
  onClose: () => void;
}

export function TaskEditor({ task, onSave, onClose }: Props) {
  const [name, setName] = useState(task.name);
  const [priority, setPriority] = useState<1 | 2 | 3>(task.priority);
  const [time, setTime] = useState(task.time ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setErr("");
    try {
      await onSave({ name: name.trim(), priority, time: time || null });
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  };

  return (
    <div className="td-modal-veil" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="td-modal">
        <h3>Edit task</h3>

        <div className="td-field">
          <label className="td-label">Name</label>
          <input
            className="td-input"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
            }}
          />
        </div>

        <div className="td-field">
          <label className="td-label">Priority</label>
          <div className="td-seg">
            {([1, 2, 3] as const).map((p) => (
              <button key={p} className={priority === p ? `on sp${p}` : ""} onClick={() => setPriority(p)}>
                {PRIORITY_TITLES[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="td-field">
          <label className="td-label">Time (optional)</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              className="td-input"
              style={{ width: 130 }}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            {time && (
              <button className="td-btn-ghost" onClick={() => setTime("")}>
                Clear
              </button>
            )}
          </div>
        </div>

        {err && <p className="td-replan-err">{err}</p>}

        <div className="td-modal-actions">
          <button className="td-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="td-btn" disabled={saving || !name.trim()} onClick={save}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
