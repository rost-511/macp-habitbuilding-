// Wizard — onboarding/assessment flow (Project 14D — Task 5).
// Moved verbatim from App.tsx; validation, copy, class names, and flow unchanged.
import { useState } from "react";
import { PLAN_MODES, normalizePlanMode } from "../../lib/planModes";
import { GOALS, HABITS_CATS, SITUATIONS, STEPS, WORKOUTS } from "../../lib/constants";

export function Wizard({ onComplete, initialProfile = null }) {
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
