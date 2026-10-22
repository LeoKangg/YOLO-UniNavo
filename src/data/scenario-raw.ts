import eliteAddendum from "../../research/candidate-elite-addendum.json" with { type: "json" };
import ucAudit from "../../research/candidate-uc-audit.json" with { type: "json" };
import selectiveAudit from "../../research/candidate-selective-audit.json" with { type: "json" };
import existingAudit from "../../research/candidate-existing-audit.json" with { type: "json" };
import rootAudit from "../../research/candidate-root-audit.json" with { type: "json" };
import vanderbilt from "../../research/candidate-vanderbilt.json" with { type: "json" };
import harvard from "../../research/candidate-harvard.json" with { type: "json" };
import access from "../../research/scenario-access.json" with { type: "json" };
import mid from "../../research/scenario-mid.json" with { type: "json" };
import selective from "../../research/scenario-selective.json" with { type: "json" };
import ontario from "../../research/scenario-ontario.json" with { type: "json" };
import root from "../../research/scenario-root.json" with { type: "json" };
import updates from "../../research/scenario-existing-rules.json" with { type: "json" };
import lowReview from "../../research/candidate-low-review.json" with { type: "json" };
import middleReview from "../../research/candidate-middle-review.json" with { type: "json" };
import highReview from "../../research/candidate-high-review.json" with { type: "json" };
import candidateUpdates from "../../research/candidate-updates.json" with { type: "json" };
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
  ...lowReview.newSchools,
  ...harvard.schools,
  ...ucAudit.schools,
  ...selectiveAudit.newSchools,
  ...vanderbilt.schools,
  ...eliteAddendum.schools,
] as unknown as ScenarioSchool[];
export const scenarioRuleUpdates = updates.updates as unknown as {
  id: string;
  ontario?: PercentageRule;
  satAlternative?: SatAlternative;
}[];
export const additionalScenarioSources: Source[] = [
  ...additionalScenarioSchools.flatMap((s) => s.sources),
  ...updates.sources,
  ...lowReview.sources,
  ...middleReview.sources,
  ...highReview.sources,
  ...selectiveAudit.sources,
  ...existingAudit.sources,
  ...rootAudit.sources,
];
export const reviewedSchoolUpdates = [
  ...middleReview.schools,
  ...candidateUpdates.updates,
] as unknown as (Partial<ScenarioSchool> & { id: string })[];
export const reviewedPrograms = middleReview.programUpdates;
export const reviewedRanges = middleReview.rangeUpdates;

export const finalSchoolUpdates = [
  ...selectiveAudit.updates,
  ...existingAudit.updates,
  ...rootAudit.updates,
] as unknown as (Partial<ScenarioSchool> & { id: string })[];
