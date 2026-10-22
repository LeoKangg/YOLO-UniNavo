import { getLanguage, translate } from "./i18n.ts";
import { GRADE_BANDS } from "./types.ts";
import { SAT_SCENARIOS, compareSat } from "./comparison.ts";
import { SAT_BANDS, bandPosition } from "./sat-bands.ts";
import { scenarioSchools, scenarioSourceMap } from "./data/scenario-catalog.ts";
import { planScenario, scenarioMatrix, assessSchool } from "./scenarios.ts";
import type {
  ScenarioSchool,
  ScenarioInput,
  RuleAssessment,
  AverageBasis,
  EvidenceReason,
} from "./scenario-types.ts";
export type ExplorerMode =
  | "scenario"
  | "all-scenarios"
  | "catalog"
  | "sat-map"
  | "saved";
const w = (en: string, ko: string) => (getLanguage() === "ko" ? ko : en);
const esc = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const name = (s: ScenarioSchool) => w(s.name, s.nameKo);
export const basisLabels: Record<AverageBasis, [string, string]> = {
  unknown: ["Not confirmed", "계산 방식 미확인"],
  "cumulative-academic": [
    "Cumulative academic subjects",
    "고교 전체 누적 학업 과목",
  ],
  "core-secondary": [
    "Core subjects across secondary school",
    "고교 핵심 교과 전체 평균",
  ],
  "overall-secondary": ["Overall secondary-school average", "고교 전체 평균"],
  "grade12-top6": ["Grade12 top six U/M", "12학년 상위 6개 U/M"],
  "school-defined": [
    "Calculation confirmed by the university",
    "대학에 계산 방식 직접 확인",
  ],
};
const refs = (ids: string[]) =>
  `<div class="scenario-refs" data-original-language lang="en">${[
    ...new Set(ids),
  ]
    .map((id) => {
      const s = scenarioSourceMap.get(id);
      return s
        ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`
        : "";
    })
    .join("")}</div>`;
export function reasonText(reason: EvidenceReason) {
  const labels: Record<EvidenceReason, [string, string]> = {
    "matched-percentage": [
      "Published percentage component matches",
      "공개 내신 항목 기준에 해당",
    ],
    "matched-sat-alternative": [
      "Published GPA-component alternative matches",
      "공식 GPA 항목 대체 조건에 해당",
    ],
    "no-percentage": [
      "No verified Ontario percentage or applicable SAT alternative",
      "온타리오 백분율·적용 가능한 SAT 대체 기준 미확인",
    ],
    "basis-needed": [
      "Average calculation basis needs confirmation",
      "성적 계산 방식 확인 필요",
    ],
    "calculation-needed": [
      "Confirm this university's own calculation separately",
      "이 대학의 개별 평균 계산 방식 확인 필요",
    ],
    "invalid-sat": [
      "SAT total and section scores contradict each other",
      "SAT 총점과 영역 점수가 맞지 않음",
    ],
    "below-percentage": [
      "Below the published percentage component",
      "공개 내신 항목 기준 미만",
    ],
    "straddles-percentage": [
      "Band crosses the published minimum; exact mark needed",
      "구간이 최저 기준에 걸침 · 정확한 평균 필요",
    ],
    "test-policy-unverified": [
      "Applicable testing rule not resolved",
      "시험 적용 규정 미확인",
    ],
    "sat-not-enough": [
      "Below the published GPA-alternative score",
      "공개 GPA 대체 시험 기준 미만",
    ],
    "sections-needed": [
      "SAT section scores need confirmation",
      "SAT 영역별 조건 확인 필요",
    ],
    "conflicting-rule": [
      "Official sources conflict; excluded",
      "공식 자료 불일치 · 자동 추천 제외",
    ],
    "route-unreviewed": [
      "Separate U.S. applicant assessment required",
      "미국 시민·영주권 전형 별도 확인 필요",
    ],
    "inputs-needed": [
      "Choose a grade band and SAT score",
      "내신 구간과 SAT 점수를 선택하세요",
    ],
  };
  return w(...labels[reason]);
}
const rank = (s: ScenarioSchool) =>
  s.rank.value !== null
    ? `#${s.rank.value} · 2026`
    : w("National rank not verified", "종합 순위 미확인");
const byRank = (a: ScenarioSchool, b: ScenarioSchool) =>
  (a.rank.value ?? Infinity) - (b.rank.value ?? Infinity) ||
  a.name.localeCompare(b.name);
function satText(s: ScenarioSchool, input: ScenarioInput) {
  if (s.testing.policy === "not-considered")
    return w("SAT not considered", "SAT 입학 심사 미반영");
  if (!s.satRange)
    return w("Composite reference not verified", "총점 분포 미확인");
  const p = input.sat === null ? "unknown" : compareSat(input.sat, s.satRange);
  return `${s.satRange.low}–${s.satRange.high} · ${w(p === "below" ? "below historical range" : p === "above" ? "above historical range" : p === "within" ? "within historical range" : "historical reference", p === "below" ? "과거 분포 미만" : p === "above" ? "과거 분포 초과" : p === "within" ? "과거 분포 안" : "과거 집단 참고")}`;
}
function schoolCard(
  s: ScenarioSchool,
  input: ScenarioInput,
  saved: Set<string>,
  assessment?: RuleAssessment,
  index?: number,
) {
  return `<article class="scenario-school-card"><div class="scenario-card-head"><span class="scenario-order">${index !== undefined ? String(index + 1).padStart(2, "0") : "↗"}</span><div><span class="small">${esc(rank(s))}</span><h3><button data-detail="${s.id}">${esc(name(s))}</button></h3><span class="small muted">${esc(s.city)}, ${esc(s.state)}</span></div><button class="save-button ${saved.has(s.id) ? "saved" : ""}" data-save="${s.id}" aria-label="${esc(w("Save school", "대학 저장"))} ${esc(name(s))}" aria-pressed="${saved.has(s.id)}">${saved.has(s.id) ? "✓" : "+"}</button></div>${assessment ? `<div class="verified-rule-tag">${esc(reasonText(assessment.reason))}</div>` : ""}<div class="scenario-program"><span class="eyebrow">${w("Program / entry unit examined", "검토 전공 · 모집 단위")}</span><strong>${esc(translate(w(s.entry.program, s.entry.programKo)))}</strong><span>${esc(w(s.entry.unit, s.entry.unitKo))}</span><p>${esc(w(s.entry.text, s.entry.textKo))}</p>${refs(s.entry.sourceIds)}</div><dl class="scenario-card-facts"><div><dt>${w("Ontario / academic rule", "내신 · 학업 기준")}</dt><dd>${esc(
    assessment?.rule
      ? `${assessment.rule.comparator === "gt" ? ">" : "≥"} ${assessment.rule.minimum}% · ${w(assessment.rule.basis, assessment.rule.basisKo)}`
      : assessment?.alternative
        ? `SAT ${assessment.alternative.minimum}+${assessment.alternative.sectionMinimums ? ` · Reading & Writing ${assessment.alternative.sectionMinimums.readingWriting}+ · Math ${assessment.alternative.sectionMinimums.math}+` : ""}. ${w("GPA component only; coursework and other requirements remain.", "GPA 항목에 한함 · 필수 과목과 기타 요건은 별도입니다.")}`
        : w(s.ontario.basis, s.ontario.basisKo),
  )}</dd></div><div><dt>SAT</dt><dd>${esc(satText(s, input))}</dd></div></dl>${assessment ? refs(assessment.sourceIds) : ""}<p class="scenario-remaining">${esc(w(s.applicantScope.text, s.applicantScope.textKo))}</p><button class="text-button" data-detail="${s.id}">${w("Requirements, cohort & sources →", "지원 요건 · 집단 · 출처 →")}</button></article>`;
}
function selectors(input: ScenarioInput) {
  return `<section class="scenario-selectors" aria-label="${w("Scenario inputs", "조건별 탐색 입력")}"><label>${w("Ontario average band", "온타리오 내신 구간")}<select id="scenario-band"><option value="">${w("Select", "선택")}</option>${GRADE_BANDS.map((b) => `<option value="${b}" ${input.band === b ? "selected" : ""}>${b}</option>`).join("")}</select></label><label>SAT<select id="scenario-sat"><option value="">${w("Select", "선택")}</option>${[
    ...new Set<number>([
      ...SAT_SCENARIOS,
      1600,
      ...(input.sat !== null ? [input.sat] : []),
    ]),
  ]
    .sort((a, b) => a - b)
    .map(
      (score) =>
        `<option value="${score}" ${input.sat === score ? "selected" : ""}>${score}</option>`,
    )
    .join(
      "",
    )}</select></label><label class="scenario-basis">${w("How was the average calculated?", "이 평균은 어떤 성적입니까?")}<select id="scenario-basis">${Object.entries(
    basisLabels,
  )
    .map(
      ([id, labels]) =>
        `<option value="${id}" ${id === input.averageBasis ? "selected" : ""}>${esc(w(...labels))}</option>`,
    )
    .join(
      "",
    )}</select></label><label>${w("Applicant scenario", "지원자 시나리오")}<select id="scenario-route"><option value="international" ${input.applicantRoute === "international" ? "selected" : ""}>${w("International first-year", "국제 신입생")}</option><option value="us" ${input.applicantRoute === "us" ? "selected" : ""}>${w("U.S. citizen / permanent resident", "미국 시민권·영주권")}</option></select></label><details class="scenario-calculations" data-disclosure="scenario-calculations"><summary>${w("University-specific average calculations", "대학별 평균 계산 기준 확인")}</summary><p>${w("Select only after reading the linked calculation. Checking means each scenario's band represents an average calculated by that university's method. It does not convert a top-six average or prove admission. For your transcript, calculate each university's average separately; do not reuse a different average.", "연결된 기준을 읽은 뒤 체크하세요. 체크한 대학은 각 시나리오의 점수가 그 대학 방식으로 계산된 평균이라는 전제로 비교합니다. 상위 6과목 평균을 환산하거나 합격을 확정하지 않습니다. 실제 지원 시 대학별로 평균을 따로 계산해야 합니다.")}</p>${scenarioSchools
    .filter((s) => s.ontario.minimum !== null || s.percentageRule)
    .map((s) => {
      const rule = s.ontario.minimum !== null ? s.ontario : s.percentageRule!;
      return `<div class="scenario-calculation"><label><input type="checkbox" data-calculation="${s.id}" ${input.confirmedCalculations.includes(s.id) ? "checked" : ""}><span><strong>${esc(name(s))}</strong><span>${esc(w(rule.basis, rule.basisKo))}</span>${s.id === "missouri" ? `<span>${w("Required13 units: math4, science3, social studies3, languages2, fine arts1.", "필수 13단위: 수학 4·과학 3·사회 3·언어 2·미술 1.")}</span>` : ""}</span></label>${refs(rule.sourceIds)}</div>`;
    })
    .join(
      "",
    )}</details><details class="scenario-precise" data-disclosure="scenario-precise"><summary>${w("Exact average / SAT sections (optional)", "정확한 평균 · SAT 영역 점수 (선택)")}</summary><div><label>${w("Exact average within this band", "선택 구간 안의 정확한 평균")}<input id="scenario-exact" type="number" min="0" max="100" step="0.1" value="${input.exactAverage ?? ""}" placeholder="72.5"></label><label>SAT Reading & Writing<input id="scenario-reading" type="number" min="200" max="800" step="10" value="${input.readingWriting ?? ""}" placeholder="200–800"></label><label>SAT Math<input id="scenario-math" type="number" min="200" max="800" step="10" value="${input.math ?? ""}" placeholder="200–800"></label></div><p class="small">${w("Needed when a grade band crosses a published cutoff or a test alternative requires section minima. Changing the total clears section scores.", "구간이 공개 기준에 걸치거나 SAT 대체 조건에 영역별 최저점이 있을 때 필요합니다. 총점을 바꾸면 영역 점수는 초기화됩니다.")}</p></details></section>`;
}
function matching(input: ScenarioInput, saved: Set<string>) {
  if (!input.band || input.sat === null)
    return `<div class="comparison-empty"><h2>${w("Choose a grade band and SAT score.", "내신 구간과 SAT 점수를 선택하세요.")}</h2><p>${w("We check the full research pool against published rules. Unverified candidates do not fill missing places.", "전체 조사 대학에서 공식 기준을 대조합니다. 확인되지 않은 후보로 부족한 수를 채우지 않습니다.")}</p></div>`;
  const plan = planScenario(scenarioSchools, input);
  return `<section class="scenario-result-head"><div><span class="eyebrow">${esc(input.band)} · SAT ${input.sat}</span><h2>${w(`${plan.selected.length} verified component matches`, `공개 항목 비교 가능 ${plan.selected.length}곳`)}</h2></div><div class="scenario-shortage"><strong>${plan.shortage}</strong><span>${w("short of10 verified matches", "10곳까지 부족한 수")}</span></div></section><div class="scenario-accuracy"><strong>${w("Published components only — final admission remains a university decision.", "공개된 학업·시험 항목을 대조한 결과입니다. 최종 입학 자격·합격은 대학이 심사합니다.")}</strong><p>${w("Other coursework, English, graduation and program requirements remain. Current rules do not establish Fall2028 policy. Historical SAT percentiles alone never qualify a school for this list.", "필수 과목·영어·졸업·전공 요건은 별도입니다. 현행 규정이 2028년 규정을 확정하지 않으며, 과거 SAT 분포만으로 목록에 넣지 않습니다.")}</p></div>${input.averageBasis === "unknown" ? `<p class="scenario-input-hint">${w("Confirm the average calculation above to evaluate published percentage rules. SAT GPA-alternative rules can be checked separately.", "성적 계산 방식 선택과 대학별 계산 기준 확인이 있어야 공개 내신 기준을 비교할 수 있습니다. SAT로 GPA 항목을 대체하는 공식 규정은 별도로 확인합니다.")}</p>` : ""}<div class="scenario-school-list">${plan.selected.map(({ school, assessment }, i) => schoolCard(school, input, saved, assessment, i)).join("") || `<div class="empty-state"><h3>${w("No verified component matches for these inputs.", "현재 입력으로 확인된 항목 일치 대학이 없습니다.")}</h3><p>${w("This is not a rejection. Published Ontario equivalencies may be missing, an averaging method may differ, or a section score may need confirmation. Review the audit below.", "불합격을 뜻하지 않습니다. 온타리오 환산 기준 미공개, 평균 산정 방식 차이, 영역 점수 미확인 등이 원인일 수 있습니다. 아래 검토 기록을 확인하세요.")}</p></div>`}</div><p class="small">${w("Order: verified2026 U.S.News National Universities rank within matching schools; ranks not verified are listed afterward by name. This is not a nationwide best-admission guarantee.", "정렬: 일치 대학 안에서 확인된 U.S. News 2026 종합 순위 우선, 순위 미확인은 이름순입니다. 미국 전체에서 가장 좋은 합격 가능 대학을 확정하는 순위가 아닙니다.")}</p><details class="methodology scenario-audit" data-disclosure="scenario-audit"><summary>${w(`Why ${plan.excluded.length} schools were not included`, `나머지 ${plan.excluded.length}곳을 넣지 않은 이유`)}</summary><div class="table-wrap"><table><thead><tr><th>${w("University", "대학교")}</th><th>${w("Reason", "미포함 사유")}</th><th>${w("Evidence", "근거")}</th></tr></thead><tbody>${plan.excluded.map(({ school, assessment }) => `<tr><th scope="row"><button class="school-table-link" data-detail="${school.id}">${esc(name(school))}</button></th><td>${esc(reasonText(assessment.reason))}${assessment.otherReasons.length ? `<span class="small">${assessment.otherReasons.map(reasonText).map(esc).join(" · ")}</span>` : ""}</td><td>${refs(assessment.sourceIds)}</td></tr>`).join("")}</tbody></table></div></details>`;
}
function matrix(input: ScenarioInput) {
  const rows = scenarioMatrix(scenarioSchools, input);
  return `<div class="scenario-matrix-intro"><h2>${w("All40 combinations", "전체 40개 조합")}</h2><p>${w("Each cell gives the verified component-match count and remaining shortage. The selected basis, applicant route and university calculation confirmations apply to every cell. Each band conditionally represents that university’s own average calculation. Exact grades and section scores are not assumed.", "각 칸은 공개 항목 비교 가능 수와 부족한 수입니다. 현재 성적 계산 방식·지원자 구분·대학별 계산 기준 체크를 적용합니다. 체크한 대학의 방식으로 각 구간의 평균을 계산했다는 조건부 비교이며, 정확한 평균·영역 점수는 가정하지 않습니다.")}</p><button class="text-button" id="export-scenarios">${w("Download40-scenario results ↓", "전체 40조합 결과 내려받기 ↓")}</button></div><div class="table-wrap"><table class="strict-scenario-matrix"><thead><tr><th>${w("Ontario average", "온타리오 내신")}</th>${SAT_SCENARIOS.map((n) => `<th>SAT ${n}</th>`).join("")}</tr></thead><tbody>${GRADE_BANDS.map(
    (b) =>
      `<tr><th scope="row">${b}</th>${SAT_SCENARIOS.map((sat) => {
        const cell = rows.find((r) => r.band === b && r.sat === sat)!;
        return `<td><button data-scenario-choice="${b}|${sat}"><strong>${w(`${cell.selected.length} schools`, `${cell.selected.length}곳`)}</strong><span>${w(`${cell.shortage} short`, `${cell.shortage}곳 부족`)}</span></button></td>`;
      }).join("")}</tr>`,
  ).join("")}</tbody></table></div>`;
}
function scoreMap(input: ScenarioInput) {
  const known = scenarioSchools.filter(
    (s) => s.satRange && s.testing.policy !== "not-considered",
  );
  const cell = (schools: ScenarioSchool[]) =>
    schools
      .map(
        (s) =>
          `<button class="sat-band-school" data-detail="${s.id}">${esc(name(s))}<span class="sat-band-range">${s.satRange!.low}–${s.satRange!.high}</span></button>`,
      )
      .join("") || "<span>—</span>";
  return `<div class="scenario-accuracy"><p>${w("Historical score position only. This table does not decide strict recommendations; Ontario and program rules must be verified independently.", "과거 시험 점수 위치만 비교합니다. 이 표로 공식 조건 추천을 판정하지 않으며 내신·전공 기준은 별도로 확인합니다.")}</p></div><div class="table-wrap"><table class="sat-band-table"><caption>${w(`${known.length} verified composite profiles in the full pool`, `전체 조사 대학 중 총점 분포 확인 ${known.length}곳`)}</caption><thead><tr><th>SAT</th><th>${w("Above range", "점수상 여유")}</th><th>${w("Overlaps range", "분포와 겹침")}</th><th>${w("Below range", "점수상 도전")}</th></tr></thead><tbody>${SAT_BANDS.map((b) => `<tr><th scope="row">${b.low === b.high ? b.low : `${b.low}–${b.high}`}${input.sat !== null && input.sat >= b.low && input.sat <= b.high ? " ●" : ""}</th>${(["above", "overlap", "below"] as const).map((p) => `<td class="band-${p}"><div class="pool-score-list">${cell(known.filter((s) => bandPosition(b, s.satRange!) === p).sort(byRank))}</div></td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
export function renderExplorer(
  input: ScenarioInput,
  mode: ExplorerMode,
  search: string,
  saved: Set<string>,
) {
  const list = scenarioSchools
    .filter(
      (s) =>
        (mode !== "saved" || saved.has(s.id)) &&
        `${s.name} ${s.nameKo} ${s.entry.program} ${s.entry.programKo}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort(byRank);
  return `<div class="page-intro"><span class="eyebrow">${scenarioSchools.length} ${w("UNIVERSITIES RESEARCHED", "개 대학 조사")}</span><h1>${w("Find schools with verified rules.", "공식 조건으로 대학 찾기")}</h1><p>${w("Choose an Ontario grade band and SAT score. Up to10 schools, only where published components can be compared.", "내신 구간과 SAT 점수별로 최대 10곳. 공식 항목을 확인할 수 있는 대학만 보여드립니다.")}</p></div>${selectors(input)}<div class="tabs" aria-label="${w("University view", "대학교 목록 보기")}">${(
    [
      ["scenario", w("Up to10 verified matches", "조건별 최대 10곳")],
      ["all-scenarios", w("All40 scenarios", "전체 40개 조합")],
      [
        "catalog",
        w(
          `All${scenarioSchools.length} researched schools`,
          `전체 ${scenarioSchools.length}개 조사 대학`,
        ),
      ],
      ["sat-map", w("SAT distribution table", "SAT 분포 표")],
      ["saved", w(`Saved (${saved.size})`, `저장한 대학 (${saved.size})`)],
    ] as const
  )
    .map(
      ([id, label]) =>
        `<button data-explorer-mode="${id}" aria-pressed="${mode === id}" class="${mode === id ? "active" : ""}">${label}</button>`,
    )
    .join(
      "",
    )}</div>${mode === "catalog" || mode === "saved" ? `<div class="filter-bar"><label class="search-field"><span>${w("University or program", "대학 · 전공 검색")}</span><input id="scenario-search" type="search" value="${esc(search)}"></label><span role="status">${list.length} ${w("schools", "곳")}</span></div><p class="small">${w("Research coverage is broader than the recommendation list. These records include schools whose Ontario equivalencies remain unverified; no admission-fit label is assigned from an assumed GPA conversion.", "조사 목록과 추천 목록은 다릅니다. 온타리오 환산 기준이 확인되지 않은 학교도 조사 기록으로 남기며, 임의 GPA 환산으로 지원 가능 분류를 붙이지 않습니다.")}</p><div class="scenario-school-list">${list.map((s) => schoolCard(s, input, saved)).join("") || `<p class="empty-state">${w("No schools match.", "해당 대학이 없습니다.")}</p>`}</div>` : mode === "all-scenarios" ? matrix(input) : mode === "sat-map" ? scoreMap(input) : matching(input, saved)}<details class="methodology"><summary>${w("Strict evidence policy & program selection", "공식 조건 추천 원칙 · 전공 선택 기준")}</summary><p>${w("A university enters the strict list only when a sourced Ontario/official100-point rule can be compared using the correct average basis, or an explicitly applicable SAT route replaces the GPA component. Missing conversions, conflicting sources and unresolved testing rules are excluded. Score distributions are historical descriptions, not admission minimums.", "온타리오·공식 100점 척도 기준을 올바른 평균 산정 방식으로 비교할 수 있거나, 적용이 명확한 SAT 규정이 GPA 항목을 대체하는 경우만 목록에 넣습니다. 환산 기준 미확인·자료 불일치·시험 규정 미확인은 제외합니다. SAT 분포는 과거 집단의 수치이며 합격선이 아닙니다.")}</p><p>${w("The examined major is backed by an official program or admission source. Unless a university explicitly supplies comparative entry requirements, we do not label it the easiest major. Graduation and later major-declaration conditions cannot establish an easier freshman-admission route.", "검토 전공은 공식 학과·입학 안내를 근거로 적었습니다. 대학이 비교 가능한 입학 요건을 공개하지 않으면 ‘가장 쉬운 과’라고 표시하지 않습니다. 졸업·입학 후 전공 선언 조건을 신입학 최저점으로 사용하지 않습니다.")}</p><p>${w("The list ranks only verified matching records in this expanding research pool, not every U.S.university.2026U.S.NewsNationalUniversities is a common historical reference, not the latest edition or a measured Korean recognition rank. Current criteria and future2028 policies are distinguished.", "계속 확장하는 조사 목록에서 확인 가능한 학교를 정렬하며 미국 모든 대학의 합격 가능성을 판정하지 않습니다. U.S. News 2026 종합대학 순위는 비교용 과거 자료로 최신판이나 한국 인지도 조사 순위가 아닙니다. 현행 요건과 2028년 확정 규정을 구분합니다.")}</p></details>`;
}
export function renderScenarioDetail(s: ScenarioSchool, input: ScenarioInput) {
  const assessment = assessSchool(s, input);
  const section = (title: string, text: string, ids: string[]) =>
    `<section class="scenario-detail-section"><h3>${title}</h3><p>${esc(text)}</p>${refs(ids)}</section>`;
  return `<div class="dialog-header"><span class="eyebrow">${esc(rank(s))}</span><button class="close-dialog" aria-label="${w("Close university details", "대학 상세 닫기")}">×</button></div><div class="dialog-body"><span class="eyebrow">${esc(s.city)}, ${esc(s.state)}</span><h2 id="dialog-title">${esc(name(s))}</h2><p class="verified-rule-tag">${esc(reasonText(assessment.reason))}</p><div class="scenario-accuracy"><p>${w("This checks published components, not final admission. The university must assess the complete record and Fall2028 policy.", "공개 항목 비교이며 최종 입학 판정이 아닙니다. 대학의 전체 기록 심사와 2028년 규정 확인이 필요합니다.")}</p></div>${section(w("Ontario percentage & calculation basis", "온타리오 내신 · 계산 방식"), w(s.ontario.basis, s.ontario.basisKo), s.ontario.sourceIds)}${s.percentageRule ? section(w("Additional published percentage scale", "추가 공개 백분율 기준"), w(s.percentageRule.basis, s.percentageRule.basisKo), s.percentageRule.sourceIds) : ""}${section(w("Academic requirements", "학업 요건"), w(s.academic.text, s.academic.textKo), s.academic.sourceIds)}${s.satAlternative ? section(w("Published SAT GPA-component alternative", "공식 SAT GPA 항목 대체 규정"), `${s.satAlternative.minimum}+${s.satAlternative.sectionMinimums ? ` · Reading & Writing ${s.satAlternative.sectionMinimums.readingWriting}+ · Math ${s.satAlternative.sectionMinimums.math}+` : ""}. ${w(s.satAlternative.remainingRequirements, s.satAlternative.remainingRequirementsKo)}`, s.satAlternative.sourceIds) : ""}${section(w("Test policy & applicable year", "시험 규정 · 적용 연도"), w(s.testing.text, s.testing.textKo), s.testing.sourceIds)}${s.satRange ? section(w(`Official composite range: ${s.satRange.low}–${s.satRange.high}`, `공식 SAT 총점 분포: ${s.satRange.low}–${s.satRange.high}`), getLanguage() === "ko" ? s.satRange.cohortKo || translate(s.satRange.cohort) : s.satRange.cohort, s.satRange.sourceIds) : ""}${section(`${w("Program examined", "검토 전공")}: ${translate(w(s.entry.program, s.entry.programKo))}`, w(s.entry.text, s.entry.textKo), s.entry.sourceIds)}<p class="small">${w("Lowest-admission major established:", "최저 합격 전공 입증 여부:")} ${s.entry.easierMajorVerified ? w("Verified comparative criteria; scope applies", "비교 요건 확인 · 적용 범위 확인 필요") : w("Not verified", "미확인")}</p>${section(w("Remaining applicant-specific requirements", "추가 지원자별 요건"), w(s.applicantScope.text, s.applicantScope.textKo), s.applicantScope.sourceIds)}${s.rank.value !== null ? section(w("Ranking evidence", "순위 근거"), `U.S. News · ${s.rank.edition} · National Universities · #${s.rank.value}${s.rank.verification === "reported-by-secondary" ? w(" · dated secondary report", " · 해당 연도 보도") : ""}`, s.rank.sourceIds) : ""}<details class="detail-sources"><summary>${w("All sources & review dates", "전체 출처 · 확인일")}</summary>${s.sources.map((source) => `<article data-original-language lang="en"><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a><p class="small">${esc(source.publisher)} · ${esc(source.cycle)} · ${source.verified}</p></article>`).join("")}</details></div>`;
}
