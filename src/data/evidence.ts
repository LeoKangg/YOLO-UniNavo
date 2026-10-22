import east from "../../research/expansion-east-meta.json" with { type: "json" };
import midwest from "../../research/expansion-midwest-meta.json" with { type: "json" };
import access from "../../research/expansion-access-meta.json" with { type: "json" };
import type { Strategy } from "../types.ts";
export interface MajorEvidence {
  name: string;
  admissionUnit: string;
  minimum: string | null;
  advantage: string;
  sourceIds: string[];
}
export interface SchoolEvidence {
  id: string;
  shortName: string;
  initials: string;
  color: string;
  recognition: Strategy["recognition"];
  majors: string[];
  structure: string;
  selectivity: Strategy["selectivity"];
  priority: number;
  testing?: Strategy["testing"];
  fit: string;
  range?: Strategy["range"];
  ranking: {
    verification?: string;
    edition: string;
    publisher: string;
    category: string;
    rank: number | null;
    url: string | null;
    sourceId: string | null;
  };
  eligibility: {
    ontarioMinimum: number | null;
    ontarioRule: string;
    satAlternative: { minimum: number; conditions: string } | null;
    sourceIds: string[];
  };
  majorEvidence: MajorEvidence[];
  majorsDirectory?: { url: string; sourceId: string; scope: string };
  catalog?: { url: string; sourceId: string };
  programRanges?: (NonNullable<Strategy["range"]> & { unit: string })[];
  ko: {
    name: string;
    facts: Record<string, string>;
    fit: string;
    majorNames: string[];
    ontarioRule?: string;
    majorEvidence?: Omit<MajorEvidence, "sourceIds">[];
    structure?: string;
  };
}
export const expandedEvidence = [
  ...east,
  ...midwest,
  ...access,
] as unknown as SchoolEvidence[];
export const evidenceMap = new Map(expandedEvidence.map((e) => [e.id, e]));
