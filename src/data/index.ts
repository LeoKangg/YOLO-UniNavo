import { additionalScenarioSources } from "./scenario-raw.ts";
import { researchedSatRanges, satResearchSources } from "./sat-research.ts";
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
// Refresh previously unverified score facts with the newly inspected official cohorts.
for (const r of researchedSatRanges) {
  const u = universities.find((u) => u.id === r.id)!;
  const key = u.facts.satRange ? "satRange" : "satMiddle50";
  u.facts[key] = {
    text: `Official composite SAT middle 50%: ${r.low}–${r.high}. ${r.cohort} This is a historical score-submitter distribution, not an admission cutoff.`,
    status: "verified",
    sourceIds: r.sourceIds,
  };
  if (u.facts.satTarget)
    u.facts.satTarget = {
      text: "Use the dated official composite distribution as a score reference; confirm Fall 2028 testing policy and assess the full transcript and program requirements before deciding whether to submit scores.",
      status: "planning-guidance",
      sourceIds: r.sourceIds,
    };
  for (const id of r.sourceIds) {
    const source = satResearchSources.find((s) => s.id === id);
    if (source && !u.sources.some((s) => s.id === id)) u.sources.push(source);
  }
}
export const planning = planningData;
export const pathways = pathwaysData;
export const sources: Source[] = [
  ...new Map(
    [
      ...universities.flatMap((u) => u.sources),
      ...planning.sources,
      ...satResearchSources,
      ...additionalScenarioSources,
      ...comparisonContext.sources,
      ...existingRankings.flatMap((r) => (r.source ? [r.source] : [])),
      ...pathways.sources,
    ].map((s) => [s.id, s]),
  ).values(),
];
export const sourceMap = new Map(sources.map((s) => [s.id, s]));
