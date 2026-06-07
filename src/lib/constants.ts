// Pure static constants extracted from App.tsx (Project 14D — Task 2).
// Values are byte-identical to the originals; no behavior or UI change.

export const GOALS   = ["Finish degree","Launch a product","Get fit & healthy","Build a business","Read 12 books/year","Learn a new skill","Improve sleep quality","Reduce stress","Save money","Career promotion"];
export const HABITS_CATS = ["Morning Routine","Deep Work","Exercise","Business","Study","Evening Wind-down","Nutrition","Mindfulness","Reading","Networking"];
export const WORKOUTS = [{v:"none",l:"No workout yet"},{v:"walk",l:"Daily walk"},{v:"home",l:"Home workout"},{v:"gym",l:"Gym session"}];
export const SITUATIONS = ["College student","Working professional","Entrepreneur","Freelancer","Student + job","Business owner"];
export const ENERGY_LEVELS = [{v:"peak",l:"🔥 Peak",c:"#d4922a"},{v:"good",l:"✅ Good",c:"#2d9e5f"},{v:"low",l:"😴 Low",c:"#6b6870"},{v:"exam",l:"📚 Exam mode",c:"#3a7cbf"}];

export const DAY_ABBRS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export const STEPS = [
  { label:"Step 1 / 6", title:"Choose Your Focus Mode", sub:"What should MACP optimize your system for?" },
  { label:"Step 2 / 6", title:"Who are you?",               sub:"Build your identity profile." },
  { label:"Step 3 / 6", title:"Your Schedule",              sub:"Tell me when you live your life." },
  { label:"Step 4 / 6", title:"Goals & Ambition",           sub:"What are you building toward?" },
  { label:"Step 5 / 6", title:"Energy & Constraints",       sub:"Honesty here shapes everything." },
  { label:"Step 6 / 6", title:"Choose Habit Categories",    sub:"Where do you want to level up?" },
];

export const REVIEW_SECTION_HEADERS: readonly string[] = [
  "WEEK GRADE",
  "WINS THIS WEEK",
  "GROWTH EDGE",
  "TIER STATUS",
  "NEXT WEEK'S KEYSTONE",
  "RECOVERY PROTOCOL",
];
