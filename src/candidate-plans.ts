import { GRADE_BANDS, type GradeBand } from "./types.ts";
import { SAT_SCENARIOS, compareSat } from "./comparison.ts";
import {
  scenarioSchoolMap,
  scenarioSourceMap,
} from "./data/scenario-catalog.ts";
import { ambitiousSchoolIds } from "./university-review.ts";
import { normalizeScenario } from "./scenarios.ts";
import type { ScenarioInput, ScenarioSchool } from "./scenario-types.ts";

// Editorial research shortlists, not a grade-to-GPA conversion or admission model.
// Display order is alphabetical; published requirements remain attached to
// each school. No placement below establishes a school's Ontario cutoff.
const rows: Record<GradeBand, string[][]> = {
  "60–65%": [
    [
      "toledo",
      "marshall",
      "central-missouri",
      "murray-state",
      "youngstown-state",
      "wichita-state",
      "cleveland-state",
      "missouri-southern",
      "akron",
      "washington-state",
    ],
    [
      "iowa-state",
      "wichita-state",
      "toledo",
      "marshall",
      "central-missouri",
      "murray-state",
      "youngstown-state",
      "cleveland-state",
      "akron",
      "washington-state",
    ],
    [
      "iowa-state",
      "wichita-state",
      "toledo",
      "marshall",
      "central-missouri",
      "murray-state",
      "youngstown-state",
      "cleveland-state",
      "akron",
      "washington-state",
    ],
    [
      "iowa-state",
      "wichita-state",
      "toledo",
      "marshall",
      "central-missouri",
      "murray-state",
      "youngstown-state",
      "cleveland-state",
      "akron",
      "washington-state",
    ],
    [
      "iowa-state",
      "wichita-state",
      "toledo",
      "marshall",
      "central-missouri",
      "murray-state",
      "youngstown-state",
      "cleveland-state",
      "akron",
      "washington-state",
    ],
  ],
  "65–70%": [
    [
      "kent-state",
      "toledo",
      "marshall",
      "central-missouri",
      "murray-state",
      "youngstown-state",
      "fort-hays-state",
      "cleveland-state",
      "washington-state",
      "wichita-state",
    ],
    [
      "iowa-state",
      "wichita-state",
      "kent-state",
      "toledo",
      "marshall",
      "central-missouri",
      "murray-state",
      "youngstown-state",
      "fort-hays-state",
      "washington-state",
    ],
    [
      "iowa-state",
      "wichita-state",
      "kent-state",
      "toledo",
      "marshall",
      "central-missouri",
      "murray-state",
      "youngstown-state",
      "fort-hays-state",
      "washington-state",
    ],
    [
      "iowa-state",
      "wichita-state",
      "kent-state",
      "toledo",
      "marshall",
      "central-missouri",
      "murray-state",
      "youngstown-state",
      "fort-hays-state",
      "washington-state",
    ],
    [
      "iowa-state",
      "wichita-state",
      "kent-state",
      "toledo",
      "marshall",
      "central-missouri",
      "murray-state",
      "youngstown-state",
      "fort-hays-state",
      "washington-state",
    ],
  ],
  "70–75%": [
    [
      "iowa",
      "james-madison",
      "portland-state",
      "temple",
      "kansas",
      "kansas-state",
      "nebraska-lincoln",
      "oklahoma-state",
      "toledo",
      "texas-state",
    ],
    [
      "iowa",
      "iowa-state",
      "james-madison",
      "temple",
      "kansas",
      "kansas-state",
      "nebraska-lincoln",
      "oklahoma-state",
      "portland-state",
      "texas-state",
    ],
    [
      "iowa",
      "iowa-state",
      "james-madison",
      "temple",
      "kansas",
      "kansas-state",
      "nebraska-lincoln",
      "oklahoma-state",
      "portland-state",
      "wichita-state",
    ],
    [
      "iowa",
      "iowa-state",
      "james-madison",
      "temple",
      "kansas",
      "kansas-state",
      "nebraska-lincoln",
      "oklahoma-state",
      "portland-state",
      "wichita-state",
    ],
    [
      "iowa",
      "iowa-state",
      "james-madison",
      "temple",
      "kansas",
      "kansas-state",
      "nebraska-lincoln",
      "oklahoma-state",
      "portland-state",
      "wichita-state",
    ],
  ],
  "75–80%": [
    [
      "arizona",
      "asu",
      "oregon",
      "iowa",
      "temple",
      "northern-iowa",
      "kansas",
      "nebraska-lincoln",
      "oklahoma-state",
      "texas-state",
    ],
    [
      "arizona",
      "asu",
      "oregon",
      "iowa",
      "iowa-state",
      "temple",
      "northern-iowa",
      "kansas",
      "nebraska-lincoln",
      "texas-state",
    ],
    [
      "arizona",
      "asu",
      "oregon",
      "iowa",
      "iowa-state",
      "baylor",
      "miami-ohio",
      "temple",
      "northern-iowa",
      "kansas",
    ],
    [
      "arizona",
      "asu",
      "oregon",
      "iowa",
      "iowa-state",
      "baylor",
      "miami-ohio",
      "temple",
      "northern-iowa",
      "kansas",
    ],
    [
      "arizona",
      "asu",
      "oregon",
      "iowa",
      "iowa-state",
      "baylor",
      "miami-ohio",
      "temple",
      "northern-iowa",
      "kansas",
    ],
  ],
  "80–85%": [
    [
      "uc-merced",
      "uc-riverside",
      "michigan-state",
      "arizona",
      "asu",
      "oregon",
      "missouri",
      "iowa",
      "temple",
      "iowa-state",
    ],
    [
      "uc-merced",
      "uc-riverside",
      "michigan-state",
      "purdue-west-lafayette",
      "arizona",
      "asu",
      "oregon",
      "missouri",
      "iowa",
      "baylor",
    ],
    [
      "uc-merced",
      "uc-riverside",
      "purdue-west-lafayette",
      "michigan-state",
      "colorado",
      "baylor",
      "delaware",
      "oregon",
      "missouri",
      "iowa",
    ],
    [
      "uc-merced",
      "uc-riverside",
      "purdue-west-lafayette",
      "penn-state",
      "michigan-state",
      "colorado",
      "baylor",
      "delaware",
      "oregon",
      "missouri",
    ],
    [
      "uc-merced",
      "uc-riverside",
      "purdue-west-lafayette",
      "penn-state",
      "michigan-state",
      "colorado",
      "baylor",
      "delaware",
      "oregon",
      "missouri",
    ],
  ],
  "85–90%": [
    [
      "uc-santa-cruz",
      "uc-davis",
      "uc-santa-barbara",
      "michigan-state",
      "indiana-bloomington",
      "colorado",
      "virginia-tech",
      "syracuse",
      "oregon",
      "arizona",
    ],
    [
      "uc-santa-cruz",
      "uc-davis",
      "uc-santa-barbara",
      "purdue-west-lafayette",
      "michigan-state",
      "indiana-bloomington",
      "colorado",
      "virginia-tech",
      "syracuse",
      "baylor",
    ],
    [
      "uc-santa-cruz",
      "uc-davis",
      "uc-santa-barbara",
      "purdue-west-lafayette",
      "penn-state",
      "indiana-bloomington",
      "michigan-state",
      "colorado",
      "delaware",
      "baylor",
    ],
    [
      "uc-santa-cruz",
      "uc-davis",
      "uc-santa-barbara",
      "rutgers-new-brunswick",
      "purdue-west-lafayette",
      "penn-state",
      "minnesota-twin-cities",
      "uconn",
      "umass-amherst",
      "indiana-bloomington",
    ],
    [
      "uc-santa-cruz",
      "uc-davis",
      "uc-santa-barbara",
      "rutgers-new-brunswick",
      "purdue-west-lafayette",
      "penn-state",
      "minnesota-twin-cities",
      "uconn",
      "umass-amherst",
      "indiana-bloomington",
    ],
  ],
  "90–95%": [
    [
      "uc-san-diego",
      "uc-irvine",
      "uc-davis",
      "uc-santa-barbara",
      "rutgers-new-brunswick",
      "penn-state",
      "minnesota-twin-cities",
      "virginia-tech",
      "uconn",
      "umass-amherst",
    ],
    [
      "uc-san-diego",
      "uc-irvine",
      "uc-davis",
      "uc-santa-barbara",
      "purdue-west-lafayette",
      "rutgers-new-brunswick",
      "penn-state",
      "minnesota-twin-cities",
      "virginia-tech",
      "uconn",
    ],
    [
      "uc-san-diego",
      "uc-irvine",
      "uc-davis",
      "uc-santa-barbara",
      "purdue-west-lafayette",
      "ohio-state-columbus",
      "rutgers-new-brunswick",
      "penn-state",
      "minnesota-twin-cities",
      "virginia-tech",
    ],
    [
      "uc-san-diego",
      "uc-irvine",
      "uc-davis",
      "uc-santa-barbara",
      "uchicago",
      "northwestern",
      "vanderbilt",
      "michigan-ann-arbor",
      "wisconsin-madison",
      "purdue-west-lafayette",
    ],
    [
      "uc-san-diego",
      "uc-irvine",
      "uc-davis",
      "uc-santa-barbara",
      "harvard",
      "cornell",
      "brown",
      "dartmouth",
      "northwestern",
      "duke",
    ],
  ],
  "95–100%": [
    [
      "uc-berkeley",
      "uc-los-angeles",
      "vanderbilt",
      "uchicago",
      "northwestern",
      "michigan-ann-arbor",
      "wisconsin-madison",
      "maryland-college-park",
      "rutgers-new-brunswick",
      "uconn",
    ],
    [
      "uc-berkeley",
      "uc-los-angeles",
      "vanderbilt",
      "uchicago",
      "northwestern",
      "michigan-ann-arbor",
      "wisconsin-madison",
      "maryland-college-park",
      "rutgers-new-brunswick",
      "uconn",
    ],
    [
      "uc-berkeley",
      "uc-los-angeles",
      "vanderbilt",
      "uchicago",
      "northwestern",
      "michigan-ann-arbor",
      "wisconsin-madison",
      "maryland-college-park",
      "rutgers-new-brunswick",
      "purdue-west-lafayette",
    ],
    [
      "uc-berkeley",
      "uc-los-angeles",
      "harvard",
      "duke",
      "northwestern",
      "uchicago",
      "cornell",
      "dartmouth",
      "penn",
      "vanderbilt",
    ],
    [
      "uc-berkeley",
      "uc-los-angeles",
      "harvard",
      "princeton",
      "yale",
      "stanford",
      "columbia",
      "penn",
      "duke",
      "uchicago",
    ],
  ],
};

export function normalizeCandidateInput(value: unknown): ScenarioInput {
  const input = normalizeScenario(value);
  return {
    ...input,
    applicantRoute: "international",
    averageBasis: "unknown",
    confirmedCalculations: [],
    exactAverage: null,
    readingWriting: null,
    math: null,
  };
}
export function candidatePlan(input: ScenarioInput) {
  if (!input.band || input.sat === null || input.sat < 1100 || input.sat > 1600)
    return {
      kind: "editorial-review" as const,
      referenceSat: null,
      selected: [] as ScenarioSchool[],
    };
  const referenceSat = SAT_SCENARIOS.filter((n) => n <= input.sat!).at(-1)!;
  const ids = rows[input.band][SAT_SCENARIOS.indexOf(referenceSat)];
  return {
    kind: "editorial-review" as const,
    referenceSat,
    selected: ids
      .map((id) => {
        const school = scenarioSchoolMap.get(id);
        if (!school) throw new Error(`Missing researched school: ${id}`);
        return school;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "en")),
  };
}
export function candidateMatrix() {
  return GRADE_BANDS.flatMap((band) =>
    SAT_SCENARIOS.map((sat) => ({
      band,
      sat,
      ...candidatePlan(normalizeCandidateInput({ band, sat })),
    })),
  );
}
export function gradeResearchNote(band: GradeBand | "", ko: boolean) {
  const i = band ? GRADE_BANDS.indexOf(band) : -1;
  if (i < 2)
    return ko
      ? "이 구간은 낮은 공개 GPA 요건·SAT 대체 경로·특별 심사·예비과정부터 조사합니다. 온타리오 성적표 환산이 없어 10곳 모두 자격 충족을 확정한 것은 아닙니다. SAT가 높아져도 필수 내신 요건은 사라지지 않아 일부 목록이 같습니다."
      : "Start with lower published GPA requirements, SAT alternatives, special review and foundation routes. Without university transcript evaluation, these ten are not confirmed eligible. Higher SAT scores do not erase academic requirements, so some lists repeat.";
  if (i < 4)
    return ko
      ? "온타리오 백분율 기준을 공개한 대학과 국제 성적표 심사 대학을 함께 검토합니다. 내신은 대학별 과목·학년 계산 방식으로 다시 확인해야 합니다. 이 구간 배치는 조사 우선순위이며 대학의 공식 합격선이 아닙니다."
      : "Compare published Ontario-percentage routes with international transcript-review routes. Each university uses its own subjects and school years. Placement is a research priority, not an official admission cutoff.";
  if (i < 6)
    return ko
      ? "문리대·인문사회계열 모집 구조와 공개 SAT 집단 자료를 비교해 조사 후보를 넓혔습니다. 개별 성적표·과목 난도 심사가 필요하며, 내신 구간별 선정은 편집 판단입니다."
      : "Broaden the research using liberal-arts entry structures and published SAT cohorts. Transcript and curriculum review are still required; grade-band placement is editorial judgment.";
  return ko
    ? "순위가 높은 대학도 도전 검토 대상으로 포함합니다. 낮은 SAT에서는 선택 제출 정책이 확인된 대학을 우선 조사하되 적용 연도를 다시 확인해야 합니다. 높은 내신·SAT도 합격이나 인문계 우위를 보장하지 않습니다."
    : "Include highly ranked universities as ambitious research options. At lower SAT scores, prioritize reviewing test-optional policies and their applicable years. Strong grades and scores do not guarantee admission or a humanities advantage.";
}
export function candidateRoute(s: ScenarioSchool, ko: boolean) {
  if (s.id.startsWith("uc-"))
    return ko
      ? "UC · 현행 SAT 미반영 · 2028년 미정"
      : "UC · currently test-free · Fall2028 undecided";
  if (ambitiousSchoolIds.has(s.id))
    return ko
      ? "매우 높은 도전 · 편집 판단"
      : "Very ambitious reach · editorial assessment";
  if (s.id === "washington-state")
    return ko
      ? "직접 입학 / Foundation 별도 검토"
      : "Direct / foundation routes reviewed separately";
  if (s.id === "youngstown-state")
    return ko
      ? "일반 / 특별 심사 경로 확인"
      : "Regular / special review routes published";
  if (s.satAlternative)
    return ko
      ? "공식 SAT 대체 경로 · 나머지 요건 별도"
      : "Published SAT alternative; other requirements remain";
  if (s.ontario.minimum !== null)
    return ko
      ? "온타리오 기준 공개 · 계산 방식 확인 필요"
      : "Ontario criterion published; calculation needs review";
  if (s.id === "toledo")
    return ko
      ? "인문계의 낮은 공개 GPA 요건 확인"
      : "Lower published humanities GPA requirement";
  if (s.id === "texas-state")
    return ko
      ? "온타리오 과목별 환산표 공개"
      : "Ontario course-level grading scale published";
  return ko
    ? "국제 성적표 개별 심사 필요"
    : "Individual international transcript review required";
}
export function candidateSatAdvice(
  s: ScenarioSchool,
  sat: number | null,
  ko: boolean,
) {
  if (s.id.startsWith("uc-"))
    return ko
      ? "현행 UC 입학 심사에서는 SAT 1100·1500·1600 모두 가산 효과가 없습니다. 2028년 가을 정책은 아직 미정이므로, 현재 규정을 확정된 2028년 규정으로 해석하지 마세요."
      : "Under current UC rules, SAT1100,1500 and1600 provide no admission advantage. Fall2028 policy is undecided; the current rule is not a confirmed2028 rule.";
  if (s.testing.policy === "not-considered")
    return ko
      ? "SAT를 입학 결정에 사용하지 않습니다. 높은 점수로 이 대학의 지원 난도를 낮춰 표시하지 않습니다."
      : "SAT is not used for admission; a higher score is not treated as an admission advantage.";
  if (sat === null)
    return ko
      ? "SAT를 입력하면 공개 시험 기준과 비교합니다."
      : "Enter SAT to compare published testing evidence.";
  if (s.satAlternative && sat >= s.satAlternative.minimum) {
    const sections = s.satAlternative.sectionMinimums;
    return ko
      ? `SAT ${s.satAlternative.minimum}+ 대체 경로의 총점에 해당합니다.${sections ? ` 영역별 ${sections.readingWriting}/${sections.math} 조건도 확인해야 합니다.` : ""} GPA 항목에 한하며 필수 과목·영어·졸업 요건은 별도입니다.`
      : `Meets the ${s.satAlternative.minimum}+ total for a GPA-component alternative.${sections ? ` Check section minima ${sections.readingWriting}/${sections.math}.` : ""} Coursework, English and graduation requirements remain.`;
  }
  if (s.id === "harvard")
    return ko
      ? `SAT ${sat}점 자체로 지원이 배제되지는 않습니다. 공식 시험 최저점 제한은 없습니다. 점수만으로 적정·안정 지원으로 분류할 수 없으며 만점이어도 매우 높은 도전 후보입니다. 검증된 총점 분포는 기재하지 않았습니다.`
      : `SAT ${sat} alone does not exclude an application: Harvard has no testing cutoff. A score alone cannot establish a match or safety; even a perfect score leaves this a very ambitious option. No verified composite distribution is asserted.`;
  if (!s.satRange)
    return ko
      ? "검증된 총점 분포가 없어 점수상 적정·안정으로 분류하지 않습니다. 아래 시험 규정과 학업 요건을 확인하세요."
      : "No verified composite distribution: no score-fit label is assigned. Check testing and academic rules below.";
  const position = compareSat(sat, s.satRange);
  if (position === "below")
    return ko
      ? `SAT ${sat}은 공개 중앙 50%(${s.satRange.low}–${s.satRange.high}) 아래입니다. ${s.testing.policy === "optional" ? "선택 제출 적용 연도와 미제출 지원을 검토하세요." : "시험이 기대·필수인 경우 점수 개선을 검토하세요."} 내신만으로 이를 보완한다고 단정할 수 없습니다.`
      : `SAT ${sat} is below the published middle 50% (${s.satRange.low}–${s.satRange.high}). ${s.testing.policy === "optional" ? "Review test-optional eligibility and applying without the score." : "Consider improving the expected/required score."} Strong grades do not establish compensation.`;
  return ko
    ? `SAT ${sat}은 공개 중앙 50%(${s.satRange.low}–${s.satRange.high})${position === "above" ? "보다 높습니다" : " 안입니다"}. 해당 집단과 시험 점수만 비교한 결과이며 합격선·합격 확률은 아닙니다.`
    : `SAT ${sat} is ${position === "above" ? "above" : "within"} the published middle 50% (${s.satRange.low}–${s.satRange.high}). This compares scores with a cohort, not admission eligibility or probability.`;
}
export function candidateCsv() {
  const fields = [
    "Ontario band (editorial)",
    "SAT",
    "University",
    "Program",
    "Route",
    "Academic requirement",
    "SAT comparison",
    "Cohort",
    "Unresolved / applicant scope",
    "Selection method",
    "Official sources",
  ];
  const quote = (x: unknown) => `"${String(x ?? "").replaceAll('"', '""')}"`;
  const result = [fields];
  for (const cell of candidateMatrix())
    cell.selected.forEach((s) =>
      result.push([
        cell.band,
        String(cell.sat),
        s.name,
        s.entry.program,
        candidateRoute(s, false),
        s.academic.text,
        candidateSatAdvice(s, cell.sat, false),
        s.satRange?.cohort ?? "Not verified",
        s.applicantScope.text,
        `Editorial research candidate, NOT confirmed eligibility. ${gradeResearchNote(cell.band, false)}`,
        [
          ...new Set([
            ...s.academic.sourceIds,
            ...s.entry.sourceIds,
            ...s.testing.sourceIds,
            ...s.applicantScope.sourceIds,
            ...s.ontario.sourceIds,
            ...(s.satRange?.sourceIds ?? []),
            ...(s.satAlternative?.sourceIds ?? []),
          ]),
        ]
          .map((id) => scenarioSourceMap.get(id)?.url ?? "")
          .filter(Boolean)
          .join(" | "),
      ]),
    );
  return "\ufeff" + result.map((row) => row.map(quote).join(",")).join("\r\n");
}
