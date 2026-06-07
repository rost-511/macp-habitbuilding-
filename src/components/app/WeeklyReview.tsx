// WeeklyReview — weekly reflection + AI insight (Project 14D — Task 8).
// Moved verbatim from App.tsx; review behavior, copy, class names, and quota/error/loading states unchanged.
// supabase, the getProgressMonth/saveWeeklyReview loaders, streamClaude, the StarRating component, and
// renderInsightSections are passed in as props (no userData / streamClaude / App import).
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { tierFor } from "../../lib/helpers";
import { buildReviewPrompt, REVIEW_PROMPT_VERSION } from "../../lib/prompts";
import { normalizePlanMode } from "../../lib/planModes";
import { UpgradePlaceholder } from "../PremiumGate";

interface QuotaInfo {
  limit: number;
  used: number;
  resetsAt: string;
}

export function WeeklyReview({ profile, plan = null, supabase, userId, screen, onReviewSaved = null, isPremium = false, getProgressMonth, saveWeeklyReview, streamClaude, StarRating, renderInsightSections }) {
  const { getToken } = useAuth();
  const [scores, setScores] = useState({ consistency:0, energy:0, focus:0 });
  const [notes, setNotes] = useState("");
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [reviewSaveStatus, setReviewSaveStatus] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [reviewQuotaHit, setReviewQuotaHit] = useState(false);
  const runningRef = useRef(false);
  const [reviewStatsReady, setReviewStatsReady] = useState(false);
  const [reviewWeekCompletion, setReviewWeekCompletion] = useState(0);
  const [reviewSavedDays, setReviewSavedDays] = useState(0);
  const [reviewSignals, setReviewSignals] = useState<any>(null);
  const tier = tierFor(profile.week||1);
  const reviewPlan = (plan || {}) as any;
  const reviewDashboard = reviewPlan.dashboard || {};
  const reviewPlanVersion = reviewPlan.plan_version || reviewPlan.planVersion || 1;
  const reviewPlanReason = reviewPlan.plan_reason || (reviewPlanVersion > 1 ? "regenerated" : "initial plan");
  const reviewPlanGeneratedAt = reviewPlan.plan_generated_at || reviewPlan.generatedAt || null;
  const reviewPlanGeneratedLabel = reviewPlanGeneratedAt
    ? new Date(reviewPlanGeneratedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not saved";
  const reviewWeeklyFocus = reviewDashboard.weeklyReviewFocus || "No weekly focus saved for this plan.";

  const reviewDayPct = (row: any) => {
    if (!row) return 0;

    const habits = row.habits_snapshot || [];
    const checked = row.checked || {};
    const total = habits.length || Object.keys(checked).length || 0;

    if (!total) return 0;

    const doneCount = Object.values(checked).filter(Boolean).length;
    return Math.round((doneCount / total) * 100);
  };

  useEffect(() => {
    if (screen !== "review") return;

    async function loadReviewProgress() {
      if (!userId) {
        setReviewStatsReady(true);
        return;
      }

      setReviewStatsReady(false);

      try {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));

        const weekDays = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(weekStart);
          d.setDate(weekStart.getDate() + i);
          return d.toISOString().slice(0, 10);
        });

        const currentMonthRows = await getProgressMonth(
          supabase,
          userId,
          today.getFullYear(),
          today.getMonth() + 1
        );

        let rows = currentMonthRows || [];

        const weekStartsInDifferentMonth =
          weekStart.getFullYear() !== today.getFullYear() ||
          weekStart.getMonth() !== today.getMonth();

        if (weekStartsInDifferentMonth) {
          const previousMonthRows = await getProgressMonth(
            supabase,
            userId,
            weekStart.getFullYear(),
            weekStart.getMonth() + 1
          );

          rows = [...rows, ...(previousMonthRows || [])];
        }

        const byDate: Record<string, any> = {};
        rows.forEach((row: any) => {
          byDate[row.progress_date] = row;
        });

        const weekPcts = weekDays.map((date) => reviewDayPct(byDate[date]));
        const savedDays = weekDays.filter((date) => Boolean(byDate[date])).length;
        const completion = Math.round(
          weekPcts.reduce((sum, pct) => sum + pct, 0) / weekPcts.length
        );

        // Compact behavioral signals for the adaptive review. Derived only from
        // rows already fetched above — no additional DB reads.
        const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const dayPattern = weekDays
          .map((date, i) => {
            const row = byDate[date];
            return row ? `${dayLabels[i]} ${reviewDayPct(row)}%` : `${dayLabels[i]} —`;
          })
          .join(", ");

        const missTally: Record<string, { missed: number; total: number }> = {};
        let frogLogged = 0;
        let frogDone = 0;
        weekDays.forEach((date) => {
          const row = byDate[date];
          if (!row) return;
          if (typeof row.frog_done === "boolean") {
            frogLogged += 1;
            if (row.frog_done) frogDone += 1;
          }
          const dayHabits = Array.isArray(row.habits_snapshot) ? row.habits_snapshot : [];
          const dayChecked =
            row.checked && typeof row.checked === "object" ? row.checked : {};
          dayHabits.forEach((h: any) => {
            const name = typeof h?.name === "string" ? h.name : null;
            if (!name) return;
            const entry = missTally[name] || { missed: 0, total: 0 };
            entry.total += 1;
            if (!dayChecked[h?.id]) entry.missed += 1;
            missTally[name] = entry;
          });
        });

        const mostMissedHabits = Object.entries(missTally)
          .filter(([, v]) => v.missed > 0)
          .sort((a, b) => b[1].missed - a[1].missed)
          .slice(0, 3)
          .map(([name, v]) => `${name} (missed ${v.missed} of ${v.total})`)
          .join("; ");

        const frogCompletionRate =
          frogLogged > 0 ? `${frogDone}/${frogLogged} logged days` : "";

        setReviewSavedDays(savedDays);
        setReviewWeekCompletion(completion);
        setReviewSignals({ dayPattern, mostMissedHabits, frogCompletionRate });
      } catch (error) {
        console.error("Failed to load weekly review progress:", error);
        setReviewSavedDays(0);
        setReviewWeekCompletion(0);
        setReviewSignals(null);
      } finally {
        setReviewStatsReady(true);
      }
    }

    loadReviewProgress();
  }, [supabase, userId, screen]);

  const simsCompletion = reviewWeekCompletion;

  const run = async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    setLoading(true);
    setSaving(false);
    setInsight("");
    setDone(false);
    setReviewSaveStatus("");
    setSaveError(false);
    setReviewQuotaHit(false);

    let generatedInsight = "";
    let generationError = "";
    let generationQuotaInfo: QuotaInfo | undefined;

    await streamClaude(
      buildReviewPrompt(
        profile,
        scores,
        notes,
        simsCompletion,
        plan,
        tierFor(profile.week || 1).label,
        {
          savedDays: reviewSavedDays,
          dayPattern: reviewSignals?.dayPattern || "",
          mostMissedHabits: reviewSignals?.mostMissedHabits || "",
          frogCompletionRate: reviewSignals?.frogCompletionRate || "",
          planMode: normalizePlanMode((plan as any)?.plan_mode || profile.plan_mode),
        }
      ),
      "weekly_review",
      getToken,
      (chunk) => {
        generatedInsight += chunk;
        setInsight((text) => text + chunk);
      },
      () => {},
      (errorMessage, quotaInfo) => {
        generationError = errorMessage;
        generationQuotaInfo = quotaInfo;
      },
      REVIEW_PROMPT_VERSION
    );

    if (generationError) {
      setLoading(false);
      // Show the API's message for quota blocks; generic copy for other errors.
      setReviewQuotaHit(!!generationQuotaInfo);
      setReviewSaveStatus(
        generationQuotaInfo
          ? generationError
          : "AI generation failed. Try again."
      );
      setSaveError(true);
      runningRef.current = false;
      return;
    }

    if (!generatedInsight.trim()) {
      setLoading(false);
      setReviewSaveStatus("No insight was generated. Try again.");
      setSaveError(true);
      runningRef.current = false;
      return;
    }

    setSaving(true);
    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const savedRow = await saveWeeklyReview(supabase, userId, {
        week_start: weekStart.toISOString().slice(0, 10),
        week_end: weekEnd.toISOString().slice(0, 10),
        plan_version: Number(reviewPlanVersion) || 1,
        plan_reason: reviewPlanReason,
        plan_generated_at: reviewPlanGeneratedAt,
        prompt_version: REVIEW_PROMPT_VERSION,
        plan_snapshot: reviewPlan,
        completion_pct: simsCompletion,
        saved_days: reviewSavedDays,
        scores,
        notes,
        insight: generatedInsight.trim(),
      });

      setReviewSaveStatus("Insight saved to weekly history.");
      setSaveError(false);
      setDone(true);
      if (onReviewSaved) onReviewSaved(savedRow);
    } catch (error) {
      console.error("Failed to save weekly review:", error);
      setReviewSaveStatus("Insight generated, but failed to save.");
      setSaveError(true);
      setDone(true);
    } finally {
      setSaving(false);
      setLoading(false);
      runningRef.current = false;
    }
  };

  const renderInsight = (raw) =>
    raw.split("\n").map((line,i)=>{
      const isH = /^[A-Z][A-Z &\/\-']+$/.test(line.trim()) && line.trim().length>3;
      return isH ? <span key={i} className="rh">{line}</span> : <span key={i}>{line}{"\n"}</span>;
    });

  return (
    <div className="rev tab-fu">
      <div className="wiz-step">WEEKLY REVIEW · WEEK {profile.week||1}</div>
      <h2 className="rev-h1">How Was This Week?</h2>
      <p className="rev-sub">
        Honest reflection is the compound interest of habit systems.<br/>
        <span style={{fontFamily:"var(--font-mono)",fontSize:".72rem",color:"var(--amber)"}}>{tier.label}</span>
      </p>
      <div className="rev-plan-card">
        <div className="rev-plan-top">
          <div>
            <div className="rev-plan-label">Reviewing current plan</div>
            <div className="rev-plan-title">Plan v{reviewPlanVersion}</div>
          </div>
          <div className="rev-plan-pill">{reviewPlanReason}</div>
        </div>
        <div className="rev-plan-focus">
          <strong>Weekly focus:</strong> {reviewWeeklyFocus}
          <br />
          <strong>Generated:</strong> {reviewPlanGeneratedLabel}
        </div>
      </div>

      {/* Completion stat */}
      <div className="rev-section">
        <div className="rev-sec-title">Habit Completion This Week</div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:"3.5rem",fontWeight:700,color:"var(--amber)",lineHeight:1}}>{simsCompletion}%</div>
          <div>
            <div style={{fontSize:".9rem",fontWeight:600}}>
              {simsCompletion>=80?"Strong week — you're compounding.":simsCompletion>=60?"Decent — one more push needed.":"Restart mode. Small wins matter."}
            </div>
            <div style={{fontSize:".78rem",color:"var(--text-dim)",marginTop:4}}>
  {reviewStatsReady
    ? `${reviewSavedDays} saved day${reviewSavedDays === 1 ? "" : "s"} this week · Target: 80% or above`
    : "Loading saved progress..."}
</div>
          </div>
        </div>
        <div style={{marginTop:16,height:6,background:"var(--border)",borderRadius:99,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${simsCompletion}%`,background:simsCompletion>=80?"var(--green)":simsCompletion>=60?"var(--amber)":"var(--red)",borderRadius:99,transition:"width 1s ease"}}/>
        </div>
      </div>

      {/* Star ratings */}
      <div className="rev-section">
        <div className="rev-sec-title">Self-Rate Your Week</div>
        <div className="star-grid">
          <StarRating label="Consistency" value={scores.consistency} onChange={v=>setScores(s=>({...s,consistency:v}))}/>
          <StarRating label="Energy Mgmt" value={scores.energy} onChange={v=>setScores(s=>({...s,energy:v}))}/>
          <StarRating label="Deep Focus" value={scores.focus} onChange={v=>setScores(s=>({...s,focus:v}))}/>
        </div>
      </div>

      {/* Notes */}
      <div className="rev-section">
        <div className="rev-sec-title">Your Reflection</div>
        <div className="field">
          <label>What worked? What didn't? What surprised you?</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)}
            style={{minHeight:110}}
            placeholder="This week I managed to... I struggled with... I noticed that my energy was..."/>
        </div>
      </div>

      <div style={{marginBottom:28}}>
        {!insight && !loading && (
          <p className="rev-pre-hint">
            Your review will cover: Week Grade · Wins · Growth Edge · Next Keystone · Recovery Protocol
          </p>
        )}
        <button className="btn btn-amber" onClick={run} disabled={loading}>
          {saving
            ? "Saving insight…"
            : loading
            ? "Analyzing your week…"
            : "✦ Generate AI Weekly Insight"}
        </button>

        {reviewSaveStatus && !loading && (
          <div style={{
            marginTop: 12,
            padding: "10px 14px",
            borderRadius: 8,
            border: `1px solid ${saveError ? "rgba(201,64,64,0.35)" : "rgba(45,158,95,0.35)"}`,
            background: saveError ? "rgba(201,64,64,0.08)" : "rgba(45,158,95,0.08)",
            color: saveError ? "var(--red)" : "var(--green)",
            fontSize: ".82rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span>{saveError ? "✕" : "✓"}</span>
            {reviewSaveStatus}
          </div>
        )}
        {reviewQuotaHit && !isPremium && <UpgradePlaceholder />}
      </div>

      {(insight||loading) && (
        <div className="rev-insight si">
          <div className="rev-insight-hd">
            {loading && <div className="spinner"/>}
            {!loading && <span style={{color:"var(--green)"}}>✓</span>}
            <span style={{fontFamily:"var(--font-mono)",fontSize:".65rem",letterSpacing:".14em",textTransform:"uppercase",color:"var(--amber)"}}>
              MACP WEEKLY INSIGHT
            </span>
            {!loading && (
              <span className="rev-meta">
                Week {profile.week || 1} · {reviewSavedDays}d logged · {reviewWeekCompletion}%
              </span>
            )}
          </div>
          <div className="rev-insight-body">
            {renderInsightSections(insight)}
            {loading && <span className="gen-cursor"/>}
          </div>
        </div>
      )}
    </div>
  );
}
