// CalendarPage — progress calendar (Project 14D — Task 6).
// Moved verbatim from App.tsx; calendar behavior, copy, and class names unchanged.
// Data loaders getProgressMonth/getProgressByDate are passed in as props (no userData import).
import { useState, useEffect, useCallback } from "react";
import { DAY_ABBRS } from "../../lib/constants";

export function CalendarPage({ supabase, userId, getProgressMonth, getProgressByDate }) {
  const today = new Date().toISOString().slice(0, 10);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth() + 1;

  const loadMonth = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await getProgressMonth(supabase, userId, year, month);
      setRows(data || []);
    } catch (error) {
      console.error("Failed to load progress month:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, userId, year, month]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  const byDate = rows.reduce((acc, row) => {
    acc[row.progress_date] = row;
    return acc;
  }, {});

  const monthName = cursor.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month - 1, d));
  }

  const completionFor = (row) => {
    if (!row) return 0;
    const habits = row.habits_snapshot || [];
    const checked = row.checked || {};
    const total = habits.length || Object.keys(checked).length || 0;
    if (!total) return 0;
    const done = Object.values(checked).filter(Boolean).length;
    return Math.round((done / total) * 100);
  };

  const selectDay = async (dateKey) => {
    if (!userId) return;

    try {
      const data = await getProgressByDate(supabase, userId, dateKey);
      setSelected(
        data || {
          progress_date: dateKey,
          checked: {},
          frog_done: false,
          energy: null,
          habits_snapshot: [],
          plan_snapshot: {},
        }
      );
    } catch (error) {
      console.error("Failed to load day progress:", error);
    }
  };

  const shiftMonth = (amount) => {
    setSelected(null);
    setCursor(new Date(year, month - 1 + amount, 1));
  };

  const selectedHabits = selected?.habits_snapshot || [];
  const selectedChecked = selected?.checked || {};
  const selectedPct = completionFor(selected);
  const selectedPlanVersion =
    selected?.plan_version ||
    selected?.plan_snapshot?.plan_version ||
    selected?.plan_snapshot?.planVersion ||
    null;
  const selectedPlanReason =
    selected?.plan_reason ||
    selected?.plan_snapshot?.plan_reason ||
    null;
  const selectedPlanGeneratedAt =
    selected?.plan_generated_at ||
    selected?.plan_snapshot?.plan_generated_at ||
    selected?.plan_snapshot?.generatedAt ||
    null;
  const selectedPlanGeneratedLabel = selectedPlanGeneratedAt
    ? new Date(selectedPlanGeneratedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not saved";

  return (
    <div className="dash tab-fu tab-clean">
      <div className="dash-top fu calendar-top">
        <div>
          <div className="dash-greet">
            Progress <span>Calendar</span>
          </div>
          <div className="dash-date">
            Daily habit history · saved per day
          </div>
        </div>

        <div className="calendar-controls" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn btn-ghost" onClick={() => shiftMonth(-1)}>
            ←
          </button>
          <div className="tier-pill">
            <div className="tier-pip" style={{ background: "var(--amber)" }} />
            <div className="tier-name">{monthName}</div>
          </div>
          <button className="btn btn-ghost" onClick={() => shiftMonth(1)}>
            →
          </button>
        </div>
      </div>

      <div className="dgrid">
        <div className="dleft">
        <div className="card fu fu1 calendar-card">
            <div className="card-hd">
              <div className="card-hd-l">
                <span className="card-icon">◌</span>
                <span className="card-title">
                  {loading ? "Loading month..." : "Monthly Progress"}
                </span>
              </div>
            </div>

            <div className="card-body">
            <div className="calendar-weekdays"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                {DAY_ABBRS.map((d) => (
                  <div
                    key={d}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: ".62rem",
                      color: "var(--text-dim)",
                      textTransform: "uppercase",
                      letterSpacing: ".1em",
                      textAlign: "center",
                      paddingBottom: 8,
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="calendar-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 8,
                }}
              >
                {cells.map((date, i) => {
                  if (!date) return <div key={`empty-${i}`} />;

                  const dateKey = date.toISOString().slice(0, 10);
                  const row = byDate[dateKey];
                  const pct = completionFor(row);
                  const isToday = dateKey === today;

                  return (
                    <button
  className="calendar-day"
  key={dateKey}
  onClick={() => selectDay(dateKey)}
                      style={{
                        minHeight: 86,
                        borderRadius: "var(--r)",
                        border: isToday
                          ? "1px solid rgba(212,146,42,0.75)"
                          : "1px solid var(--border)",
                        background: row
                          ? "var(--surface2)"
                          : "rgba(255,255,255,0.015)",
                        color: row ? "var(--text)" : "var(--text-dim)",
                        cursor: "pointer",
                        padding: 10,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: ".72rem",
                          color: isToday ? "var(--amber)" : "inherit",
                        }}
                      >
                        {date.getDate()}
                      </span>

                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: row
                            ? `conic-gradient(var(--amber) ${pct}%, var(--border2) 0)`
                            : "var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          alignSelf: "flex-end",
                        }}
                      >
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "var(--surface)",
                            display: "block",
                          }}
                        />
                      </span>

                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: ".58rem",
                          color: row ? "var(--text-mid)" : "var(--text-dim)",
                        }}
                      >
                        {row ? `${pct}%` : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="dright">
          <div className="card fu fu2">
            <div className="card-hd">
              <div className="card-hd-l">
                <span className="card-icon">✓</span>
                <span className="card-title">Day Detail</span>
              </div>
            </div>

            <div className="card-body">
              {!selected && (
                <div style={{ color: "var(--text-mid)", fontSize: ".86rem" }}>
                  Click any day to inspect saved habit progress.
                </div>
              )}

              {selected && (
                <>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--amber)",
                      fontSize: ".7rem",
                      letterSpacing: ".12em",
                      textTransform: "uppercase",
                      marginBottom: 10,
                    }}
                  >
                    {selected.progress_date}
                  </div>

                  <div className="day-plan-strip">
                    <div>
                      <div className="day-plan-label">Plan used</div>
                      <div className="day-plan-value">
                        {selectedPlanVersion ? `Plan v${selectedPlanVersion}` : "No plan metadata"}
                      </div>
                    </div>
                    <div className="day-plan-pill">
                      {selectedPlanReason || selectedPlanGeneratedLabel}
                    </div>
                  </div>

                  <div className="ring-center" style={{ marginBottom: 18 }}>
                    <div className="ring-pct">{selectedPct}%</div>
                    <div className="ring-lbl">Completed</div>
                  </div>

                  <div className="info-row">
                    <span className="info-lbl">Frog Task</span>
                    <span className="info-val">
                      {selected.frog_done ? "Done ✓" : "Not done"}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-lbl">Energy</span>
                    <span className="info-val">
                      {selected.energy || "Not logged"}
                    </span>
                  </div>

                  <div style={{ marginTop: 18 }}>
                    <div className="card-title" style={{ marginBottom: 10 }}>
                      Habits
                    </div>

                    <div className="habit-list">
                      {selectedHabits.length === 0 && (
                        <div style={{ color: "var(--text-dim)", fontSize: ".82rem" }}>
                          No saved habits for this day.
                        </div>
                      )}

                      {selectedHabits.map((h) => {
                        const done = Boolean(selectedChecked[h.id]);
                        return (
                          <div key={h.id} className="habit-row">
                            <div className={`hcheck ${done ? "done" : ""}`}>
                              {done ? "✓" : ""}
                            </div>
                            <div className={`hname ${done ? "done" : ""}`}>
                              {h.name}
                            </div>
                            <span className={`htag htag-${h.tag || "work"}`}>
                              {h.tag || "work"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
