import original from "../../research/sat-band-original.json" with { type: "json" };
import selective from "../../research/sat-band-selective.json" with { type: "json" };
import context from "../../research/sat-band-context.json" with { type: "json" };
export const researchedSatRanges = [...original.ranges, ...selective.ranges];
export const satResearchSources = [
  ...original.sources,
  ...selective.sources,
  ...context.sources,
];
