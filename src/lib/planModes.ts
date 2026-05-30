// Plan modes for MACP. A mode is a single axis that shapes the FOCUS of a
// generated plan (not its JSON shape). One prompt builder, parameterized by
// mode via buildModeBlock — never a separate prompt builder per mode.

export type PlanMode = "general" | "fitness" | "exam" | "college" | "deep_work";

export interface PlanModeMeta {
  id: PlanMode;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}

export const PLAN_MODES: PlanModeMeta[] = [
  {
    id: "general",
    label: "General Productivity",
    shortLabel: "General",
    description: "A balanced daily system across all of your goals.",
    icon: "🎯",
  },
  {
    id: "fitness",
    label: "Fitness & Health",
    shortLabel: "Fitness",
    description: "Training, recovery, sleep, and nutrition anchors.",
    icon: "💪",
  },
  {
    id: "exam",
    label: "Exam Prep",
    shortLabel: "Exam",
    description: "Active recall, spaced repetition, deadline focus.",
    icon: "📚",
  },
  {
    id: "college",
    label: "College Productivity",
    shortLabel: "College",
    description: "Lectures, self-study, and a realistic campus balance.",
    icon: "🎓",
  },
  {
    id: "deep_work",
    label: "Deep Work",
    shortLabel: "Deep Work",
    description: "Long focus blocks and distraction control.",
    icon: "🧠",
  },
];

const VALID_MODES: PlanMode[] = [
  "general",
  "fitness",
  "exam",
  "college",
  "deep_work",
];

// Coerce any stored/legacy value to a valid mode. Unknown/missing => "general".
export function normalizePlanMode(value: unknown): PlanMode {
  return typeof value === "string" && (VALID_MODES as string[]).includes(value)
    ? (value as PlanMode)
    : "general";
}

export function getPlanModeMeta(mode: PlanMode | string): PlanModeMeta {
  const id = normalizePlanMode(mode);
  return PLAN_MODES.find((m) => m.id === id) || PLAN_MODES[0];
}

// Prompt injection for a mode. Returns "" for general (current behaviour), or a
// blank-line-wrapped focus block for the others. The block shapes plan CONTENT
// only — the JSON schema, 5-habit rule, and allowed tags are unchanged.
export function buildModeBlock(mode: PlanMode | string): string {
  switch (normalizePlanMode(mode)) {
    case "fitness":
      return `\nPLAN MODE — Fitness & Health (shape the whole plan around this):
- Center the plan on training: progressive workouts, recovery/rest windows, sleep hygiene, and hydration/nutrition anchors.
- The frog task should advance their training goal; the daily flow must protect a workout slot and post-workout recovery.
- Lean the 5 habits toward the health and morning tags.\n`;
    case "exam":
      return `\nPLAN MODE — Exam Preparation (shape the whole plan around this):
- Center the plan on retention: active-recall and spaced-repetition study blocks, hardest-topic-first, and deadline-driven pacing.
- The frog task should be the highest-yield exam topic; schedule short decompression to prevent burnout.
- Lean the 5 habits toward the work (study) and morning tags.\n`;
    case "college":
      return `\nPLAN MODE — College Productivity (shape the whole plan around this):
- Balance lectures, self-study blocks, and social/recovery time around a realistic campus schedule.
- The frog task should be the most consequential academic deadline; keep habits achievable between classes.
- Spread the 5 habits across the work (study), health, and evening tags.\n`;
    case "deep_work":
      return `\nPLAN MODE — Deep Work (shape the whole plan around this):
- Maximize cognitive output: long uninterrupted focus blocks (90+ min), a phone/distraction protocol, and one output metric to track.
- The frog task is the highest-leverage deliverable; eliminate shallow work from the daily flow.
- Lean the 5 habits toward the work tag, with an evening shutdown/review.\n`;
    case "general":
    default:
      return "";
  }
}
