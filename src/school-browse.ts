import { qsOrder } from "./qs.ts";
import type { ScenarioSchool } from "./scenario-types.ts";

export interface BrowseFilters {
  search: string;
  sort: "qs" | "sat" | "name";
  band: "" | "under-1200" | "1200" | "1300" | "1400";
  optionalOnly: boolean;
  ucOnly: boolean;
  privateOnly: boolean;
}
export const emptyBrowse = (): BrowseFilters => ({
  search: "",
  sort: "qs",
  band: "",
  optionalOnly: false,
  ucOnly: false,
  privateOnly: false,
});

const bandLimits: Record<
  Exclude<BrowseFilters["band"], "">,
  [number, number]
> = {
  "under-1200": [0, 1200],
  "1200": [1200, 1300],
  "1300": [1300, 1400],
  "1400": [1400, Infinity],
};
// The band uses the middle of the published middle-50% range, like the SAT
// bands on the test prep page.
const middle = (s: ScenarioSchool) =>
  s.satRange ? (s.satRange.low + s.satRange.high) / 2 : null;

export function browseSchools(
  schools: ScenarioSchool[],
  f: BrowseFilters,
): ScenarioSchool[] {
  const q = f.search.trim().toLowerCase();
  const list = schools.filter((s) => {
    if (
      q &&
      !`${s.name} ${s.nameKo} ${s.city} ${s.state} ${s.entry.program} ${s.entry.programKo}`
        .toLowerCase()
        .includes(q)
    )
      return false;
    if (f.band) {
      const m = middle(s);
      const [lo, hi] = bandLimits[f.band];
      if (m === null || m < lo || m >= hi) return false;
    }
    if (f.optionalOnly && s.testing.policy !== "optional") return false;
    if (f.ucOnly && !s.id.startsWith("uc-")) return false;
    if (f.privateOnly && !/private/i.test(s.type)) return false;
    return true;
  });
  return list.sort(
    f.sort === "name"
      ? (a, b) => a.name.localeCompare(b.name)
      : f.sort === "sat"
        ? (a, b) =>
            (a.satRange?.low ?? Infinity) - (b.satRange?.low ?? Infinity) ||
            qsOrder(a, b)
        : qsOrder,
  );
}
