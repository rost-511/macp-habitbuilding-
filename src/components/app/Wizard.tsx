// Wizard — onboarding/assessment flow (Project 15 rewrite).
// 7 steps. All Project-14 fields are preserved (old saved users load cleanly via
// initialProfile); new assessment fields are additive and live inside
// onboarding_answers — no DB schema change.
import { useState } from "react";
import { PLAN_MODES, normalizePlanMode } from "../../lib/planModes";
import {
  FAILURE_PATTERNS,
  GOALS,
  HABITS_CATS,
  INTENSITIES,
  MOTIVATION_STYLES,
  PEAK_WINDOWS,
  SITUATIONS,
  STEPS,
  STRUGGLES,
  WORKOUTS,
} from "../../lib/constants";

export function Wizard({ onComplete, initialProfile = null }) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  const [P, setP] = useState(() => {
    const base = {
      // Project 14 fields — unchanged keys, old profiles stay compatible.
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
      // Project 15 fields — additive.
      sleepTime: "23:00",
      scheduleText: "",
      peakFocusTime: "morning",
      intensity: "balanced",
      struggle: "",
      failurePattern: "",
      motivationStyle: "",
      firstWin: "",
    };

    const initial: any = initialProfile || {};

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
      sleepTime: typeof initial.sleepTime === "string" && initial.sleepTime ? initial.sleepTime : base.sleepTime,
      peakFocusTime: PEAK_WINDOWS.some((w) => w.v === initial.peakFocusTime)
        ? initial.peakFocusTime
        : base.peakFocusTime,
      intensity: INTENSITIES.some((i) => i.v === initial.intensity)
        ? initial.intensity
        : base.intensity,
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
      if (isBlank(P.sleepTime)) missing.push("Sleep time");
      if (isBlank(P.workout)) missing.push("Workout preference");
      if (!validHours(P.collegeHours)) missing.push("Study hours / day");
      if (!validHours(P.workHours)) missing.push("Work hours / day");
      if (!isMeaningfulText(P.scheduleText, 3))
        missing.push("Fixed schedule (describe your commitments, or write \"none\")");
      return missing;
    }

    if (stepIndex === 3) {
      const missing = [];
      if (!P.goals.length) missing.push("Top goals (select at least one)");
      if (!isMeaningfulText(P.mainGoal, 10))
        missing.push("Main 90-day goal (at least 10 characters — describe what you want to achieve)");
      if (!isMeaningfulText(P.firstWin, 5))
        missing.push("First small win (at least 5 characters — what would feel like progress in week 1?)");
      if (!isBlank(P.businessGoal) && !isMeaningfulText(P.businessGoal, 3))
        missing.push("Business goal (at least 3 characters, not just a number)");
      return missing;
    }

    if (stepIndex === 4) {
      const missing = [];
      if (!P.energyLevel) missing.push("Average daily energy");
      if (isBlank(P.freeHours)) missing.push("Free hours per day");
      if (isBlank(P.peakFocusTime)) missing.push("Peak focus window");
      if (isBlank(P.intensity)) missing.push("Plan intensity");
      return missing;
    }

    if (stepIndex === 5) {
      const missing = [];
      if (isBlank(P.struggle)) missing.push("Biggest struggle (pick one)");
      if (isBlank(P.failurePattern)) missing.push("Failure pattern (pick one)");
      if (isBlank(P.motivationStyle)) missing.push("What keeps you going (pick one)");
      if (!isMeaningfulText(P.constraints, 3))
        missing.push("Constraints or challenges (at least 3 characters)");
      return missing;
    }

    if (stepIndex === 6) {
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
      scheduleText: P.scheduleText.trim(),
      firstWin: P.firstWin.trim(),
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
            <div className="wiz-modes">
              {PLAN_MODES.map((m) => {
                const on = P.plan_mode === m.id;
                return (
                  <div
                    key={m.id}
                    className={`wiz-mode ${on ? "on" : ""}`}
                    onClick={() => up("plan_mode", m.id)}
                  >
                    <div className="wiz-mode-ic">{m.icon}</div>
                    <div className="wiz-mode-l">{m.label}</div>
                    <div className="wiz-mode-d">{m.description}</div>
                  </div>
                );
              })}
            </div>
            <span className="field-hint">You can regenerate your plan in a different mode at any time.</span>
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
              <label>Sleep time</label>
              <input type="time" value={P.sleepTime} onChange={e=>up("sleepTime",e.target.value)}/>
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
            <label>Workout preference</label>
            <select value={P.workout} onChange={e=>up("workout",e.target.value)}>
              {WORKOUTS.map(w=><option key={w.v} value={w.v}>{w.l}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Your fixed schedule</label>
            <textarea value={P.scheduleText} onChange={e=>up("scheduleText",e.target.value)}
              placeholder={"e.g. Classes Mon–Fri 9:00–13:00, work shift 15:00–19:00, gym Tue/Thu evening..."}/>
            <span className="field-hint">The blocks MACP must plan around — classes, shifts, commute, family time. Write "none" if your day is open.</span>
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
          <div className="field">
            <label>Your first small win</label>
            <input value={P.firstWin} onChange={e=>up("firstWin",e.target.value)}
              placeholder="e.g. Study 30 focused minutes every day this week"/>
            <span className="field-hint">One small thing that would feel like real progress in week 1. Your plan is built to deliver it.</span>
          </div>
          <div className="field">
            <label>Business goal (optional)</label>
            <input value={P.businessGoal} onChange={e=>up("businessGoal",e.target.value)} placeholder="e.g. Launch Shopify store by August"/>
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
            <label>When is your brain at its best?</label>
            <div className="chips">
              {PEAK_WINDOWS.map(w=>(
                <div key={w.v} className={`chip ${P.peakFocusTime===w.v?"on":""}`} onClick={()=>up("peakFocusTime",w.v)}>{w.l}</div>
              ))}
            </div>
            <span className="field-hint">Your most important task gets scheduled here.</span>
          </div>
          <div className="field">
            <label>Free hours per day (realistic)</label>
            <select value={P.freeHours} onChange={e=>up("freeHours",e.target.value)}>
              {["< 1","1","2","3","4","5+"].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="field">
            <label>How hard should MACP push you?</label>
            <div className="wiz-modes">
              {INTENSITIES.map((i)=>{
                const on = P.intensity === i.v;
                return (
                  <div key={i.v} className={`wiz-mode ${on?"on":""}`} onClick={()=>up("intensity",i.v)}>
                    <div className="wiz-mode-l">{i.l}</div>
                    <div className="wiz-mode-d">{i.d}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {step===5 && (
        <div className="fgrp">
          <div className="field">
            <label>Your biggest struggle right now (pick one)</label>
            <div className="chips">
              {STRUGGLES.map(s=>(
                <div key={s} className={`chip ${P.struggle===s?"on":""}`} onClick={()=>up("struggle",s)}>{s}</div>
              ))}
            </div>
          </div>
          <div className="field">
            <label>When habits failed before, what happened? (pick one)</label>
            <div className="chips">
              {FAILURE_PATTERNS.map(f=>(
                <div key={f} className={`chip ${P.failurePattern===f?"on":""}`} onClick={()=>up("failurePattern",f)}>{f}</div>
              ))}
            </div>
            <span className="field-hint">No judgment — your recovery protocol is designed around this answer.</span>
          </div>
          <div className="field">
            <label>What actually keeps you going? (pick one)</label>
            <div className="chips">
              {MOTIVATION_STYLES.map(m=>(
                <div key={m} className={`chip ${P.motivationStyle===m?"on":""}`} onClick={()=>up("motivationStyle",m)}>{m}</div>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Constraints or challenges</label>
            <textarea value={P.constraints} onChange={e=>up("constraints",e.target.value)}
              placeholder="e.g. Exam in 3 weeks, irregular shifts, anxiety in mornings, chronic fatigue..."/>
          </div>
        </div>
      )}

      {step===6 && (
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
