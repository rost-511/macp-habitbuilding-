import { useState, useEffect, useRef, useCallback } from "react";
import { SignedIn, SignedOut, UserButton, useAuth, useSignIn, useSignUp, useClerk, AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { useSupabase } from "./lib/useSupabase";
import { useEntitlement } from "./lib/entitlements";
import { UpgradePlaceholder } from "./components/PremiumGate";
import PublicLanding from "./components/PublicLanding";
import TrustPage, { type TrustPageKey } from "./components/TrustPage";
import { buildPlanPrompt, buildReviewPrompt, PLAN_PROMPT_VERSION, REVIEW_PROMPT_VERSION, buildRecoveryPrompt, RECOVERY_PROMPT_VERSION } from "./lib/prompts";
import { PLAN_MODES, normalizePlanMode } from "./lib/planModes";
import {
  getMyProfile,
  completeOnboarding,
  saveCurrentPlan,
  getTodayProgress,
  saveTodayProgress,
  getProgressMonth,
  getProgressByDate,
  saveWeeklyReview,
  resetUserAppData,
  getPlanHistory,
  getWeeklyReviews,
} from "./lib/userData";
import { STYLES } from "./styles/appStyles";
import { GOALS, HABITS_CATS, WORKOUTS, SITUATIONS, ENERGY_LEVELS, DAY_ABBRS, STEPS, REVIEW_SECTION_HEADERS } from "./lib/constants";

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS & HELPERS
───────────────────────────────────────────────────────────────────────────── */
function tierFor(week) {
  if (week === 0) return { label:"Assessment", color:"#6b6870", level:0 };
  if (week <= 2)  return { label:"Tier 1 · Foundation", color:"#c9961a", level:1 };
  if (week <= 5)  return { label:"Tier 2 · Momentum", color:"#3a7cbf", level:2 };
                  return { label:"Tier 3 · Optimized", color:"#2d9e5f", level:3 };
}

function pickSmartNudge(s: {
  doneCount: number;
  totalHabits: number;
  todayPct: number;
  frogDone: boolean;
  streak: number;
  energy: string | null;
  nowMin: number;
  insights: string[];
}): { icon: string; text: string } | null {
  if (s.energy === "low") return null;
  if (s.totalHabits > 0 && s.doneCount === s.totalHabits && s.frogDone) return null;

  if (s.doneCount === 0 && !s.frogDone)
    return { icon: "→", text: "Start small — finish one habit to get momentum going." };

  if (!s.frogDone && s.nowMin < 14 * 60)
    return { icon: "🐸", text: "Eat the frog first. Your keystone task protects the whole day." };

  if (!s.frogDone && s.nowMin >= 14 * 60)
    return { icon: "🐸", text: "Your keystone task is still open — a good one to close before the day ends." };

  if (s.todayPct > 0 && s.todayPct < 50)
    return { icon: "↑", text: "Pick the easiest habit next and recover the day." };

  if (s.streak >= 1 && s.todayPct < 100)
    return { icon: "🔥", text: `You're on a ${s.streak}-day streak — one quick win keeps it alive.` };

  const needsAttention = s.insights.find((ins) => ins.startsWith("Needs attention:"));
  if (needsAttention) {
    const match = needsAttention.match(/^Needs attention:\s*([^,(]+)/);
    const habit = match ? match[1].trim() : "";
    if (habit) return { icon: "◎", text: `Give ${habit} a little attention today.` };
  }

  const trendUp = s.insights.find(
    (ins) => ins.toLowerCase().includes("improved") || ins.toLowerCase().includes("trending up")
  );
  if (trendUp) return { icon: "↑", text: "You're trending up this week — keep today simple." };

  return null;
}

function makeHabits(profile, tierLevel) {
  const base = [
    { id:"w1", name:"Drink 2 L of water", tag:"health",   tier:1 },
    { id:"w2", name:"No phone for first 30 min", tag:"morning", tier:1 },
    { id:"w3", name:"Complete the Frog Task", tag:"work",    tier:1 },
    { id:"w4", name:"10-min journaling", tag:"morning", tier:1 },
  ];
  if (tierLevel >= 2) {
    base.push({ id:"w5", name:"90-min deep work block", tag:"work",    tier:2 });
    base.push({ id:"w6", name:"Move for 20+ min",       tag:"health",  tier:2 });
  }
  if (tierLevel >= 3) {
    base.push({ id:"w7", name:"Business task logged",   tag:"business",tier:3 });
    base.push({ id:"w8", name:"Evening review done",    tag:"evening", tier:3 });
    base.push({ id:"w9", name:"Read 20 pages",          tag:"evening", tier:3 });
  }
  (profile.customHabits || []).forEach((h, i) =>
    base.push({ id:`c${i}`, name:h.name, tag:h.tag, tier:2, custom:true })
  );
  return base;
}

function makeTimeline(profile) {
  const [wH, wM] = (profile.wakeTime || "06:00").split(":").map(Number);
  const t = (dh, dm=0) => {
    const total = wH*60 + wM + dh*60 + dm;
    return `${String(Math.floor(total/60)%24).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
  };
  const slots = [
    { time:t(0),   name:"Wake + Hydrate",          note:"16 oz water before anything else",      phase:"morning" },
    { time:t(0,12),name:"Mindset (10 min)",         note:"Journal, set intention, breathe",        phase:"morning" },
  ];
  if (profile.workout !== "none")
    slots.push({ time:t(0,28),name:`${profile.workout==="gym"?"Gym":"Home Workout"} (30–45 min)`, note:"Non-negotiable movement", phase:"morning" });
  slots.push({ time:t(1,15), name:"🐸 EAT THE FROG",          note:"Hardest task first — no distractions",    phase:"work" });
  if (profile.collegeHours)
    slots.push({ time:t(2,45), name:`Study Block (${profile.collegeHours}h)`, note:"Active recall + Pomodoro",    phase:"work" });
  slots.push({ time:t(4,30), name:"Lunch + Recovery",            note:"Eat, short walk, no screens",            phase:"rest" });
  if (profile.workHours)
    slots.push({ time:t(5,30), name:`Work Block (${profile.workHours}h)`,   note:"Focused execution",               phase:"work" });
  if (profile.businessGoal)
    slots.push({ time:t(8,0),  name:"Business Block",              note:profile.businessGoal.slice(0,42),          phase:"business" });
  slots.push({ time:t(9,15),  name:"Evening Review (10 min)",      note:"Rate the day, write tomorrow's frog",     phase:"evening" });
  slots.push({ time:t(9,30),  name:"Wind-down",                    note:"Screen off, read, prepare for sleep",     phase:"evening" });
  return slots;
}

function nowMinutes() {
  const n = new Date();
  return n.getHours()*60 + n.getMinutes();
}

function timeToMin(str) {
  const [h,m] = str.split(":").map(Number);
  return h*60+m;
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
}

function fmtSecs(s) {
  const m = Math.floor(s/60), sec = s%60;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   API — STREAMING CLAUDE
───────────────────────────────────────────────────────────────────────────── */
interface QuotaInfo {
  limit: number;
  used: number;
  resetsAt: string;
}

async function streamClaude(prompt, eventType, getToken, onChunk, onDone, onError: (message: string, quotaInfo?: QuotaInfo) => void, promptVersion?: string) {
  try {
    let token = null;
    try {
      token = typeof getToken === "function" ? await getToken() : null;
    } catch {
      token = null;
    }

    const res = await fetch("/api/generate-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ prompt, event_type: eventType, prompt_version: promptVersion ?? null }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      const message = errorData?.details || errorData?.error || "Failed to generate plan";
      if (errorData?.code === "quota_exceeded") {
        const quotaInfo: QuotaInfo = {
          limit: errorData.limit ?? 0,
          used: errorData.used ?? 0,
          resetsAt: errorData.resetsAt ?? "",
        };
        onError(message, quotaInfo);
        return;
      }
      throw new Error(message);
    }

    const data = await res.json();

    if (!data.text) {
      throw new Error("No plan text returned from API");
    }

    onChunk(data.text);
onDone(data.text);
  } catch (e) {
    onError(e instanceof Error ? e.message : String(e));
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   FOCUS MODE TIMER
───────────────────────────────────────────────────────────────────────────── */
function FocusMode({ task, onExit, onDone }) {
  const TOTAL = 25*60;
  const [secs, setSecs] = useState(TOTAL);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (running) ref.current = setInterval(() => setSecs(s => s > 0 ? s-1 : 0), 1000);
    else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  }, [running]);

  const pct = (TOTAL - secs) / TOTAL;
  const r = 58, circ = 2*Math.PI*r;
  const dash = circ * (1-pct);

  return (
    <div className="focus-overlay" onClick={e => e.target===e.currentTarget && onExit()}>
      <div className="focus-label">🐸 FOCUS MODE · 25-MIN POMODORO</div>
      <div className="focus-task">"{task}"</div>

      <div className="focus-ring-wrap" style={{width:140,height:140}}>
        <svg width="140" height="140" style={{transform:"rotate(-90deg)"}}>
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--border2)" strokeWidth="8"/>
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--green)" strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dash}
            style={{transition:"stroke-dashoffset 1s linear"}}/>
        </svg>
        <div className="focus-ring-center" style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-mono)",fontSize:"1.4rem",color:"var(--green)"}}>
          {fmtSecs(secs)}
        </div>
      </div>

      <div className="focus-controls">
        {secs > 0
          ? <button className="focus-ctrl focus-start" onClick={() => setRunning(r=>!r)}>
              {running ? "⏸ Pause" : (secs===TOTAL ? "▶ Start" : "▶ Resume")}
            </button>
          : <button className="focus-done" onClick={onDone}>✓ Complete Frog Task</button>
        }
        <button className="focus-ctrl focus-exit" onClick={onExit}>Exit</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PROGRESS RING
───────────────────────────────────────────────────────────────────────────── */
function ProgressRing({ pct }) {
  const r = 52, circ = 2*Math.PI*r;
  const dash = circ*(1-pct/100);
  return (
    <div className="ring-wrap fu fu2">
      <svg width="120" height="120" className="ring-svg">
        <circle cx="60" cy="60" r={r} className="ring-bg"/>
        <circle cx="60" cy="60" r={r} className="ring-fg"
          strokeDasharray={circ} strokeDashoffset={dash}/>
      </svg>
      <div className="ring-center">
        <div className="ring-pct">{pct}%</div>
        <div className="ring-lbl">Done Today</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STAR RATING
───────────────────────────────────────────────────────────────────────────── */
function StarRating({ label, value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-box">
      <div className="star-lbl">{label}</div>
      <div className="stars">
        {[1,2,3,4,5].map(n => (
          <span key={n} className="star"
            style={{color: n<=(hover||value)?"var(--amber)":"var(--border2)",fontSize:"1.4rem",cursor:"pointer"}}
            onClick={()=>onChange(n)}
            onMouseEnter={()=>setHover(n)}
            onMouseLeave={()=>setHover(0)}>★</span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   WIZARD
───────────────────────────────────────────────────────────────────────────── */
function Wizard({ onComplete, initialProfile = null }) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  const [P, setP] = useState(() => {
    const base = {
      name: "",
      situation: "",
      wakeTime: "06:00",
      workout: "none",
      collegeHours: "",
      workHours: "",
      businessGoal: "",
      goals: [],
      mainGoal: "",
      energyLevel: 7,
      constraints: "",
      freeHours: "2",
      categories: [],
      customHabits: [],
      week: 1,
      plan_mode: "general",
    };
  
    const initial = initialProfile || {};
  
    return {
      ...base,
      ...initial,
      goals: Array.isArray(initial.goals) ? initial.goals : base.goals,
      categories: Array.isArray(initial.categories)
        ? initial.categories
        : base.categories,
      customHabits: Array.isArray(initial.customHabits)
        ? initial.customHabits
        : base.customHabits,
      energyLevel: Number(initial.energyLevel || base.energyLevel),
      week: Number(initial.week || base.week),
      plan_mode: normalizePlanMode(initial.plan_mode || base.plan_mode),
    };
  });
  const up = (k, v) => {
    setError("");
    setP((p) => ({ ...p, [k]: v }));
  };

  const tog = (k, v) => {
    setError("");
    const a = P[k] || [];
    up(k, a.includes(v) ? a.filter((x) => x !== v) : [...a, v]);
  };

  const isBlank = (value) =>
    typeof value !== "string" || value.trim().length === 0;

  const validHours = (value) => {
    if (value === "" || value === null || value === undefined) return false;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 && n <= 14;
  };

  // Returns true only if the value has real textual content (not a single char, not purely numeric, meets minLen).
  const isMeaningfulText = (value: unknown, minLen = 3): boolean => {
    if (typeof value !== "string") return false;
    const t = value.trim();
    if (t.length < minLen) return false;
    if (/^\d+$/.test(t)) return false;
    return true;
  };

  const errorsForStep = (stepIndex) => {
    if (stepIndex === 1) {
      const missing = [];
      if (!isMeaningfulText(P.name, 2)) missing.push("First name (at least 2 characters)");
      if (isBlank(P.situation)) missing.push("Current situation");
      return missing;
    }

    if (stepIndex === 2) {
      const missing = [];
      if (isBlank(P.wakeTime)) missing.push("Wake time");
      if (isBlank(P.workout)) missing.push("Workout preference");
      if (!validHours(P.collegeHours)) missing.push("Study hours / day");
      if (!validHours(P.workHours)) missing.push("Work hours / day");
      if (!isBlank(P.businessGoal) && !isMeaningfulText(P.businessGoal, 3))
        missing.push("Business goal (at least 3 characters, not just a number)");
      return missing;
    }

    if (stepIndex === 3) {
      const missing = [];
      if (!P.goals.length) missing.push("Top goals (select at least one)");
      if (!isMeaningfulText(P.mainGoal, 10))
        missing.push("Main 90-day goal (at least 10 characters — describe what you want to achieve)");
      return missing;
    }

    if (stepIndex === 4) {
      const missing = [];
      if (!P.energyLevel) missing.push("Average daily energy");
      if (isBlank(P.freeHours)) missing.push("Free hours per day");
      if (!isMeaningfulText(P.constraints, 3))
        missing.push("Constraints or challenges (at least 3 characters)");
      return missing;
    }

    if (stepIndex === 5) {
      const missing = [];
      if (!P.categories.length) missing.push("Focus areas (select at least one)");
      return missing;
    }

    return [];
  };

  const firstBadStep = () => {
    return STEPS.findIndex((_, index) => errorsForStep(index).length > 0);
  };

  const s = STEPS[step];
  const pct = ((step + 1) / STEPS.length) * 100;

  const next = () => {
    const missing = errorsForStep(step);

    if (missing.length) {
      setError(`Fill this before continuing: ${missing.join(", ")}`);
      return;
    }

    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const finish = () => {
    const badStep = firstBadStep();

    if (badStep !== -1) {
      setStep(badStep);
      setError(`Fill this before generating: ${errorsForStep(badStep).join(", ")}`);
      return;
    }

    setError("");

    onComplete({
      ...P,
      name: P.name.trim(),
      collegeHours: String(P.collegeHours).trim(),
      workHours: String(P.workHours).trim(),
      businessGoal: P.businessGoal.trim(),
      mainGoal: P.mainGoal.trim(),
      constraints: P.constraints.trim(),
    });
  };

  return (
    <div className="wiz fu">
      <div className="wiz-step">{s.label}</div>
      <h2 className="wiz-title">{s.title}</h2>
      <p className="wiz-sub">{s.sub}</p>
      <div className="prog-track"><div className="prog-fill" style={{width:`${pct}%`}}/></div>

      {step===0 && (
        <div className="fgrp">
          <div className="field">
            <label>What should MACP optimize your system for?</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
              {PLAN_MODES.map((m) => {
                const on = P.plan_mode === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => up("plan_mode", m.id)}
                    style={{
                      cursor: "pointer",
                      padding: "14px 16px",
                      borderRadius: "var(--r2)",
                      border: `1px solid ${on ? "rgba(212,146,42,0.7)" : "var(--border2)"}`,
                      background: on ? "var(--amber-dim)" : "var(--surface2)",
                      transition: "border-color .15s, background .15s",
                    }}
                  >
                    <div style={{ fontSize: "1.15rem", marginBottom: 6 }}>{m.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: ".9rem", color: on ? "var(--amber)" : "var(--text)" }}>{m.label}</div>
                    <div style={{ fontSize: ".74rem", color: "var(--text-mid)", lineHeight: 1.45, marginTop: 3 }}>{m.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {step===1 && (
        <div className="fgrp">
          <div className="field">
            <label>First name</label>
            <input value={P.name} onChange={e=>up("name",e.target.value)} placeholder="e.g. Jordan"/>
          </div>
          <div className="field">
            <label>Current situation</label>
            <div className="chips">
              {SITUATIONS.map(s=>(
                <div key={s} className={`chip ${P.situation===s?"on":""}`} onClick={()=>up("situation",s)}>{s}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step===2 && (
        <div className="fgrp">
          <div className="row2">
            <div className="field">
              <label>Wake time</label>
              <input type="time" value={P.wakeTime} onChange={e=>up("wakeTime",e.target.value)}/>
            </div>
            <div className="field">
              <label>Workout preference</label>
              <select value={P.workout} onChange={e=>up("workout",e.target.value)}>
                {WORKOUTS.map(w=><option key={w.v} value={w.v}>{w.l}</option>)}
              </select>
            </div>
          </div>
          <div className="row2">
            <div className="field">
              <label>Study hours / day</label>
              <input type="number" min="0" max="14" value={P.collegeHours} onChange={e=>up("collegeHours",e.target.value)} placeholder="0"/>
              <span className="field-hint">Enter 0 if not applicable</span>
            </div>
            <div className="field">
              <label>Work hours / day</label>
              <input type="number" min="0" max="14" value={P.workHours} onChange={e=>up("workHours",e.target.value)} placeholder="0"/>
            </div>
          </div>
          <div className="field">
            <label>Business goal (optional)</label>
            <input value={P.businessGoal} onChange={e=>up("businessGoal",e.target.value)} placeholder="e.g. Launch Shopify store by August"/>
          </div>
        </div>
      )}

      {step===3 && (
        <div className="fgrp">
          <div className="field">
            <label>Top goals (pick all that apply)</label>
            <div className="chips">
              {GOALS.map(g=>(
                <div key={g} className={`chip ${P.goals.includes(g)?"on":""}`} onClick={()=>tog("goals",g)}>{g}</div>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Your main 90-day goal (in your own words)</label>
            <textarea value={P.mainGoal} onChange={e=>up("mainGoal",e.target.value)} placeholder="By the end of 90 days I want to..."/>
          </div>
        </div>
      )}

      {step===4 && (
        <div className="fgrp">
          <div className="field range-wrap">
            <label>Average daily energy (1 = exhausted, 10 = peak)</label>
            <input type="range" min="1" max="10" value={P.energyLevel} onChange={e=>up("energyLevel",Number(e.target.value))}/>
            <div className="range-labels">
              <span>1 · Exhausted</span>
              <span className="range-val">{P.energyLevel} / 10</span>
              <span>10 · Peak</span>
            </div>
          </div>
          <div className="field">
            <label>Free hours per day (realistic)</label>
            <select value={P.freeHours} onChange={e=>up("freeHours",e.target.value)}>
              {["< 1","1","2","3","4","5+"].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Constraints or challenges</label>
            <textarea value={P.constraints} onChange={e=>up("constraints",e.target.value)}
              placeholder="e.g. Exam in 3 weeks, irregular shifts, anxiety in mornings, chronic fatigue..."/>
          </div>
        </div>
      )}

      {step===5 && (
        <div className="fgrp">
          <div className="field">
            <label>Focus areas (choose your habit categories)</label>
            <div className="chips">
              {HABITS_CATS.map(c=>(
                <div key={c} className={`chip ${P.categories.includes(c)?"on":""}`} onClick={()=>tog("categories",c)}>{c}</div>
              ))}
            </div>
          </div>
        </div>
      )}
      {error && (
        <div
          style={{
            marginTop: 18,
            padding: "12px 14px",
            border: "1px solid rgba(201,64,64,0.35)",
            background: "rgba(201,64,64,0.08)",
            color: "var(--red)",
            borderRadius: 10,
            fontSize: ".86rem",
          }}
        >
          {error}
        </div>
      )}
      <div className="btn-row">
        {step>0 && <button className="btn btn-ghost" onClick={back}>← Back</button>}
        {step<STEPS.length-1
          ? <button className="btn btn-amber" onClick={next}>Continue →</button>
          : <button className="btn btn-amber" onClick={finish}>Generate My Plan ✦</button>
        }
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GENERATING SCREEN
───────────────────────────────────────────────────────────────────────────── */
function Generating({ profile, onReady, onBack, supabase, onPlanGenerated, existingPlan, userId, isPremium = false }) {
  const { getToken } = useAuth();
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [saving, setSaving] = useState(false);
const [preview, setPreview] = useState<any>(null);
const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const run = async () => {
      let memoryContext: string | null = null;

      const isRegeneration =
        existingPlan &&
        typeof existingPlan === "object" &&
        Object.keys(existingPlan).length > 0;

      if (isRegeneration && userId) {
        try {
          const reviews = await getWeeklyReviews(supabase, userId);
          const latestReview = reviews[0] || null;
          const activePlan = existingPlan as any;
          const activePlanVersion = Number(activePlan.plan_version || activePlan.planVersion || 1);
          const activeDashboard = activePlan?.dashboard || {};

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

          const parts: string[] = [`- Previously on Plan v${activePlanVersion} (${activePlan.plan_reason || "regenerated"})`];
          if (activeDashboard?.weeklyReviewFocus) {
            parts.push(`- Previous weekly focus: ${activeDashboard.weeklyReviewFocus}`);
          }
          if (latestReview) {
            const insightText: string = latestReview.insight || "";
            const scores = latestReview.scores || {};
            parts.push(`- Last weekly review: ${latestReview.completion_pct ?? 0}% completion, ${latestReview.saved_days ?? 0} saved days`);
            if (scores.consistency || scores.energy || scores.focus) {
              parts.push(`- Scores: Consistency ${scores.consistency ?? 0}/5, Energy ${scores.energy ?? 0}/5, Deep Focus ${scores.focus ?? 0}/5`);
            }
            const growthEdge = extractSection(insightText, "GROWTH EDGE");
            if (growthEdge) parts.push(`- Growth edge: ${growthEdge}`);
            const keystone = extractSection(insightText, "NEXT WEEK'S KEYSTONE");
            if (keystone) parts.push(`- Last keystone habit: ${keystone}`);
          }

          memoryContext = parts.join("\n");
        } catch {
          // memory context is optional — generation proceeds without it
        }
      }

      streamClaude(
        buildPlanPrompt(profile, memoryContext, tierFor(profile.week || 1).label, normalizePlanMode(profile.plan_mode)),
        "plan_generation",
      getToken,
      chunk => setText(t=>t+chunk),
      async (fullText) => {
        setDone(true);
      
        const hasExistingPlan =
          existingPlan &&
          typeof existingPlan === "object" &&
          Object.keys(existingPlan).length > 0;
      
        const previousPlanVersion = hasExistingPlan
          ? Number(existingPlan.plan_version || existingPlan.planVersion || 1)
          : 0;
      
        const nextPlanVersion = previousPlanVersion + 1;
        const generatedAt = new Date().toISOString();
        const planReason = hasExistingPlan ? "regenerated" : "initial";
      
        let parsedPlan: Record<string, unknown>;
      
        try {
          const cleaned = fullText
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/, "")
            .trim();
      
          const parsed = JSON.parse(cleaned);
      
          parsedPlan = {
            ...parsed,
            aiPlanText:
              typeof parsed.aiPlanText === "string"
                ? parsed.aiPlanText
                : fullText,
                generatedAt,
                plan_generated_at: generatedAt,
                plan_version: nextPlanVersion,
                plan_reason: planReason,
                prompt_version: PLAN_PROMPT_VERSION,
                plan_mode: normalizePlanMode(profile.plan_mode),
                previous_plan_version: hasExistingPlan ? previousPlanVersion : null,
            profileSnapshot: profile,
          };
        } catch {
          parsedPlan = {
            aiPlanText: fullText,
            generatedAt,
plan_generated_at: generatedAt,
plan_version: nextPlanVersion,
plan_reason: planReason,
prompt_version: PLAN_PROMPT_VERSION,
plan_mode: normalizePlanMode(profile.plan_mode),
previous_plan_version: hasExistingPlan ? previousPlanVersion : null,
            profileSnapshot: profile,
          };
        }
        setPreview(parsedPlan);

        if (!userId) {
          setErr("Plan generated, but could not be saved (not signed in). Please sign in and try again.");
          return;
        }

        setSaving(true);

        try {
          await saveCurrentPlan(supabase, userId, parsedPlan);
          onPlanGenerated(parsedPlan);
        } catch (e) {
          console.error("Failed to save plan:", e);
          setErr("Plan generated, but failed to save. Do not refresh. Check Supabase/database.");
          return;
        } finally {
          setSaving(false);
        }
      },
      (msg, quota) => { setErr(msg); setQuotaInfo(quota ?? null); },
      PLAN_PROMPT_VERSION
    );
    };

    run();
  }, []);

  const previewDashboard = preview?.dashboard || {};
const previewFrog = previewDashboard?.frogTask;
const previewHabits = Array.isArray(previewDashboard?.habits)
  ? previewDashboard.habits.slice(0, 5)
  : [];
const previewSummary = String(preview?.aiPlanText || "")
  .split(/\n{2,}/)
  .map((p) => p.trim())
  .filter(Boolean);

  return (
    <div className="wiz fu">
      <div className="wiz-step">✦ AI GENERATION</div>
      <h2 className="wiz-title">Building Your Plan</h2>
      <p className="wiz-sub">Claude is analyzing your profile and generating a personalized MACP routine.</p>

      <div className="gen-box">
        <div className="gen-header">
          {!done && <div className="gen-dot"/>}
          {done && <span style={{color:"var(--green)",fontSize:"1rem"}}>✓</span>}
          <div className="gen-title">
            {done ? "MACP PLAN COMPLETE" : "GENERATING YOUR PERSONALIZED ROUTINE..."}
          </div>
        </div>
        <div className="gen-body">
  {!done && !err && (
    <div className="gen-spinner">
      <div className="spinner" />
      {text
        ? "Structuring your personalized MACP routine..."
        : "Analyzing schedule, goals, and energy level..."}
    </div>
  )}

  {err && (
    quotaInfo ? (
      <div style={{ color: "var(--red)", fontSize: ".88rem" }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Daily AI limit reached</div>
        <div>You've used {quotaInfo.used} of {quotaInfo.limit} AI generations today.</div>
        <div style={{ marginTop: 4, opacity: 0.75 }}>Try again after the daily reset.</div>
        {!isPremium && <UpgradePlaceholder />}
      </div>
    ) : (
      <div style={{ color: "var(--red)", fontSize: ".88rem" }}>
        Error: {err}
        <br />
        Check that the API is connected.
      </div>
    )
  )}

  {done && preview && (
    <div className="gen-preview">
      <div className="gen-preview-copy">
        {previewSummary.length > 0 ? (
          previewSummary.map((p, i) => <p key={i}>{p}</p>)
        ) : (
          <p>Your personalized MACP routine is ready.</p>
        )}
      </div>

      <div className="gen-preview-grid">
        {previewFrog && (
          <div className="gen-preview-card">
            <div className="gen-preview-label">Highest leverage task</div>
            <div className="gen-preview-title">{previewFrog.title}</div>
            <div className="gen-preview-note">{previewFrog.description}</div>
          </div>
        )}

        {previewDashboard?.weeklyReviewFocus && (
          <div className="gen-preview-card">
            <div className="gen-preview-label">Weekly focus</div>
            <div className="gen-preview-title">{previewDashboard.weeklyReviewFocus}</div>
          </div>
        )}
      </div>

      {previewHabits.length > 0 && (
        <div className="gen-preview-card">
          <div className="gen-preview-label">Habit stack</div>
          <div className="gen-preview-list">
            {previewHabits.map((habit) => (
              <div key={habit.id || habit.name} className="gen-preview-habit">
                <span>✓</span>
                <strong>{habit.name}</strong>
                <em>{habit.tag}</em>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )}
</div>
      </div>

      <div className="btn-row">
      {done && !saving && !err && (
  <button className="btn btn-amber" onClick={onReady}>
    Open My Dashboard →
  </button>
)}

{done && saving && (
  <button className="btn btn-amber" disabled style={{ opacity: 0.6 }}>
    Saving your plan…
  </button>
)}

{err && (
  <button className="btn btn-ghost" onClick={onBack}>
    ← {existingPlan && typeof existingPlan === "object" && Object.keys(existingPlan).length > 0 ? "Back to Dashboard" : "Back to Home"}
  </button>
)}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────────────────────────────────────── */
function MacpLoader({ variant = "boot" }: { variant?: "boot" | "setup" }) {
  // Premium post-auth transition — neutral hand-off while we route the user.
  if (variant === "setup") {
    return (
      <div className="setup-wrap grain">
        <div className="setup-pill">M · A · C · P SYSTEM</div>
        <h1 className="setup-title">Opening your <em>system…</em></h1>
        <p className="setup-sub">Checking your setup and sending you to the right place.</p>
        <div className="setup-bar"><div className="setup-bar-fill" /></div>
        <div className="setup-steps">
          <div className="setup-step done"><span className="setup-check">✓</span> Account verified</div>
          <div className="setup-step done"><span className="setup-check">✓</span> Setup checked</div>
          <div className="setup-step pending"><span className="setup-ring" /> Opening MACP</div>
        </div>
      </div>
    );
  }
  // Minimal boot loader (unchanged behavior on app cold-start).
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--amber)",
        fontFamily: "var(--font-body)",
        fontSize: ".9rem",
        fontWeight: 700,
        letterSpacing: ".02em",
      }}
    >
      Loading MACP…
    </div>
  );
}
function Dashboard({ profile, setProfile, plan = null, supabase, userId }) { 
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
/* ─────────────────────────────────────────────────────────────────────────────
   CALENDAR PAGE
───────────────────────────────────────────────────────────────────────────── */
function CalendarPage({ supabase, userId }) {
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
/* ─────────────────────────────────────────────────────────────────────────────
   WEEKLY REVIEW
───────────────────────────────────────────────────────────────────────────── */
function parseInsightSections(raw: string): { header: string; body: string }[] {
  if (!raw) return [];
  const lines = raw.split("\n");
  const sections: { header: string; body: string }[] = [];
  let current: { header: string; body: string } | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    const isKnown = REVIEW_SECTION_HEADERS.includes(trimmed);
    const isGeneric = /^[A-Z][A-Z &\/\-']+$/.test(trimmed) && trimmed.length > 3;
    if (isKnown || isGeneric) {
      if (current) sections.push(current);
      current = { header: trimmed, body: "" };
    } else if (current) {
      current.body += line + "\n";
    }
  }
  if (current) sections.push(current);
  return sections.map((s) => ({ ...s, body: s.body.trim() }));
}

function renderInsightSections(raw: string) {
  if (!raw) return null;
  const sections = parseInsightSections(raw);
  if (sections.length === 0) {
    return (
      <span style={{ fontSize: ".88rem", lineHeight: 1.75, color: "var(--text-mid)", whiteSpace: "pre-wrap" }}>
        {raw}
      </span>
    );
  }
  return (
    <>
      {sections.map((s, i) => {
        const isKeystone = s.header === "NEXT WEEK'S KEYSTONE";
        const isGrowth = s.header === "GROWTH EDGE";
        const isRecovery = s.header === "RECOVERY PROTOCOL";
        const isGrade = s.header === "WEEK GRADE";
        if (isRecovery && !s.body) return null;
        if (isKeystone) {
          return (
            <div key={i} className="rev-section-keystone">
              <div className="rev-section-title">{s.header}</div>
              <div className="rev-section-body">{s.body}</div>
            </div>
          );
        }
        if (isGrowth) {
          return (
            <div key={i} className="rev-section-growth">
              <div className="rev-section-title">{s.header}</div>
              <div className="rev-section-body">{s.body}</div>
            </div>
          );
        }
        if (isRecovery) {
          return (
            <div key={i} className="rev-section-recovery">
              <div className="rev-section-title">{s.header}</div>
              <div className="rev-section-body">{s.body}</div>
            </div>
          );
        }
        if (isGrade) {
          const gradeMatch = s.body.match(/^([A-D][+-]?)\b/);
          const grade = gradeMatch ? gradeMatch[1] : null;
          const rest = grade ? s.body.slice(grade.length).trim() : s.body;
          return (
            <div key={i} className="rev-section-block">
              <div className="rev-section-title">{s.header}</div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 4 }}>
                {grade && <div className="rev-grade-chip">{grade}</div>}
                <div className="rev-section-body">{rest}</div>
              </div>
            </div>
          );
        }
        return (
          <div key={i} className="rev-section-block">
            <div className="rev-section-title">{s.header}</div>
            <div className="rev-section-body">{s.body}</div>
          </div>
        );
      })}
    </>
  );
}

function WeeklyReview({ profile, plan = null, supabase, userId, screen, onReviewSaved = null, isPremium = false }) {
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

/* ─────────────────────────────────────────────────────────────────────────────
   SETTINGS / PROFILE
───────────────────────────────────────────────────────────────────────────── */
function Settings({ profile, setProfile, onReset, onGenerateNewPlan, userId, plan, weeklyReviews, weeklyReviewsLoading }) {
  const supabase = useSupabase();
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

/* ─────────────────────────────────────────────────────────────────────────────
   MACP AUTH CONTROLS
   100% MACP-owned UI. Every control drives Clerk's REAL backend through its
   custom-flow hooks — Clerk still owns auth, sessions and security:
     • Google / Apple → signIn|signUp.authenticateWithRedirect (real OAuth)
     • Email          → signIn.create / signUp.create + email_code verification
     • setActive      → Clerk creates the real session
   Providers are detected from the live Clerk environment (the same source
   Clerk's own <SignIn/> reads), so Apple shows ONLY when truly configured.
   No embedded <SignIn/> / <SignUp/>, no fake buttons, no fake OTP.
───────────────────────────────────────────────────────────────────────────── */
// Official-mark Google "G" (four-color) — vector, theme-safe.
function GoogleMark() {
  return (
    <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001 6.19 5.238 6.19 5.238-.438.398 6.594-4.807 6.594-14.809 0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );
}
function AppleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.36 1.43c.04 1.05-.36 2.07-1.05 2.83-.72.8-1.9 1.42-2.95 1.33-.12-1.02.4-2.08 1.05-2.78.73-.79 1.98-1.36 2.95-1.38ZM19.6 17.2c-.53 1.22-.78 1.77-1.46 2.85-.95 1.5-2.29 3.37-3.95 3.39-1.47.02-1.85-.97-3.85-.96-2 .01-2.42.97-3.9.96-1.66-.02-2.93-1.71-3.88-3.21-2.66-4.2-2.94-9.12-1.3-11.73 1.17-1.86 3.01-2.96 4.74-2.96 1.77 0 2.88.97 4.34.97 1.42 0 2.28-.98 4.33-.98 1.55 0 3.19.85 4.36 2.31-3.83 2.1-3.21 7.56.47 9.4Z"/>
    </svg>
  );
}
function MacpAuthErr({ text }: { text: string }) {
  return (
    <div className="macp-auth-err" role="alert" aria-live="assertive">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>
      </svg>
      <span>{text}</span>
    </div>
  );
}

function MacpAuthControls({ mode }: { mode: "sign-in" | "sign-up" }) {
  const clerk = useClerk();
  const { isLoaded: authLoaded } = useAuth();
  const { isLoaded: siLoaded, signIn, setActive: setActiveSignIn } = useSignIn();
  const { isLoaded: suLoaded, signUp, setActive: setActiveSignUp } = useSignUp();

  const isSignIn = mode === "sign-in";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [busy, setBusy] = useState<null | "google" | "apple" | "email" | "verify" | "resend">(null);
  const [error, setError] = useState("");

  // Reset transient state when the user flips sign-in ⇄ sign-up.
  useEffect(() => {
    setStep("form"); setCode(""); setPassword(""); setError(""); setBusy(null);
  }, [mode]);

  const ready = authLoaded && siLoaded && suLoaded;

  // Real provider detection — the exact source Clerk's own <SignIn/> reads to
  // decide which social buttons to render. Prefer clerk-js's computed strategy
  // arrays; fall back to deriving from the raw `social` map (enabled +
  // authenticatable). Anything not configured server-side ⇒ button hidden.
  const userSettings: any = (clerk as any)?.__unstable__environment?.userSettings;
  const fromSocialMap: string[] = Object.entries(userSettings?.social || {})
    .filter(([, v]: [string, any]) => v?.enabled && (v?.authenticatable ?? true))
    .map(([k]) => k);
  const enabledStrategies: string[] =
    (userSettings?.authenticatableSocialStrategies?.length && userSettings.authenticatableSocialStrategies) ||
    (userSettings?.socialProviderStrategies?.length && userSettings.socialProviderStrategies) ||
    fromSocialMap;
  const googleEnabled = enabledStrategies.includes("oauth_google");
  const appleEnabled = enabledStrategies.includes("oauth_apple");

  const friendlyError = (err: any): string =>
    err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message ||
    "Something went wrong. Please try again.";

  const startOAuth = async (provider: "google" | "apple") => {
    if (!ready || busy) return;
    setError(""); setBusy(provider);
    try {
      // Survives the OAuth round-trip so the post-auth hand-off still fires on return.
      sessionStorage.setItem("macp:auth-intent", mode);
      const resource: any = isSignIn ? signIn : signUp;
      await resource.authenticateWithRedirect({
        strategy: provider === "google" ? "oauth_google" : "oauth_apple",
        redirectUrl: window.location.origin + "/sso-callback",
        redirectUrlComplete: window.location.origin + "/",
        ...(isSignIn ? {} : { legalAccepted: true }),
      });
      // Browser redirects to the provider here — nothing below runs.
    } catch (err) {
      sessionStorage.removeItem("macp:auth-intent");
      setError(friendlyError(err));
      setBusy(null);
    }
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || busy) return;
    setError(""); setBusy("email");
    try {
      if (isSignIn) {
        const res = await (signIn as any).create({ identifier: email.trim(), password });
        if (res.status === "complete" && res.createdSessionId) {
          await (setActiveSignIn as any)({ session: res.createdSessionId });
          return; // session set → App's post-auth effect takes over
        }
        setError("We couldn't finish signing you in. Please try again.");
        setBusy(null);
      } else {
        const res = await (signUp as any).create({ emailAddress: email.trim(), password, legalAccepted: true });
        if (res.status === "complete" && res.createdSessionId) {
          await (setActiveSignUp as any)({ session: res.createdSessionId });
          return;
        }
        // Email verification required → send the real code, show our OTP step.
        await (signUp as any).prepareEmailAddressVerification({ strategy: "email_code" });
        setStep("verify");
        setBusy(null);
      }
    } catch (err) {
      setError(friendlyError(err));
      setBusy(null);
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || busy) return;
    setError(""); setBusy("verify");
    try {
      const res = await (signUp as any).attemptEmailAddressVerification({ code: code.trim() });
      if (res.status === "complete" && res.createdSessionId) {
        await (setActiveSignUp as any)({ session: res.createdSessionId });
        return;
      }
      setError("That code didn't verify. Check it and try again.");
      setBusy(null);
    } catch (err) {
      setError(friendlyError(err));
      setBusy(null);
    }
  };

  const resendCode = async () => {
    if (busy) return;
    setError(""); setBusy("resend");
    try {
      await (signUp as any).prepareEmailAddressVerification({ strategy: "email_code" });
    } catch (err) {
      setError(friendlyError(err));
    }
    setBusy(null);
  };

  // While Clerk initializes — skeleton instead of a half-built form (no FOUC/pop).
  if (!ready) {
    return (
      <div className="macp-auth" aria-busy="true" aria-live="polite">
        <div className="macp-skel" style={{ height: 52 }} />
        <div className="macp-skel" style={{ height: 13, width: "55%", margin: "9px auto" }} />
        <div className="macp-skel" style={{ height: 52 }} />
        <div className="macp-skel" style={{ height: 52 }} />
      </div>
    );
  }

  // ── Email-code verification step (real Clerk sign-up flow) ──
  if (step === "verify") {
    return (
      <form className="macp-auth" onSubmit={submitCode} noValidate>
        <button type="button" className="macp-back" onClick={() => { setStep("form"); setError(""); setCode(""); }}>
          ← Back
        </button>
        <p className="macp-otp-hint">
          Enter the 6-digit code we sent to <b>{email}</b>.
        </p>
        <div className="macp-field">
          <label className="macp-label" htmlFor="macp-code">Verification code</label>
          {/* Six display cells with a single real <input> sitting transparent on top —
              all typing/paste flows straight into Clerk's `code` state. */}
          <div className="macp-otp">
            <input
              id="macp-code" className="macp-otp-input" name="code"
              inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              value={code} autoFocus aria-label="6-digit verification code"
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <div className="macp-otp-cells" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`macp-otp-cell${i === code.length && !error ? " active" : ""}${error ? " err" : ""}`}
                >
                  {code[i] || ""}
                  {i === code.length && !error && <span className="macp-otp-caret" />}
                </div>
              ))}
            </div>
          </div>
        </div>
        {error && <MacpAuthErr text={error} />}
        <button type="submit" className="macp-cta" disabled={!!busy || code.length < 6}>
          {busy === "verify" ? <><span className="macp-cta-spin" />Verifying…</> : "Verify & continue"}
        </button>
        <div className="macp-resend">
          Didn't get it?{" "}
          <button type="button" className="macp-auth-link" onClick={resendCode} disabled={busy === "resend"}>
            {busy === "resend" ? "Sending…" : "Resend code"}
          </button>
        </div>
      </form>
    );
  }

  // ── Primary step: providers + email ──
  return (
    <div className="macp-auth">
      {googleEnabled && (
        <button type="button" className="macp-oauth" onClick={() => startOAuth("google")} disabled={!!busy}>
          {busy === "google"
            ? <span className="macp-cta-spin" style={{ borderColor: "rgba(240,236,227,0.3)", borderTopColor: "var(--text)" }} />
            : <GoogleMark />}
          Continue with Google
        </button>
      )}
      {appleEnabled && (
        <button type="button" className="macp-oauth" onClick={() => startOAuth("apple")} disabled={!!busy}>
          {busy === "apple"
            ? <span className="macp-cta-spin" style={{ borderColor: "rgba(240,236,227,0.3)", borderTopColor: "var(--text)" }} />
            : <AppleMark />}
          Continue with Apple
        </button>
      )}

      {(googleEnabled || appleEnabled) && (
        <div className="macp-divider"><span>or continue with email</span></div>
      )}

      <form className="macp-auth" onSubmit={submitEmail} noValidate>
        <div className="macp-field">
          <label className="macp-label" htmlFor="macp-email">Email address</label>
          <input
            id="macp-email" className="macp-input" name="email" type="email"
            inputMode="email" autoComplete="email" placeholder="you@email.com"
            value={email} onChange={(e) => setEmail(e.target.value)} required
          />
        </div>
        <div className="macp-field">
          <label className="macp-label" htmlFor="macp-pw">Password</label>
          <div className="macp-pw-wrap">
            <input
              id="macp-pw" className="macp-input" name="password"
              type={showPw ? "text" : "password"}
              autoComplete={isSignIn ? "current-password" : "new-password"}
              placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} required
            />
            <button
              type="button" className="macp-pw-toggle" onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 10 8 10 8a18 18 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M3 3l18 18M6.6 6.6A18 18 0 0 0 2 12s3 8 10 8a9 9 0 0 0 5.4-1.6"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
        </div>

        {error && <MacpAuthErr text={error} />}

        <button type="submit" className="macp-cta" disabled={!!busy}>
          {busy === "email"
            ? <><span className="macp-cta-spin" />{isSignIn ? "Signing in…" : "Creating account…"}</>
            : <>{isSignIn ? "Sign in" : "Create account"}<span aria-hidden="true">→</span></>}
        </button>
      </form>

      {/* Clerk attaches its real bot check here when sign-up needs it. Keep it compact so it never breaks the mobile card. */}
      <div id="clerk-captcha" data-cl-theme="dark" data-cl-size="compact" />
    </div>
  );
}

function AuthShell({
  initialMode = "sign-in",
  onClose,
}: {
  initialMode?: "sign-in" | "sign-up";
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">(initialMode);
  const isSignIn = mode === "sign-in";

  return (
    <div className="auth-screen grain">
      {/* LEFT — MACP brand + Clerk-controlled auth */}
      <div className="auth-left">
        <button className="auth-logo" onClick={onClose} aria-label="Back to MACP home">
          MACP<span>system</span>
        </button>

        {/* Form zone — vertically centered between the wordmark and the footer */}
        <div className="auth-center">
          <div className="auth-brand">
            {isSignIn ? (
              <h1 className="auth-headline">Sign in to your<br /><em>system.</em></h1>
            ) : (
              <h1 className="auth-headline">Build a system<br /><span>that <em>compounds.</em></span></h1>
            )}
            <p className="auth-sub">
              {isSignIn
                ? "Pick up your plan, streaks, and today's frog — exactly where you left off."
                : "Generate your first AI plan in 3 minutes. No fluff."}
            </p>
          </div>

          <div className="auth-controls">
            <SignedOut>
              <MacpAuthControls mode={mode} />
            </SignedOut>
            <SignedIn>
              {/* Guards the one frame between Clerk completing and the
                  post-auth transition taking over (no "already signed in" flash). */}
              <p className="auth-sub" style={{ marginTop: 4 }}>Opening your system…</p>
            </SignedIn>
          </div>
        </div>

        <div className="auth-foot">
          <div className="auth-legal">
            By continuing you agree to MACP's <u>Terms</u> and <u>Privacy Policy</u>.
          </div>
          <div className="auth-foot-rule" />
          <div className="auth-switch">
            {isSignIn ? (
              <>New to MACP?<button onClick={() => setMode("sign-up")}>Create your account</button></>
            ) : (
              <>Already have an account?<button onClick={() => setMode("sign-in")}>Sign in</button></>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT — product proof (static preview, desktop only) */}
      <div className="auth-right" aria-hidden="true">
        <div className="auth-pv-head">
          <div className="auth-pv-eyebrow">YOUR SYSTEM, ALREADY RUNNING</div>
          <h2 className="auth-pv-headline">
            Plans, streaks, and today's frog — <em>right where you left them.</em>
          </h2>
        </div>

        <div className="auth-pv-tilt">
        <div className="auth-pv">
          <div className="apv-bar">
            <div className="apv-logo">MACP<span> system</span></div>
            <div className="apv-nav">
              <span className="on">DASHBOARD</span><span>CALENDAR</span><span>WEEKLY REVIEW</span>
            </div>
          </div>
          <div className="apv-body">
<div className="apv-greetrow">
  <div>
    <div className="apv-greet">Good afternoon, <em>jarvis</em></div>
    <div className="apv-date">MONDAY, JUNE 1, 2026</div>
  </div>
  <div className="apv-tier"><span />TIER 1 · FOUNDATION</div>
</div>

            <div className="apv-plan">
              <div className="apv-plan-top">
                <div className="apv-kicker">CURRENT PLAN</div>
                <div className="apv-badge">INITIAL</div>
              </div>
              <div className="apv-plan-name">Plan v1</div>
              <div className="apv-plan-meta">Tier 1 · Foundation · Working professional</div>
            </div>

            <div className="apv-stats">
              <div className="apv-stat">
                <div className="apv-stat-lbl">Habits Today</div>
                <div className="apv-stat-val">3<small> /5</small></div>
                <div className="apv-stat-foot g">On track</div>
              </div>
              <div className="apv-stat">
                <div className="apv-stat-lbl">Streak</div>
                <div className="apv-stat-val">6<small> days</small></div>
                <div className="apv-stat-foot a">Keep going</div>
              </div>
              <div className="apv-stat">
                <div className="apv-stat-lbl">This Week</div>
                <div className="apv-stat-val">72<small> %</small></div>
                <div className="apv-stat-foot">+12% vs last</div>
              </div>
            </div>

            <div className="apv-frog">
              <div className="apv-frog-lbl">🐸 EAT THE FROG · HIGHEST LEVERAGE</div>
              <div className="apv-frog-name">Practice new skill for 5 minutes</div>
              <div className="apv-frog-row">
                <span className="apv-frog-cta">Mark Complete</span>
                <span className="apv-frog-ghost">Focus Mode · 25 min</span>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="auth-values">
          <div className="auth-value">
            <div className="auth-value-ic">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z"/></svg>
            </div>
            <div className="auth-value-txt">
              <div className="auth-value-t">AI-built plans</div>
              <div className="auth-value-d">Personalized to your real schedule and energy.</div>
            </div>
          </div>
          <div className="auth-value">
            <div className="auth-value-ic">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v4h-4"/><path d="M12 8v4l2.5 2"/></svg>
            </div>
            <div className="auth-value-txt">
              <div className="auth-value-t">Weekly reviews</div>
              <div className="auth-value-d">Recovers your streak when life happens.</div>
            </div>
          </div>
          <div className="auth-value">
            <div className="auth-value-ic">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5M4 19h16"/><path d="M8 16l3.5-4 3 2.5L20 7"/></svg>
            </div>
            <div className="auth-value-txt">
              <div className="auth-value-t">Progress insights</div>
              <div className="auth-value-d">Watch momentum compound, week over week.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   LANDING — see src/components/PublicLanding.tsx (Project 14B public landing).
   Rendered below as <PublicLanding/>; keeps the same { onStart, onDashboard, onAuth } props.
───────────────────────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────────────────────
   APP SHELL
───────────────────────────────────────────────────────────────────────────── */
export default function App() {
  const [screen, setScreen] = useState("landing");
  // Public trust pages (Project 14C) — own-header views, no app topbar, like the landing.
  const TRUST_SCREENS = ["privacy", "terms", "support", "ai-disclaimer"];
  const isTrustScreen = TRUST_SCREENS.includes(screen);
  const isPublicScreen = screen === "landing" || isTrustScreen;
const [profile, setProfile] = useState<any>(null);
const [plan, setPlan] = useState<any>(null);
const [booting, setBooting] = useState(true);
const [weeklyReviews, setWeeklyReviews] = useState<any[]>([]);
const [weeklyReviewsLoading, setWeeklyReviewsLoading] = useState(false);
const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
const [postAuthSetup, setPostAuthSetup] = useState(false);
const [appNotice, setAppNotice] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
const intendedFromAuthRef = useRef(false);

  const supabase = useSupabase();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { isPremium } = useEntitlement();

  // MACP-styled inline feedback (replaces native alert()).
  const showNotice = useCallback((text: string, kind: "error" | "ok" = "error") => {
    setAppNotice({ kind, text });
  }, []);
  useEffect(() => {
    if (!appNotice) return;
    const t = setTimeout(() => setAppNotice(null), 5000);
    return () => clearTimeout(t);
  }, [appNotice]);

  // Open the full MACP auth shell (replaces the default Clerk modal).
  const openAuth = useCallback((mode: "sign-in" | "sign-up") => {
    setAuthMode(mode);
    intendedFromAuthRef.current = true; // marks this as an in-session auth → post-auth transition
    setScreen("auth");
  }, []);

  useEffect(() => {
    async function checkSavedUser() {
      if (!isLoaded) return;

      // In-session auth (email) flags via the ref; OAuth survives the redirect
      // round-trip via sessionStorage. Either one means "show the hand-off".
      const oauthIntent =
        typeof window !== "undefined" ? window.sessionStorage.getItem("macp:auth-intent") : null;
      const fromAuth = intendedFromAuthRef.current || !!oauthIntent;
      if (fromAuth) {
        // Premium post-auth hand-off: "Opening your system…"
        setPostAuthSetup(true);
        setBooting(true);
      }
  
      if (!isSignedIn || !userId) {
        setBooting(false);
        return;
      }

      try {
        const savedProfile = await getMyProfile(supabase, userId);
  
        if (savedProfile?.onboarding_completed) {
          setProfile(savedProfile.onboarding_answers);
  
          const hasSavedPlan =
            savedProfile.current_plan &&
            Object.keys(savedProfile.current_plan).length > 0;
  
          if (hasSavedPlan) {
            setPlan(savedProfile.current_plan);
            setScreen("dashboard");
          } else {
            setScreen("generating");
          }
        } else if (fromAuth) {
          // New user who just authenticated via the shell → start the assessment.
          setScreen("wizard");
        }
      } catch (error) {
        console.error("Failed to load saved user:", error);
        if (fromAuth) setScreen("wizard"); // fail open to assessment (matches prior modal flow)
      } finally {
        intendedFromAuthRef.current = false;
        if (typeof window !== "undefined") window.sessionStorage.removeItem("macp:auth-intent");
        setPostAuthSetup(false);
        setBooting(false);
      }
    }

    checkSavedUser();
  }, [isLoaded, isSignedIn, userId, supabase]);

  useEffect(() => {
    if (!isSignedIn || !userId) return;
    let cancelled = false;

    setWeeklyReviewsLoading(true);
    getWeeklyReviews(supabase, userId)
      .then(rows => { if (!cancelled) setWeeklyReviews(rows || []); })
      .catch(err => console.error("Failed to load weekly reviews:", err))
      .finally(() => { if (!cancelled) setWeeklyReviewsLoading(false); });

    return () => { cancelled = true; };
  }, [isSignedIn, userId, supabase]);

  const handleReviewSaved = useCallback((savedRow: any) => {
    setWeeklyReviews(prev => [savedRow, ...prev.filter(r => r.id !== savedRow.id)]);
  }, []);

  const handleWizardComplete = async (p) => {
    setProfile(p);

    if (!userId) {
      showNotice("You must be signed in to save your assessment.");
      return;
    }

    try {
      await completeOnboarding(supabase, userId, p);
      setScreen("generating");
    } catch (error) {
      console.error("Failed to save onboarding:", error);
      showNotice("Your assessment could not be saved. Please try again.");
    }
  };
  const handlePlanGenerated = (generatedPlan) => {
    setPlan(generatedPlan);
  };
  const handlePlanReady = () => setScreen("dashboard");

  const handleReset = async () => {
    if (!userId) {
      showNotice("You must be signed in to start over.");
      return;
    }

    const ok = window.confirm(
      "Start over? This permanently deletes your current plan, plan history, daily progress, and weekly reviews. Your account stays signed in. This cannot be undone."
    );

    if (!ok) return;

    setBooting(true);

    try {
      await resetUserAppData(supabase, userId);

      setPlan(null);
      setProfile(null);
      setWeeklyReviews([]);
      setScreen("wizard");
    } catch (error) {
      console.error("Failed to start over:", error);
      showNotice("Start Over failed. Check the console/Supabase permissions.");
    } finally {
      setBooting(false);
    }
  };
  const handleGenerateNewPlan = () => {
    if (!profile) return;

    const ok = window.confirm(
      "Generate a new plan? Your saved calendar/progress history will stay. Only your current plan will be replaced after the new plan is generated."
    );

    if (!ok) return;

    setScreen("wizard");
  };
  const APP_SCREENS = ["dashboard", "calendar", "review", "settings"];
const showAppNav = profile && APP_SCREENS.includes(screen);

const NAV = showAppNav
  ? [
      { id: "dashboard", label: "Dashboard" },
      { id: "calendar", label: "Calendar" },
      { id: "review", label: "Weekly Review" },
      { id: "settings", label: "Profile & Export" },
    ]
  : [];
  // OAuth return path. Clerk redirects back here after Google/Apple; the invisible
  // <AuthenticateWithRedirectCallback/> completes the real handshake, then sends the
  // user to "/". Plain window.location check — no router, no embedded sign-in UI.
  if (typeof window !== "undefined" && window.location.pathname === "/sso-callback") {
    return (
      <>
        <style>{STYLES}</style>
        <div className="setup-wrap grain">
          <div className="setup-pill">M · A · C · P SYSTEM</div>
          <h1 className="setup-title">Opening your <em>system…</em></h1>
          <p className="setup-sub">Checking your setup and sending you to the right place.</p>
          <div className="setup-bar"><div className="setup-bar-fill" /></div>
        </div>
        <AuthenticateWithRedirectCallback
          signInForceRedirectUrl="/"
          signUpForceRedirectUrl="/"
        />
      </>
    );
  }
  if (booting) {
    return (
      <>
        <style>{STYLES}</style>
        <MacpLoader variant={postAuthSetup ? "setup" : "boot"} />
      </>
    );
  }
  if (screen === "auth") {
    return (
      <>
        <style>{STYLES}</style>
        <AuthShell
          initialMode={authMode}
          onClose={() => {
            intendedFromAuthRef.current = false;
            setScreen("landing");
          }}
        />
      </>
    );
  }
  return (
    <>
      <style>{STYLES}</style>
      <div className={`app-shell grain ${isPublicScreen ? "landing-shell" : ""}`}>
        {/* Top bar — hidden on public pages (landing + trust pages ship their own header) */}
        {!isPublicScreen && (
        <div className={`topbar ${["wizard", "generating"].includes(screen) ? "flow-topbar" : ""}`}>
  <div
    className="topbar-logo"
    onClick={() => {
      if (profile && ["dashboard", "calendar", "review", "settings"].includes(screen)) {
        setScreen("dashboard");
      }
    }}
  >
    MACP<span> system</span>
  </div>

  {NAV.length > 0 && (
    <div className="topbar-nav">
      {NAV.map((n) => (
        <button
          key={n.id}
          className={`topbar-btn ${screen === n.id ? "active" : ""}`}
          onClick={() => setScreen(n.id)}
        >
          {n.label}
        </button>
      ))}
    </div>
  )}

  {screen === "wizard" && (
    <button
      className="wizard-home-button"
      onClick={() => setScreen("landing")}
    >
      ← Home
    </button>
  )}

  {profile && !["wizard", "generating"].includes(screen) && (
    <div className="topbar-tag">{tierFor(profile.week || 1).label}</div>
  )}
</div>
        )}

        {/* Page */}
        <div className="page">
        {screen==="landing" && (
  <PublicLanding
    onStart={() => setScreen("wizard")}
    onDashboard={() => setScreen("dashboard")}
    onAuth={openAuth}
    onTrust={(p: TrustPageKey) => setScreen(p)}
  />
)}
        {isTrustScreen && (
  <TrustPage
    page={screen as TrustPageKey}
    onHome={() => setScreen("landing")}
    onTrust={(p) => setScreen(p)}
  />
)}
                    {screen === "wizard" && (
            <Wizard
              onComplete={handleWizardComplete}
              initialProfile={profile}
            />
          )}
          {screen==="generating" && (
  <Generating
    profile={profile}
    onReady={handlePlanReady}
    onBack={plan && typeof plan === "object" && Object.keys(plan).length > 0 ? () => setScreen("dashboard") : () => setScreen("landing")}
    supabase={supabase}
    onPlanGenerated={handlePlanGenerated}
    existingPlan={plan}
    userId={userId}
    isPremium={isPremium}
  />
)}
          {profile && ["dashboard", "calendar", "review", "settings"].includes(screen) && (
  <>
    <div style={{ display: screen === "dashboard" ? "block" : "none" }}>
      <Dashboard
        profile={profile}
        setProfile={setProfile}
        plan={plan}
        supabase={supabase}
        userId={userId}
      />
    </div>

    <div style={{ display: screen === "calendar" ? "block" : "none" }}>
      <CalendarPage
        supabase={supabase}
        userId={userId}
      />
    </div>

    <div style={{ display: screen === "review" ? "block" : "none" }}>
    <WeeklyReview
  profile={profile}
  plan={plan}
  supabase={supabase}
  userId={userId}
  screen={screen}
  onReviewSaved={handleReviewSaved}
  isPremium={isPremium}
/>
    </div>

    <div style={{ display: screen === "settings" ? "block" : "none" }}>
    <Settings
        profile={profile}
        setProfile={setProfile}
        onReset={handleReset}
        onGenerateNewPlan={handleGenerateNewPlan}
        userId={userId}
        plan={plan}
        weeklyReviews={weeklyReviews}
        weeklyReviewsLoading={weeklyReviewsLoading}
      />
    </div>
  </>
)}
        </div>
      </div>
      {appNotice && (
        <div
          className={`macp-toast ${appNotice.kind === "ok" ? "ok" : ""}`}
          role="alert"
          aria-live="assertive"
        >
          <span className="macp-toast-ic">{appNotice.kind === "ok" ? "✓" : "!"}</span>
          <div className="macp-toast-body">
            <span className="macp-toast-title">{appNotice.kind === "ok" ? "MACP" : "Heads up"}</span>
            <span className="macp-toast-msg">{appNotice.text}</span>
          </div>
          <button className="macp-toast-x" onClick={() => setAppNotice(null)} aria-label="Dismiss">×</button>
        </div>
      )}
    </>
  );
}