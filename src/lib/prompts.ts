// Prompt builders + version constants for MACP AI generation.
// Version constants are defined here so the template and its version can never
// drift apart. prompt_version wiring (request body / usage logs / history) is
// intentionally NOT done here yet — see Project 6 Task 3B.

import { buildModeBlock, type PlanMode } from "./planModes";

export const PLAN_PROMPT_VERSION = "plan-v3.1";
export const REVIEW_PROMPT_VERSION = "review-v2";

export function buildPlanPrompt(
  profile: any,
  memoryContext: string | null = null,
  tierLabel: string = "",
  planMode: PlanMode | string = "general"
) {
  const [wH, wM] = (profile.wakeTime || "06:00").split(":").map(Number);
  const t = (dh: number, dm = 0) => {
    const total = wH * 60 + wM + dh * 60 + dm;
    return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  };

  const memoryBlock = memoryContext
    ? `\nPREVIOUS COACHING MEMORY (this is a plan regeneration — use this data to directly improve on the last plan, address the growth edge, and build on the keystone habit):\n${memoryContext}\n`
    : "";

  const existingHabits =
    (profile.customHabits || [])
      .map((h: any) => h?.name)
      .filter(Boolean)
      .join(", ") || "None";

  const modeBlock = buildModeBlock(planMode);

  // Onboarding v2 fields (Project 15). All fall back gracefully so plans for
  // old saved users (pre-v2 onboarding_answers) still generate correctly.
  const peakLabels: Record<string, string> = {
    early_morning: "Early morning (5–8)",
    morning: "Morning (8–12)",
    afternoon: "Afternoon (12–17)",
    evening: "Evening (17–21)",
    night: "Night (21–1)",
  };
  const peakFocus = peakLabels[profile.peakFocusTime] || "Not specified";
  const intensity = profile.intensity || "balanced";
  const scheduleText =
    typeof profile.scheduleText === "string" &&
    profile.scheduleText.trim() &&
    !/^none$/i.test(profile.scheduleText.trim())
      ? profile.scheduleText.trim()
      : "No fixed commitments reported";

  return `You are MACP — an elite habit-architecture AI. Design a behavior-science-backed daily system for this user and return ONLY a valid JSON object. No markdown, no code fences, no extra text — just the raw JSON.
${memoryBlock}
USER PROFILE:
- Name: ${profile.name || "User"}
- Situation: ${profile.situation || "Not specified"}
- Wake time: ${profile.wakeTime}
- Sleep time: ${profile.sleepTime || "Not specified"}
- College/study hours per day: ${profile.collegeHours || 0}h
- Work hours per day: ${profile.workHours || 0}h
- Free/discretionary hours per day: ${profile.freeHours || "Not specified"}
- Fixed schedule (plan AROUND these blocks — never schedule over them): ${scheduleText}
- Peak focus window: ${peakFocus}
- Business goal: ${profile.businessGoal || "None"}
- Average energy level: ${profile.energyLevel}/10
- Workout: ${profile.workout}
- Goals: ${(profile.goals || []).join(", ")}
- Habit categories: ${(profile.categories || []).join(", ")}
- Constraints (HARD limits — never violate): ${profile.constraints || "None"}
- Main goal: ${profile.mainGoal || "Not specified"}
- First-week win they chose: ${profile.firstWin || "Not specified"}
- Desired intensity: ${intensity}
- Biggest current struggle: ${profile.struggle || "Not specified"}
- Typical failure pattern: ${profile.failurePattern || "Not specified"}
- What motivates them: ${profile.motivationStyle || "Not specified"}
- Program week: ${profile.week || 1} (${tierLabel || "Tier 1 · Foundation"})
- Existing habits to respect/build on: ${existingHabits}

DESIGN PRINCIPLES (apply all):
- Right-size to time: the 5 habits + frog must realistically fit the user's free/discretionary hours above. When free time is scarce, choose 2-minute keystone habits over ambitious ones.
- Scale by DIFFICULTY, never by count — always return exactly 5 habits, matched to the user's tier:
  Tier 1 (Foundation): friction-free, 2-minute-rule habits that are nearly impossible to fail.
  Tier 2 (Momentum): add depth and duration to the foundation.
  Tier 3 (Optimized): demanding keystone and high-leverage habits.
- Intensity calibration: "gentle" = shrink every habit to its smallest confidence-building version; "balanced" = steady challenge; "aggressive" = push toward the demanding end of the user's tier — but never exceed the tier ceiling or the free-hours budget.
- Behavior design: every habit is specific, measurable, and cue-anchored via habit stacking ("after [existing routine], I will [habit]"). Give the smallest viable version.
- Honor the user's constraints as hard limits — never prescribe a habit or time block that violates them.
- Schedule around their real life: the dailyFlow must respect the fixed schedule blocks above, place the frog inside their peak focus window when possible, and wind down at least 60 minutes before their sleep time.
- Counter their failure pattern: design the habit cues and the lowEnergyFallback specifically to defeat the failure pattern they named (e.g. all-or-nothing → explicit minimum versions; fades by week 2 → week-2 escalation warning in aiPlanText; forgets → strong environmental cues).
- Speak their motivation language: frame the identityStatement and aiPlanText in terms of what motivates them (streaks/data, identity, accountability, quick wins, or challenge).
- Deliver their first-week win: the frog task or habit h1 must directly produce the first-week win they chose, within 7 days.
- COHERENCE — one objective, zero competing targets: everything in the output serves the user's main goal through ONE keystone behavior. The frog task is today's lever on that goal; habits h1–h5 are the system that makes it inevitable; the dailyFlow is where those habits physically live (every habit appears in or anchors to a flow block); weeklyReviewFocus measures exactly that keystone behavior — not a different metric. Never introduce a side-quest target that competes with the main goal for the same hours.
${modeBlock}
Return this exact JSON shape (all fields required):
{
  "aiPlanText": "<2–3 short paragraphs: name the identity, the keystone habits, the energy/schedule logic, and the ONE thing to nail this week. Plain string, paragraphs separated by blank lines>",
  "dashboard": {
    "identityStatement": "<a concrete 'I am the type of person who...' identity claim derived directly from their main goal, in their language>",
    "frogTask": {
      "title": "<their single most important daily task, specific to their goals, max 12 words>",
      "description": "<one sentence: why this task, what outcome it drives>",
      "category": "<one of: work | business | health | morning | evening>"
    },
    "habits": [
      { "id": "h1", "name": "<specific, measurable, cue-anchored habit>", "tag": "<morning|work|health|business|evening>", "why": "<max 8 words: how this habit serves their main goal>" },
      { "id": "h2", "name": "<specific, measurable, cue-anchored habit>", "tag": "<morning|work|health|business|evening>", "why": "<max 8 words: how this habit serves their main goal>" },
      { "id": "h3", "name": "<specific, measurable, cue-anchored habit>", "tag": "<morning|work|health|business|evening>", "why": "<max 8 words: how this habit serves their main goal>" },
      { "id": "h4", "name": "<specific, measurable, cue-anchored habit>", "tag": "<morning|work|health|business|evening>", "why": "<max 8 words: how this habit serves their main goal>" },
      { "id": "h5", "name": "<specific, measurable, cue-anchored habit>", "tag": "<morning|work|health|business|evening>", "why": "<max 8 words: how this habit serves their main goal>" }
    ],
    "dailyFlow": [
      { "time": "${t(0)}", "title": "Wake + Hydrate", "description": "16 oz water before anything else" },
      { "time": "${t(0, 15)}", "title": "<morning routine item>", "description": "<brief note>" },
      { "time": "${t(1, 15)}", "title": "🐸 Eat the Frog", "description": "<their specific frog task>" },
      { "time": "${profile.collegeHours ? `${t(2, 45)}` : `${t(2, 30)}`}", "title": "<work or study block>", "description": "<focus method or goal>" },
      { "time": "${t(4, 30)}", "title": "Lunch + Recovery", "description": "Eat, short walk, no screens" },
      { "time": "${t(6, 0)}", "title": "<afternoon block>", "description": "<task or goal>" },
      { "time": "${t(9, 0)}", "title": "Evening Review", "description": "Rate the day, write tomorrow's frog" },
      { "time": "${t(9, 30)}", "title": "Wind-down", "description": "Screen off, read, prepare for sleep" }
    ],
    "weeklyReviewFocus": "<the single most important metric or behaviour they should track weekly to progress toward ${tierLabel || "the next tier"} — be specific>",
    "lowEnergyFallback": [
      "<2-minute minimum version of their #1 keystone habit>",
      "<the one non-negotiable habit that protects the streak today>",
      "<restart rule: if a day is missed, resume today — never try to catch up or double up>"
    ]
  }
}

Rules:
- habits tag must be exactly one of: morning, work, health, business, evening
- dailyFlow time must be HH:MM 24-hour format, kept in ascending order
- the dailyFlow times above are defaults — shift them as needed so no block overlaps the user's fixed schedule, the frog lands in their peak focus window, and wind-down starts at least 60 minutes before their sleep time
- habits array must have exactly 5 items with unique ids h1–h5
- every habit's "why" must trace back to the main goal in the user's own language (max 8 words)
- scale habits by difficulty to the user's tier — never return more or fewer than 5
- every habit must be specific, measurable, and cue-anchored; no generic advice
- never prescribe anything that violates the user's stated constraints
- lowEnergyFallback must be exactly 3 short strings (the recovery protocol)
- aiPlanText must be a plain string (no JSON inside it)`;
}

export interface ReviewSignals {
  savedDays?: number;
  dayPattern?: string;
  mostMissedHabits?: string;
  frogCompletionRate?: string;
  planMode?: string;
}

export function buildReviewPrompt(
  profile: any,
  scores: any,
  notes: string,
  completionPct: number,
  plan: any = null,
  tierLabel: string = "",
  signals: ReviewSignals = {}
) {
  const reviewPlan = (plan || {}) as any;
  const reviewDashboard = reviewPlan.dashboard || {};
  const reviewPlanVersion = reviewPlan.plan_version || reviewPlan.planVersion || 1;
  const reviewPlanReason = reviewPlan.plan_reason || (reviewPlanVersion > 1 ? "regenerated" : "initial plan");
  const reviewWeeklyFocus = reviewDashboard.weeklyReviewFocus || "No weekly focus saved";

  const savedDaysLine =
    typeof signals.savedDays === "number" ? `${signals.savedDays} of 7` : "unknown";
  const dayPatternLine = signals.dayPattern || "not available";
  const missedLine = signals.mostMissedHabits || "none detected";
  const frogLine = signals.frogCompletionRate || "not tracked";
  const planMode = signals.planMode || "general";

  return `You are MACP weekly coach. Generate a sharp, personalized weekly review grounded in the data below.

USER: ${profile.name || "User"} | ${tierLabel} | Week ${profile.week || 1}
Plan mode: ${planMode}
Active plan: Plan v${reviewPlanVersion} (${reviewPlanReason})
Plan weekly focus: ${reviewWeeklyFocus}

WEEK SIGNALS:
- Habit completion (week average): ${completionPct}%
- Days logged: ${savedDaysLine}
- Daily pattern: ${dayPatternLine}
- Most-missed habits: ${missedLine}
- Frog/keystone completion: ${frogLine}
- Self-scores — Consistency: ${scores.consistency}/5, Energy mgmt: ${scores.energy}/5, Deep focus: ${scores.focus}/5
- User notes: "${notes || "None provided"}"
- Goals: ${(profile.goals || []).join(", ")}

REVIEW PRINCIPLES:
- Read completion % together with days logged — unlogged days are missing data, NOT proof of failure. Never shame a partial week.
- When a most-missed habit is named, call it out by name and build the advice around it.
- Mention frog/keystone completion when it is available.
- Cross-check the self-scores against actual completion; flag the gap honestly if one exists.
- Make the advice specific to the user's plan mode (${planMode}).
- Be concrete and direct. No motivational fluff, no therapy-speak. Use second person.

Write using EXACT section headers (keep them UPPERCASE, each on its own line):

WEEK GRADE
A letter grade (A/B/C/D) and one honest, data-grounded sentence.

WINS THIS WEEK
1–2 specific wins tied to habits they actually completed.

GROWTH EDGE
The single biggest bottleneck — name the most-missed habit or pattern. Direct, not harsh.

TIER STATUS
Stay in ${tierLabel}, advance a tier, or step back? One sentence, justified by completion and days logged.

NEXT WEEK'S KEYSTONE
ONE cue-anchored adjustment for next week ("after [existing routine], I will [habit]"). Say why that one.

RECOVERY PROTOCOL
If days were missed: a 2-minute minimum restart and a never-miss-twice rule. No guilt — only action.

Keep the whole review around 200–260 words.`;
}


export const REPLAN_PROMPT_VERSION = "replan-v1";

export interface ReplanHabitStat {
  id: string;
  name: string;
  priority: number;
  time: string | null;
  window: string | null;
  days: number[];
  completionRate14d: number; // 0..1, only counting days the habit was scheduled
}

export function buildReplanPrompt(
  profile: any,
  schedule: { wake?: string; sleep?: string; blocks?: { label: string; days: number[]; start: string; end: string }[] } | null,
  habits: ReplanHabitStat[]
): string {
  const blocks =
    schedule?.blocks?.length
      ? schedule.blocks
          .map((b) => `${b.label}: days ${b.days.join(",")} ${b.start}-${b.end}`)
          .join("; ")
      : "none specified";

  const habitLines = habits
    .map(
      (h) =>
        `- id=${h.id} | "${h.name}" | P${h.priority} | ${h.time ?? h.window ?? "anytime"} | days ${h.days.join(",")} | 14-day completion ${(h.completionRate14d * 100).toFixed(0)}%`
    )
    .join("\n");

  return `You are MACP's execution coach. The user pressed "Replan": review their habit system and propose targeted changes. You may only ADD, UPDATE, or REMOVE habits — never rewrite everything. Keep what works (high completion), fix what doesn't (low completion: shrink it, retime it, or remove it). Stay within the user's schedule and constraints.

USER CONTEXT:
- Main goal: ${profile?.mainGoal || "Not specified"}
- Constraints (HARD limits): ${profile?.constraints || "None"}
- Typical failure pattern: ${profile?.failurePattern || "Not specified"}
- Wake: ${schedule?.wake || profile?.wakeTime || "?"} | Sleep: ${schedule?.sleep || profile?.sleepTime || "?"}
- Busy blocks (never schedule inside these): ${blocks}

CURRENT HABITS (with 14-day completion rates on scheduled days):
${habitLines || "- none yet — propose a starter set of 3-5 habits"}

Return ONLY this JSON (no markdown fences):
{
  "summary": "<2-3 sentences: what you changed and why, in plain language>",
  "changes": [
    { "type": "add", "habit": { "name": "<specific habit>", "emoji": "<one emoji or null>", "priority": 1, "time": "HH:MM or null", "window": "morning|afternoon|evening|anytime or null", "days": [0,1,2,3,4,5,6], "subtasks": ["<optional subtask names>"] }, "reason": "<max 15 words>" },
    { "type": "update", "id": "<existing habit id>", "habit": { "name": "...", "priority": 2, "time": null, "window": "evening", "days": [1,2,3,4,5] }, "reason": "<max 15 words>" },
    { "type": "remove", "id": "<existing habit id>", "reason": "<max 15 words>" }
  ]
}

Rules:
- 0 to 6 changes total. Days use 0=Sunday..6=Saturday. priority is 1 (must-do), 2, or 3. If the current system already works, return an empty changes array and say so in the summary.
- "time" must be HH:MM 24h or null; when time is set, window must be null.
- Never place a timed habit inside a busy block. Respect wake/sleep.
- For "update", include ONLY the habit fields you are changing plus name.
- Prefer shrinking a failing habit over removing it; remove only when it clearly conflicts with the goal or schedule.`;
}
