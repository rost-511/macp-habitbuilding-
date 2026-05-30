// Prompt builders + version constants for MACP AI generation.
// Version constants are defined here so the template and its version can never
// drift apart. prompt_version wiring (request body / usage logs / history) is
// intentionally NOT done here yet — see Project 6 Task 3B.

export const PLAN_PROMPT_VERSION = "plan-v1";
export const REVIEW_PROMPT_VERSION = "review-v1";

export function buildPlanPrompt(profile: any, memoryContext: string | null = null) {
  const [wH, wM] = (profile.wakeTime || "06:00").split(":").map(Number);
  const t = (dh: number, dm = 0) => {
    const total = wH * 60 + wM + dh * 60 + dm;
    return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  };

  const memoryBlock = memoryContext
    ? `\nPREVIOUS COACHING MEMORY (this is a plan regeneration — use this data to directly improve on the last plan, address the growth edge, and build on the keystone habit):\n${memoryContext}\n`
    : "";

  return `You are MACP — an elite habit-architecture AI. Analyze this user's profile and return ONLY a valid JSON object. No markdown, no code fences, no extra text — just the raw JSON.
${memoryBlock}
USER PROFILE:
- Name: ${profile.name || "User"}
- Situation: ${profile.situation || "Not specified"}
- Wake time: ${profile.wakeTime}
- College/study hours per day: ${profile.collegeHours || 0}h
- Work hours per day: ${profile.workHours || 0}h
- Business goal: ${profile.businessGoal || "None"}
- Average energy level: ${profile.energyLevel}/10
- Workout: ${profile.workout}
- Goals: ${(profile.goals || []).join(", ")}
- Habit categories: ${(profile.categories || []).join(", ")}
- Constraints: ${profile.constraints || "None"}
- Main goal: ${profile.mainGoal || "Not specified"}

Return this exact JSON shape (all fields required):
{
  "aiPlanText": "<2–3 paragraph human-readable summary of the full plan — tier, identity, key habits, energy strategy>",
  "dashboard": {
    "identityStatement": "<one 'I am the type of person who...' sentence tailored to their goals>",
    "frogTask": {
      "title": "<their single most important daily task, specific to their goals, max 12 words>",
      "description": "<one sentence: why this task, what outcome it drives>",
      "category": "<one of: work | business | health | morning | evening>"
    },
    "habits": [
      { "id": "h1", "name": "<specific actionable habit>", "tag": "<morning|work|health|business|evening>" },
      { "id": "h2", "name": "<specific actionable habit>", "tag": "<morning|work|health|business|evening>" },
      { "id": "h3", "name": "<specific actionable habit>", "tag": "<morning|work|health|business|evening>" },
      { "id": "h4", "name": "<specific actionable habit>", "tag": "<morning|work|health|business|evening>" },
      { "id": "h5", "name": "<specific actionable habit>", "tag": "<morning|work|health|business|evening>" }
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
    "weeklyReviewFocus": "<the single most important metric or behaviour they should track weekly — be specific>",
    "lowEnergyFallback": [
      "<minimum habit 1 for bad days>",
      "<minimum habit 2 for bad days>",
      "<minimum habit 3 for bad days>"
    ]
  }
}

Rules:
- habits tag must be exactly one of: morning, work, health, business, evening
- dailyFlow time must be HH:MM 24-hour format
- habits array must have exactly 5 items with unique ids h1–h5
- Be specific to this user's actual goals — no generic advice
- aiPlanText must be a plain string (no JSON inside it)`;
}

export function buildReviewPrompt(
  profile: any,
  scores: any,
  notes: string,
  completionPct: number,
  plan: any = null,
  tierLabel: string = ""
) {
  const reviewPlan = (plan || {}) as any;
  const reviewDashboard = reviewPlan.dashboard || {};
  const reviewPlanVersion = reviewPlan.plan_version || reviewPlan.planVersion || 1;
  const reviewPlanReason = reviewPlan.plan_reason || (reviewPlanVersion > 1 ? "regenerated" : "initial plan");
  const reviewWeeklyFocus = reviewDashboard.weeklyReviewFocus || "No weekly focus saved";

  return `You are MACP weekly coach. Generate a personalized weekly review.

USER: ${profile.name || "User"} | ${tierLabel} | Week ${profile.week || 1}
Active plan: Plan v${reviewPlanVersion} (${reviewPlanReason})
Plan weekly focus: ${reviewWeeklyFocus}
Habit completion this week: ${completionPct}%
Scores — Consistency: ${scores.consistency}/5, Energy mgmt: ${scores.energy}/5, Deep focus: ${scores.focus}/5
User notes: "${notes || "None provided"}"
Goals: ${(profile.goals || []).join(", ")}

Write using EXACT section headers:

WEEK GRADE
Give a letter grade (A/B/C/D) and a single honest sentence why.

WINS THIS WEEK
2 specific things they likely did right. Connect to their actual goals.

GROWTH EDGE
The one bottleneck holding them back. Be direct, not harsh.

TIER STATUS
Should they: Stay in ${tierLabel}, advance a tier, or step back? Explain in one sentence.

NEXT WEEK'S KEYSTONE
The single most important habit to cement next week. Why that one?

RECOVERY PROTOCOL
If they missed days: a specific 3-step rebound plan. No guilt — only action.

Max 220 words. Be honest, warm, energizing — like a great coach, not a therapist.`;
}
