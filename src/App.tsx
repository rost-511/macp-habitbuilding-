import { useState, useEffect, useRef, useCallback } from "react";
import { SignedIn, SignedOut, useAuth, useSignIn, useSignUp, useClerk, AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { useSupabase } from "./lib/useSupabase";
import { useEntitlement } from "./lib/entitlements";
import { UpgradePlaceholder } from "./components/PremiumGate";
import PublicLanding from "./components/PublicLanding";
import TrustPage, { type TrustPageKey } from "./components/TrustPage";
import { buildPlanPrompt, PLAN_PROMPT_VERSION } from "./lib/prompts";
import { normalizePlanMode } from "./lib/planModes";
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
import { tierFor, fmtSecs, parseInsightSections } from "./lib/helpers";
import { MacpLoader } from "./components/app/MacpLoader";
import { Wizard } from "./components/app/Wizard";
import { CalendarPage } from "./components/app/CalendarPage";
import { Settings } from "./components/app/Settings";
import { WeeklyReview } from "./components/app/WeeklyReview";
import { Dashboard } from "./components/app/Dashboard";

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
   WEEKLY REVIEW
───────────────────────────────────────────────────────────────────────────── */
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
        saveTodayProgress={saveTodayProgress}
        getTodayProgress={getTodayProgress}
        getProgressMonth={getProgressMonth}
        streamClaude={streamClaude}
        FocusMode={FocusMode}
      />
    </div>

    <div style={{ display: screen === "calendar" ? "block" : "none" }}>
      <CalendarPage
        supabase={supabase}
        userId={userId}
        getProgressMonth={getProgressMonth}
        getProgressByDate={getProgressByDate}
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
  getProgressMonth={getProgressMonth}
  saveWeeklyReview={saveWeeklyReview}
  streamClaude={streamClaude}
  StarRating={StarRating}
  renderInsightSections={renderInsightSections}
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
        supabase={supabase}
        getPlanHistory={getPlanHistory}
        renderInsightSections={renderInsightSections}
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