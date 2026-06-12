import { useState } from "react";
import type { TodayItem as Item } from "./todayLogic";
import { TodayItem, PRIORITY_TITLES } from "./TodayItem";

export type SortMode = "time" | "priority";

interface Props {
  items: Item[];
  nowKey: string | null;
  nowMin: number; // minutes since local midnight — places the agenda's now-line
  loading: boolean;
  dateLabel: string; // e.g. "Thursday, Jun 12"
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  onToggle: (item: Item) => void;
  onOpen: (item: Item) => void;
  onDeleteTask: (item: Item) => void;
  onEditTask: (item: Item) => void;
  onAddTask: (input: { name: string; priority: 1 | 2 | 3; time: string | null }) => void;
}

export function TodayList({
  items,
  nowKey,
  nowMin,
  loading,
  dateLabel,
  sortMode,
  onSortChange,
  onToggle,
  onOpen,
  onDeleteTask,
  onEditTask,
  onAddTask,
}: Props) {
  const [name, setName] = useState("");
  const [priority, setPriority] = useState<1 | 2 | 3>(2);
  const [time, setTime] = useState("");

  const carried = items.filter((i) => i.carried);
  const today = items.filter((i) => !i.carried);
  const timed = today.filter((i) => i.anchor < 1440); // chronological agenda entries
  const anytime = today.filter((i) => i.anchor >= 1440);
  const doneCount = items.filter((i) => i.done).length;
  // The now-line slots between the last passed entry and the next upcoming one.
  const nowIdx = timed.findIndex((i) => i.anchor > nowMin);
  const nowLabel = `${String(Math.floor(nowMin / 60)).padStart(2, "0")}:${String(nowMin % 60).padStart(2, "0")}`;

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAddTask({ name: trimmed, priority, time: time || null });
    setName("");
    setTime("");
    setPriority(2);
  };

  const renderItem = (item: Item, showTaskChip: boolean, variant: "grouped" | "agenda" = "grouped") => (
    <TodayItem
      key={item.key}
      item={item}
      isNow={item.key === nowKey}
      onToggle={onToggle}
      onOpen={onOpen}
      onDelete={item.kind === "task" ? onDeleteTask : undefined}
      onEdit={item.kind === "task" ? onEditTask : undefined}
      showTaskChip={showTaskChip}
      variant={variant}
    />
  );

  const nowLine = (
    <div className="td-nowline" key="nowline" aria-label={`Current time ${nowLabel}`}>
      <span className="t">{nowLabel}</span>
    </div>
  );

  if (loading) {
    return (
      <div>
        <div className="td-skel" />
        <div className="td-skel" />
        <div className="td-skel" />
        <div className="td-skel" />
      </div>
    );
  }

  return (
    <div>
      <div className="td-head">
        <span className="td-date">{dateLabel}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="td-sort" role="group" aria-label="Sort order">
            <button className={sortMode === "time" ? "on" : ""} onClick={() => onSortChange("time")}>
              Time
            </button>
            <button
              className={sortMode === "priority" ? "on" : ""}
              onClick={() => onSortChange("priority")}
            >
              Priority
            </button>
          </div>
          <span className="td-count">
            <b>{doneCount}</b>/{items.length} done
          </span>
        </div>
      </div>

      {carried.length > 0 && (
        <>
          <div className="td-section">Carried over · {carried.length}</div>
          <div className={sortMode === "time" ? "td-agenda" : undefined}>
            {carried.map((item) => renderItem(item, false, sortMode === "time" ? "agenda" : "grouped"))}
          </div>
        </>
      )}

      {today.length === 0 && carried.length === 0 && (
        <p className="td-empty">
          Nothing scheduled today. Add a task below, or set up habits in the Habits tab.
        </p>
      )}

      {sortMode === "time" ? (
        <div className="td-agenda">
          {timed.length > 0 && (
            <>
              <div className="td-section">Schedule</div>
              {timed.flatMap((item, i) => {
                const row = renderItem(item, true, "agenda");
                return i === nowIdx ? [nowLine, row] : [row];
              })}
              {nowIdx === -1 && nowLine}
            </>
          )}
          {anytime.length > 0 && (
            <>
              <div className="td-section">Anytime</div>
              {anytime.map((item) => renderItem(item, true, "agenda"))}
            </>
          )}
        </div>
      ) : (
        ([1, 2, 3] as const).map((p) => {
          const group = today.filter((i) => i.priority === p);
          if (group.length === 0) return null;
          return (
            <div key={p} className={`td-pgroup p${p}`}>
              <div className="td-pgroup-head">
                <span className="lbl">{PRIORITY_TITLES[p]}</span>
                <span className="n">
                  {group.filter((i) => i.done).length}/{group.length}
                </span>
              </div>
              {group.map((item) => renderItem(item, true))}
            </div>
          );
        })
      )}

      <div className="td-add">
        <span className="td-add-plus">+</span>
        <input
          type="text"
          placeholder="add a task for today…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        {name.trim() && (
          <div className="td-add-ctl">
            <select
              aria-label="Priority"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value) as 1 | 2 | 3)}
            >
              <option value={1}>High</option>
              <option value={2}>Normal</option>
              <option value={3}>Light</option>
            </select>
            <input
              type="time"
              aria-label="Time (optional)"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <button className="td-btn" onClick={submit}>
              Add
            </button>
          </div>
        )}
      </div>

      <div className="td-legend" aria-hidden="true">
        <span>
          <b className="c1">amber</b> high · <b className="c2">blue</b> normal · <b className="c3">violet</b> light
        </span>
        <span className="gest">swipe → edit · ← delete</span>
      </div>
    </div>
  );
}
