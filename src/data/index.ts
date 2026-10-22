import west from "../../research/west.json" with { type: "json" };
import east from "../../research/east.json" with { type: "json" };
import iowa from "../../research/iowa.json" with { type: "json" };
import planningData from "../../research/planning.json" with { type: "json" };
import pathwaysData from "../../research/pathways.json" with { type: "json" };
import type { University, Source } from "../types.ts";
export const RESEARCH_DATE = "2026-10-21";
export const ENTRY_YEAR = 2028;
export const universities: University[] = [
  ...west,
  ...east,
  ...iowa,
] as University[];
export const planning = planningData;
export const pathways = pathwaysData;
export const sources: Source[] = [
  ...new Map(
    [
      ...universities.flatMap((u) => u.sources),
      ...planning.sources,
      ...pathways.sources,
    ].map((s) => [s.id, s]),
  ).values(),
];
export const sourceMap = new Map(sources.map((s) => [s.id, s]));
