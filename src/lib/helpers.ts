// Pure helper functions extracted from App.tsx (Project 14D — Task 3).
// No JSX, hooks, state, Clerk, Supabase, API, or AI calls — behavior unchanged.
// parseInsightSections uses REVIEW_SECTION_HEADERS (extracted in Task 2).

import { REVIEW_SECTION_HEADERS } from "./constants";

export function tierFor(week) {
  if (week === 0) return { label:"Assessment", color:"#6b6870", level:0 };
  if (week <= 2)  return { label:"Tier 1 · Foundation", color:"#c9961a", level:1 };
  if (week <= 5)  return { label:"Tier 2 · Momentum", color:"#3a7cbf", level:2 };
                  return { label:"Tier 3 · Optimized", color:"#2d9e5f", level:3 };
}

// Peak focus window metadata for onboarding v2 peakFocusTime values.
// Returns null for unknown/missing values (old saved users).
export function peakWindowMeta(v: unknown): { label: string; short: string; startMin: number; endMin: number } | null {
  const map: Record<string, { label: string; short: string; startMin: number; endMin: number }> = {
    early_morning: { label: "Early morning (5–8)", short: "5:00–8:00",  startMin: 5 * 60,  endMin: 8 * 60 },
    morning:       { label: "Morning (8–12)",      short: "8:00–12:00", startMin: 8 * 60,  endMin: 12 * 60 },
    afternoon:     { label: "Afternoon (12–17)",   short: "12:00–17:00",startMin: 12 * 60, endMin: 17 * 60 },
    evening:       { label: "Evening (17–21)",     short: "17:00–21:00",startMin: 17 * 60, endMin: 21 * 60 },
    night:         { label: "Night (21–1)",        short: "21:00–1:00", startMin: 21 * 60, endMin: 25 * 60 },
  };
  return typeof v === "string" && map[v] ? map[v] : null;
}

export function pickSmartNudge(s: {
  doneCount: number;
  totalHabits: number;
  todayPct: number;
  frogDone: boolean;
  streak: number;
  energy: string | null;
  nowMin: number;
  insights: string[];
  motivationStyle?: string;
  failurePattern?: string;
}): { icon: string; text: string } | null {
  if (s.energy === "low") return null;
  if (s.totalHabits > 0 && s.doneCount === s.totalHabits && s.frogDone) return null;

  const challenger = (s.motivationStyle || "").includes("Competition");
  const identityDriven = (s.motivationStyle || "").includes("better version");
  const missOneMissWeek = (s.failurePattern || "").includes("missed day");

  if (s.doneCount === 0 && !s.frogDone)
    return {
      icon: "→",
      text: challenger
        ? "First move wins the day — beat yesterday's start time with one habit."
        : "Start small — finish one habit to get momentum going.",
    };

  if (!s.frogDone && s.nowMin < 14 * 60)
    return { icon: "🐸", text: "Eat the frog first. Your keystone task protects the whole day." };

  if (!s.frogDone && s.nowMin >= 14 * 60)
    return { icon: "🐸", text: "Your keystone task is still open — a good one to close before the day ends." };

  if (s.todayPct > 0 && s.todayPct < 50)
    return {
      icon: "↑",
      text: identityDriven
        ? "Each small habit is a vote for the person you're becoming — cast the next one."
        : "Pick the easiest habit next and recover the day.",
    };

  if (s.streak >= 1 && s.todayPct < 100)
    return {
      icon: "🔥",
      text: missOneMissWeek
        ? `${s.streak}-day streak. You know your pattern — never miss twice. One quick win locks today in.`
        : `You're on a ${s.streak}-day streak — one quick win keeps it alive.`,
    };

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

export function makeHabits(profile, tierLevel) {
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

export function makeTimeline(profile) {
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

export function nowMinutes() {
  const n = new Date();
  return n.getHours()*60 + n.getMinutes();
}

export function timeToMin(str) {
  const [h,m] = str.split(":").map(Number);
  return h*60+m;
}

export function todayLabel() {
  return new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
}

export function fmtSecs(s) {
  const m = Math.floor(s/60), sec = s%60;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

export function parseInsightSections(raw: string): { header: string; body: string }[] {
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
