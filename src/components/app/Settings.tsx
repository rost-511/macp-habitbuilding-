// Settings — profile, progression, export & history (Project 14D — Task 7).
// Moved verbatim from App.tsx; settings behavior, copy, and class names unchanged.
// supabase, the getPlanHistory data loader, and renderInsightSections are passed in as props (no userData import).
import { useState, useEffect } from "react";
import { tierFor, makeHabits, makeTimeline } from "../../lib/helpers";

export function Settings({ profile, setProfile, onReset, onGenerateNewPlan, userId, plan, weeklyReviews, weeklyReviewsLoading, supabase, getPlanHistory, renderInsightSections }) {
  const [planHistory, setPlanHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [expandedWeeklyReviewId, setExpandedWeeklyReviewId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPlanHistory = async () => {
      if (!userId) {
        if (!cancelled) setPlanHistory([]);
        return;
      }

      setHistoryLoading(true);

      try {
        const rows = await getPlanHistory(supabase, userId);
        if (!cancelled) setPlanHistory(rows);
      } catch (error) {
        console.error("Failed to load plan history:", error);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    loadPlanHistory();

    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  const tier = tierFor(profile.week||1);
  const [week, setWeek] = useState(profile.week||1);

  const updateWeek = (w) => {
    setWeek(w);
    setProfile(p=>({...p, week:w}));
  };

  const exportJSON = () => {
    const latestReview = weeklyReviews[0] || null;
    const latestPlanRecord = planHistory[0] || null;
    const insightText: string = latestReview?.insight || "";

    // Priority: in-memory plan → latest review's plan_snapshot → planHistory[0].plan
    let activePlanDoc: any = {};
    let activePlanVersion: number | null = null;
    let activePlanSource: string = "unknown";
    if (plan && typeof plan === "object" && Object.keys(plan).length > 0) {
      activePlanDoc = plan;
      activePlanVersion = Number(plan.plan_version || plan.planVersion || 1);
      activePlanSource = "current_plan";
    } else if (latestReview?.plan_snapshot && Object.keys(latestReview.plan_snapshot).length > 0) {
      activePlanDoc = latestReview.plan_snapshot;
      activePlanVersion = latestReview.plan_version ?? null;
      activePlanSource = "latest_weekly_review";
    } else if (latestPlanRecord?.plan) {
      activePlanDoc = latestPlanRecord.plan;
      activePlanVersion = latestPlanRecord.plan_version ?? null;
      activePlanSource = "plan_history";
    }
    const activeDashboard = activePlanDoc?.dashboard || {};

    const reviewPlanVersion: number | null = latestReview?.plan_version ?? null;

    const extractSection = (text: string, header: string): string | null => {
      if (!text) return null;
      const lines = text.split("\n");
      const startIdx = lines.findIndex(l => l.trim() === header);
      if (startIdx === -1) return null;
      const body: string[] = [];
      for (let i = startIdx + 1; i < lines.length; i++) {
        if (/^[A-Z][A-Z &/\-']{2,}$/.test(lines[i].trim())) break;
        body.push(lines[i]);
      }
      return body.join("\n").trim() || null;
    };

    const ai_memory_snapshot = {
      active_plan_source: activePlanSource,
      active_plan_version: activePlanVersion,
      latest_weekly_review_plan_version: reviewPlanVersion,
      latest_weekly_review_plan_reason: latestReview?.plan_reason ?? null,
      latest_weekly_review_matches_active_plan:
        activePlanVersion !== null && reviewPlanVersion !== null
          ? activePlanVersion === reviewPlanVersion
          : false,
      latest_weekly_review_week_start: latestReview?.week_start ?? null,
      latest_weekly_review_week_end: latestReview?.week_end ?? null,
      current_week: profile?.week ?? null,
      current_identity: activeDashboard?.identityStatement || null,
      latest_weekly_review_summary: insightText || null,
      latest_growth_edge: extractSection(insightText, "GROWTH EDGE"),
      latest_keystone: extractSection(insightText, "NEXT WEEK'S KEYSTONE"),
      latest_scores: latestReview?.scores ?? null,
      latest_completion_pct: latestReview?.completion_pct ?? null,
      latest_saved_days: latestReview?.saved_days ?? null,
      recent_plan_versions: planHistory.map((p: any) => ({
        version: p.plan_version,
        reason: p.plan_reason,
        generated_at: p.plan_generated_at,
      })),
      next_coaching_focus: activeDashboard?.weeklyReviewFocus || null,
    };

    // Strip internal auth identifiers that must never appear in user-facing exports.
    const sanitizeRow = ({ clerk_user_id: _cid, user_id: _uid, ...rest }: any) => rest;

    const data = {
      profile,
      exportedAt: new Date().toISOString(),
      tier: tier.label,
      timeline: makeTimeline(profile),
      plan_history: planHistory,
      weekly_reviews: weeklyReviews.map(sanitizeRow),
      ai_memory_snapshot,
    };
    const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="macp_plan.json"; a.click();
  };

  const exportCSV = () => {
    const habits = makeHabits(profile, tier.level);
    const rows = [["id","name","tag","tier"],...habits.map(h=>[h.id,`"${h.name}"`,h.tag,h.tier])];
    const blob = new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="macp_habits.csv"; a.click();
  };

  return (
    <div className="set tab-fu">
      <div className="wiz-step">SETTINGS & PROFILE</div>
      <h2 className="set-h1">Your MACP Profile</h2>
      <p className="set-sub">Adjust your week, tier, and export your plan at any time.</p>

      {/* Profile info */}
      <div className="set-section">
        <div className="set-sec-title">Profile</div>
        <div className="card">
          <div className="card-body">
            {[
              ["Name", profile.name||"—"],
              ["Situation", profile.situation||"—"],
              ["Wake time", profile.wakeTime],
              ["Study hours/day", profile.collegeHours||"0"],
              ["Work hours/day", profile.workHours||"0"],
              ["Energy level", `${profile.energyLevel}/10`],
              ["Business goal", profile.businessGoal||"—"],
            ].map(([l,v])=>(
              <div key={l} className="info-row">
                <span className="info-lbl">{l}</span>
                <span className="info-val">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tier / Week selector */}
      <div className="set-section">
        <div className="set-sec-title">Progression — Current Week</div>
        <div className="week-controls" style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
        <button className="btn btn-ghost week-btn" style={{padding:"10px 18px"}} onClick={()=>updateWeek(Math.max(1,week-1))}>−</button>
        <div className="week-readout" style={{textAlign:"center"}}>
            <div style={{fontFamily:"var(--font-display)",fontSize:"2.5rem",fontWeight:700,lineHeight:1}}>{week}</div>
            <div style={{fontFamily:"var(--font-mono)",fontSize:".62rem",color:"var(--text-dim)",letterSpacing:".12em",textTransform:"uppercase"}}>Week</div>
          </div>
          <button className="btn btn-ghost week-btn" style={{padding:"10px 18px"}} onClick={()=>updateWeek(Math.min(12,week+1))}>+</button>
          <div className="week-tier" style={{flex:1,textAlign:"right"}}>
            <div className="tier-pill" style={{justifyContent:"flex-end"}}>
              <div className="tier-pip" style={{background:tier.color}}/>
              <div className="tier-name">{tier.label}</div>
            </div>
          </div>
        </div>
        <div className="tier-strip">
          {[
            {w:[0,0],l:"Assessment",n:"Week 0"},
            {w:[1,2],l:"Foundation",n:"Wk 1–2"},
            {w:[3,5],l:"Momentum", n:"Wk 3–5"},
            {w:[6,12],l:"Optimized",n:"Wk 6–12"},
          ].map((t,i)=>{
            const active = (week>=t.w[0] && week<=t.w[1]) || (i===3 && week>=6);
            return (
              <div key={i} className={`tier-seg ${active?"active":""}`} onClick={()=>updateWeek(t.w[0])}>
                <div className="tier-seg-num">Tier {i}</div>
                <div className="tier-seg-name">{t.l}</div>
                <div style={{fontFamily:"var(--font-mono)",fontSize:".55rem",color:"var(--text-dim)",marginTop:3}}>{t.n}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Placeholder library */}
      <div className="set-section">
        <div className="set-sec-title">Template Placeholders (Live Values)</div>
        <div className="card">
          <div className="card-body" style={{fontFamily:"var(--font-mono)",fontSize:".72rem",lineHeight:2.1}}>
            {[
              [`{{user_name}}`, profile.name||"—"],
              [`{{wake_time}}`, profile.wakeTime],
              [`{{college_hours}}`, profile.collegeHours||"0"],
              [`{{work_hours}}`, profile.workHours||"0"],
              [`{{business_goal}}`, profile.businessGoal||"—"],
              [`{{energy_level}}`, `${profile.energyLevel}/10`],
              [`{{tier_level}}`, tier.label],
              [`{{current_week}}`, `Week ${profile.week||1}`],
              [`{{daily_frog}}`, profile.businessGoal||profile.mainGoal||"Priority task"],
            ].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",borderBottom:"1px solid var(--border)",padding:"2px 0"}}>
                <span style={{color:"var(--amber)"}}>{k}</span>
                <span style={{color:"var(--text-mid)"}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export */}
<div className="set-section">
  <div className="set-sec-title">Export Your Plan</div>

  <div className="settings-actions">
    <button className="btn btn-main" onClick={exportJSON}>
      ⬇ Export JSON
    </button>

    <button className="btn btn-amber" onClick={onGenerateNewPlan}>
      ✦ Generate New Plan
    </button>

    <button className="btn btn-ghost settings-danger-btn" onClick={onReset}>
      ↺ Start Over
    </button>
  </div>
</div>
      
      {/* Plan History */}
<div className="set-section">
  <div className="set-sec-title">Plan History</div>

  <div className="plan-history-list">
    {historyLoading && (
      <div className="plan-history-empty">Loading plan history...</div>
    )}

    {!historyLoading && planHistory.length === 0 && (
      <div className="plan-history-empty">
        No saved plan history yet. Your next generated plan will appear here.
      </div>
    )}

    {!historyLoading &&
      planHistory.map((item) => {
        const generatedDate = item.plan_generated_at
          ? new Date(item.plan_generated_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Unknown date";

        const reason =
          item.plan_reason === "regenerated" ? "Regenerated" : "Initial";

          const isExpanded = expandedPlanId === item.id;
          const historyPlan = item.plan || {};
          const historyDashboard = historyPlan.dashboard || {};
          const historySnapshot = item.profile_snapshot || historyPlan.profileSnapshot || {};
          const historyPlanVersion =
            item.plan_version || historyPlan.plan_version || historyPlan.planVersion || 1;
          const historyWeek = Number(historySnapshot.week || 1);
          const historyTier = tierFor(Number.isFinite(historyWeek) ? historyWeek : 1);
          const historyMode = historySnapshot.situation || "MACP Plan";
          const historyFrog = historyDashboard.frogTask || null;
          const historyHabits = Array.isArray(historyDashboard.habits)
            ? historyDashboard.habits.slice(0, 5)
            : [];
            const historyMetaItems = [
              ["Version", `v${historyPlanVersion}`],
              ["Generated", generatedDate],
              ["Reason", reason],
              ["Context", `${historyTier.label} · ${historyMode}`],
            ];
            const hasStructuredHistoryDetails =
              Boolean(historyFrog?.title) ||
              Boolean(historyDashboard.weeklyReviewFocus) ||
              historyHabits.length > 0;
            const hasHistoryDetails =
              historyMetaItems.length > 0 ||
              Boolean(historyPlan.aiPlanText) ||
              hasStructuredHistoryDetails;
          
          return (
            <div
              key={item.id}
              className={`plan-history-card ${isExpanded ? "open" : ""}`}
            >
              <button
                className="plan-history-item"
                type="button"
                onClick={() => setExpandedPlanId(isExpanded ? null : item.id)}
              >
                <div>
                  <div className="plan-history-title">
                  Plan v{historyPlanVersion}
                  </div>
                  <div className="plan-history-meta">
                    {reason} · {generatedDate}
                  </div>
                </div>
          
                <div className="plan-history-right">
                  <div className="plan-history-pill">
                  {historyMode}
                  </div>
                  <span className="plan-history-chevron">
                    {isExpanded ? "−" : "+"}
                  </span>
                </div>
              </button>
          
              {isExpanded && hasHistoryDetails && (
                <div className="plan-history-detail">
                  <div className="plan-history-metadata-row">
                    {historyMetaItems.map(([label, value]) => (
                      <div key={label} className="plan-history-metadata-cell">
                        <div className="plan-history-metadata-label">{label}</div>
                        <div className="plan-history-metadata-value">{value}</div>
                      </div>
                    ))}
                  </div>

                  {historyPlan.aiPlanText && (
                    <p className="plan-history-summary">{historyPlan.aiPlanText}</p>
                  )}

                  {!hasStructuredHistoryDetails && (
                    <div className="plan-history-legacy-note">
                      Detailed structure was not saved for this older plan.
                    </div>
                  )}

                  <div className="plan-history-detail-grid">
                    {historyFrog?.title && (
                      <div className="plan-history-detail-card">
                        <div className="plan-history-detail-label">Highest leverage task</div>
                        <div className="plan-history-detail-title">{historyFrog.title}</div>
                        {historyFrog.description && (
                          <div className="plan-history-detail-note">
                            {historyFrog.description}
                          </div>
                        )}
                      </div>
                    )}

                    {historyDashboard.weeklyReviewFocus && (
                      <div className="plan-history-detail-card">
                        <div className="plan-history-detail-label">Weekly focus</div>
                        <div className="plan-history-detail-title">
                          {historyDashboard.weeklyReviewFocus}
                        </div>
                      </div>
                    )}

                    {historyHabits.length > 0 && (
                        <div className="plan-history-detail-card plan-history-habit-card">
                        <div className="plan-history-detail-label">Habit stack</div>
                        <div className="plan-history-habit-list">
                          {historyHabits.map((habit: any, index: number) => (
                            <div
                              key={habit.id || `${habit.name}-${index}`}
                              className="plan-history-habit-row"
                            >
                              <span className="plan-history-habit-name">
                                {habit.name}
                              </span>
                              {habit.tag && (
                                <span className="plan-history-habit-tag">
                                  {habit.tag}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
      })}
  </div>
</div>

      {/* Weekly Review History */}
<div className="set-section">
  <div className="set-sec-title">Weekly Review History</div>

  <div className="plan-history-list">
    {weeklyReviewsLoading && (
      <div className="plan-history-empty">Loading review history...</div>
    )}

    {!weeklyReviewsLoading && weeklyReviews.length === 0 && (
      <div className="plan-history-empty">
        No weekly reviews yet. Complete a week and generate an insight to build your coaching memory.
      </div>
    )}

    {!weeklyReviewsLoading && (() => {
      const currentActivePlanVersion: number | null =
        plan && typeof plan === "object" && Object.keys(plan as object).length > 0
          ? Number((plan as any).plan_version || (plan as any).planVersion || 1)
          : planHistory.length > 0
          ? (planHistory[0].plan_version ?? null)
          : null;

      return weeklyReviews.map((item) => {
        const isExpanded = expandedWeeklyReviewId === item.id;
        const scores = item.scores || {};
        const reviewVersion: number | null = item.plan_version ?? null;
        const isMismatch =
          currentActivePlanVersion !== null &&
          reviewVersion !== null &&
          reviewVersion !== currentActivePlanVersion;
        const fmtWeekDate = (iso: string) => {
          const [y, m, d] = iso.split("-").map(Number);
          return new Date(y, m - 1, d).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          });
        };

        return (
          <div
            key={item.id}
            className={`plan-history-card ${isExpanded ? "open" : ""}`}
          >
            <button
              className="plan-history-item"
              type="button"
              onClick={() =>
                setExpandedWeeklyReviewId(isExpanded ? null : item.id)
              }
            >
              <div>
                <div className="plan-history-title">
                  {fmtWeekDate(item.week_start)} → {fmtWeekDate(item.week_end)}
                </div>
                <div className="plan-history-meta">
                  Plan v{item.plan_version || 1} · {item.completion_pct ?? 0}% · {item.saved_days ?? 0} days
                </div>
                {isMismatch && (
                  <div style={{
                    marginTop: 4,
                    fontFamily: "var(--font-mono)",
                    fontSize: ".58rem",
                    color: "var(--amber)",
                    opacity: 0.7,
                    letterSpacing: ".04em",
                  }}>
                    Reviewed on Plan v{reviewVersion} · current plan is v{currentActivePlanVersion}
                  </div>
                )}
              </div>

              <div className="plan-history-right">
                <div className="plan-history-pill">
                  {item.plan_reason || "initial"}
                </div>
                <span className="plan-history-chevron">
                  {isExpanded ? "−" : "+"}
                </span>
              </div>
            </button>

            {isExpanded && (
              <div className="plan-history-detail">
                <div className="plan-history-metadata-row" style={{marginBottom:12}}>
                  <div className="plan-history-metadata-cell">
                    <div className="plan-history-metadata-label">Consistency</div>
                    <div className="plan-history-metadata-value">{scores.consistency ?? 0}/5</div>
                  </div>
                  <div className="plan-history-metadata-cell">
                    <div className="plan-history-metadata-label">Energy Mgmt</div>
                    <div className="plan-history-metadata-value">{scores.energy ?? 0}/5</div>
                  </div>
                  <div className="plan-history-metadata-cell">
                    <div className="plan-history-metadata-label">Deep Focus</div>
                    <div className="plan-history-metadata-value">{scores.focus ?? 0}/5</div>
                  </div>
                </div>

                {item.notes && (
                  <div className="wr-notes-block">
                    <div className="wr-notes-label">Reflection</div>
                    <div className="wr-notes-text">{item.notes}</div>
                  </div>
                )}

                {item.insight && (
                  <div className="wr-insight-block">
                    <div className="wr-insight-label">AI Insight</div>
                    <div className="wr-insight-text">{renderInsightSections(item.insight)}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      });
    })()}
  </div>
</div>
    </div>
  );
}
