// Legacy editorial recommendation model; the live explorer uses scenarios.ts.
// Profile normalization and scoreContext remain in use for stored inputs / SAT guidance.
import { GRADE_BANDS } from "./types.ts";
import type { Profile, Category, University, Strategy } from "./types.ts";
import { strategies } from "./data/strategies.ts";
export const defaultProfile: Profile = {
  band: "",
  sat: null,
  rigor: "unknown",
  coursework: false,
  citizenship: "unknown",
  program: "flexible",
};
export function categoryFor(id: string, profile: Profile): Category | null {
  const index = GRADE_BANDS.indexOf(
    profile.band as (typeof GRADE_BANDS)[number],
  );
  const strategy = strategies[id];
  if (index < 0 || !strategy) return null;
  let category = strategy.bands[index];
  if (
    category === "More Realistic" &&
    (!profile.coursework || profile.rigor !== "strong")
  )
    category = "Target";
  if (
    (profile.program === "specialized" || profile.citizenship === "us") &&
    ["Target", "More Realistic"].includes(category)
  )
    category = "Reach";
  // SAT can inform preparation/submission, but never erases academic prerequisites.
  return category;
}
export function recommend(all: University[], profile: Profile): University[] {
  if (!profile.band) return [];
  const eligible = all.filter(
    (u) => categoryFor(u.id, profile) !== "Very High Reach",
  );
  const order: Category[] = ["More Realistic", "Target", "Reach"];
  const selected: University[] = [];
  const sorted = eligible.toSorted(
    (a, b) => strategies[a.id].priority - strategies[b.id].priority,
  );
  // Preserve breadth before brand ordering: up to two from each planning category.
  for (const category of order)
    selected.push(
      ...sorted
        .filter((u) => categoryFor(u.id, profile) === category)
        .slice(0, 2),
    );
  for (const u of sorted)
    if (selected.length < 6 && !selected.some((s) => s.id === u.id))
      selected.push(u);
  return selected.slice(0, 6);
}
export function scoreContext(strategy: Strategy, profile: Profile): string {
  if (!strategy.range)
    return "No verified score distribution in this review; no numerical submission target assigned.";
  if (profile.sat === null)
    return `Published middle 50%: ${strategy.range.low}–${strategy.range.high}. Add a diagnostic score to compare.`;
  if (profile.sat < strategy.range.low)
    return "Your score is below this published middle 50%. Focus on targeted practice and review the school’s entry-year test policy.";
  if (profile.sat > strategy.range.high)
    return "Your score is above this published middle 50%. It does not guarantee admission or replace academic requirements.";
  return "Your score falls within this published middle 50%. Submission still depends on the full application and entry-year policy.";
}
export function normalizeProfile(input: unknown): Profile {
  const p =
    input && typeof input === "object" ? (input as Partial<Profile>) : {};
  return {
    band: GRADE_BANDS.includes(p.band as (typeof GRADE_BANDS)[number])
      ? p.band!
      : "",
    sat:
      typeof p.sat === "number" &&
      p.sat >= 400 &&
      p.sat <= 1600 &&
      Number.isInteger(p.sat)
        ? p.sat
        : null,
    rigor: ["unknown", "standard", "strong"].includes(p.rigor ?? "")
      ? p.rigor!
      : "unknown",
    coursework: p.coursework === true,
    citizenship: ["unknown", "canadian", "us", "other"].includes(
      p.citizenship ?? "",
    )
      ? p.citizenship!
      : "unknown",
    program: p.program === "specialized" ? "specialized" : "flexible",
  };
}
