import expansionEast from "../../research/expansion-east.json" with { type: "json" };
import expansionMidwest from "../../research/expansion-midwest.json" with { type: "json" };
import expansionAccess from "../../research/expansion-access.json" with { type: "json" };
import existingRankings from "../../research/existing-rankings.json" with { type: "json" };
import comparisonContext from "../../research/comparison-context.json" with { type: "json" };
import west from "../../research/west.json" with { type: "json" };
import east from "../../research/east.json" with { type: "json" };
import iowa from "../../research/iowa.json" with { type: "json" };
import planningData from "../../research/planning.json" with { type: "json" };
import pathwaysData from "../../research/pathways.json" with { type: "json" };
import type { University, Source } from "../types.ts";
export const RESEARCH_DATE = "2026-10-22";
export const ENTRY_YEAR = 2028;
export const universities: University[] = [
  ...west,
  ...east,
  ...iowa,
  ...expansionEast,
  ...expansionMidwest,
  ...expansionAccess,
] as University[];
export const planning = planningData;
export const pathways = pathwaysData;
export const sources: Source[] = [
  ...new Map(
    [
      ...universities.flatMap((u) => u.sources),
      ...planning.sources,
      ...comparisonContext.sources,
      ...existingRankings.flatMap((r) => (r.source ? [r.source] : [])),
      ...pathways.sources,
    ].map((s) => [s.id, s]),
  ).values(),
];
export const sourceMap = new Map(sources.map((s) => [s.id, s]));
