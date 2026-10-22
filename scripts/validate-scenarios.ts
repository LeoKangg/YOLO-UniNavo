import {
  scenarioSchools,
  scenarioSourceMap,
} from "../src/data/scenario-catalog.ts";
export function validateScenarioData(): string[] {
  const errors: string[] = [];
  const check = (ok: unknown, message: string) => {
    if (!ok) errors.push(message);
  };
  check(
    new Set(scenarioSchools.map((s) => s.id)).size === scenarioSchools.length,
    "Duplicate scenario school IDs",
  );
  for (const school of scenarioSchools) {
    check(
      school.id && school.name && school.nameKo && school.city && school.state,
      `${school.id}: missing identity`,
    );
    check(
      school.entry.program &&
        school.entry.programKo &&
        school.entry.sourceIds.length,
      `${school.id}: program evidence missing`,
    );
    for (const [key, value] of Object.entries(school))
      if (value && typeof value === "object" && "sourceIds" in value) {
        for (const id of value.sourceIds as string[])
          check(
            scenarioSourceMap.has(id),
            `${school.id}.${key}: missing source ${id}`,
          );
      }
    for (const rule of [school.ontario, school.percentageRule].filter(
      (r) => r?.minimum !== null && r?.minimum !== undefined,
    )) {
      check(
        rule!.minimum! >= 0 && rule!.minimum! <= 100,
        `${school.id}: invalid percentage`,
      );
      check(
        rule!.basisKey && rule!.sourceIds.length,
        `${school.id}: percentage lacks basis or source`,
      );
      check(
        !rule!.comparator || ["gte", "gt"].includes(rule!.comparator),
        `${school.id}: invalid comparator`,
      );
    }
    if (school.satRange)
      check(
        school.satRange.low >= 400 &&
          school.satRange.high <= 1600 &&
          school.satRange.low <= school.satRange.high &&
          school.satRange.cohort &&
          school.satRange.sourceIds.length,
        `${school.id}: invalid SAT distribution`,
      );
    if (school.satAlternative)
      check(
        school.satAlternative.minimum >= 400 &&
          school.satAlternative.minimum <= 1600 &&
          school.satAlternative.sourceIds.length &&
          school.satAlternative.remainingRequirements &&
          school.satAlternative.remainingRequirementsKo,
        `${school.id}: incomplete SAT alternative`,
      );
    if (school.rank.value !== null)
      check(
        school.rank.edition === "2026" &&
          school.rank.sourceIds.length &&
          school.rank.value > 0,
        `${school.id}: rank edition/source mismatch`,
      );
    // No record in this audit establishes an absolute easiest major.
    check(
      school.entry.easierMajorVerified === false,
      `${school.id}: easiest-major assertion requires a new comparative evidence audit`,
    );
  }
  return errors;
}
