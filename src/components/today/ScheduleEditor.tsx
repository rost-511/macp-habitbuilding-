import { useEffect, useState } from "react";
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

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
