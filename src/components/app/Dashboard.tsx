// Dashboard — daily habits, frog task, progress analytics & recovery brief (Project 14D — Task 9).
// Moved verbatim from App.tsx; habit/frog/progress/recovery/review-CTA/premium/loading behavior, copy,
// and class names unchanged. supabase, the userData loaders (getTodayProgress, saveTodayProgress,
// getProgressMonth), streamClaude, and the FocusMode component are passed in as props
// (no userData / streamClaude / App import); ProgressRing & MacpLoader import from their own modules.
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { tierFor, makeTimeline, nowMinutes, makeHabits, pickSmartNudge, todayLabel, timeToMin } from "../../lib/helpers";
import { ENERGY_LEVELS, DAY_ABBRS } from "../../lib/constants";
import { buildRecoveryPrompt, RECOVERY_PROMPT_VERSION } from "../../lib/prompts";
import { normalizePlanMode } from "../../lib/planModes";
import { ProgressRing } from "./ProgressRing";
import { MacpLoader } from "./MacpLoader";

interface QuotaInfo {
  limit: number;
  used: number;
  resetsAt: string;
}

export function Dashboard({ profile, setProfile, plan = null, supabase, userId, saveTodayProgress, getTodayProgress, getProgressMonth, streamClaude, FocusMode }) {
  const tier = tierFor(profile.week || 1);

  const pd = (plan as any)?.dashboard ?? null;

  const timeline = pd?.dailyFlow
    ? pd.dailyFlow.map((f: any) => ({
        time: f.time,
        name: f.title,
        note: f.description,
      }))
    : makeTimeline(profile);

  const nowMin = nowMinutes();

  const [habits, setHabits] = useState(() =>
    pd?.habits?.length
      ? pd.habits.map((h: any) => ({ ...h, tier: 1 }))
      : makeHabits(profile, tier.level)
  );
  const [checked, setChecked] = useState({});
  const [frogDone, setFrogDone] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [energy, setEnergy] = useState(null);
const [progressReady, setProgressReady] = useState(false);
const [celebrate, setCelebrate] = useState(false);
  const [newHabit, setNewHabit] = useState({ name:"", tag:"work" });
  const [showAdd, setShowAdd] = useState(false);
  const { getToken } = useAuth();
  const [recoveryText, setRecoveryText] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryErr, setRecoveryErr] = useState("");
  const [recoveryQuotaInfo, setRecoveryQuotaInfo] = useState<QuotaInfo | null>(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const progressSnapshot = () => {
    const activePlan = (plan || {}) as any;
  
    return {
      habits_snapshot: habits,
      plan_snapshot: activePlan,
      plan_version: Number(activePlan.plan_version || activePlan.planVersion || 1),
      plan_generated_at: activePlan.plan_generated_at || activePlan.generatedAt || null,
      plan_reason: activePlan.plan_reason || null,
    };
  };
  
  const persistProgress = async (next: {
    checked?: Record<string, boolean>;
    frog_done?: boolean;
    energy?: string | null;
  } = {}) => {
    if (!userId) return;
  
    try {
      await saveTodayProgress(supabase, userId, {
        checked: next.checked ?? checked,
        frog_done: next.frog_done ?? frogDone,
        energy: next.energy ?? energy,
        ...progressSnapshot(),
      });
    } catch (error) {
      console.error("Failed to save daily progress:", error);
    }
  };
  
  useEffect(() => {
    async function loadTodayProgress() {
      if (!userId) {
        setProgressReady(true);
        return;
      }
  
      setProgressReady(false);
  
      try {
        const saved = await getTodayProgress(supabase, userId);
  
        if (saved) {
          setChecked(saved.checked || {});
          setFrogDone(Boolean(saved.frog_done));
          setEnergy(saved.energy || null);
        }
      } catch (error) {
        console.error("Failed to load daily progress:", error);
      } finally {
        setProgressReady(true);
      }
    }
  
    loadTodayProgress();
  }, [supabase, userId]);
  const [analyticsReady, setAnalyticsReady] = useState(false);
  const [analytics, setAnalytics] = useState({
    weekCompletion: 0,
    weekCompletionLogged: 0,
    savedThisWeek: 0,
    streak: 0,
    bestPct: 0,
    savedDays: 0,
    weekPcts: [0, 0, 0, 0, 0, 0, 0],
    frogWeek: 0,
    insights: [] as string[],
  });
  
  const dayPct = (row: any) => {
    if (!row) return 0;
  
    const habits = row.habits_snapshot || [];
    const checked = row.checked || {};
    const total = habits.length || Object.keys(checked).length || 0;
  
    if (!total) return 0;
  
    const done = Object.values(checked).filter(Boolean).length;
    return Math.round((done / total) * 100);
  };
  
  useEffect(() => {
    async function loadDashboardAnalytics() {
      if (!userId) {
        setAnalyticsReady(true);
        return;
      }
      
      setAnalyticsReady(false);
  
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
  
        const rows = await getProgressMonth(supabase, userId, year, month);

        const byDate: Record<string, any> = {};
        rows.forEach((row: any) => {
          byDate[row.progress_date] = row;
        });

        const today = new Date();
        const todayKey = today.toISOString().slice(0, 10);

        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));

        // Fetch previous month's rows if the current week spans a month boundary,
        // so streak and week completion don't reset incorrectly on day 1–6 of a month.
        const weekStartsInPriorMonth =
          weekStart.getFullYear() !== today.getFullYear() ||
          weekStart.getMonth() !== today.getMonth();
        if (weekStartsInPriorMonth) {
          const priorYear = weekStart.getFullYear();
          const priorMonth = weekStart.getMonth() + 1;
          const priorRows = await getProgressMonth(supabase, userId, priorYear, priorMonth);
          priorRows.forEach((row: any) => {
            byDate[row.progress_date] = row;
          });
        }

        const weekDays = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(weekStart);
          d.setDate(weekStart.getDate() + i);
          return d.toISOString().slice(0, 10);
        });

        const weekPcts = weekDays.map((date) => dayPct(byDate[date]));

        // Week completion: average only days that have been logged, not future/unlogged days.
        const loggedWeekPcts = weekPcts.filter((_, i) => Boolean(byDate[weekDays[i]]));
        const savedThisWeek = loggedWeekPcts.length;
        const weekCompletionLogged = savedThisWeek > 0
          ? Math.round(loggedWeekPcts.reduce((sum, n) => sum + n, 0) / savedThisWeek)
          : 0;
        // Keep the old 7-day average for backwards-compat fields that may use it.
        const weekCompletion = Math.round(
          weekPcts.reduce((sum, n) => sum + n, 0) / weekPcts.length
        );

        // Frog/keystone completion rate for the current week.
        const frogWeek = weekDays.reduce((count, date) => {
          const row = byDate[date];
          return count + (row && row.frog_done === true ? 1 : 0);
        }, 0);

        let streak = 0;
        const cursor = new Date(today);

        while (true) {
          const key = cursor.toISOString().slice(0, 10);
          const pct = dayPct(byDate[key]);

          if (pct <= 0) break;

          streak += 1;
          cursor.setDate(cursor.getDate() - 1);
        }

        const bestPct = rows.length
          ? Math.max(...rows.map((row: any) => dayPct(row)))
          : 0;

        // --- Deterministic progress insights (no AI, no schema change) ---
        const insights: string[] = [];

        // Best day this week (need ≥ 2 logged days)
        if (savedThisWeek >= 2) {
          const dayLabels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
          let bestI = 0;
          for (let i = 1; i < 7; i++) {
            if (byDate[weekDays[i]] && weekPcts[i] > weekPcts[bestI]) bestI = i;
          }
          if (byDate[weekDays[bestI]] && weekPcts[bestI] > 0) {
            insights.push(`Best day: ${dayLabels[bestI]} at ${weekPcts[bestI]}%.`);
          }
        }

        // Habit tally (strongest + weakest) — need ≥ 3 logged days
        if (savedThisWeek >= 3) {
          const tally: Record<string, { name: string; done: number; total: number }> = {};
          weekDays.forEach((date) => {
            const row = byDate[date];
            if (!row) return;
            const hs: any[] = Array.isArray(row.habits_snapshot) ? row.habits_snapshot : [];
            const ch: Record<string, boolean> = row.checked && typeof row.checked === "object" ? row.checked : {};
            hs.forEach((h: any) => {
              const id = h?.id;
              const name = typeof h?.name === "string" ? h.name : null;
              if (!id || !name) return;
              if (!tally[id]) tally[id] = { name, done: 0, total: 0 };
              tally[id].total += 1;
              if (ch[id]) tally[id].done += 1;
            });
          });

          const entries = Object.values(tally).filter((e) => e.total >= 3);
          if (entries.length > 0) {
            const strongest = entries.reduce((a, b) => (b.done / b.total > a.done / a.total ? b : a));
            insights.push(`Strongest habit: ${strongest.name} (${strongest.done}/${strongest.total} days).`);

            const weakest = entries
              .filter((e) => e.total - e.done >= 2)
              .reduce((a: any, b) => (a === null || (b.total - b.done) / b.total > (a.total - a.done) / a.total ? b : a), null as any);
            if (weakest) {
              const missed = weakest.total - weakest.done;
              insights.push(`Needs attention: ${weakest.name} (missed ${missed} of ${weakest.total} logged days).`);
            }
          }
        }

        // Completion trend — need ≥ 4 logged days
        if (savedThisWeek >= 4 && insights.length < 3) {
          const loggedPairs = weekDays
            .map((date, i) => ({ pct: weekPcts[i], logged: Boolean(byDate[date]) }))
            .filter((x) => x.logged);
          const mid = Math.floor(loggedPairs.length / 2);
          const earlyAvg = loggedPairs.slice(0, mid).reduce((s, x) => s + x.pct, 0) / mid;
          const lateAvg = loggedPairs.slice(mid).reduce((s, x) => s + x.pct, 0) / (loggedPairs.length - mid);
          const diff = Math.round(lateAvg - earlyAvg);
          if (Math.abs(diff) >= 10) {
            insights.push(
              diff > 0
                ? "Trend: your completion improved as the week went on."
                : "Trend: you started stronger — finish the week well."
            );
          }
        }

          setAnalytics({
            weekCompletion,
            weekCompletionLogged,
            savedThisWeek,
            streak,
            bestPct,
            savedDays: rows.length,
            weekPcts,
            frogWeek,
            insights: insights.slice(0, 3),
          });
        } catch (error) {
          console.error("Failed to load dashboard analytics:", error);
        } finally {
          setAnalyticsReady(true);
        }
    }
  
    loadDashboardAnalytics();
  }, [supabase, userId]);

  const generateRecoveryBrief = async () => {
    if (recoveryLoading) return;
    setRecoveryLoading(true);
    setRecoveryErr("");
    setRecoveryQuotaInfo(null);

    const uncheckedToday = habits
      .filter((h: any) => !checked[h.id])
      .map((h: any) => h.name)
      .slice(0, 3)
      .join(", ");

    const prompt = buildRecoveryPrompt(profile, {
      weekCompletion: analytics.weekCompletion,
      streak: analytics.streak,
      savedDays: analytics.savedDays,
      weekPcts: analytics.weekPcts,
      frogDone,
      mostMissedHabits: uncheckedToday || "",
      planMode: normalizePlanMode((plan as any)?.plan_mode || profile.plan_mode),
      tierLabel: tier.label,
      week: profile.week || 1,
      planFocus: (plan as any)?.dashboard?.weeklyReviewFocus || "",
    });

    await streamClaude(
      prompt,
      "recovery_plan",
      getToken,
      (chunk) => setRecoveryText((t) => t + chunk),
      () => setRecoveryLoading(false),
      (msg, quota) => {
        setRecoveryErr(msg);
        setRecoveryQuotaInfo(quota ?? null);
        setRecoveryLoading(false);
      },
      RECOVERY_PROMPT_VERSION
    );
  };

  if (!progressReady || !analyticsReady) {
    return <MacpLoader />;
  }
  const doneCount = Object.values(checked).filter(Boolean).length;
  const pct = habits.length ? Math.round((doneCount/habits.length)*100) : 0;
  const smartNudge = nudgeDismissed ? null : pickSmartNudge({
    doneCount,
    totalHabits: habits.length,
    todayPct: pct,
    frogDone,
    streak: analytics.streak,
    energy,
    nowMin,
    insights: analytics.insights,
  });
  const weekDots =
  analytics.weekPcts?.length === 7
    ? analytics.weekPcts
    : [0, 0, 0, 0, 0, 0, 0];

const weekDotStates = weekDots.map((pct) => pct > 0);

const activePlan = (plan || {}) as any;
const currentPlanVersion = Number(activePlan.plan_version || activePlan.planVersion || 1);
const currentPlanGeneratedAt = activePlan.plan_generated_at || activePlan.generatedAt || null;
const currentPlanGeneratedLabel = currentPlanGeneratedAt
  ? new Date(currentPlanGeneratedAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  : "Not saved";
const currentPlanReason =
  activePlan.plan_reason || (currentPlanVersion > 1 ? "Regenerated" : "Initial plan");
const currentPlanContext = `${tier.label} · ${profile.situation || "MACP Plan"}`;

  const toggleHabit = (id) => {
    const wasChecked = checked[id];
    const nextChecked = { ...checked, [id]: !checked[id] };
  
    setChecked(nextChecked);
    persistProgress({ checked: nextChecked });
  
    const nextDoneCount = Object.values(nextChecked).filter(Boolean).length;
  
    if (!wasChecked && nextDoneCount === habits.length) {
      setTimeout(() => setCelebrate(true), 300);
      setTimeout(() => setCelebrate(false), 3200);
    }
  };

  const addHabit = () => {
    if (!newHabit.name.trim()) return;
    const h = { id:`u${Date.now()}`, name:newHabit.name.trim(), tag:newHabit.tag, tier:2, custom:true };
    setHabits(hs=>[...hs,h]);
    setProfile(p=>({...p, customHabits:[...(p.customHabits||[]), {name:h.name,tag:h.tag}]}));
    setNewHabit({name:"",tag:"work"});
    setShowAdd(false);
  };

  const removeHabit = (id) => setHabits(hs=>hs.filter(h=>h.id!==id));

  const frogTask =
  pd?.frogTask?.title ||
  profile.businessGoal ||
  profile.mainGoal ||
  "Your highest-leverage task today";

const frogDesc =
  pd?.frogTask?.description ||
  "This is the task that, when done, makes the rest of the day feel like a bonus. Brian Tracy's rule: do it before email, before social, before anything else.";

  return (
    <>
      {focusMode && (
        <FocusMode
          task={frogTask}
          onExit={()=>setFocusMode(false)}
          onDone={() => {
            if (!frogDone) setAnalytics((a) => ({ ...a, frogWeek: a.frogWeek + 1 }));
            setFrogDone(true);
            setFocusMode(false);
            persistProgress({ frog_done: true });
          }}
        />
      )}
      {celebrate && (
        <div className="celebrate" onClick={()=>setCelebrate(false)}>
          <div className="celebrate-box">
            <div className="celebrate-emoji">🏆</div>
            <div className="celebrate-title">All Habits Done!</div>
            <div className="celebrate-sub">
              You just compounded your identity.<br/>
              <span style={{color:"var(--amber)",fontStyle:"italic"}}>"{profile.name || "Champion"} is the type of person who shows up every day."</span>
            </div>
          </div>
        </div>
      )}

<div className="dash tab-fu tab-clean">
        {/* Header */}
        <div className="dash-top fu">
          <div>
            <div className="dash-greet">
              Good {new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"},{" "}
              <span>{profile.name || "Champion"}</span>
            </div>
            <div className="dash-date">{todayLabel()}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:10}}>
            <div className="tier-pill">
              <div className="tier-pip" style={{background:tier.color}}/>
              <div className="tier-name">{tier.label}</div>
              <div className="tier-week">W{profile.week||1}</div>
            </div>
          </div>
          </div>

          <div className="card current-plan-card fu fu1">
          <div className="current-plan-body">
            <div className="current-plan-top">
              <div>
                <div className="current-plan-eyebrow">Current plan</div>
                <div className="current-plan-title">Plan v{currentPlanVersion}</div>
              </div>
              <div className="current-plan-badge">{currentPlanReason}</div>
            </div>

            <div className="current-plan-meta-line">
              <span className="current-plan-meta-item">
                <span className="current-plan-meta-label">Generated</span>
                <span className="current-plan-meta-value">{currentPlanGeneratedLabel}</span>
              </span>
              <span className="current-plan-meta-item">
                <span className="current-plan-meta-label">Context</span>
                <span className="current-plan-meta-value">{currentPlanContext}</span>
              </span>
              <span className="current-plan-meta-item">
                <span className="current-plan-meta-label">Today</span>
                <span className="current-plan-meta-value">Plan v{currentPlanVersion}</span>
              </span>
            </div>
          </div>
        </div>

{/* Energy check-in */}
        {progressReady && !energy && (
          <div className="card fu fu1" style={{marginBottom:20}}>
            <div className="card-hd">
              <div className="card-hd-l"><span className="card-icon">⚡</span><span className="card-title">Daily Check-in — How's your energy today?</span></div>
            </div>
            <div className="card-body">
              <div className="checkin-row">
                {ENERGY_LEVELS.map(e=>(
                  <button key={e.v}
                    className={`energy-btn ${energy===e.v?"sel":""}`}
                    style={energy===e.v?{borderColor:e.c,color:e.c,background:`${e.c}14`}:{}}
                    onClick={() => {
                      setEnergy(e.v);
                      persistProgress({ energy: e.v });
                    }}>
                    {e.l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {energy && energy==="low" && (
          <div className="card fu fu1" style={{marginBottom:20,borderColor:"rgba(58,124,191,0.3)",background:"rgba(58,124,191,0.04)"}}>
            <div className="card-body" style={{display:"flex",alignItems:"center",gap:14}}>
              <span style={{fontSize:"1.5rem"}}>🌊</span>
              <div>
                <div style={{fontWeight:600,marginBottom:4}}>Low-Energy Mode Activated</div>
                <div style={{fontSize:".83rem",color:"var(--text-mid)"}}>Today's minimum: <strong>
  {pd?.lowEnergyFallback?.length
    ? pd.lowEnergyFallback.join(" · ")
    : "Frog task + hydrate + 10-min journal"}
</strong>. That's it. Showing up is the win.</div>
              </div>
              <button onClick={()=>setEnergy(null)} style={{marginLeft:"auto",background:"none",border:"none",color:"var(--text-dim)",cursor:"pointer",fontSize:"1.1rem"}}>×</button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="stats fu fu2">
          <div className="stat">
            <div className="stat-lbl">Habits Today</div>
            <div className="stat-val">{doneCount}<span className="stat-unit">/{habits.length}</span></div>
            <div className={`stat-note ${doneCount>0?"pos":""}`}>{doneCount===0?"Not started yet":doneCount===habits.length?"All done! 🏆":"Keep going →"}</div>
          </div>
          <div className="stat">
            <div className="stat-lbl">Current Week</div>
            <div className="stat-val">{analytics.weekCompletionLogged}<span className="stat-unit">%</span></div>
            <div className="stat-note pos">{analytics.savedThisWeek > 0 ? `${analytics.savedThisWeek}d logged` : "No data yet"}</div>
          </div>
          <div className="stat">
            <div className="stat-lbl">Streak</div>
            <div className="stat-val">{analytics.streak}<span className="stat-unit">days</span></div>
            <div className={`stat-note ${analytics.streak > 0 ? "pos" : ""}`}>
              {analytics.streak > 0 ? "Keep it alive" : "Start today"}
            </div>
          </div>
          <div className="stat">
            <div className="stat-lbl">Frog This Week</div>
            <div className="stat-val">{analytics.frogWeek}<span className="stat-unit">/{analytics.savedThisWeek}</span></div>
            <div className={`stat-note ${analytics.frogWeek > 0 ? "pos" : ""}`}>
              {analytics.frogWeek > 0 ? "Keystone hits" : "None yet"}
            </div>
          </div>
        </div>

        {/* Smart Nudge strip */}
        {smartNudge && (
          <div
            role="status"
            aria-live="polite"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(212,146,42,0.06)",
              borderLeft: "3px solid var(--amber)",
              fontSize: ".83rem",
              color: "var(--text-mid)",
              lineHeight: 1.55,
            }}
          >
            <span style={{ fontSize: "1rem", flexShrink: 0 }}>{smartNudge.icon}</span>
            <span style={{ flex: 1 }}>{smartNudge.text}</span>
            <button
              aria-label="Dismiss smart nudge"
              onClick={() => setNudgeDismissed(true)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-dim)",
                cursor: "pointer",
                fontSize: "1.1rem",
                padding: "4px 8px",
                marginLeft: "auto",
                flexShrink: 0,
                minWidth: 44,
                minHeight: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >×</button>
          </div>
        )}

        {/* Main grid */}
        <div className="dgrid">
          <div className="dleft">
            {/* Frog Task */}
            <div className="card frog-card fu fu3">
              <div className="frog-hd">
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:"1.1rem"}}>🐸</span>
                  <span className="frog-tag">EAT THE FROG · HIGHEST LEVERAGE TASK</span>
                </div>
              </div>
              <div className="frog-body">
                <div className="frog-task">{frogTask}</div>
                <div className="frog-why">
                {frogDesc}.
                </div>
                <div className="frog-actions">
                  <button
                    className={`frog-done-btn ${frogDone?"done":""}`}
                    onClick={() => {
                      const next = !frogDone;
                      setFrogDone(next);
                      setAnalytics((a) => ({ ...a, frogWeek: Math.max(0, a.frogWeek + (next ? 1 : -1)) }));
                      persistProgress({ frog_done: next });
                    }}
                  >{frogDone?"✓ Frog eaten!":"Mark Complete"}</button>
                  {!frogDone && (
                    <button className="focus-btn" onClick={()=>setFocusMode(true)}>
                      ⏱ Focus Mode (25 min)
                    </button>
                  )}
                </div>
              </div>
            </div>
            {plan?.aiPlanText && (
  <div className="card fu fu3" style={{ marginBottom: 16 }}>
    <div className="card-hd">
      <div className="card-hd-l">
        <span className="card-icon">✦</span>
        <span className="card-title">Your AI-Generated MACP Plan</span>
      </div>
    </div>

    <div className="card-body">
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: ".78rem",
          lineHeight: 1.75,
          color: "var(--text-mid)",
          whiteSpace: "pre-wrap",
          maxHeight: 340,
          overflowY: "auto",
        }}
      >
        {plan.aiPlanText}
      </div>
    </div>
  </div>
)}
            {/* Habit stack */}
            <div className="card fu fu4">
              <div className="card-hd">
                <div className="card-hd-l">
                  <span className="card-icon">✓</span>
                  <span className="card-title">Today's Habit Stack</span>
                </div>
                <button className="card-action" onClick={()=>setShowAdd(s=>!s)}>+ Add habit</button>
              </div>
              <div className="card-body">
                <div className="habit-list">
                  {habits.map(h=>(
                    <div key={h.id} className="habit-row">
                      <div className={`hcheck ${checked[h.id]?"done":""}`} onClick={()=>toggleHabit(h.id)}>
                        {checked[h.id]?"✓":""}
                      </div>
                      <div className={`hname ${checked[h.id]?"done":""}`}>{h.name}</div>
                      <span className={`htag htag-${h.tag}`}>{h.tag}</span>
                      {h.custom && (
                        <button className="hdel" onClick={()=>removeHabit(h.id)}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
                {showAdd && (
                  <div className="add-habit-row">
                    <input
                      className="add-habit-input"
                      value={newHabit.name}
                      onChange={e=>setNewHabit(n=>({...n,name:e.target.value}))}
                      onKeyDown={e=>e.key==="Enter"&&addHabit()}
                      placeholder="New habit name..."
                      autoFocus
                    />
                    <select
                      className="add-habit-select"
                      value={newHabit.tag}
                      onChange={e=>setNewHabit(n=>({...n,tag:e.target.value}))}
                    >
                      <option value="morning">morning</option>
                      <option value="work">work</option>
                      <option value="health">health</option>
                      <option value="business">business</option>
                      <option value="evening">evening</option>
                    </select>
                    <button className="add-habit-btn" onClick={addHabit}>Add</button>
                  </div>
                )}
              </div>
            </div>

            {/* Streak */}
            <div className="card fu fu5">
              <div className="card-hd">
                <div className="card-hd-l"><span className="card-icon">🔥</span><span className="card-title">This Week's Streak</span></div>
              </div>
              <div className="card-body">
                <div className="streak-grid">
                  {DAY_ABBRS.map((d,i)=>(
                    <div key={d} className="sday">
                      <div className={`sday-dot ${i===6?"today":weekDotStates[i]?"hit":"missed"}`}>
                        {weekDotStates[i]?"✓":i===6?"→":""}
                      </div>
                      <div className="sday-lbl">{d}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress insights — shown only when enough data exists (≥ 3 logged days) */}
            {analytics.insights.length > 0 && (
              <div className="card fu fu5" style={{ borderColor: "var(--border2)" }}>
                <div className="card-hd">
                  <div className="card-hd-l">
                    <span className="card-icon">◎</span>
                    <span className="card-title">This Week's Patterns</span>
                  </div>
                </div>
                <div className="card-body">
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                    {analytics.insights.map((insight, i) => (
                      <li key={i} style={{ fontSize: ".82rem", color: "var(--text-mid)", lineHeight: 1.5 }}>{insight}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Recovery brief — shown only when off track and user requests it */}
            {(analytics.weekCompletion < 60 || analytics.streak === 0 || !frogDone) && (
              <div className="card fu fu5" style={{ borderColor: "rgba(58,124,191,0.3)", background: "rgba(58,124,191,0.04)" }}>
                <div className="card-hd">
                  <div className="card-hd-l">
                    <span className="card-icon">↺</span>
                    <span className="card-title">Recovery Brief</span>
                  </div>
                </div>
                <div className="card-body">
                  {!recoveryText && !recoveryLoading && !recoveryErr && (
                    <>
                      <p style={{ fontSize: ".84rem", color: "var(--text-mid)", marginBottom: 12, lineHeight: 1.6 }}>
                        This week looks a little off pace. Get a short, actionable recovery brief to recalibrate.
                      </p>
                      <button className="btn btn-ghost" style={{ fontSize: ".82rem" }} onClick={generateRecoveryBrief}>
                        ↺ Get recovery brief
                      </button>
                    </>
                  )}
                  {recoveryLoading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-mid)", fontSize: ".84rem" }}>
                      <div className="spinner" />
                      Analyzing your week…
                    </div>
                  )}
                  {recoveryText && !recoveryErr && (
                    <div style={{ fontSize: ".84rem", lineHeight: 1.75, color: "var(--text-mid)", whiteSpace: "pre-wrap" }}>
                      {recoveryText.split("\n").map((line, i) => {
                        const isHeader = /^[A-Z][A-Z &\/\-']+$/.test(line.trim()) && line.trim().length > 3;
                        return isHeader
                          ? <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: ".65rem", letterSpacing: ".12em", color: "var(--sky)", marginTop: 14, marginBottom: 2 }}>{line}</div>
                          : <span key={i}>{line}{"\n"}</span>;
                      })}
                    </div>
                  )}
                  {recoveryErr && (
                    <div style={{ fontSize: ".82rem", color: "var(--red)" }}>
                      {recoveryQuotaInfo ? (
                        <>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>Daily AI limit reached</div>
                          <div>You've used {recoveryQuotaInfo.used} of {recoveryQuotaInfo.limit} AI generations today.</div>
                          <div style={{ marginTop: 4, opacity: 0.75 }}>Try again after the daily reset.</div>
                        </>
                      ) : (
                        <div>Could not generate recovery brief. Check your connection and try again.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="dright">
            <ProgressRing pct={pct}/>

            {/* Daily Timeline */}
            <div className="card fu fu3">
              <div className="card-hd">
                <div className="card-hd-l"><span className="card-icon">⏱</span><span className="card-title">Daily Flow</span></div>
              </div>
              <div className="card-body">
                <div className="tl">
                  {timeline.map((item,i)=>{
                    const itemMin = timeToMin(item.time);
                    const next = timeline[i+1];
                    const nextMin = next ? timeToMin(next.time) : itemMin+60;
                    const isPast = nowMin > nextMin;
                    const isNow  = nowMin >= itemMin && nowMin < nextMin;
                    return (
                      <div key={i} className="tl-row">
                        <div className="tl-spine">
                          <div className={`tl-dot ${isPast?"past":isNow?"now":""}`}/>
                          {i<timeline.length-1 && <div className={`tl-line ${isPast?"past":""}`}/>}
                        </div>
                        <div className="tl-content">
                          <div className="tl-time" style={isNow?{color:"var(--amber)"}:{}}>{item.time}</div>
                          <div className="tl-name" style={isNow?{color:"var(--text)",fontWeight:700}:isPast?{color:"var(--text-dim)"}:{}}>{item.name}</div>
                          <div className="tl-note">{item.note}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
