import {
  bestSat,
  gradeBand,
  simpleAverage,
  type GradesState,
} from "./grades.ts";
import type { GradeBand } from "./types.ts";
import type { ScenarioSchool } from "./scenario-types.ts";

// Connects Taeyul's entered marks to the editorial shortlists. Positions are a
// comparison with published score cohorts, never an admission likelihood.
export function gradeInput(
  grades: GradesState,
): { average: number; band: GradeBand | ""; sat: number | null } | null {
  const levels = grades.courses
    .filter((c) => (c.final ?? c.midterm) !== null)
    .map((c) => c.grade);
  if (!levels.length) return null;
  const latest = Math.max(...levels);
  const average = simpleAverage(
    grades.courses.filter((c) => c.grade === latest),
  )!;
  return { average, band: gradeBand(average), sat: bestSat(grades.sat) };
}

export type SatPosition =
  | "within"
  | "below"
  | "above"
  | "no-data"
  | "not-considered";
export function satPosition(
  s: ScenarioSchool,
  sat: number | null,
): SatPosition {
  if (s.testing.policy === "not-considered") return "not-considered";
  if (!s.satRange || sat === null) return "no-data";
  if (sat < s.satRange.low) return "below";
  if (sat > s.satRange.high) return "above";
  return "within";
}

export interface SatStep {
  sat: number;
  within: number;
  added: ScenarioSchool[];
}
export function satOutlook(list: ScenarioSchool[], sat: number): SatStep[] {
  const within = (score: number) =>
    list.filter((s) => satPosition(s, score) === "within");
  const now = within(sat);
  const lows = list
    .filter((s) => satPosition(s, sat) === "below")
    .map((s) => s.satRange!.low);
  if (!lows.length) return [{ sat, within: now.length, added: [] }];
  const next = Math.min(...lows);
  const later = within(next);
  return [
    { sat, within: now.length, added: [] },
    {
      sat: next,
      within: later.length,
      added: later.filter((s) => !now.includes(s)),
    },
  ];
}
