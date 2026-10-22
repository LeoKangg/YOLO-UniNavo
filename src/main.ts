import "./style.css";
import { getLanguage, setLanguage, translate, localize } from "./i18n.ts";
import {
  universities,
  sources,
  sourceMap,
  planning,
  pathways,
  RESEARCH_DATE,
} from "./data/index.ts";
import { evidenceMap } from "./data/evidence.ts";
import {
  comparisonCsv,
  SAT_SCENARIOS,
  compareSat,
  meetsPublishedAlternative,
} from "./comparison.ts";
import comparisonContext from "../research/comparison-context.json" with { type: "json" };
import existingRankings from "../research/existing-rankings.json" with { type: "json" };
import { strategies } from "./data/strategies.ts";
import { timeline } from "./data/timeline.ts";
import { normalizePlanner, personalTimeline, saveTaskEdit } from "./planner.ts";
import type { PersonalTask } from "./planner.ts";
import { GRADE_BANDS } from "./types.ts";
import type { Fact, University } from "./types.ts";
import { categoryFor, recommend, scoreContext } from "./recommendations.ts";
import {
  loadProfile,
  loadChecked,
  loadSaved,
  readLocal,
  writeLocal,
} from "./storage.ts";

const app = document.querySelector<HTMLDivElement>("#app")!;
const profile = loadProfile();
const checked = loadChecked(),
  saved = loadSaved();
let persistenceAvailable = true;
let planner = normalizePlanner(readLocal("planner"), timeline);
let undoPlanner: { planner: typeof planner; checked: string[] } | null = null;
let plannerNotice = "";
const words = (en: string, ko: string) => (getLanguage() === "ko" ? ko : en);
let universityMode = "compare",
  difficulty = "",
  recognition = "",
  testing = "",
  state = "",
  sector = "",
  universitySearch = "";
let phase = "all",
  hideCompleted = true,
  examTab = "sat",
  sourceSearch = "";
let profileExpanded = false,
  advancedExpanded = false;
const openedDetails = new Set<string>();

const nav = [
  { id: "timeline", label: "My timeline", icon: "◷" },
  { id: "universities", label: "Universities", icon: "▦" },
  { id: "exams", label: "SAT & AP", icon: "✧" },
  { id: "resources", label: "Study resources", icon: "▤" },
  { id: "sources", label: "Sources", icon: "↗" },
];
const esc = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const route = () =>
  nav.some((n) => n.id === location.hash.slice(1))
    ? location.hash.slice(1)
    : "timeline";
const date = (s: string) =>
  new Date(`${s}T12:00:00Z`).toLocaleDateString(
    getLanguage() === "ko" ? "ko-KR" : "en-CA",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    },
  );
const month = (s: string) =>
  new Date(`${s}-01T12:00:00Z`).toLocaleDateString(
    getLanguage() === "ko" ? "ko-KR" : "en-CA",
    {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    },
  );
const link = (url: string, label: string, cls = "") =>
  `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a>`;
function refs(ids: string[]) {
  return `<span class="references" data-original-language lang="en">${[
    ...new Set(ids),
  ]
    .map((id) => {
      const s = sourceMap.get(id);
      return s ? link(s.url, s.title) : "";
    })
    .join("")}</span>`;
}
function fact(f: Fact, title?: string) {
  const body = `<p>${esc(f.text)}</p><span class="fact-status">${esc(f.status.replaceAll("-", " "))}</span><details class="source-disclosure"><summary>Sources</summary>${refs(f.sourceIds)}</details>`;
  return title
    ? `<details class="fact fact-fold"><summary>${esc(title)}</summary>${body}</details>`
    : `<div class="fact">${body}</div>`;
}
function planFact(id: string) {
  const f = planning.facts.find((f) => f.id === id);
  return f ? fact(f) : "";
}
function badge(id: string) {
  const c = categoryFor(id, profile);
  return `<span class="badge ${c === "Reach" || c === "Very High Reach" ? "reach" : c === "More Realistic" ? "realistic" : ""}">${c ?? "Select your grade range"}</span>`;
}
function profilePanel() {
  return `<section class="profile-panel" aria-label="Your planning profile"><div class="profile-main"><div><span class="eyebrow">YOUR STARTING POINT</span><label for="grade-band">Expected Ontario average</label></div><select id="grade-band"><option value="">Choose your range</option>${GRADE_BANDS.map((b) => `<option ${profile.band === b ? "selected" : ""}>${b}</option>`).join("")}</select><span class="profile-hint">An exploration filter. No GPA conversion.</span><button id="profile-toggle" class="text-button" aria-expanded="${profileExpanded}">Refine profile <span aria-hidden="true">${profileExpanded ? "−" : "+"}</span></button></div>
 ${
   profileExpanded
     ? `<div class="profile-fields"><label>SAT diagnostic (optional)<input id="sat-score" type="number" min="400" max="1600" step="1" value="${profile.sat ?? ""}" placeholder="400–1600"></label><label>Course rigor<select id="rigor">${[
         ["unknown", "Not assessed"],
         ["standard", "Standard U/M preparation"],
         ["strong", "Strong preparation, reviewed with guidance"],
       ]
         .map(
           ([v, l]) =>
             `<option value="${v}" ${profile.rigor === v ? "selected" : ""}>${l}</option>`,
         )
         .join(
           "",
         )}</select></label><label>Citizenship / status<select id="citizenship">${[
         ["unknown", "Not specified"],
         ["canadian", "Canadian citizen, not U.S. citizen/PR"],
         ["us", "U.S. citizen or permanent resident"],
         ["other", "Other citizenship / confirm status"],
       ]
         .map(
           ([v, l]) =>
             `<option value="${v}" ${profile.citizenship === v ? "selected" : ""}>${l}</option>`,
         )
         .join(
           "",
         )}</select></label><label>Academic interests<select id="program"><option value="flexible" ${profile.program === "flexible" ? "selected" : ""}>Broad arts & social sciences</option><option value="specialized" ${profile.program === "specialized" ? "selected" : ""}>Business / CS / engineering / other specialized</option></select></label><label class="checkline wide"><input type="checkbox" id="coursework" ${profile.coursework ? "checked" : ""}>I have checked the shortlisted universities’ course eligibility with guidance or Admissions.</label><p class="small wide">Self-reported planning inputs, saved only in this browser. ${profile.citizenship === "us" ? "This research emphasizes international applicants. Your U.S. application/aid route needs separate confirmation; categories remain conservative." : "Citizenship-dependent: Ontario residence alone does not establish applicant, aid or visa status."}</p></div>`
     : ""
 }</section>`;
}
function card(u: University) {
  const s = strategies[u.id];
  return `<article class="university-card"><div class="card-top"><span class="monogram" style="--school:${s.color}">${s.initials}</span><button class="save-button ${saved.has(u.id) ? "saved" : ""}" data-save="${u.id}" aria-label="${saved.has(u.id) ? "Remove" : "Save"} ${esc(u.name)} ${saved.has(u.id) ? "from" : "to"} my shortlist" aria-pressed="${saved.has(u.id)}">${saved.has(u.id) ? "✓" : "+"}</button></div><span class="small muted">${esc(u.state)} · ${u.type.toLowerCase().includes("private") ? "Private" : "Public"}</span><h3>${esc(u.name)}</h3>${badge(u.id)}<p class="card-subjects">${esc(s.majors.join(" · "))}</p><p class="small muted">Fall 2028 policies need checking.</p><button class="detail-button" data-detail="${u.id}">View details <span aria-hidden="true">↗</span></button></article>`;
}
function taskRow(t: PersonalTask) {
  return `<article class="task-row ${checked.has(t.id) ? "is-complete" : ""}"><div class="task-heading"><label><input type="checkbox" data-task="${t.id}" ${checked.has(t.id) ? "checked" : ""}><span ${t.personal ? "data-original-language" : ""}>${esc(t.title)}</span></label><div class="task-actions"><button data-edit-task="${t.id}" aria-label="${esc(words("Edit task", "할 일 수정"))}">${words("Edit / move", "수정 · 이동")}</button><button data-delete-task="${t.id}" aria-label="${esc(words("Delete task", "할 일 삭제"))}">${words("Delete", "삭제")}</button></div></div><div class="task-detail"><p ${t.personal ? "data-original-language" : ""}>${esc(t.detail)}</p><span class="fact-status">${t.personal ? words("My plan", "내가 수정한 계획") : t.kind}</span>${refs(t.sourceIds)}${t.original ? `<details class="source-disclosure"><summary>${words("Original guidance & sources", "수정 전 안내와 출처")}</summary><p>${esc(t.original.detail)}</p>${refs(t.original.sourceIds)}</details>` : ""}</div></article>`;
}
function pathwayPanel() {
  return `<aside class="pathway"><span class="eyebrow">A DIFFERENT ROUTE</span><h3>Build options, not false certainty.</h3><p>At 60–70%, this research does not support a balanced direct-entry shortlist at the featured universities. At 70–75%, the few options shown are research leads, not targets. Prioritize stronger marks and a transcript assessment.</p>${pathways.facts.map((f) => fact(f)).join("")}<p class="small">Conditional English admission is not an academic waiver. A branch-campus offer is not an offer at the flagship campus. Check the exact campus, pathway contract and progression rules.</p></aside>`;
}
function timelinePage() {
  const months = personalTimeline(timeline, planner);
  const tasks = months.flatMap((m) => m.tasks),
    count = tasks.filter((t) => checked.has(t.id)).length;
  const shown = months.filter((m) => phase === "all" || m.phase === phase);
  return `<div class="planner-heading"><div><span class="eyebrow">MY ROADMAP · 2026—2028</span><h1>${words("One step at a time.", "한 달씩, 하나씩.")}</h1><p>${words("Change the plan. Check things off. Keep moving.", "계획은 바꿔도 괜찮아요. 끝낸 일은 체크하고, 다음 할 일로.")}</p></div><div class="planner-total"><strong>${Math.round((count / Math.max(tasks.length, 1)) * 100)}<span>%</span></strong><span>${count} / ${tasks.length} ${words("complete", "완료")}</span></div></div>
  <section class="journey-chart" aria-label="${words("Monthly progress chart", "월별 진행률 차트")}">${months
    .map((m) => {
      const done = m.tasks.filter((t) => checked.has(t.id)).length;
      return `<a href="#month-${m.id}" data-jump-month="${m.id}" aria-label="${esc(month(m.id))}: ${done}/${m.tasks.length}" title="${esc(month(m.id))}: ${done}/${m.tasks.length}"><span class="chart-track"><i style="height:${Math.max((done / Math.max(m.tasks.length, 1)) * 100, 4)}%"></i></span><small>${m.id.slice(5)}</small><span class="chart-year">${m.id.endsWith("-01") || m.id === "2026-10" ? m.id.slice(0, 4) : ""}</span></a>`;
    })
    .join("")}</section>
  <div class="timeline-toolbar"><label>Show a stage<select id="phase"><option value="all">Select</option>${[...new Set(timeline.map((m) => m.phase))].map((p) => `<option ${phase === p ? "selected" : ""}>${p}</option>`).join("")}</select></label><label class="checkline"><input type="checkbox" id="hide-completed" ${hideCompleted ? "checked" : ""}>Hide completed tasks</label><button class="text-button" id="export-plan">${words("Back up plan ↓", "계획 백업 ↓")}</button><label class="import-plan">${words("Restore backup", "백업 불러오기")}<input id="import-plan" type="file" accept="application/json,.json" class="sr-only"></label></div>
  <div class="planner-save-note">${words("Automatically saved in this browser. Back up your plan before changing devices or clearing browser data.", "이 브라우저에 자동 저장됩니다. 기기를 바꾸거나 브라우저 데이터를 지우기 전에는 백업하세요.")}</div>
  ${plannerNotice ? `<div class="planner-notice" role="status">${esc(plannerNotice)} ${undoPlanner ? `<button id="undo-plan" class="text-button">${words("Undo", "실행 취소")}</button>` : ""}</div>` : ""}
  <div class="timeline editable-timeline">${shown
    .map((m, i) => {
      const done = m.tasks.filter((t) => checked.has(t.id)).length;
      const visible = m.tasks.filter(
        (t) => !hideCompleted || !checked.has(t.id),
      );
      return `<section class="month-card ${m.id === "2026-10" ? "current" : ""}" id="month-${m.id}"><header class="month-header"><div class="month-date"><span class="month-number">${m.id.slice(5)}</span><span>${esc(month(m.id))}</span><small>${esc(m.phase)}</small></div><div class="month-summary"><span class="eyebrow">${String(i + 1).padStart(2, "0")} / ${String(shown.length).padStart(2, "0")}</span><h2>${esc(m.title)}</h2><p>${esc(m.focus)}</p><div class="month-progress"><progress value="${done}" max="${Math.max(m.tasks.length, 1)}" aria-label="${esc(month(m.id))}"></progress><span>${done}/${m.tasks.length}</span></div></div></header><div class="month-tasks">${visible.length ? visible.map(taskRow).join("") : `<div class="month-finished"><span>✓</span><p>${words("Nothing left here. Add a new task whenever plans change.", "남은 할 일이 없어요. 계획이 바뀌면 새로 추가하세요.")}</p></div>`}<button class="add-task" data-add-task="${m.id}">＋ ${words("Add a task", "할 일 추가")}</button></div></section>`;
    })
    .join("")}</div>
  <details class="methodology"><summary>${words("Official dates & Ontario requirements", "공식 일정과 온타리오 준비 기준")}</summary><p>This is a planning calendar anchored to October 21, 2026. College application dates for Fall 2028 remain unconfirmed; future task months are preparation windows, not official deadlines.</p>${planFact("ossd-cohort")}${planFact("ontario-um")}${planFact("early-options")}${planFact("canadian-entry")}${planFact("federal-aid")}</details>`;
}
function rememberPlan() {
  undoPlanner = { planner: structuredClone(planner), checked: [...checked] };
}
function persistPlan() {
  persistenceAvailable =
    writeLocal("planner", planner) &&
    writeLocal("checked", [...checked]) &&
    persistenceAvailable;
  render();
}
function openTaskEditor(id?: string, monthId?: string) {
  const months = personalTimeline(timeline, planner);
  const containing = months.find((m) => m.tasks.some((t) => t.id === id));
  const task = containing?.tasks.find((t) => t.id === id);
  const dialog = document.querySelector<HTMLDialogElement>("#task-dialog")!;
  dialog.innerHTML = `<form id="task-form"><div class="dialog-header"><h2 id="task-dialog-title">${task ? words("Edit your plan", "계획 수정") : words("A new task", "새 할 일")}</h2><button type="button" class="close-dialog" aria-label="${words("Cancel", "취소")}">×</button></div><div class="task-form-fields"><label>${words("Task", "할 일")}<input name="title" required maxlength="180" value="${esc(task ? translate(task.title) : "")}"></label><label>${words("Month · choose another to move", "월 · 다른 달을 선택하면 이동합니다")}<select name="monthId">${timeline.map((m) => `<option value="${m.id}" ${m.id === (containing?.id ?? monthId) ? "selected" : ""}>${esc(month(m.id))}</option>`).join("")}</select></label><label>${words("Details / my notes", "자세한 내용 / 내 메모")}<textarea name="detail" rows="7" maxlength="5000">${esc(task ? translate(task.detail) : "")}</textarea></label><p class="small">${words("Your edits are personal planning notes. Original official guidance remains available under the task.", "수정 내용은 개인 계획으로 저장됩니다. 기존 공식 안내와 출처는 항목 아래에서 다시 확인할 수 있어요.")}</p><div class="form-actions"><button type="button" id="cancel-task" class="text-button">${words("Cancel", "취소")}</button><button class="button" type="submit">${words("Save plan", "저장하기")}</button></div></div></form>`;
  dialog
    .querySelector(".close-dialog")!
    .addEventListener("click", () => dialog.close());
  dialog
    .querySelector("#cancel-task")!
    .addEventListener("click", () => dialog.close());
  dialog.querySelector("form")!.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form),
      title = String(data.get("title") ?? "").trim();
    if (!title) {
      (form.elements.namedItem("title") as HTMLInputElement).focus();
      return;
    }
    rememberPlan();
    planner = saveTaskEdit(planner, {
      id: id ?? `custom-${crypto.randomUUID()}`,
      monthId: String(data.get("monthId")),
      title,
      detail: String(data.get("detail") ?? ""),
    });
    plannerNotice = words("Plan saved.", "계획을 저장했어요.");
    dialog.close();
    persistPlan();
  });
  dialog.showModal();
}
const rankFor = (id: string) =>
  evidenceMap.get(id)?.ranking ?? existingRankings.find((r) => r.id === id);
const byRank = (a: University, b: University) =>
  (rankFor(a.id)?.rank ?? 999) - (rankFor(b.id)?.rank ?? 999);
function rankLabel(id: string) {
  const r = rankFor(id);
  return r?.rank ? `#${r.rank}` : words("Not verified", "미확인");
}
function scoreLabel(id: string, score: number) {
  const position = compareSat(score, strategies[id].range);
  const labels = {
    below: words("Below range", "분포 미만"),
    within: words("Within range", "분포 내"),
    above: words("Above range", "분포 초과"),
    unknown: words("No verified range", "분포 미확인"),
  };
  return labels[position];
}
function comparisonPanel(list: University[]) {
  if (!profile.band)
    return `<div class="comparison-empty"><span>01</span><h2>${words("Choose an Ontario grade band above.", "위에서 온타리오 성적 구간을 선택하세요.")}</h2><p>${words("Compare five SAT scores across all 20 universities, with entry rules and major evidence alongside.", "20개 대학을 SAT 1100 · 1200 · 1300 · 1400 · 1500점으로 비교합니다. 지원 요건과 전공별 근거도 함께 확인하세요.")}</p></div>`;
  const sorted = [...list].sort(byRank);
  return `<section class="comparison-intro"><div><span class="eyebrow">ONTARIO × SAT</span><h2>${esc(profile.band)} + SAT</h2><p>${words("Five score scenarios. One complete transcript still matters.", "SAT 5개 점수 시나리오를 나란히 비교하세요.")}</p></div><button class="text-button" id="export-comparison">${words("Download all 40 scenarios ↓", "전체 40개 조합 내려받기 ↓")}</button></section>
  <div class="comparison-key"><span class="sat-below">${words("Below published middle 50%", "공개 중간 50% 미만")}</span><span class="sat-within">${words("Within published middle 50%", "공개 중간 50% 안")}</span><span class="sat-above">${words("Above published middle 50%", "공개 중간 50% 초과")}</span></div>
  <details class="methodology comparison-help"><summary>${words("How to read this comparison", "비교표 읽는 법")}</summary><p class="small">${words("These are score distributions, not admission cutoffs. Cohorts differ by school; the last column identifies them. The Ontario column is an editorial planning category, not confirmed eligibility. Grade bands use the lower bound inclusively and upper bound exclusively, except 100% is included.", "색상은 합격선이 아니라 시험 점수 분포 비교입니다. 학교별 집단·연도가 다르므로 마지막 열을 확인하세요. 온타리오 분류는 지원 전략 참고이며 지원 자격 확정이 아닙니다. 성적 구간은 하한 포함·상한 미포함이며 마지막 구간은 100%를 포함합니다.")}</p></details>
  ${profile.citizenship !== "us" && GRADE_BANDS.indexOf(profile.band) < 3 ? `<aside class="conditional-route"><strong>${words("A verified conditional route: Iowa State", "공식 규정으로 확인된 조건부 검토: 아이오와 주립대")}</strong><p>${words("At SAT1200+, the current international rule satisfies the GPA component only. This can be worth checking even in the60–65% band. Remaining coursework, English, credential and financial conditions still need review; Fall2028 continuation is unconfirmed.", "SAT 1200 이상은 현재 국제학생 규정의 GPA 항목을 충족합니다. 60–65% 구간에서도 이 규정의 적용 여부를 문의할 가치가 있습니다. 필수 과목·영어·졸업 자격·재정 요건은 별도 심사하며 2028년 적용은 재확인해야 합니다.")}</p>${refs(["isu-admissions"])}</aside>` : ""}
  <div class="table-wrap scenario-wrap" tabindex="0" aria-label="${words("Scroll the SAT comparison table", "SAT 비교표 가로 스크롤")}"><table class="scenario-table"><caption>${esc(profile.band)} · ${list.length} ${words("schools · SAT scenarios, not admission predictions", "개 대학 · SAT 시나리오, 합격 예측 아님")}</caption><thead><tr><th>${words("University / U.S. rank¹", "대학교 / 미국 순위¹")}</th><th>${words("Ontario planning²", "온타리오 검토 분류²")}</th>${SAT_SCENARIOS.map((n) => `<th>SAT ${n}</th>`).join("")}<th>${words("Official cohort & evidence", "공식 집단 · 근거")}</th></tr></thead><tbody>${sorted
    .map((u) => {
      const strategy = strategies[u.id];
      return `<tr><th><button class="school-table-link" data-detail="${u.id}">${esc(translate(u.name))}</button><span class="small">${rankLabel(u.id)} · 2026</span><span class="table-majors">${strategy.majors.map((m) => esc(translate(m))).join(" · ")}</span></th><td>${badge(u.id)}</td>${SAT_SCENARIOS.map((score) => `<td class="sat-${compareSat(score, strategy.range)}"><strong>${scoreLabel(u.id, score)}</strong>${meetsPublishedAlternative(u.id, score, profile) ? `<span class="conditional-chip">${words("International GPA alternative*", "국제지원 GPA 대체*")}</span>` : ""}<span class="small">${words("Transcript review", "성적표 심사 필요")}</span></td>`).join("")}<td>${strategy.range ? `<strong>${strategy.range.low}–${strategy.range.high}</strong><p>${esc(translate(strategy.range.cohort))}</p>${refs(strategy.range.sourceIds)}` : words("A verified composite middle50% is unavailable in this review.", "이번 조사에서 총점 중간 50% 분포를 확인하지 못했습니다.")}<button class="text-button" data-detail="${u.id}">${words("Rules & majors →", "지원 요건 · 전공 →")}</button></td></tr>`;
    })
    .join(
      "",
    )}</tbody></table></div><p class="small">${words("¹ U.S.News2026 National Universities, including public and private institutions. Historical common edition, not the latest2027 edition or a ranking of all U.S.institutions. ² Editorial scenarios; neither SAT1500 nor an upper grade band guarantees admission. *International GPA component only; citizenship and entry year require confirmation.", "¹ U.S. News 2026년판 National Universities: 공립·사립 종합대학 비교. 최신 2027년판이나 미국 모든 대학 유형을 합친 순위가 아닙니다. ² 편집상 시나리오로, SAT 1500이나 높은 학교 성적도 합격을 보장하지 않습니다. *국제학생 GPA 항목에 한함. 국적별 적용과 입학 연도를 확인하세요.")}</p>`;
}
function rankingsPanel(list: University[]) {
  return `<section class="ranking-intro"><h2>${words("Rankings, recognition & majors", "미국 순위 · 인지도 · 전공")}</h2><p>${words("All schools use the same2026 U.S.News National Universities edition, verified through institutional releases or dated news reports. Korean recognition has no verified representative ranking in this review: the brand tiers are editorial references only, not Korea-specific survey results. QS employer reputation is global and cannot substitute for a Korean recognition poll.", "미국 순위는 학교 발표 또는 해당 연도 보도에서 확인한 U.S. News 2026년판 National Universities로 통일했습니다. 한국 내 인지도를 비교한 대표성 있는 조사 순위는 이번 조사에서 확인하지 못했습니다. 브랜드 등급은 편집상 참고이며 한국인 대상 설문 결과가 아닙니다. QS의 고용주 평판도 세계 조사이므로 한국 인지도 순위로 바꿔 쓰지 않습니다.")}</p>${refs(["qs-methodology"])}</section><div class="table-wrap"><table class="ranking-table"><caption>U.S. News · 2026 · National Universities</caption><thead><tr><th>${words("U.S.rank", "미국 순위")}</th><th>${words("University", "대학교")}</th><th>${words("Brand reference · editorial", "브랜드 참고 · 편집")}</th><th>${words("Majors to investigate", "검토할 전공")}</th><th>${words("Ontario minimum / lowest-entry major", "온타리오 최저점 / 최저 입학 전공")}</th></tr></thead><tbody>${[
    ...list,
  ]
    .sort(byRank)
    .map((u) => {
      const rank = rankFor(u.id),
        e = evidenceMap.get(u.id);
      return `<tr><td>${rank?.url ? link(rank.url, rankLabel(u.id)) : rankLabel(u.id)}${rank && "verification" in rank && rank.verification === "reported-by-secondary" ? `<span class="small">${words("Dated news report", "해당 연도 보도 확인")}</span>` : ""}</td><th><button class="school-table-link" data-detail="${u.id}">${esc(translate(u.name))}</button></th><td>${esc(translate(strategies[u.id].recognition))}<span class="small">${words("Not a Korean rank", "한국 인지도 순위 아님")}</span></td><td>${strategies[u.id].majors.map((m) => esc(translate(m))).join("<br>")}</td><td>${e?.eligibility.ontarioMinimum ?? words("No verified percentage cutoff", "검증된 % 합격선 없음")}<span class="small">${words("No proven lowest-entry major; see unit-specific evidence.", "최저 입학 전공을 단정할 수 없음. 모집 단위별 근거를 확인하세요.")}</span><button class="text-button" data-detail="${u.id}">${words("View evidence →", "근거 보기 →")}</button></td></tr>`;
    })
    .join("")}</tbody></table></div>`;
}
function universitiesPage() {
  let list =
    universityMode === "picks"
      ? recommend(universities, profile)
      : universityMode === "saved"
        ? universities.filter((u) => saved.has(u.id))
        : universities;
  list = list.filter((u) => {
    const s = strategies[u.id];
    return (
      (!difficulty || categoryFor(u.id, profile) === difficulty) &&
      (!recognition || s.recognition === recognition) &&
      (!testing || s.testing === testing) &&
      (!state || u.state === state) &&
      (!sector || u.type.toLowerCase().includes(sector.toLowerCase())) &&
      (!universitySearch ||
        `${u.name} ${s.majors.join(" ")} ${translate(u.name, "ko")} ${s.majors.map((m) => translate(m, "ko")).join(" ")}`
          .toLowerCase()
          .includes(universitySearch.toLowerCase()))
    );
  });
  return `<div class="page-intro"><h1>Find universities</h1><p>Choose a grade range. Explore your options.</p></div>${profilePanel()}<div class="tabs" aria-label="University view">${[
    ["compare", words("Grade × SAT", "성적 × SAT 비교")],
    ["explore", "All universities"],
    ["rankings", words("Rankings & majors", "순위 · 전공")],
    ["picks", "My 6 picks"],
    ["saved", `Saved (${saved.size})`],
  ]
    .map(
      ([v, l]) =>
        `<button data-university-mode="${v}" aria-pressed="${universityMode === v}" class="${universityMode === v ? "active" : ""}">${l}</button>`,
    )
    .join(
      "",
    )}</div><div class="filter-bar"><label class="search-field"><span class="sr-only">Search universities or majors</span><input id="university-search" type="search" placeholder="Search a university or subject" value="${esc(universitySearch)}"></label><button class="text-button" id="advanced-toggle" aria-expanded="${advancedExpanded}">Advanced filters ${advancedExpanded ? "−" : "+"}</button><span class="small muted" role="status">${list.length} ${list.length === 1 ? "university" : "universities"}</span></div>${advancedExpanded ? `<div class="advanced-filters">${filterSelect("difficulty", "Planning category", ["Very High Reach", "Reach", "Target", "More Realistic"], difficulty)}${filterSelect("recognition", "Brand reference", ["Very High", "High", "Moderate"], recognition)}${filterSelect("testing", "Published SAT policy", ["Test optional", "Test required", "Confirm policy"], testing)}${filterSelect("state", "State", [...new Set(universities.map((u) => u.state))].sort(), state)}${filterSelect("sector", "University type", ["Public", "Private"], sector)}<button class="text-button" id="clear-filters">Clear filters</button></div>` : ""}<p class="planning-disclaimer">This is planning guidance, not an admission guarantee. Categories are editorial exploration scenarios, not validated Ontario cutoffs. ${profile.program === "specialized" ? "Specialized-program fit requires a separate review." : ""}</p>${profile.band && GRADE_BANDS.indexOf(profile.band) < 3 && !["compare", "rankings"].includes(universityMode) ? pathwayPanel() : ""}${universityMode === "picks" ? `<div class="notice">${profile.band ? "Up to six working picks, balancing available planning categories before brand reference. We do not fill a list with unsuitable names. “Target” still requires a full transcript assessment; “More Realistic” appears only after course checks and strong preparation are reported." : "Choose a grade range to generate your working shortlist."}</div>` : ""}${universityMode === "compare" ? comparisonPanel(list) : universityMode === "rankings" ? rankingsPanel(list) : list.length ? `<div class="cards">${list.map((u) => card(u)).join("")}</div>` : `<div class="empty-state"><h3>${universityMode === "saved" ? "Build your own shortlist." : "No matching universities."}</h3><p>${universityMode === "saved" ? "Use the + button on a university card to save it here." : "Adjust your filters, or review the separate pathway strategy. An empty shortlist is more honest than an invented fit."}</p><button class="text-button" id="clear-filters-empty">Clear filters</button></div>`}<details class="methodology"><summary>How these recommendations work</summary><p>Grade bands select manually authored, conservative exploration scenarios. Course eligibility and course rigor constrain “More Realistic”; specialized interests and an unreviewed U.S. applicant route prevent more favorable labels. SAT scores are compared with verified distributions for planning and never automatically raise the category. Acceptance rates, where verified, describe a cohort and are not individualized probabilities.</p><p>Brand Recognition is an editorial reference based on broad national/international visibility, not a measured Korean survey or a ranking. “Very High”, “High” and “Moderate” describe this limited comparison set. Major suggestions reflect breadth and documented program structures, not easier admission.</p><p>No transcript has been reviewed by this website. Grades 9–12, rigor, essays, activities, recommendations where required, English evidence, citizenship and program-specific rules can materially change an assessment. NYU is always a reach; no school here is a guaranteed safety.</p></details>`;
}
function filterSelect(
  id: string,
  label: string,
  options: string[],
  value: string,
) {
  return `<label>${label}<select id="filter-${id}"><option value="">All</option>${options.map((v) => `<option ${v === value ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>`;
}
function examsPage() {
  const ranged = universities.filter((u) => strategies[u.id].range);
  return `<div class="page-intro"><h1>SAT & AP</h1><p>School grades first. Focused preparation next. A score is one part of your application.</p></div><div class="tabs">${[
    ["sat", "SAT strategy"],
    ["ap", "AP priorities"],
  ]
    .map(
      ([v, l]) =>
        `<button data-exam-tab="${v}" class="${examTab === v ? "active" : ""}" aria-pressed="${examTab === v}">${l}</button>`,
    )
    .join("")}</div>${
    examTab === "sat"
      ? `<section class="exam-hero"><h2>Start with one practice test.</h2><p>Take a timed Bluebook test. Then practice your weak areas.</p><details class="methodology"><summary>Your SAT routine</summary>${planFact("sat-plan")}</details><details class="methodology"><summary>About the SAT</summary>${planFact("sat-definition")}</details><a class="button" href="https://satsuite.collegeboard.org/practice/practice-tests/bluebook" target="_blank" rel="noopener noreferrer">Start with official practice ↗</a></section><details class="section section-fold"><summary>Your SAT goals, grounded in real cohorts.</summary><p>These are strategic references, not official cutoffs. The lower end is a baseline comparison, not an admission minimum; the upper end is a strong study goal. Above that is a stretch goal without a promise of admission. Only verified distributions are used.</p><div class="cards">${ranged
          .map((u) => {
            const s = strategies[u.id],
              r = s.range!;
            return `<article class="score-card"><span class="eyebrow">${esc(s.shortName)}</span><h3>${r.low}–${r.high}</h3><p class="small">Official middle 50%<br>${esc(r.cohort)}</p><dl><div><dt>Baseline reference</dt><dd>${r.low}</dd></div><div><dt>Strong strategic target</dt><dd>${r.high}</dd></div><div><dt>Excellent / stretch goal</dt><dd>Above ${r.high}</dd></div></dl><p class="small">${esc(scoreContext(s, profile))}</p>${refs(r.sourceIds)}</article>`;
          })
          .join(
            "",
          )}</div><p class="small muted">For other schools, an official range was not verified here. No numerical target is assigned. An optional-test policy does not waive English proficiency requirements.</p></details><section class="section"><h2>Confirmed SAT dates · 2026–27</h2>${planFact("sat-registration")}<div class="table-wrap"><table><caption>Remaining test dates as of October 21, 2026 · times in Eastern Time</caption><thead><tr><th>Test date</th><th>Register by</th><th>Late / changes</th><th>Score release</th></tr></thead><tbody>${planning.satDates
          .filter((d) => d.date >= RESEARCH_DATE)
          .map(
            (d) =>
              `<tr><th>${date(d.date)}</th><td>${date(d.registrationDeadline)}</td><td>${date(d.lateDeadline)}</td><td>${date(d.scoreRelease)}</td></tr>`,
          )
          .join(
            "",
          )}</tbody></table></div>${refs(["sat-dates", "sat-release"])}<details class="methodology"><summary>2027–28 anticipated dates — not confirmed</summary>${planFact("sat-future")}<p>${planning.satAnticipatedDates.map((d) => date(d.date)).join(" · ")}</p></details></section><details class="section section-fold"><summary>Sending scores & test policies</summary><div><h2>Sending scores</h2>${planFact("sat-score-choice")}${planFact("sat-superscore")}</div><div><h2>What “test optional” means</h2><p>You may choose whether SAT/ACT scores are considered where the applicable policy allows. Program admission, scholarships, placement and English evidence may have separate rules. Check the entry year and campus.</p>${refs(["msu-apply", "isu-merit", "psu-requirements"])}<p>Penn State currently uses the best combined score from a single sitting rather than superscoring.</p>${refs(["psu-requirements"])}<a href="#universities" class="text-link">Read school-specific policies →</a></div></details>`
      : `<section class="exam-hero"><h2>Choose one or two AP subjects.</h2>${planFact("ap-selection")}<details class="methodology"><summary>AP course or exam only?</summary>${planFact("ap-course-exam")}</details></section><section class="section"><h2>Four priorities to consider</h2><p>Priorities and workload descriptions are editorial planning advice. AP courses can demonstrate advanced work, but each college evaluates rigor in school context. An exam-only score does not add a completed AP course to your transcript.</p><div class="ap-grid">${planning.apPriorities.map((a) => `<article class="ap-card"><span class="eyebrow">PRIORITY 0${a.priority} ${a.priority === 4 ? "· OPTIONAL" : ""}</span><h3>${esc(a.name)}</h3><p>${esc(a.reason)}</p><details class="ap-details"><summary>Preparation & credit details</summary><dl class="stacked"><dt>Workload & preparation</dt><dd>${esc(a.difficulty)}</dd><dt>When to consider it</dt><dd>${esc(a.timing)}</dd><dt>2027 exam</dt><dd>${date(a.examDate)} · ${esc(a.session)}</dd><dt>Score goal & credit relevance</dt><dd>${esc(a.target)}. ${esc(a.credit)}</dd></dl>${refs(a.sourceIds)}</details></article>`).join("")}</div><p class="small">These ASU credit examples do not transfer automatically to other universities. NYU CAS, for example, awards no credit for AP English Language; its Statistics credit does not replace Sociology’s required statistics course.</p>${refs(["nyu-ap", "nyu-sociology"])}</section><section class="section"><h2>Arrange your exam before preparing for it.</h2>${planFact("ap-order-deadline")}${planFact("ap-local-deadline")}${planFact("ap-2028")}${planFact("ap-score-policy")}</section>`
  }`;
}
function resourcesPage() {
  return `<div class="page-intro"><h1>Study resources</h1><p>Official practice comes first. Choose a book only when you know the gap it needs to fill.</p></div><div class="resource-grid">${planning.resources.map((r, i) => `<article class="resource-card"><div class="resource-number">${String(i + 1).padStart(2, "0")}</div><div><span class="eyebrow">${esc(r.priority)}</span><h2>${esc(r.title)}</h2><p>${esc(r.purpose)}</p><details class="resource-details"><summary>About this resource</summary><p class="byline">${esc(r.author)} · ${esc(r.edition)}</p><p>${esc(r.reason)}</p>${refs(r.sourceIds)}</details>${link(r.url, r.priority.includes("free") ? "Open free resource" : "View publisher / edition", "text-link")}</div></article>`).join("")}</div><p class="notice">Editions and availability were reviewed on October 21, 2026. No live prices or affiliate links. College Essay Essentials’ November 2026 edition was still forthcoming at this review.</p>`;
}
function sourcesPage() {
  const list = sources.filter((s) =>
    `${s.title} ${s.publisher} ${s.url} ${s.cycle} ${universities
      .filter((u) => u.sources.some((source) => source.id === s.id))
      .map((u) => translate(u.name, "ko"))
      .join(" ")}`
      .toLowerCase()
      .includes(sourceSearch.toLowerCase()),
  );
  return `<div class="page-intro"><h1>Sources</h1><p>${words("Admissions offices, university catalogs, official testing and government guidance, plus dated ranking reports. Every link opens the underlying page.", "대학 입학처·학과 안내·공식 시험 및 정부 자료와 해당 연도 순위 보도를 모았습니다. 각 링크에서 원문을 확인할 수 있습니다.")}</p><p class="small muted">Source document titles, publishers and reference cycles retain their original wording for verification.</p></div><div class="source-summary"><div><strong>${universities.length}</strong><span>universities researched</span></div><div><strong>${sources.length}</strong><span>source records</span></div><div><strong>Oct 21–22, 2026</strong><span>research snapshot</span></div></div><div class="notice">“Verified” records when a source was reviewed, not a guarantee that every field is known or still current. Source cycle and each fact’s status distinguish historical references, conflicts, editorial guidance and unverified information.</div><div class="filter-bar"><label class="search-field"><span class="sr-only">Search sources</span><input type="search" id="source-search" placeholder="Search publisher, topic or university" value="${esc(sourceSearch)}"></label><span role="status" class="small muted">${list.length} source records</span></div><div class="source-list">${list.map((s) => `<article><div><span class="eyebrow" data-original-language lang="en">${esc(s.publisher)}</span><h2 data-original-language lang="en">${link(s.url, s.title)}</h2><p class="source-url">${esc(s.url)}</p><p class="small" data-original-language lang="en">${esc(s.cycle)}</p></div><span class="small muted">Reviewed<br>${date(s.verified)}</span></article>`).join("") || '<p class="empty-state">No sources match this search.</p>'}</div><details class="methodology"><summary>Research method & known limitations</summary><p>University admissions and program pages take precedence over aggregators. Official testing bodies, government agencies and publishers support testing, travel and materials. Books and essay advice are supplemental, not admissions requirements. An inaccessible or conflicting source is disclosed rather than filled with a guessed fact.</p><p>Fall 2028 application deadlines and most testing-policy commitments require rechecking. 2027–28 SAT dates are anticipated; 2028 AP dates are not yet published in the reviewed schedule. Cost figures retain their published year and exclusions. Ontario equivalents and English waivers require school-specific assessment.</p><p>This is an independently prepared planning tool, not a university service or an admissions prediction model.</p></details>`;
}
function render(restoreFocus = false) {
  const active = document.activeElement as HTMLInputElement | null;
  const focusId = restoreFocus ? active?.id : "";
  const selection = active?.type === "search" ? active.selectionStart : null;
  app
    .querySelectorAll<HTMLDetailsElement>("details[data-disclosure]")
    .forEach((d) => {
      if (d.open) openedDetails.add(d.dataset.disclosure!);
      else openedDetails.delete(d.dataset.disclosure!);
    });
  const r = route();
  app.innerHTML = `<aside class="sidebar"><a class="brand" href="#timeline" aria-label="UniNavo home"><span class="brand-symbol">u<span>↗</span></span><span>UniNavo<span class="brand-sub">YOUR NEXT CHAPTER</span></span></a><nav aria-label="Main navigation">${nav.map((n) => `<a href="#${n.id}" ${r === n.id ? 'aria-current="page"' : ""}><span aria-hidden="true">${n.icon}</span>${n.label}${n.id === "timeline" ? "<i></i>" : ""}</a>`).join("")}</nav></aside><div class="workspace"><header class="topbar"><span>Grade 11 → Fall 2028</span><div class="top-actions"><button id="language-toggle" class="language-toggle" lang="${getLanguage() === "en" ? "ko" : "en"}" aria-label="${getLanguage() === "en" ? "한국어로 보기" : "Switch to English"}"><span aria-hidden="true">◎</span> ${getLanguage() === "en" ? "한국어" : "English"}</button></div></header><main id="main" tabindex="-1">${r === "timeline" ? timelinePage() : r === "universities" ? universitiesPage() : r === "exams" ? examsPage() : r === "resources" ? resourcesPage() : sourcesPage()}</main><footer><p>Planning guidance, not an admission guarantee.</p><details class="footer-notes"><summary>Sources & important notes</summary><p>Research reviewed: October 21–22, 2026. Admission policies and deadlines can change. Always confirm final requirements on the university’s official admissions website before applying.</p><p>${persistenceAvailable ? "Your checklist and profile stay in this browser." : "Browser storage is unavailable. Changes are kept for this session only."}</p></details><a href="#sources">View sources ↗</a></footer></div><dialog id="task-dialog" aria-labelledby="task-dialog-title"></dialog><dialog id="university-dialog" aria-labelledby="dialog-title"></dialog><div id="live-status" class="sr-only" role="status" aria-live="polite"></div>`;
  document.documentElement.lang = getLanguage();
  document.title =
    getLanguage() === "ko"
      ? "UniNavo | 온타리오 학생을 위한 미국 대학 입학 플래너"
      : "UniNavo | Ontario to U.S. College Planner";
  const skip = document.querySelector(".skip");
  if (skip) skip.textContent = translate("Skip to content");
  localize(app);
  app
    .querySelectorAll<HTMLDetailsElement>("details[data-disclosure]")
    .forEach((d) => {
      d.open = openedDetails.has(d.dataset.disclosure!);
    });
  bind();
  if (focusId) {
    const node = document.getElementById(focusId) as HTMLInputElement | null;
    node?.focus({ preventScroll: true });
    if (selection !== null && node?.type === "search")
      node.setSelectionRange(selection, selection);
  }
}
function saveProfile() {
  persistenceAvailable = writeLocal("profile", profile) && persistenceAvailable;
  render(true);
}
function clearFilters() {
  difficulty = recognition = testing = state = sector = universitySearch = "";
  render();
}
function bind() {
  document
    .querySelector("#export-comparison")
    ?.addEventListener("click", () => {
      const csv = comparisonCsv(profile, (id) => rankFor(id)?.rank ?? null);
      const url = URL.createObjectURL(
          new Blob([csv], { type: "text/csv;charset=utf-8" }),
        ),
        a = document.createElement("a");
      a.href = url;
      a.download = "uninavo-40-scenarios-20-schools.csv";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

  document
    .querySelectorAll<HTMLButtonElement>("[data-edit-task]")
    .forEach((b) =>
      b.addEventListener("click", () => openTaskEditor(b.dataset.editTask)),
    );
  document
    .querySelectorAll<HTMLButtonElement>("[data-add-task]")
    .forEach((b) =>
      b.addEventListener("click", () =>
        openTaskEditor(undefined, b.dataset.addTask),
      ),
    );
  document
    .querySelectorAll<HTMLButtonElement>("[data-delete-task]")
    .forEach((b) =>
      b.addEventListener("click", () => {
        rememberPlan();
        planner.deleted.push(b.dataset.deleteTask!);
        plannerNotice = words(
          "Task removed. You can undo this.",
          "할 일을 삭제했어요. 실행 취소할 수 있습니다.",
        );
        persistPlan();
      }),
    );
  document.querySelector("#undo-plan")?.addEventListener("click", () => {
    if (!undoPlanner) return;
    planner = undoPlanner.planner;
    checked.clear();
    undoPlanner.checked.forEach((id) => checked.add(id));
    undoPlanner = null;
    plannerNotice = words("Change undone.", "변경을 취소했어요.");
    persistPlan();
  });
  document
    .querySelectorAll<HTMLAnchorElement>("[data-jump-month]")
    .forEach((a) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        phase = "all";
        render();
        document
          .getElementById(`month-${a.dataset.jumpMonth}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }),
    );
  document.querySelector("#export-plan")?.addEventListener("click", () => {
    const blob = new Blob(
      [
        JSON.stringify(
          { app: "UniNavo", planner, checked: [...checked] },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "uninavo-plan.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document
    .querySelector<HTMLInputElement>("#import-plan")
    ?.addEventListener("change", async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        if (file.size > 2000000) throw new Error("size");
        const data = JSON.parse(await file.text());
        if (
          data.app !== "UniNavo" ||
          data.planner?.version !== 1 ||
          !Array.isArray(data.planner.edits) ||
          !Array.isArray(data.planner.deleted) ||
          !Array.isArray(data.checked)
        )
          throw new Error("format");
        rememberPlan();
        planner = normalizePlanner(data.planner, timeline);
        checked.clear();
        data.checked
          .filter((x: unknown) => typeof x === "string")
          .forEach((id: string) => checked.add(id));
        plannerNotice = words("Backup restored.", "백업을 불러왔어요.");
        persistPlan();
      } catch {
        plannerNotice = words(
          "Could not read this backup. Your plan was not changed.",
          "백업 파일을 읽을 수 없어요. 기존 계획은 그대로입니다.",
        );
        render();
      }
    });

  document.getElementById("language-toggle")?.addEventListener("click", () => {
    persistenceAvailable =
      setLanguage(getLanguage() === "en" ? "ko" : "en") && persistenceAvailable;
    render(true);
  });
  document
    .querySelector<HTMLSelectElement>("#grade-band")
    ?.addEventListener("change", (e) => {
      profile.band = (e.target as HTMLSelectElement)
        .value as typeof profile.band;
      saveProfile();
    });
  document.querySelector("#profile-toggle")?.addEventListener("click", () => {
    profileExpanded = !profileExpanded;
    render();
    document.getElementById("profile-toggle")?.focus();
  });
  document
    .querySelector<HTMLInputElement>("#sat-score")
    ?.addEventListener("change", (e) => {
      const input = e.target as HTMLInputElement;
      if (!input.checkValidity()) {
        input.reportValidity();
        return;
      }
      profile.sat = input.value ? Number(input.value) : null;
      saveProfile();
    });
  document
    .querySelector<HTMLSelectElement>("#rigor")
    ?.addEventListener("change", (e) => {
      profile.rigor = (e.target as HTMLSelectElement)
        .value as typeof profile.rigor;
      saveProfile();
    });
  document
    .querySelector<HTMLSelectElement>("#citizenship")
    ?.addEventListener("change", (e) => {
      profile.citizenship = (e.target as HTMLSelectElement)
        .value as typeof profile.citizenship;
      saveProfile();
    });
  document
    .querySelector<HTMLSelectElement>("#program")
    ?.addEventListener("change", (e) => {
      profile.program = (e.target as HTMLSelectElement)
        .value as typeof profile.program;
      saveProfile();
    });
  document
    .querySelector<HTMLInputElement>("#coursework")
    ?.addEventListener("change", (e) => {
      profile.coursework = (e.target as HTMLInputElement).checked;
      saveProfile();
    });
  document
    .querySelectorAll<HTMLButtonElement>("[data-detail]")
    .forEach((b) =>
      b.addEventListener("click", () => openUniversity(b.dataset.detail!)),
    );
  document.querySelectorAll<HTMLButtonElement>("[data-save]").forEach((b) =>
    b.addEventListener("click", () => {
      const id = b.dataset.save!;
      if (saved.has(id)) saved.delete(id);
      else saved.add(id);
      persistenceAvailable =
        writeLocal("saved", [...saved]) && persistenceAvailable;
      render();
      document
        .querySelector<HTMLButtonElement>(`[data-save="${id}"]`)
        ?.focus({ preventScroll: true });
    }),
  );
  document.querySelectorAll<HTMLInputElement>("[data-task]").forEach((box) =>
    box.addEventListener("change", () => {
      const id = box.dataset.task!;
      rememberPlan();
      plannerNotice = box.checked
        ? words("Task completed and saved.", "완료했어요. 저장되었습니다.")
        : words("Task reopened.", "다시 할 일로 옮겼어요.");
      if (box.checked) checked.add(id);
      else checked.delete(id);
      persistenceAvailable =
        writeLocal("checked", [...checked]) && persistenceAvailable;
      render();
      document
        .querySelector<HTMLInputElement>(`[data-task="${id}"]`)
        ?.focus({ preventScroll: true });
    }),
  );
  document
    .querySelector<HTMLSelectElement>("#phase")
    ?.addEventListener("change", (e) => {
      phase = (e.target as HTMLSelectElement).value;
      render(true);
    });
  document
    .querySelector<HTMLInputElement>("#hide-completed")
    ?.addEventListener("change", (e) => {
      hideCompleted = (e.target as HTMLInputElement).checked;
      render(true);
    });
  document
    .querySelectorAll<HTMLButtonElement>("[data-university-mode]")
    .forEach((b) =>
      b.addEventListener("click", () => {
        universityMode = b.dataset.universityMode!;
        render();
      }),
    );
  document.querySelector("[data-top-picks]")?.addEventListener("click", () => {
    universityMode = "picks";
    location.hash = "universities";
  });
  document.querySelector("#advanced-toggle")?.addEventListener("click", () => {
    advancedExpanded = !advancedExpanded;
    render();
    document.getElementById("advanced-toggle")?.focus();
  });
  document
    .querySelector<HTMLInputElement>("#university-search")
    ?.addEventListener("input", (e) => {
      universitySearch = (e.target as HTMLInputElement).value;
      render(true);
    });
  document
    .querySelector<HTMLInputElement>("#source-search")
    ?.addEventListener("input", (e) => {
      sourceSearch = (e.target as HTMLInputElement).value;
      render(true);
    });
  for (const id of ["difficulty", "recognition", "testing", "state", "sector"])
    document
      .querySelector<HTMLSelectElement>(`#filter-${id}`)
      ?.addEventListener("change", (e) => {
        const v = (e.target as HTMLSelectElement).value;
        if (id === "difficulty") difficulty = v;
        else if (id === "recognition") recognition = v;
        else if (id === "testing") testing = v;
        else if (id === "state") state = v;
        else sector = v;
        render(true);
      });
  document
    .querySelector("#clear-filters")
    ?.addEventListener("click", clearFilters);
  document
    .querySelector("#clear-filters-empty")
    ?.addEventListener("click", clearFilters);
  document.querySelectorAll<HTMLButtonElement>("[data-exam-tab]").forEach((b) =>
    b.addEventListener("click", () => {
      examTab = b.dataset.examTab!;
      render();
    }),
  );
}
const factLabels: Record<string, string> = {
  admission: "Admission review",
  requirements: "Admission requirements",
  acceptanceRate: "Acceptance rate",
  acceptance: "Acceptance rate",
  testing: "SAT & ACT policy",
  sat: "SAT & ACT policy",
  satRange: "Official score distribution",
  satMiddle50: "Official score distribution",
  satTarget: "Strategic score target",
  deadlines: "Application deadlines",
  application: "Application & materials",
  materials: "Additional materials",
  ontario: "Ontario applicant notes",
  canadian: "Ontario applicant notes",
  coursework: "High-school coursework",
  international: "Applicant classification",
  english: "English proficiency",
  englishExemption: "English exemptions",
  majors: "Subjects to explore",
  recommendedMajors: "Subjects to explore",
  structure: "Admission structure",
  admissionStructure: "Admission structure",
  majorStructure: "Admission structure",
  ap: "AP & advanced credit",
  cost: "Tuition & cost context",
  aid: "Financial aid & CSS Profile",
};
function researchDetails(u: University) {
  const e = evidenceMap.get(u.id),
    s = strategies[u.id];
  const rule =
    u.facts.ontario ??
    u.facts.canadian ??
    u.facts.requirements ??
    u.facts.admission;
  const structure =
    u.facts.majorStructure ??
    u.facts.admissionStructure ??
    u.facts.structure ??
    u.facts.majors;
  const catalogs = comparisonContext.catalogs as Record<string, string>;
  const rank = rankFor(u.id);
  const catalog =
    catalogs[u.id] ??
    e?.catalog?.url ??
    e?.majorsDirectory?.url ??
    u.sources.find((source) =>
      /full.*(major|program|catalog)|undergraduate.*(program|major).*directory|all.*(major|program)/i.test(
        source.title,
      ),
    )?.url;
  return `<section class="school-evidence"><div class="ranking-summary"><strong>${rank?.url ? link(rank.url, rankLabel(u.id)) : rankLabel(u.id)}</strong> <span>U.S. News · 2026 · National Universities</span><p>${words("Brand reference", "브랜드 참고")}: ${translate(s.recognition)} · ${words("Editorial; no verified Korean survey rank", "편집상 참고 · 한국 조사 순위 미확인")}</p></div><h3>${words("Ontario credentials & entry rules", "온타리오 학력 · 지원 요건")}</h3>${rule ? fact(rule) : ""}<h3>${words("Which majors have lower entry requirements?", "입학 요건이 낮은 전공은?")}</h3><p>${words("No verified lowest Ontario admission mark is available for these majors. Where colleges publish distinct requirements or score profiles, they are shown below. A declaration rule after enrollment is not a freshman admission cutoff.", "아래 전공의 온타리오 최저 합격점은 확인되지 않았습니다. 단과대별 요건이나 점수 분포 차이가 공개된 경우 아래에 표시했습니다. 입학 후 전공 선언 조건은 신입학 합격선이 아닙니다.")}</p>${u.id === "asu" ? `<div class="conditional-route"><p>${esc(words(comparisonContext.asuComparison.text, comparisonContext.asuComparison.ko))}</p>${refs(comparisonContext.asuComparison.sourceIds)}</div>` : ""}${structure ? fact(structure) : ""}
  ${
    e
      ? `<div class="major-evidence">${e.majorEvidence
          .map((m, i) => {
            const ko = e.ko.majorEvidence?.[i];
            return `<article><h4>${esc(words(m.name, ko?.name ?? e.ko.majorNames[i] ?? translate(m.name)))}</h4><p>${esc(words(m.admissionUnit, ko?.admissionUnit ?? translate(m.admissionUnit)))}</p><p>${m.minimum ? esc(words(m.minimum, ko?.minimum ?? m.minimum)) : words("No published major-specific admission minimum verified.", "공개된 전공별 신입학 최저점 미확인.")}</p>${refs(m.sourceIds)}</article>`;
          })
          .join("")}</div>`
      : ""
  }
  ${e?.programRanges?.length ? `<h3>${words("College-specific SAT references", "단과대별 SAT 참고 범위")}</h3><p>${words("Middle50% of the named cohort; not minimums. Differences do not prove that changing majors causes admission.", "명시한 집단의 중간 50% 분포이며 최저점이 아닙니다. 점수 분포 차이가 전공 변경으로 합격할 수 있음을 뜻하지 않습니다.")}</p><div class="program-range-list">${e.programRanges.map((r) => `<article><span>${esc(translate(r.unit))}</span><strong>${r.low}–${r.high}</strong><p class="small">${esc(translate(r.cohort))}</p>${refs(r.sourceIds)}</article>`).join("")}</div>` : ""}
  ${catalog ? `<p>${link(catalog, words("Browse the full official major directory", "공식 전체 학과 목록 보기"), "text-link")}</p><p class="small">${words("Filter the directory to bachelor’s programs at this campus. The focused subjects above are not the full catalog; other programs may add auditions, portfolios or separate admission.", "학사 과정과 해당 캠퍼스로 필터하세요. 위 전공은 집중 검토한 후보이며 전체 학과 목록이 아닙니다. 다른 학과는 실기·포트폴리오·별도 선발을 요구할 수 있습니다.")}</p>` : ""}</section>`;
}
function openUniversity(id: string) {
  const u = universities.find((u) => u.id === id)!;
  const s = strategies[id];
  const dialog =
    document.querySelector<HTMLDialogElement>("#university-dialog")!;
  dialog.innerHTML = `<div class="dialog-header"><span class="monogram" style="--school:${s.color}">${s.initials}</span><button class="close-dialog" aria-label="Close university details">×</button></div><div class="dialog-body"><span class="eyebrow">${esc(u.city)}, ${esc(u.state)} · ${esc(u.type)}</span><h2 id="dialog-title">${esc(u.name)}</h2>${badge(id)}<p class="lead">${esc(s.fit)}</p><div class="notice">Fall 2028 entry: do not reuse reference-cycle deadlines as your application deadlines. ${s.testing === "Confirm policy" ? "Confirm the testing policy for the selected school and Fall 2028." : "Read the school-specific test requirement and applicable entry year below."}</div><section><h3>Academic direction</h3><p>${esc(s.majors.join(" · "))}</p><p class="small">${esc(s.structure)} · Brand reference: ${s.recognition} (editorial, not an admissions metric).</p><p class="small">${esc(scoreContext(s, profile))}</p></section>${researchDetails(u)}<div class="detail-facts">${Object.entries(
    u.facts,
  )
    .map(([key, f]) => fact(f, factLabels[key] ?? key))
    .join(
      "",
    )}</div><details class="detail-sources"><summary>Official sources</summary>${u.sources.map((source) => `<div><span data-original-language lang="en">${link(source.url, source.title)}</span><p class="source-url">${esc(source.url)}</p><small><span data-original-language lang="en">${esc(source.publisher)} · ${esc(source.cycle)}</span> · <span>Reviewed</span> ${date(source.verified)}</small></div>`).join("")}</details></div>`;
  dialog
    .querySelector(".close-dialog")!
    .addEventListener("click", () => dialog.close());
  dialog.onclick = (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        dialog.close();
    }
  };
  localize(dialog);
  dialog.showModal();
}
document.querySelector(".skip")?.addEventListener("click", (event) => {
  event.preventDefault();
  document.getElementById("main")?.focus();
});
window.addEventListener("hashchange", () => {
  render();
  window.scrollTo({ top: 0 });
  document.querySelector<HTMLElement>("#main")?.focus({ preventScroll: true });
});
render();
