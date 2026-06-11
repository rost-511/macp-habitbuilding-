// Pure static constants extracted from App.tsx (Project 14D — Task 2).
// Values are byte-identical to the originals; no behavior or UI change.

export const GOALS   = ["Finish degree","Launch a product","Get fit & healthy","Build a business","Read 12 books/year","Learn a new skill","Improve sleep quality","Reduce stress","Save money","Career promotion"];
export const HABITS_CATS = ["Morning Routine","Deep Work","Exercise","Business","Study","Evening Wind-down","Nutrition","Mindfulness","Reading","Networking"];
export const WORKOUTS = [{v:"none",l:"No workout yet"},{v:"walk",l:"Daily walk"},{v:"home",l:"Home workout"},{v:"gym",l:"Gym session"}];
export const SITUATIONS = ["College student","Working professional","Entrepreneur","Freelancer","Student + job","Business owner"];
export const ENERGY_LEVELS = [{v:"peak",l:"🔥 Peak",c:"#d4922a"},{v:"good",l:"✅ Good",c:"#2d9e5f"},{v:"low",l:"😴 Low",c:"#6b6870"},{v:"exam",l:"📚 Exam mode",c:"#3a7cbf"}];

export const DAY_ABBRS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// Onboarding v2 — assessment options (Project 15).
// Single-select chips: value is stored verbatim in onboarding_answers.
export const STRUGGLES = [
  "Staying consistent",
  "Procrastination",
  "Phone / distraction",
  "Low energy",
  "Too many goals at once",
  "Starting too big",
];

export const FAILURE_PATTERNS = [
  "Strong start, fade by week 2",
  "One missed day becomes a missed week",
  "All-or-nothing — perfect or nothing",
  "Life gets busy and the plan dies",
  "I simply forget",
  "Never really started",
];

export const MOTIVATION_STYLES = [
  "Streaks & visible progress",
  "Becoming a better version of me",
  "Accountability & commitments",
  "Quick wins I can feel",
  "Competition & challenge",
];

export const INTENSITIES = [
  { v: "gentle",   l: "Gentle",   d: "Small, almost effortless steps. Build the streak first." },
  { v: "balanced", l: "Balanced", d: "Steady challenge without burnout. The default." },
  { v: "aggressive", l: "Aggressive", d: "Push hard. I want demanding days." },
];

export const PEAK_WINDOWS = [
  { v: "early_morning", l: "Early morning (5–8)" },
  { v: "morning",       l: "Morning (8–12)" },
  { v: "afternoon",     l: "Afternoon (12–17)" },
  { v: "evening",       l: "Evening (17–21)" },
  { v: "night",         l: "Night (21–1)" },
];

export const STEPS = [
  { label:"Step 1 / 7", title:"Choose Your Focus Mode", sub:"What should MACP optimize your system for?" },
  { label:"Step 2 / 7", title:"Who are you?",            sub:"Build your identity profile." },
  { label:"Step 3 / 7", title:"Your Day, Honestly",      sub:"MACP plans around your real schedule — not an ideal one." },
  { label:"Step 4 / 7", title:"Goals & First Win",       sub:"What are you building toward — and what counts as progress?" },
  { label:"Step 5 / 7", title:"Energy & Intensity",      sub:"When you peak, and how hard you want to be pushed." },
  { label:"Step 6 / 7", title:"What Gets In The Way",    sub:"Honesty here shapes everything. MACP designs around your failure pattern." },
  { label:"Step 7 / 7", title:"Choose Habit Categories", sub:"Where do you want to level up?" },
];

export const REVIEW_SECTION_HEADERS: readonly string[] = [
  "WEEK GRADE",
  "WINS THIS WEEK",
  "GROWTH EDGE",
  "TIER STATUS",
  "NEXT WEEK'S KEYSTONE",
  "RECOVERY PROTOCOL",
];
