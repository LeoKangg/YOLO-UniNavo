import { getLanguage, translate } from "./i18n.ts";
import { GRADE_BANDS } from "./types.ts";
import { SAT_SCENARIOS } from "./comparison.ts";
import { SAT_BANDS, bandPosition } from "./sat-bands.ts";
import { scenarioSchools, scenarioSourceMap } from "./data/scenario-catalog.ts";
import {
  candidatePlan,
  candidateMatrix,
  candidateRoute,
  candidateSatAdvice,
  gradeResearchNote,
} from "./candidate-plans.ts";
import type { ScenarioSchool, ScenarioInput } from "./scenario-types.ts";
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
const rank = (s: ScenarioSchool) =>
  s.rank.value !== null
    ? `#${s.rank.value} · 2026`
    : w("National rank not verified", "종합 순위 미확인");
const byRank = (a: ScenarioSchool, b: ScenarioSchool) =>
  (a.rank.value ?? Infinity) - (b.rank.value ?? Infinity) ||
  a.name.localeCompare(b.name);
function schoolCard(
  s: ScenarioSchool,
  input: ScenarioInput,
  saved: Set<string>,
  index?: number,
) {
  const ko = getLanguage() === "ko";
  return `<article class="scenario-school-card"><div class="scenario-card-head"><span class="scenario-order">${index !== undefined ? String(index + 1).padStart(2, "0") : "↗"}</span><div><span class="small">${esc(rank(s))}</span><h3><button data-detail="${s.id}">${esc(name(s))}</button></h3><span class="small muted">${esc(s.city)}, ${esc(s.state)}</span></div><button class="save-button ${saved.has(s.id) ? "saved" : ""}" data-save="${s.id}" aria-label="${esc(w("Save school", "대학 저장"))} ${esc(name(s))}" aria-pressed="${saved.has(s.id)}">${saved.has(s.id) ? "✓" : "+"}</button></div>
  <p class="candidate-route">${esc(candidateRoute(s, ko))}</p>
  <div class="scenario-program"><span class="eyebrow">${w("Program to examine", "검토 전공")}</span><strong>${esc(translate(w(s.entry.program, s.entry.programKo)))}</strong><span>${esc(w(s.entry.unit, s.entry.unitKo))}</span><p>${esc(w(s.entry.text, s.entry.textKo))}</p>${refs(s.entry.sourceIds.slice(0, 2))}</div>
  <dl class="candidate-facts"><div><dt>${w("Published academic requirement", "공식 학업 요건")}</dt><dd>${esc(w(s.academic.text, s.academic.textKo))}${refs(s.academic.sourceIds.slice(0, 2))}</dd></div><div><dt>${w("This SAT score", "이 SAT 점수에서는")}</dt><dd><p class="candidate-testing">${esc(w(s.testing.text, s.testing.textKo))}</p>${esc(candidateSatAdvice(s, input.sat, ko))}${s.satRange ? `<span class="candidate-cohort">${esc(w(s.satRange.cohort, s.satRange.cohortKo || translate(s.satRange.cohort)))}</span>` : ""}${refs(s.satAlternative?.sourceIds ?? s.satRange?.sourceIds ?? s.testing.sourceIds.slice(0, 1))}</dd></div></dl>
  <button class="text-button" data-detail="${s.id}">${w("Full requirements, testing year & sources →", "상세 요건 · 시험 적용 연도 · 전체 출처 →")}</button></article>`;
}
function selectors(input: ScenarioInput) {
  return `<section class="scenario-selectors sat-only" aria-label="${w("SAT input", "SAT 점수 입력")}"><label>${w("SAT score (optional)", "SAT 점수 (선택)")}<input id="scenario-sat" type="number" inputmode="numeric" min="400" max="1600" step="10" value="${input.sat ?? ""}" placeholder="400–1600"></label><p>${w("Korean citizen · International first-year applicant in the U.S.", "한국 시민권자 · 미국 대학 국제 신입생 지원")}<br><span>${w("Humanities, sociology and history · Choose a grade scenario in the table.", "인문학·사회학·역사학 중심 · 내신 구간은 표에서 선택하세요.")}</span></p></section>`;
}
const disclosure = () =>
  `<div class="scenario-accuracy"><strong>${w("Ten research candidates per combination — eligibility is not confirmed.", "조합당 10곳은 지원 검토 후보입니다. 합격 가능·자격 충족이 확정된 10곳이 아닙니다.")}</strong><p>${w("School requirements and score distributions are sourced facts. Grade-band placement is editorial judgment. Ontario percentages are not converted to U.S. GPA; university transcript review, English and entry-year policies remain necessary.", "대학 요건·SAT 분포는 출처가 있는 사실이고, 구간별 후보 선정은 편집 판단입니다. 온타리오 내신을 미국 GPA로 임의 환산하지 않습니다. 대학별 성적표·영어·지원 연도 규정 확인이 필요합니다.")}</p></div>`;
function matching(input: ScenarioInput, saved: Set<string>) {
  const plan = candidatePlan(input);
  if (!plan.selected.length)
    return `<div class="comparison-empty"><h2>${w("Choose a combination in the table.", "표에서 내신·SAT 조합을 선택하세요.")}</h2><p>${w("The researched lists cover SAT 1100–1600. Scores below 1100 are not mapped to a higher-score list.", "조사한 목록은 SAT 1100–1600 범위입니다. 1100 미만을 높은 점수 목록에 맞춰 표시하지 않습니다.")}</p><button class="text-button" data-explorer-mode="all-scenarios">${w("View all combinations →", "전체 조합 보기 →")}</button></div>`;
  return `<section class="scenario-result-head"><div><span class="eyebrow">${esc(input.band)} · SAT ${input.sat}</span><h2>${w("10 schools to investigate", "먼저 검토할 대학 10곳")}</h2></div><button class="text-button" data-explorer-mode="all-scenarios">${w("← Other combinations", "← 다른 조합 보기")}</button></section>${disclosure()}<p class="candidate-selection-note">${esc(gradeResearchNote(input.band, getLanguage() === "ko"))}${plan.referenceSat !== input.sat ? ` ${w(`Uses the SAT${plan.referenceSat} shortlist; the score comparison below uses your actual score.`, `SAT ${plan.referenceSat} 기준 목록을 사용하며 아래 점수 비교는 입력한 실제 점수를 적용합니다.`)}` : ""}</p><div class="scenario-school-list">${plan.selected.map((s, i) => schoolCard(s, input, saved, i)).join("")}</div><p class="small">${w("Numbers indicate research order, not national rank or admission probability. Ranks shown on cards are historical 2026 U.S.News National Universities references.", "번호는 조사 순서이며 대학 순위·합격 확률이 아닙니다. 카드의 순위는 U.S. News 2026 종합대학 과거 자료입니다.")}</p>`;
}
const shortNames: Record<string, [string, string]> = {
  "michigan-ann-arbor": ["Michigan–Ann Arbor", "미시간 앤아버"],
  "wisconsin-madison": ["Wisconsin–Madison", "위스콘신 매디슨"],
  "purdue-west-lafayette": ["Purdue · Liberal Arts", "퍼듀 · 문과대학"],
  "rutgers-new-brunswick": ["Rutgers–New Brunswick", "럿거스 뉴브런즈윅"],
  "minnesota-twin-cities": ["Minnesota · Liberal Arts", "미네소타 · 문과대학"],
  "penn-state": ["Penn State · University Park", "펜실베이니아 주립"],
  "iowa-state": ["Iowa State", "아이오와 주립"],
  iowa: ["University of Iowa", "아이오와 대학교"],
  "southern-california": ["USC", "서던캘리포니아 (USC)"],
  "maryland-college-park": ["Maryland–College Park", "메릴랜드 칼리지파크"],
};
function matrix() {
  const rows = candidateMatrix();
  return `<div class="scenario-matrix-intro"><h2>${w("40 combinations · 10 schools each", "40개 조합 · 각각 대학 10곳")}</h2><p>${w("Preview three universities; select a cell for all ten, programs and evidence. Each row is lower-inclusive and upper-exclusive, except100% is included in the last row.", "각 칸에 대학 3곳을 미리 표시합니다. 누르면 10곳 전체와 전공·근거를 볼 수 있습니다. 내신 구간의 시작점은 포함, 끝점은 다음 구간에 포함하며 100%는 마지막 구간입니다.")}</p><button class="text-button" id="export-scenarios">${w("Download all 400 candidate entries ↓", "전체 400개 후보 항목 내려받기 ↓")}</button></div>${disclosure()}<div class="table-wrap candidate-matrix-wrap"><table class="strict-scenario-matrix candidate-matrix"><thead><tr><th>${w("Ontario grades", "온타리오 내신")}</th>${SAT_SCENARIOS.map((n) => `<th>SAT ${n}</th>`).join("")}</tr></thead><tbody>${GRADE_BANDS.map(
    (b) =>
      `<tr><th scope="row">${b}</th>${SAT_SCENARIOS.map((sat) => {
        const cell = rows.find((r) => r.band === b && r.sat === sat)!;
        return `<td><button data-scenario-choice="${b}|${sat}" aria-label="${esc(b)} SAT ${sat} ${w("view 10 candidates", "후보 10곳 보기")}"><span class="candidate-preview">${cell.selected
          .slice(0, 3)
          .map(
            (s) =>
              `<span>${esc(shortNames[s.id] ? w(...shortNames[s.id]) : name(s))}</span>`,
          )
          .join(
            "",
          )}</span><strong>${w("View all 10 →", "10곳 모두 보기 →")}</strong></button></td>`;
      }).join("")}</tr>`,
  ).join(
    "",
  )}</tbody></table></div><p class="small">${w("Some low-grade rows repeat at higher SAT scores because academic requirements remain. Scores alone do not justify replacing them with more selective universities.", "낮은 내신 구간은 SAT가 올라도 학업 요건이 남아 일부 목록이 같습니다. 점수만으로 더 선발적인 대학으로 바꾸지 않았습니다.")}</p>`;
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
  return `<div class="page-intro"><span class="eyebrow">${scenarioSchools.length} ${w("UNIVERSITIES RESEARCHED", "개 대학 조사")}</span><h1>${w("Find ten schools to investigate.", "내신·SAT별 대학 10곳")}</h1><p>${w("Compare researched humanities routes, published requirements and SAT profiles for each combination.", "내신·SAT 조합별로 인문사회계열 전공과 공식 입학 요건을 비교하세요.")}</p></div>${selectors(input)}<div class="tabs" aria-label="${w("University view", "대학교 목록 보기")}">${(
    [
      ["scenario", w("Selected combination", "선택한 조합 10곳")],
      ["all-scenarios", w("All 40 scenarios", "전체 40개 조합")],
      [
        "catalog",
        w(
          `All ${scenarioSchools.length} researched schools`,
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
    )}</div>${mode === "catalog" || mode === "saved" ? `<div class="filter-bar"><label class="search-field"><span>${w("University or program", "대학 · 전공 검색")}</span><input id="scenario-search" type="search" value="${esc(search)}"></label><span role="status">${list.length} ${w("schools", "곳")}</span></div><p class="small">${w("Research coverage is broader than the recommendation list. These records include schools whose Ontario equivalencies remain unverified; no admission-fit label is assigned from an assumed GPA conversion.", "조사 목록과 추천 목록은 다릅니다. 온타리오 환산 기준이 확인되지 않은 학교도 조사 기록으로 남기며, 임의 GPA 환산으로 지원 가능 분류를 붙이지 않습니다.")}</p><div class="scenario-school-list">${list.map((s) => schoolCard(s, input, saved)).join("") || `<p class="empty-state">${w("No schools match.", "해당 대학이 없습니다.")}</p>`}</div>` : mode === "all-scenarios" ? matrix() : mode === "sat-map" ? scoreMap(input) : matching(input, saved)}<details class="methodology"><summary>${w("How the ten candidates were selected", "10곳 선정 방법 · 사실과 판단의 구분")}</summary><p>${w("These are manually curated research shortlists from the displayed pool. Lower-grade cases prioritize published lower GPA requirements, alternative routes and individual review; stronger-grade cases broaden to selective universities, college-specific SAT profiles and testing policies. A place in a grade band is editorial judgment, not a verified Ontario equivalency or a probability model. We do not claim these are the ten best attainable universities in the entire United States.", "표시된 조사 목록에서 검토 후보를 직접 선정했습니다. 낮은 내신 구간은 낮은 공개 GPA 요건·대체 경로·개별 심사부터 조사하고, 높은 구간은 선발적인 대학·단과대학별 SAT 분포·시험 정책까지 넓힙니다. 구간 배치는 편집 판단이며 확인된 온타리오 환산값이나 합격 예측 모델이 아닙니다. 미국 전체에서 입학 가능한 최상위 10곳이라고 단정하지 않습니다.")}</p><p>${w("Official program availability is verified. Toledo publishes different entry GPA requirements by college; Purdue publishes college-level profiles. These comparisons do not identify the absolute easiest major. At schools such as Maryland and Florida, choosing a humanities major does not lower university admission requirements.", "전공 운영 여부는 공식 안내로 확인했습니다. 톨레도는 단과대학별 GPA 요건, 퍼듀는 단과대학별 입학 집단 자료를 공개합니다. 이것만으로 가장 쉬운 학과를 확정하지 않습니다. 메릴랜드·플로리다처럼 인문계 선택이 대학 입학 조건을 낮추지 않는 곳도 표시했습니다.")}</p><p>${w("SAT ranges retain their cohort, campus and year. Current policies are not necessarily Fall 2028 policies. Ranks use historical 2026 U.S.News National Universities evidence; no measured Korean-recognition ranking was established.", "SAT 수치는 집단·캠퍼스·연도를 함께 표시합니다. 현행 정책이 2028년 가을에도 같다고 가정하지 않습니다. 순위는 비교용 U.S. News 2026 종합대학 자료이며 한국 인지도 조사 순위는 확인되지 않았습니다.")}</p></details>`;
}
export function renderScenarioDetail(s: ScenarioSchool, input: ScenarioInput) {
  const section = (title: string, text: string, ids: string[]) =>
    `<section class="scenario-detail-section"><h3>${title}</h3><p>${esc(text)}</p>${refs(ids)}</section>`;
  return `<div class="dialog-header"><span class="eyebrow">${esc(rank(s))}</span><button class="close-dialog" aria-label="${w("Close university details", "대학 상세 닫기")}">×</button></div><div class="dialog-body"><span class="eyebrow">${esc(s.city)}, ${esc(s.state)}</span><h2 id="dialog-title">${esc(name(s))}</h2><p class="verified-rule-tag">${esc(candidateRoute(s, getLanguage() === "ko"))}</p><div class="scenario-accuracy"><p>${w("A research candidate, not confirmed admission eligibility. The university must assess the full record and entry-year policy.", "지원 검토 후보이며 입학 자격이 확정된 것은 아닙니다. 대학의 전체 기록 심사와 지원 연도 규정 확인이 필요합니다.")}</p></div>${section(w("Your SAT comparison", "입력한 SAT 비교"), candidateSatAdvice(s, input.sat, getLanguage() === "ko"), s.satRange?.sourceIds ?? s.testing.sourceIds)}${section(w("Ontario percentage & calculation basis", "온타리오 내신 · 계산 방식"), w(s.ontario.basis, s.ontario.basisKo), s.ontario.sourceIds)}${s.percentageRule ? section(w("Additional published percentage scale", "추가 공개 백분율 기준"), w(s.percentageRule.basis, s.percentageRule.basisKo), s.percentageRule.sourceIds) : ""}${section(w("Academic requirements", "학업 요건"), w(s.academic.text, s.academic.textKo), s.academic.sourceIds)}${s.satAlternative ? section(w("Published SAT GPA-component alternative", "공식 SAT GPA 항목 대체 규정"), `${s.satAlternative.minimum}+${s.satAlternative.sectionMinimums ? ` · Reading & Writing ${s.satAlternative.sectionMinimums.readingWriting}+ · Math ${s.satAlternative.sectionMinimums.math}+` : ""}. ${w(s.satAlternative.remainingRequirements, s.satAlternative.remainingRequirementsKo)}`, s.satAlternative.sourceIds) : ""}${section(w("Test policy & applicable year", "시험 규정 · 적용 연도"), w(s.testing.text, s.testing.textKo), s.testing.sourceIds)}${s.satRange ? section(w(`Official composite range: ${s.satRange.low}–${s.satRange.high}`, `공식 SAT 총점 분포: ${s.satRange.low}–${s.satRange.high}`), getLanguage() === "ko" ? s.satRange.cohortKo || translate(s.satRange.cohort) : s.satRange.cohort, s.satRange.sourceIds) : ""}${section(`${w("Program examined", "검토 전공")}: ${translate(w(s.entry.program, s.entry.programKo))}`, w(s.entry.text, s.entry.textKo), s.entry.sourceIds)}<p class="small">${w("Lowest-admission major established:", "최저 합격 전공 입증 여부:")} ${s.entry.easierMajorVerified ? w("Verified comparative criteria; scope applies", "비교 요건 확인 · 적용 범위 확인 필요") : w("Not verified", "미확인")}</p>${section(w("Remaining applicant-specific requirements", "추가 지원자별 요건"), w(s.applicantScope.text, s.applicantScope.textKo), s.applicantScope.sourceIds)}${s.rank.value !== null ? section(w("Ranking evidence", "순위 근거"), `U.S. News · ${s.rank.edition} · National Universities · #${s.rank.value}${s.rank.verification === "reported-by-secondary" ? w(" · dated secondary report", " · 해당 연도 보도") : ""}`, s.rank.sourceIds) : ""}<details class="detail-sources"><summary>${w("All sources & review dates", "전체 출처 · 확인일")}</summary>${s.sources.map((source) => `<article data-original-language lang="en"><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a><p class="small">${esc(source.publisher)} · ${esc(source.cycle)} · ${source.verified}</p></article>`).join("")}</details></div>`;
}
