import access from "../../research/scenario-access.json" with { type: "json" };
import mid from "../../research/scenario-mid.json" with { type: "json" };
import selective from "../../research/scenario-selective.json" with { type: "json" };
import ontario from "../../research/scenario-ontario.json" with { type: "json" };
import root from "../../research/scenario-root.json" with { type: "json" };
import updates from "../../research/scenario-existing-rules.json" with { type: "json" };
import type {
  ScenarioSchool,
  PercentageRule,
  SatAlternative,
} from "../scenario-types.ts";
import type { Source } from "../types.ts";
export const additionalScenarioSchools = [
  ...access.schools,
  ...mid.schools,
  ...selective.schools,
  ...root.schools,
  ...ontario.schools,
] as unknown as ScenarioSchool[];
export const scenarioRuleUpdates = updates.updates as unknown as {
  id: string;
  ontario?: PercentageRule;
  satAlternative?: SatAlternative;
}[];
export const additionalScenarioSources: Source[] = [
  ...additionalScenarioSchools.flatMap((s) => s.sources),
  ...updates.sources,
];
