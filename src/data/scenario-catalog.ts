import { universities, sourceMap } from "./index.ts";
import { strategies } from "./strategies.ts";
import { evidenceMap } from "./evidence.ts";
import { universityKo } from "../locales/ko-universities.ts";
import existingRanks from "../../research/existing-rankings.json" with { type: "json" };
import comparisonContext from "../../research/comparison-context.json" with { type: "json" };
import {
  additionalScenarioSchools,
  scenarioRuleUpdates,
} from "./scenario-raw.ts";
import type { ScenarioSchool, AverageBasis } from "../scenario-types.ts";

const originalSchools: ScenarioSchool[] = universities.map((u) => {
  const strategy = strategies[u.id],
    ko = universityKo[u.id],
    e = evidenceMap.get(u.id);
  const academicKey = [
    "admission",
    "requirements",
    "admissionRequirements",
  ].find((k) => u.facts[k]);
  const ontarioKey = ["ontario", "canadian"].find((k) => u.facts[k]);
  const testingKey = ["testing", "sat"].find((k) => u.facts[k]);
  const entryKey = [
    "majorStructure",
    "admissionStructure",
    "structure",
    "majors",
  ].find((k) => u.facts[k]);
  const text = (
    key: string | undefined,
    fallback: string,
    fallbackKo: string,
  ) =>
    key
      ? {
          text: u.facts[key].text,
          textKo: ko?.[key] ?? fallbackKo,
          sourceIds: u.facts[key].sourceIds,
        }
      : { text: fallback, textKo: fallbackKo, sourceIds: [] };
  const rank = e?.ranking ?? existingRanks.find((r) => r.id === u.id);
  const sourceIds = rank
    ? "sourceId" in rank
      ? [rank.sourceId].filter((id): id is string => !!id)
      : "source" in rank && rank.source
        ? [rank.source.id]
        : []
    : [];
  const program = e?.majorEvidence?.[0];
  const entry = text(
    entryKey,
    "Program entry structure needs confirmation.",
    "전공별 신입학 구조를 추가 확인해야 합니다.",
  );
  const rule = text(
    ontarioKey,
    "No Ontario percentage cutoff verified.",
    "온타리오 백분율 기준 미확인.",
  );
  const school: ScenarioSchool = {
    id: u.id,
    name: u.name,
    nameKo:
      e?.ko.name ??
      (
        {
          asu: "애리조나 주립대학교",
          arizona: "애리조나 대학교",
          oregon: "오리건 대학교",
          colorado: "콜로라도 대학교 볼더",
          "michigan-state": "미시간 주립대학교",
          "indiana-bloomington": "인디애나 대학교 블루밍턴",
          "penn-state": "펜실베이니아 주립대학교 유니버시티파크",
          nyu: "뉴욕 대학교 (NYU)",
          "iowa-state": "아이오와 주립대학교",
        } as Record<string, string>
      )[u.id] ??
      u.name,
    state: u.state,
    city: u.city,
    type: u.type,
    rank: {
      edition: "2026",
      value: rank?.rank ?? null,
      sourceIds,
      verification: rank?.verification,
    },
    ontario: {
      minimum: null,
      basis: rule.text,
      basisKo: rule.textKo,
      sourceIds: rule.sourceIds,
    },
    academic: text(
      academicKey,
      "Full transcript assessment required.",
      "전체 성적표 심사가 필요합니다.",
    ),
    testing: {
      policy:
        strategy.testing === "Test optional"
          ? "optional"
          : strategy.testing === "Test required"
            ? "required"
            : "unknown",
      ...text(
        testingKey,
        "Entry-year testing policy needs confirmation.",
        "입학 연도 시험 규정 확인이 필요합니다.",
      ),
    },
    satRange: strategy.range ? { ...strategy.range, cohortKo: "" } : null,
    entry: {
      ...entry,
      program: program?.name ?? strategy.majors[0],
      programKo: e?.ko.majorNames[0] ?? strategy.majors[0],
      unit: program?.admissionUnit ?? strategy.structure,
      unitKo:
        e?.ko.majorEvidence?.[0]?.admissionUnit ??
        e?.ko.structure ??
        "공식 모집 단위 안내 확인",
      easierMajorVerified: false,
      sourceIds: [
        ...new Set([...entry.sourceIds, ...(program?.sourceIds ?? [])]),
      ],
    },
    applicantScope: {
      text: "Research concerns international first-year applicants with Ontario secondary records. Full transcript, prerequisite, English and program review remain necessary; no admission outcome is inferred.",
      textKo:
        "온타리오 고교 기록을 제출하는 국제 신입생에 관한 조사입니다. 전체 성적표·선수 과목·영어·전공 요건 심사가 필요하며 합격 결과를 추정하지 않습니다.",
      sourceIds: [
        ...new Set([...rule.sourceIds, ...text(academicKey, "", "").sourceIds]),
      ],
    },
    sources: u.sources,
  };
  const originalUnits: Record<string, [string, string]> = {
    asu: ["University / program admission", "대학·전공별 입학"],
    arizona: ["College of Social and Behavioral Sciences", "사회·행동과학대학"],
    oregon: ["College of Arts and Sciences", "문리대"],
    colorado: ["College of Arts and Sciences", "문리대"],
    "michigan-state": ["College of Social Science", "사회과학대학"],
    "indiana-bloomington": ["College of Arts and Sciences", "문리대"],
    "penn-state": ["College of the Liberal Arts", "문과대학"],
    nyu: ["College of Arts and Science", "문리대"],
    "iowa-state": [
      "College of Liberal Arts and Sciences",
      "인문사회·자연과학대학",
    ],
  };
  if (!program && originalUnits[u.id]) {
    school.entry.unit = originalUnits[u.id][0];
    school.entry.unitKo = originalUnits[u.id][1];
  }
  if (u.id === "asu")
    school.entry = {
      ...school.entry,
      text: comparisonContext.asuComparison.text,
      textKo: comparisonContext.asuComparison.ko,
      sourceIds: comparisonContext.asuComparison.sourceIds,
    };
  for (const update of scenarioRuleUpdates.filter((x) => x.id === u.id)) {
    if (update.ontario) school.ontario = { ...update.ontario };
    if (update.satAlternative) school.satAlternative = update.satAlternative;
  }
  const ids = [
    ...school.rank.sourceIds,
    ...school.entry.sourceIds,
    ...(school.satAlternative?.sourceIds ?? []),
  ];
  school.sources = [
    ...new Map(
      [
        ...school.sources,
        ...ids.flatMap((id) => {
          const s = sourceMap.get(id);
          return s ? [s] : [];
        }),
      ].map((s) => [s.id, s]),
    ).values(),
  ];
  return school;
});
// Basis keys are assigned only from the literal published calculation scope.
const basisKeys: Record<string, AverageBasis> = {
  "northern-iowa": "cumulative-academic",
  missouri: "core-secondary",
  iowa: "core-secondary",
  "portland-state": "overall-secondary",
};
for (const school of additionalScenarioSchools) {
  if (school.ontario.minimum !== null && !school.ontario.basisKey)
    school.ontario.basisKey = basisKeys[school.id] ?? "school-defined";
  if (school.percentageRule && !school.percentageRule.basisKey)
    school.percentageRule.basisKey = basisKeys[school.id] ?? "school-defined";
}
export const scenarioSchools = [
  ...originalSchools,
  ...additionalScenarioSchools,
];
export const scenarioSchoolMap = new Map(scenarioSchools.map((s) => [s.id, s]));
export const scenarioSourceMap = new Map([
  ...sourceMap,
  ...scenarioSchools.flatMap((s) =>
    s.sources.map((source) => [source.id, source] as const),
  ),
]);
