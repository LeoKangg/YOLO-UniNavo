import type { Source, GradeBand } from "./types.ts";
export type AverageBasis =
  | "unknown"
  | "cumulative-academic"
  | "core-secondary"
  | "overall-secondary"
  | "grade12-top6"
  | "school-defined";
export interface SourcedText {
  text: string;
  textKo: string;
  sourceIds: string[];
}
export interface PercentageRule {
  minimum: number;
  comparator?: "gte" | "gt";
  basis: string;
  basisKo: string;
  basisKey?: AverageBasis;
  sourceIds: string[];
  scope?: string;
}
export interface SatAlternative {
  minimum: number;
  sectionMinimums?: { readingWriting: number; math: number };
  replacesGpa: boolean;
  remainingRequirements: string;
  remainingRequirementsKo: string;
  sourceIds: string[];
  verificationStatus?: string;
}
export interface ScenarioSchool {
  id: string;
  name: string;
  nameKo: string;
  state: string;
  city: string;
  type: string;
  rank: {
    edition: string;
    value: number | null;
    sourceIds: string[];
    verification?: string;
  };
  ontario: Omit<PercentageRule, "minimum"> & { minimum: number | null };
  academic: SourcedText;
  testing: SourcedText & {
    policy: "optional" | "required" | "expected" | "not-considered" | "unknown";
  };
  satRange: null | {
    low: number;
    high: number;
    cohort: string;
    cohortKo: string;
    sourceIds: string[];
  };
  entry: SourcedText & {
    program: string;
    programKo: string;
    unit: string;
    unitKo: string;
    easierMajorVerified: boolean;
  };
  applicantScope: SourcedText;
  sources: Source[];
  percentageRule?: PercentageRule;
  satAlternative?: SatAlternative;
}
export interface ScenarioInput {
  band: GradeBand | "";
  sat: number | null;
  averageBasis: AverageBasis;
  exactAverage: number | null;
  confirmedCalculations: string[];
  applicantRoute: "international" | "us";
  readingWriting: number | null;
  math: number | null;
}
export type EvidenceReason =
  | "matched-percentage"
  | "matched-sat-alternative"
  | "no-percentage"
  | "basis-needed"
  | "calculation-needed"
  | "invalid-sat"
  | "below-percentage"
  | "straddles-percentage"
  | "test-policy-unverified"
  | "sat-not-enough"
  | "sections-needed"
  | "conflicting-rule"
  | "route-unreviewed"
  | "inputs-needed";
export interface RuleAssessment {
  matched: boolean;
  reason: EvidenceReason;
  sourceIds: string[];
  rule?: PercentageRule;
  alternative?: SatAlternative;
  otherReasons: EvidenceReason[];
}
