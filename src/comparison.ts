import type { Profile, Strategy } from "./types.ts";
export const SAT_SCENARIOS = [1100, 1200, 1300, 1400, 1500] as const;
export type ScorePosition = "below" | "within" | "above" | "unknown";
export function compareSat(
  score: number,
  range?: Strategy["range"],
): ScorePosition {
  if (!range) return "unknown";
  return score < range.low ? "below" : score > range.high ? "above" : "within";
}
export function meetsPublishedAlternative(
  id: string,
  score: number,
  profile: Profile,
): boolean {
  // ISU explicitly allows SAT1200 to satisfy the GPA component, not all admission requirements.
  // The researched rule is for international first-year applicants; never apply to a known U.S. route.
  return id === "iowa-state" && score >= 1200 && profile.citizenship !== "us";
}

import { universities, sourceMap } from "./data/index.ts";
import { strategies } from "./data/strategies.ts";
import { categoryFor } from "./recommendations.ts";
import { GRADE_BANDS } from "./types.ts";
export function comparisonCsv(
  profile: Profile,
  rank: (id: string) => number | null,
): string {
  const rows: (string | number)[][] = [
    [
      "Ontario band",
      "SAT scenario",
      "University",
      "Planning category (editorial)",
      "SAT position (not eligibility)",
      "SAT middle50%",
      "Cohort",
      "GPA alternative (international component only)",
      "2026 USNews National rank",
      "Focused majors",
      "Evidence URLs",
    ],
  ];
  for (const band of GRADE_BANDS)
    for (const score of SAT_SCENARIOS)
      for (const u of universities) {
        const p = { ...profile, band, sat: score },
          s = strategies[u.id];
        rows.push([
          band,
          score,
          u.name,
          categoryFor(u.id, p) ?? "",
          compareSat(score, s.range),
          s.range ? `${s.range.low}-${s.range.high}` : "unverified",
          s.range?.cohort ?? "",
          meetsPublishedAlternative(u.id, score, p)
            ? "If international route applies: GPA component met under current rule; other requirements and Fall2028 need confirmation"
            : "No researched alternative applied",
          rank(u.id) ?? "unverified",
          s.majors.join("; "),
          [
            ...(s.range?.sourceIds ?? []),
            ...(u.id === "iowa-state" ? ["isu-admissions"] : []),
          ]
            .map((id) => sourceMap.get(id)?.url ?? "")
            .join("; "),
        ]);
      }
  return (
    "\uFEFF" +
    rows
      .map((r) =>
        r.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(","),
      )
      .join("\r\n")
  );
}
