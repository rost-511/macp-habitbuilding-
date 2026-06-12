import { useEffect, useRef, useState } from "react";
import type { TodayItem as Item } from "./todayLogic";
import { carriedLabel } from "./todayLogic";

export const PRIORITY_TITLES: Record<1 | 2 | 3, string> = {
  1: "High leverage",
  2: "Normal",
  3: "Light",
};

const SWIPE_TRIGGER = 64; // px of horizontal drag that fires the action
const SWIPE_MAX = 96;

interface Props {
  item: Item;
  isNow: boolean;
  onToggle: (item: Item) => void;
  onOpen: (item: Item) => void;
  onDelete?: (item: Item) => void; // tasks only
  onEdit?: (item: Item) => void; // tasks only
  showTaskChip?: boolean; // redundant inside a dedicated Tasks section
  variant?: "grouped" | "agenda"; // agenda = Time view: time-first, rail accent, no gradient
}

export function TodayItem({
  item,
  isNow,
  onToggle,
  onOpen,
  onDelete,
  onEdit,
  showTaskChip = true,
  variant = "grouped",
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dx, setDx] = useState(0);
  const touch = useRef<{ x: number; y: number; horizontal: boolean | null } | null>(null);
  const swipeable = !!(onEdit || onDelete);

  // Close the row menu on any outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (!swipeable) return;
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, horizontal: null };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!swipeable || !touch.current) return;
    const ddx = e.touches[0].clientX - touch.current.x;
    const ddy = e.touches[0].clientY - touch.current.y;
    if (touch.current.horizontal === null && (Math.abs(ddx) > 8 || Math.abs(ddy) > 8)) {
      touch.current.horizontal = Math.abs(ddx) > Math.abs(ddy);
    }
    if (!touch.current.horizontal) return; // vertical scroll wins
    setDx(Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, ddx)));
  };

  const onTouchEnd = () => {
    if (!touch.current) return;
    const fired = touch.current.horizontal && Math.abs(dx) >= SWIPE_TRIGGER;
    if (fired && dx > 0 && onEdit) onEdit(item);
    if (fired && dx < 0 && onDelete) onDelete(item);
    touch.current = null;
    setDx(0);
  };

  const agenda = variant === "agenda";
  const cls = ["td-row", `pri${item.priority}`, agenda ? "agenda" : "", isNow ? "now" : "", item.done ? "done" : ""]
    .filter(Boolean)
    .join(" ");
  const wrapCls = ["td-swipe", dx > 8 ? "swiping-r" : "", dx < -8 ? "swiping-l" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapCls}>
      {swipeable && (
        <div className="td-swipe-under" aria-hidden="true">
          <span className="e">✎ Edit</span>
          <span className="d">Delete</span>
        </div>
      )}
      <div
        className={cls}
        role="button"
        tabIndex={0}
        aria-label={`${item.name} — ${PRIORITY_TITLES[item.priority]} priority`}
        style={dx !== 0 ? { transform: `translateX(${dx}px)` } : undefined}
        onClick={() => onOpen(item)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onOpen(item);
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {agenda && (
          <>
            <span className="td-row-time">
              {item.time ?? (item.window && item.window !== "anytime" ? item.window.slice(0, 3) : "—")}
            </span>
            <span className={`td-rail p${item.priority}`} aria-hidden="true" />
          </>
        )}
        <button
          className={`td-check ${item.done ? "on" : ""}`}
          aria-label={item.done ? `Mark ${item.name} not done` : `Mark ${item.name} done`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(item);
          }}
        >
          ✓
        </button>
        {!agenda && (
          <span className="td-row-time">
            {item.time ?? (item.window && item.window !== "anytime" ? item.window.slice(0, 3) : "—")}
          </span>
        )}
        <span className="td-row-name">
          {item.emoji ? `${item.emoji} ` : ""}
          {item.name}
          {item.subTotal > 0 && (
            <span className="td-row-sub">
              {item.subDone}/{item.subTotal}
            </span>
          )}
        </span>
        {item.carried && <span className="td-chip missed">{carriedLabel(item.carriedDays)}</span>}
        {item.kind === "task" && !item.carried && showTaskChip && <span className="td-chip">task</span>}
        {isNow && <span className="td-badge now-tag">NOW</span>}
        {swipeable && (
          <button
            className="td-kebab"
            aria-label={`Actions for ${item.name}`}
            aria-expanded={menuOpen}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
          >
            ⋮
          </button>
        )}
      </div>
      {menuOpen && (
        <div className="td-rowmenu" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <button
              onClick={() => {
                setMenuOpen(false);
                onEdit(item);
              }}
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              className="danger"
              onClick={() => {
                setMenuOpen(false);
                onDelete(item);
              }}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
