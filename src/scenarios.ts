import { GRADE_BANDS } from "./types.ts";
import { SAT_SCENARIOS } from "./comparison.ts";
import type { GradeBand } from "./types.ts";
import type {
  ScenarioInput,
  ScenarioSchool,
  RuleAssessment,
  PercentageRule,
  EvidenceReason,
  AverageBasis,
} from "./scenario-types.ts";
export const defaultScenario: ScenarioInput = {
  band: "",
  sat: null,
  averageBasis: "unknown",
  exactAverage: null,
  confirmedCalculations: [],
  applicantRoute: "international",
  readingWriting: null,
  math: null,
};
export function normalizeScenario(value: unknown): ScenarioInput {
  const input =
    value && typeof value === "object" ? (value as Partial<ScenarioInput>) : {};
  const finite = (
    v: unknown,
    min: number,
    max: number,
    step = 1,
  ): v is number =>
    typeof v === "number" &&
    Number.isFinite(v) &&
    v >= min &&
    v <= max &&
    Math.abs(v / step - Math.round(v / step)) < 1e-8;
  const band = GRADE_BANDS.includes(input.band as GradeBand) ? input.band! : "";
  const bounds = band ? bandBounds(band) : null;
  const exact = finite(input.exactAverage, 0, 100, 0.1)
    ? input.exactAverage
    : null;
  return {
    band,
    sat: finite(input.sat, 400, 1600, 10) ? input.sat : null,
    averageBasis: (
      [
        "unknown",
        "cumulative-academic",
        "core-secondary",
        "overall-secondary",
        "grade12-top6",
        "school-defined",
      ] as AverageBasis[]
    ).includes(input.averageBasis as AverageBasis)
      ? input.averageBasis!
      : "unknown",
    exactAverage:
      bounds &&
      exact !== null &&
      exact >= bounds.low &&
      (exact < bounds.high || (bounds.high === 100 && exact === 100))
        ? exact
        : null,
    confirmedCalculations: Array.isArray(input.confirmedCalculations)
      ? [
          ...new Set(
            input.confirmedCalculations.filter(
              (id): id is string => typeof id === "string",
            ),
          ),
        ]
      : [],
    applicantRoute: input.applicantRoute === "us" ? "us" : "international",
    readingWriting: finite(input.readingWriting, 200, 800, 10)
      ? input.readingWriting
      : null,
    math: finite(input.math, 200, 800, 10) ? input.math : null,
  };
}
export function bandBounds(band: GradeBand) {
  const [low, high] = band.replace("%", "").split("–").map(Number);
  return { low, high };
}
function checkPercentage(
  rule: PercentageRule,
  input: ScenarioInput,
  schoolId: string,
): EvidenceReason {
  if (
    input.averageBasis === "unknown" ||
    !rule.basisKey ||
    input.averageBasis !== rule.basisKey
  )
    return "basis-needed";
  if (!input.confirmedCalculations.includes(schoolId))
    return "calculation-needed";
  const { low, high } = bandBounds(input.band as GradeBand),
    value = input.exactAverage ?? low;
  const meets = (n: number) =>
    rule.comparator === "gt" ? n > rule.minimum : n >= rule.minimum;
  if (meets(value)) return "matched-percentage";
  if (input.exactAverage === null && high > rule.minimum)
    return "straddles-percentage";
  return "below-percentage";
}
export function assessSchool(
  school: ScenarioSchool,
  input: ScenarioInput,
): RuleAssessment {
  if (!input.band || input.sat === null)
    return {
      matched: false,
      reason: "inputs-needed",
      sourceIds: [],
      otherReasons: [],
    };
  // Reject contradictions globally, even for a rule without section minima.
  const validSections =
    (input.readingWriting === null ||
      (input.sat - input.readingWriting >= 200 &&
        input.sat - input.readingWriting <= 800)) &&
    (input.math === null ||
      (input.sat - input.math >= 200 && input.sat - input.math <= 800)) &&
    (input.readingWriting === null ||
      input.math === null ||
      input.readingWriting + input.math === input.sat);
  if (!validSections)
    return {
      matched: false,
      reason: "invalid-sat",
      sourceIds: [],
      otherReasons: [],
    };
  if (input.applicantRoute !== "international")
    return {
      matched: false,
      reason: "route-unreviewed",
      sourceIds: school.applicantScope.sourceIds,
      otherReasons: [],
    };
  const attempts: {
    reason: EvidenceReason;
    sourceIds: string[];
    rule?: PercentageRule;
    alternative?: ScenarioSchool["satAlternative"];
  }[] = [];
  const alternative = school.satAlternative;
  if (alternative?.replacesGpa) {
    if (
      alternative.verificationStatus &&
      alternative.verificationStatus !== "verified"
    )
      attempts.push({
        reason: "conflicting-rule",
        sourceIds: alternative.sourceIds,
        alternative,
      });
    else if (input.sat < alternative.minimum)
      attempts.push({
        reason: "sat-not-enough",
        sourceIds: alternative.sourceIds,
        alternative,
      });
    else {
      // Every SAT section is200–800. At total1300, both sections must be at least500.
      // Never infer a section meets490 merely from total1100/1200.
      const sections = alternative.sectionMinimums;
      const rw =
        input.readingWriting ??
        (input.math !== null
          ? input.sat - input.math
          : Math.max(200, input.sat - 800));
      const math =
        input.math ??
        (input.readingWriting !== null
          ? input.sat - input.readingWriting
          : Math.max(200, input.sat - 800));
      const totalValid =
        rw >= 200 &&
        rw <= 800 &&
        math >= 200 &&
        math <= 800 &&
        (input.readingWriting === null ||
          input.math === null ||
          input.readingWriting + input.math === input.sat);
      const sectionsMet =
        !sections ||
        (totalValid && rw >= sections.readingWriting && math >= sections.math);
      attempts.push({
        reason: sectionsMet ? "matched-sat-alternative" : "sections-needed",
        sourceIds: alternative.sourceIds,
        alternative,
      });
    }
  }
  const rules: PercentageRule[] = [];
  if (school.ontario.minimum !== null)
    rules.push({ ...school.ontario, minimum: school.ontario.minimum });
  if (school.percentageRule) rules.push(school.percentageRule);
  for (const rule of rules)
    attempts.push({
      reason: checkPercentage(rule, input, school.id),
      sourceIds: rule.sourceIds,
      rule,
    });
  const matched = attempts.find((a) => a.reason.startsWith("matched-"));
  if (matched && school.testing.policy !== "unknown")
    return {
      ...matched,
      matched: true,
      otherReasons: attempts.filter((a) => a !== matched).map((a) => a.reason),
    };
  if (matched)
    return {
      ...matched,
      matched: false,
      reason: "test-policy-unverified",
      sourceIds: [...matched.sourceIds, ...school.testing.sourceIds],
      otherReasons: [],
    };
  const fallback = attempts[0] ?? {
    reason: "no-percentage" as const,
    sourceIds: school.ontario.sourceIds,
  };
  return {
    ...fallback,
    matched: false,
    otherReasons: attempts.slice(1).map((a) => a.reason),
  };
}
export function planScenario(schools: ScenarioSchool[], input: ScenarioInput) {
  const assessed = schools.map((school) => ({
    school,
    assessment: assessSchool(school, input),
  }));
  const matched = assessed
    .filter((x) => x.assessment.matched)
    .sort(
      (a, b) =>
        (a.school.rank.value ?? Infinity) - (b.school.rank.value ?? Infinity) ||
        a.school.name.localeCompare(b.school.name),
    );
  return {
    selected: matched.slice(0, 10),
    matchedCount: matched.length,
    shortage: Math.max(0, 10 - matched.length),
    excluded: assessed.filter((x) => !x.assessment.matched),
  };
}
export function scenarioMatrix(
  schools: ScenarioSchool[],
  input: ScenarioInput,
) {
  return GRADE_BANDS.flatMap((band) =>
    SAT_SCENARIOS.map((sat) => ({
      band,
      sat,
      ...planScenario(schools, {
        ...input,
        band,
        sat,
        exactAverage: null,
        readingWriting: null,
        math: null,
      }),
    })),
  );
}
export function scenarioCsv(
  schools: ScenarioSchool[],
  input: ScenarioInput,
  sourceUrl: (id: string) => string,
) {
  const rows: (string | number)[][] = [
    [
      "Ontario band",
      "SAT",
      "Average calculation basis",
      "Applicant route",
      "School-specific calculation assumptions",
      "Result",
      "Shortage to10",
      "School",
      "2026 National Universities rank (if verified)",
      "Evidence category (component only)",
      "Program examined (not proven easiest)",
      "Academic conditions",
      "Remaining scope / conditions",
      "Source URLs",
    ],
  ];
  for (const item of scenarioMatrix(schools, input)) {
    if (!item.selected.length)
      rows.push([
        item.band,
        item.sat,
        input.averageBasis,
        input.applicantRoute,
        input.confirmedCalculations.join("; "),
        "No verified component matches",
        item.shortage,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]);
    for (const { school, assessment } of item.selected)
      rows.push([
        item.band,
        item.sat,
        input.averageBasis,
        input.applicantRoute,
        input.confirmedCalculations.join("; "),
        "Published component comparison only; no admission decision",
        item.shortage,
        school.name,
        school.rank.value ?? "unverified",
        assessment.reason,
        school.entry.program,
        [
          school.academic.text,
          assessment.rule?.basis ?? "",
          assessment.rule
            ? `Minimum ${assessment.rule.comparator === "gt" ? ">" : ">="} ${assessment.rule.minimum}%`
            : "",
        ]
          .filter(Boolean)
          .join(" | "),
        [
          school.applicantScope.text,
          school.testing.text,
          assessment.alternative?.remainingRequirements ?? "",
        ]
          .filter(Boolean)
          .join(" | "),
        [
          ...new Set([
            ...assessment.sourceIds,
            ...school.academic.sourceIds,
            ...school.testing.sourceIds,
            ...school.entry.sourceIds,
            ...school.applicantScope.sourceIds,
          ]),
        ]
          .map(sourceUrl)
          .join("; "),
      ]);
  }
  return (
    "\uFEFF" +
    rows
      .map((r) =>
        r.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(","),
      )
      .join("\r\n")
  );
}
