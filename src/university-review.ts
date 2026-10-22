import eliteAddendum from "../research/candidate-elite-addendum.json" with { type: "json" };
import ucAudit from "../research/candidate-uc-audit.json" with { type: "json" };
import existingAudit from "../research/candidate-existing-audit.json" with { type: "json" };
import selectiveAudit from "../research/candidate-selective-audit.json" with { type: "json" };
import rootAudit from "../research/candidate-root-audit.json" with { type: "json" };
import vanderbilt from "../research/candidate-vanderbilt.json" with { type: "json" };

export const REVIEW_DATE = "2026-10-22";
export const ambitiousSchoolIds = new Set([
  ...eliteAddendum.schools.map((s) => s.id),
  "harvard",
  ...selectiveAudit.newSchools.map((s) => s.id),
  "vanderbilt",
]);
export const ucProfiles = ucAudit.admitProfiles;
export const ucSchoolIds = ucProfiles.map((p) => p.id);
export interface UniversityReview {
  id: string;
  status: string;
  sourceIds: string[];
  scope: string;
  finding: string;
}
const full = [
  ...ucAudit.schools,
  ...selectiveAudit.newSchools,
  ...vanderbilt.schools,
  ...eliteAddendum.schools,
].map((s) => ({
  id: s.id,
  status: ["uchicago", "northwestern"].includes(s.id) ? "partial" : "reviewed",
  sourceIds: s.testing.sourceIds,
  scope:
    "New record: academic, testing, program and international-applicant sources checked",
  finding:
    "No invented Ontario percentage, easiest-major guarantee, current rank or SAT composite range.",
}));
export const universityReviews: UniversityReview[] = [
  ...rootAudit.coverage,
  ...selectiveAudit.coverage,
  ...existingAudit.coverage.map((r) => ({
    ...r,
    scope: existingAudit.scope,
    finding: r.notes,
  })),
  ...full,
];
export const universityReviewMap = new Map(
  universityReviews.map((r) => [r.id, r]),
);
export const confirmed2028Policies: Record<string, "required" | "optional"> = {
  princeton: "required",
  columbia: "required",
  alabama: "required",
  uab: "required",
  "alabama-huntsville": "required",
  "virginia-tech": "optional",
  "minnesota-twin-cities": "optional",
  vanderbilt: "optional",
};
