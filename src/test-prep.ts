import { planning } from "./data/index.ts";
import type { GradesState } from "./grades.ts";
import type { ScenarioSchool } from "./scenario-types.ts";

// Groups schools by the middle of their published middle-50% SAT range.
// A band is a browsing aid, not an admission threshold.
const BANDS = [
  { id: "under-1200", label: "~1199", min: 0, max: 1200 },
  { id: "1200", label: "1200–1299", min: 1200, max: 1300 },
  { id: "1300", label: "1300–1399", min: 1300, max: 1400 },
  { id: "1400", label: "1400–1499", min: 1400, max: 1500 },
  { id: "1500", label: "1500+", min: 1500, max: Infinity },
];
export interface SatBand {
  id: string;
  label: string;
  min: number;
  max: number;
  schools: ScenarioSchool[];
  containsScore: boolean;
}
const middle = (s: ScenarioSchool) => (s.satRange!.low + s.satRange!.high) / 2;
export function satBands(
  schools: ScenarioSchool[],
  sat: number | null,
): SatBand[] {
  const ranged = schools
    .filter((s) => s.satRange && s.testing.policy !== "not-considered")
    .sort((a, b) => middle(a) - middle(b));
  return BANDS.map((b) => ({
    ...b,
    schools: ranged.filter((s) => middle(s) >= b.min && middle(s) < b.max),
    containsScore: sat !== null && sat >= b.min && sat < b.max,
  }));
}

export function nextSatSitting(
  today: string,
): { date: string; registrationDeadline: string } | null {
  const next = planning.satDates.find((d) => d.registrationDeadline >= today);
  return next
    ? { date: next.date, registrationDeadline: next.registrationDeadline }
    : null;
}

// 0 = diagnostic, 1 = targeted practice. Full practice tests come from the
// same Bluebook source, so the third step is guidance rather than a state.
export const resourceStage = (grades: GradesState) =>
  grades.sat.length ? 1 : 0;
