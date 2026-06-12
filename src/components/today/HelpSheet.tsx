import { useEffect } from "react";

interface Props {
  onClose: () => void;
}

export function HelpSheet({ onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="td-modal-veil" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="td-modal td-help" role="dialog" aria-label="How MACP works">
        <h3>How it works</h3>

        <h4>Priorities</h4>
        <p>
          Every habit and task carries a colored glow on its right edge: <span className="c1">amber</span> means
          high leverage — do it first; <span className="c2">blue</span> means normal importance;{" "}
          <span className="c3">violet</span> means light or optional. Switch the header toggle to{" "}
          <span className="key">Priority</span> to group your day by these tiers.
        </p>

        <h4>Today list</h4>
        <p>
          Habits repeat on their schedule; tasks live for one day only. Anything you don't finish follows you in{" "}
          <span className="key">Carried over</span> until you complete or delete it. Tap the checkbox to complete
          instantly — tap anywhere else on a row to enter focus mode with subtasks.
        </p>

        <h4>Editing &amp; deleting tasks</h4>
        <p>
          On desktop, open the <span className="key">⋮</span> menu on any task row. On mobile, swipe a task{" "}
          <span className="c2">right to edit</span> or <span style={{ color: "#f87171", fontWeight: 600 }}>left to delete</span>.
          Habits are edited in the Habits tab.
        </p>

        <h4>Completed</h4>
        <p>
          The Completed tab shows everything you finished, day by day — use the arrows or the date picker to look
          back at any date.
        </p>

        <h4>✦ Replan</h4>
        <p>
          When life shifts, press Replan: the AI reviews your schedule and your last 14 days, then proposes
          changes you accept or reject one by one. Nothing changes without your approval.
        </p>

        <div className="td-modal-actions">
          <button className="td-btn" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
