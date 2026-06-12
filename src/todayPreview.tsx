// Standalone design preview for the Today list (no Clerk/Supabase needed).
// Served via /today-preview.html — not part of the app build.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { TODAY_STYLES } from "./styles/todayStyles";
import { TodayList, type SortMode } from "./components/today/TodayList";
import type { TodayItem } from "./components/today/todayLogic";

const raw: TodayItem[] = [
  { key: "t:c1", kind: "task", id: "c1", name: "Send invoice to client", emoji: null, priority: 1, time: null, window: null, anchor: 1440, done: false, carried: true, carriedDays: 2, subDone: 0, subTotal: 0 },
  { key: "h:1", kind: "habit", id: "1", name: "Morning run", emoji: "🏃", priority: 1, time: "07:00", window: null, anchor: 420, done: true, carried: false, carriedDays: 0, subDone: 0, subTotal: 0 },
  { key: "h:2", kind: "habit", id: "2", name: "Deep work block", emoji: null, priority: 1, time: "09:30", window: null, anchor: 570, done: false, carried: false, carriedDays: 0, subDone: 2, subTotal: 3 },
  { key: "t:1", kind: "task", id: "t1", name: "Call dentist", emoji: null, priority: 2, time: "11:30", window: null, anchor: 690, done: false, carried: false, carriedDays: 0, subDone: 0, subTotal: 0 },
  { key: "h:3", kind: "habit", id: "3", name: "Read 20 pages", emoji: "📖", priority: 2, time: null, window: "evening", anchor: 1140, done: false, carried: false, carriedDays: 0, subDone: 0, subTotal: 0 },
  { key: "h:4", kind: "habit", id: "4", name: "Gym", emoji: "🏋️", priority: 1, time: "18:00", window: null, anchor: 1080, done: false, carried: false, carriedDays: 0, subDone: 0, subTotal: 0 },
  { key: "h:5", kind: "habit", id: "5", name: "Stretch", emoji: null, priority: 3, time: null, window: "anytime", anchor: 1440, done: false, carried: false, carriedDays: 0, subDone: 0, subTotal: 0 },
  { key: "t:2", kind: "task", id: "t2", name: "Water the plants", emoji: null, priority: 3, time: null, window: null, anchor: 1440, done: false, carried: false, carriedDays: 0, subDone: 0, subTotal: 0 },
];

const items = [...raw].sort((a, b) => {
  if (a.carried !== b.carried) return a.carried ? -1 : 1;
  if (a.anchor !== b.anchor) return a.anchor - b.anchor;
  return a.priority - b.priority;
});

function Preview() {
  const [sortMode, setSortMode] = useState<SortMode>("time");
  return (
    <div className="td-root" style={{ minHeight: "100vh" }}>
      <style>{TODAY_STYLES}</style>
      <div className="td-wrap" style={{ paddingTop: 20 }}>
        <TodayList
          items={items}
          nowKey="h:2"
          nowMin={14 * 60 + 23}
          loading={false}
          dateLabel="Saturday, Jun 13"
          sortMode={sortMode}
          onSortChange={setSortMode}
          onToggle={() => {}}
          onOpen={() => {}}
          onDeleteTask={() => {}}
          onEditTask={() => {}}
          onAddTask={() => {}}
        />
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Preview />);
