import "./style.css";
import { apCourseGroups } from "./data/ap-courses.ts";
import { getLanguage, setLanguage, translate, localize } from "./i18n.ts";
import {
  universities,
  sources,
  sourceMap,
  planning,
  RESEARCH_DATE,
} from "./data/index.ts";
import { evidenceMap } from "./data/evidence.ts";
import { renderExplorer, renderScenarioDetail } from "./university-explorer.ts";
import type { ExplorerMode } from "./university-explorer.ts";
import {
  normalizeCandidateInput,
  candidateCsv,
  candidateSatAdvice,
} from "./candidate-plans.ts";
import { scenarioSchools, scenarioSchoolMap } from "./data/scenario-catalog.ts";
import comparisonContext from "../research/comparison-context.json" with { type: "json" };
import { timeline } from "./data/timeline.ts";
import { normalizePlanner, personalTimeline, saveTaskEdit } from "./planner.ts";
import type { PersonalTask } from "./planner.ts";
import type { Fact, University } from "./types.ts";
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
let explorerMode: ExplorerMode = "all-scenarios",
  explorerSearch = "";
let scenarioInput = normalizeCandidateInput(
  readLocal("scenario") ?? {
    band: profile.band || "60–65%",
    sat: profile.sat ?? 1100,
  },
);
let sourceSearch = "";
const openedDetails = new Set<string>();

const nav = [
  { id: "timeline", label: "My timeline", icon: "◷" },
  { id: "universities", label: "Universities", icon: "▦" },
  { id: "sat", label: "SAT", icon: "✧" },
  { id: "ap", label: "AP", icon: "✦" },
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
  location.hash === "#exams"
    ? "sat"
    : nav.some((n) => n.id === location.hash.slice(1))
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
function taskRow(t: PersonalTask) {
  return `<article class="task-row ${checked.has(t.id) ? "is-complete" : ""}"><div class="task-heading"><label><input type="checkbox" data-task="${t.id}" ${checked.has(t.id) ? "checked" : ""}><span ${t.personal ? "data-original-language" : ""}>${esc(t.title)}</span></label><div class="task-actions"><button data-edit-task="${t.id}" aria-label="${esc(words("Edit task", "할 일 수정"))}">${words("Edit / move", "수정 · 이동")}</button><button data-delete-task="${t.id}" aria-label="${esc(words("Delete task", "할 일 삭제"))}">${words("Delete", "삭제")}</button></div></div><div class="task-detail"><p ${t.personal ? "data-original-language" : ""}>${esc(t.detail)}</p><span class="fact-status">${t.personal ? words("My plan", "태율이가 수정한 계획") : t.kind}</span>${refs(t.sourceIds)}${t.original ? `<details class="source-disclosure"><summary>${words("Original guidance & sources", "수정 전 안내와 출처")}</summary><p>${esc(t.original.detail)}</p>${refs(t.original.sourceIds)}</details>` : ""}</div></article>`;
}
function timelinePage() {
  const months = personalTimeline(timeline, planner);
  const tasks = months.flatMap((m) => m.tasks),
    count = tasks.filter((t) => checked.has(t.id)).length;
  return `<div class="planner-heading"><div><span class="eyebrow">${words("ROADMAP · 2026—2028", "태율이의 로드맵 · 2026—2028")}</span><h1>${words("One step at a time.", "한 달씩, 하나씩.")}</h1><p>${words("Change the plan. Check things off. Keep moving.", "계획은 바꿔도 괜찮아요. 끝낸 일은 체크하고, 다음 할 일로.")}</p></div><div class="planner-total"><strong>${Math.round((count / Math.max(tasks.length, 1)) * 100)}<span>%</span></strong><span>${count} / ${tasks.length} ${words("complete", "완료")}</span></div></div>
  <section class="journey-chart" aria-label="${words("Monthly progress chart", "월별 진행률 차트")}">${months
    .map((m) => {
      const done = m.tasks.filter((t) => checked.has(t.id)).length;
      return `<a href="#month-${m.id}" data-jump-month="${m.id}" aria-label="${esc(month(m.id))}: ${done}/${m.tasks.length}" title="${esc(month(m.id))}: ${done}/${m.tasks.length}"><span class="chart-track"><i style="height:${Math.max((done / Math.max(m.tasks.length, 1)) * 100, 4)}%"></i></span><small>${m.id.slice(5)}</small><span class="chart-year">${m.id.endsWith("-01") || m.id === "2026-10" ? m.id.slice(0, 4) : ""}</span></a>`;
    })
    .join("")}</section>
  ${plannerNotice ? `<div class="planner-notice" role="status">${esc(plannerNotice)} ${undoPlanner ? `<button id="undo-plan" class="text-button">${words("Undo", "실행 취소")}</button>` : ""}</div>` : ""}
  <div class="timeline editable-timeline">${months
    .map((m, i) => {
      const done = m.tasks.filter((t) => checked.has(t.id)).length;
      return `<section class="month-card ${m.id === "2026-10" ? "current" : ""}" id="month-${m.id}"><header class="month-header"><div class="month-date"><span class="month-number">${m.id.slice(5)}</span><span>${esc(month(m.id))}</span><small>${esc(m.phase)}</small></div><div class="month-summary"><span class="eyebrow">${String(i + 1).padStart(2, "0")} / ${String(months.length).padStart(2, "0")}</span><h2>${esc(m.title)}</h2><p>${esc(m.focus)}</p><div class="month-progress"><progress value="${done}" max="${Math.max(m.tasks.length, 1)}" aria-label="${esc(month(m.id))}"></progress><span>${done}/${m.tasks.length}</span></div></div></header><div class="month-tasks">${m.tasks.length ? m.tasks.map(taskRow).join("") : `<div class="month-finished"><span>✓</span><p>${words("Nothing left here. Add a new task whenever plans change.", "남은 할 일이 없어요. 계획이 바뀌면 새로 추가하세요.")}</p></div>`}<button class="add-task" data-add-task="${m.id}">＋ ${words("Add a task", "할 일 추가")}</button></div></section>`;
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
  dialog.innerHTML = `<form id="task-form"><div class="dialog-header"><h2 id="task-dialog-title">${task ? words("Edit your plan", "계획 수정") : words("A new task", "새 할 일")}</h2><button type="button" class="close-dialog" aria-label="${words("Cancel", "취소")}">×</button></div><div class="task-form-fields"><label>${words("Task", "할 일")}<input name="title" required maxlength="180" value="${esc(task ? translate(task.title) : "")}"></label><label>${words("Month · choose another to move", "월 · 다른 달을 선택하면 이동합니다")}<select name="monthId">${timeline.map((m) => `<option value="${m.id}" ${m.id === (containing?.id ?? monthId) ? "selected" : ""}>${esc(month(m.id))}</option>`).join("")}</select></label><label>${words("Details / my notes", "자세한 내용 / 태율이의 메모")}<textarea name="detail" rows="7" maxlength="5000">${esc(task ? translate(task.detail) : "")}</textarea></label><p class="small">${words("Your edits are personal planning notes. Original official guidance remains available under the task.", "수정 내용은 개인 계획으로 저장됩니다. 기존 공식 안내와 출처는 항목 아래에서 다시 확인할 수 있어요.")}</p><div class="form-actions"><button type="button" id="cancel-task" class="text-button">${words("Cancel", "취소")}</button><button class="button" type="submit">${words("Save plan", "저장하기")}</button></div></div></form>`;
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
function universitiesPage() {
  return renderExplorer(scenarioInput, explorerMode, explorerSearch, saved);
}
function apCatalogSection() {
  return `<section class="section ap-catalog" aria-labelledby="ap-catalog-title"><h2 id="ap-catalog-title">${words("All 42 AP courses · 2026–27", "AP 전체 42과목 · 2026–27년")}</h2><p>${words("Browse College Board’s official courses by subject. Each course links to its official page.", "College Board 공식 과목을 분야별로 살펴보세요. 각 과목에서 공식 안내로 이동할 수 있습니다.")}</p><p class="small muted">${words("Reviewed October 22, 2026. AP Central lists 43 subjects including AP Networking, which is pilot-only in 2026–27 and launches generally in 2027–28. The 42 courses below exclude that pilot. School availability and exam-only eligibility vary.", "2026년 10월 22일 확인. AP Central은 AP Networking을 포함해 43과목을 표시합니다. Networking은 2026–27년 시범 운영, 2027–28년 정식 도입 예정이므로 아래 일반 제공 42과목에서 제외했습니다. 학교별 개설 여부와 시험만 응시할 수 있는지는 따로 확인하세요.")}</p>${refs(["ap-course-catalog", "ap-networking"])}<div class="ap-catalog-grid">${apCourseGroups.map((group) => `<article class="ap-course-group"><h3>${esc(words(group.en, group.ko))} <span class="muted">${group.courses.length}</span></h3><ul>${group.courses.map(([en, ko, slug]) => `<li>${link(`https://apcentral.collegeboard.org/courses/${slug}`, words(`AP ${en}`, `AP ${ko} (${en})`))}</li>`).join("")}</ul></article>`).join("")}</div></section>`;
}
function examsPage(examTab: "sat" | "ap") {
  const ranged = scenarioSchools.filter(
    (u) => u.satRange && u.testing.policy !== "not-considered",
  );
  const content = `${
    examTab === "sat"
      ? `<details class="section section-fold"><summary>Your SAT goals, grounded in real cohorts.</summary><p>These are strategic references, not official cutoffs. The lower end is a baseline comparison, not an admission minimum; the upper end is a strong study goal. Above that is a stretch goal without a promise of admission. Only verified distributions are used.</p><div class="cards">${ranged
          .map((u) => {
            const r = u.satRange!;
            return `<article class="score-card"><span class="eyebrow">${esc(words(u.name, u.nameKo))}</span><h3>${r.low}–${r.high}</h3><p class="small">Official middle 50%<br>${esc(words(r.cohort, r.cohortKo || translate(r.cohort)))}</p><dl><div><dt>Baseline reference</dt><dd>${r.low}</dd></div><div><dt>Strong strategic target</dt><dd>${r.high}</dd></div><div><dt>Excellent / stretch goal</dt><dd>Above ${r.high}</dd></div></dl><p class="small">${esc(candidateSatAdvice(u, scenarioInput.sat, getLanguage() === "ko"))}</p>${refs(r.sourceIds)}</article>`;
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
          )}</tbody></table></div>${refs(["sat-dates", "sat-release"])}<details class="methodology"><summary>2027–28 anticipated dates — not confirmed</summary>${planFact("sat-future")}<p>${planning.satAnticipatedDates.map((d) => date(d.date)).join(" · ")}</p></details></section><details class="section section-fold"><summary>Sending scores & test policies</summary><div><h2>Sending scores</h2>${planFact("sat-score-choice")}${planFact("sat-superscore")}</div><div><h2>What “test optional” means</h2><p>You may choose whether SAT/ACT scores are considered where the applicable policy allows. Program admission, scholarships, placement and English evidence may have separate rules. Check the entry year and campus.</p>${refs(["msu-apply", "isu-merit", "psu-requirements"])}<p>Penn State currently uses the best combined score from a single sitting rather than superscoring.</p>${refs(["psu-requirements"])}<a href="#universities" class="text-link">Read school-specific policies →</a></div></details><section class="exam-hero"><h2>Start with one practice test.</h2><p>Take a timed Bluebook test. Then practice your weak areas.</p><details class="methodology"><summary>Your SAT routine</summary>${planFact("sat-plan")}</details><details class="methodology"><summary>About the SAT</summary>${planFact("sat-definition")}</details><a class="button" href="https://satsuite.collegeboard.org/practice/practice-tests/bluebook" target="_blank" rel="noopener noreferrer">Start with official practice ↗</a></section>`
      : `<section class="section"><h2>Four priorities to consider</h2><p>Priorities and workload descriptions are editorial planning advice. AP courses can demonstrate advanced work, but each college evaluates rigor in school context. An exam-only score does not add a completed AP course to your transcript.</p><div class="ap-grid">${planning.apPriorities.map((a) => `<article class="ap-card"><span class="eyebrow">PRIORITY 0${a.priority} ${a.priority === 4 ? "· OPTIONAL" : ""}</span><h3>${esc(a.name)}</h3><p>${esc(a.reason)}</p><details class="ap-details"><summary>Preparation & credit details</summary><dl class="stacked"><dt>Workload & preparation</dt><dd>${esc(a.difficulty)}</dd><dt>When to consider it</dt><dd>${esc(a.timing)}</dd><dt>2027 exam</dt><dd>${date(a.examDate)} · ${esc(a.session)}</dd><dt>Score goal & credit relevance</dt><dd>${esc(a.target)}. ${esc(a.credit)}</dd></dl>${refs(a.sourceIds)}</details></article>`).join("")}</div><p class="small">These ASU credit examples do not transfer automatically to other universities. NYU CAS, for example, awards no credit for AP English Language; its Statistics credit does not replace Sociology’s required statistics course.</p>${refs(["nyu-ap", "nyu-sociology"])}</section><section class="section"><h2>Arrange your exam before preparing for it.</h2>${planFact("ap-order-deadline")}${planFact("ap-local-deadline")}${planFact("ap-2028")}${planFact("ap-score-policy")}</section>${apCatalogSection()}<section class="exam-hero"><h2>Choose one or two AP subjects.</h2>${planFact("ap-selection")}<details class="methodology"><summary>AP course or exam only?</summary>${planFact("ap-course-exam")}</details></section>`
  }`;
  const visibleContent =
    examTab === "sat"
      ? content
          .replace(/<details\b([^>]*)>/g, "<section$1>")
          .replace(/<summary>/g, "<h2>")
          .replace(/<\/summary>/g, "</h2>")
          .replace(/<\/details>/g, "</section>")
      : content;
  return `<div class="page-intro"><h1>${examTab.toUpperCase()}</h1><p>School grades first. Focused preparation next. A score is one part of your application.</p></div>${visibleContent}`;
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
  return `<div class="page-intro"><h1>Sources</h1><p>${words("Admissions offices, university catalogs, official testing and government guidance, plus dated ranking reports. Every link opens the underlying page.", "대학 입학처·학과 안내·공식 시험 및 정부 자료와 해당 연도 순위 보도를 모았습니다. 각 링크에서 원문을 확인할 수 있습니다.")}</p><p class="small muted">Source document titles, publishers and reference cycles retain their original wording for verification.</p></div><div class="source-summary"><div><strong>${scenarioSchools.length}</strong><span>universities researched</span></div><div><strong>${sources.length}</strong><span>source records</span></div><div><strong>Oct 21–22, 2026</strong><span>research snapshot</span></div></div><div class="notice">“Verified” records when a source was reviewed, not a guarantee that every field is known or still current. Source cycle and each fact’s status distinguish historical references, conflicts, editorial guidance and unverified information.</div><div class="filter-bar"><label class="search-field"><span class="sr-only">Search sources</span><input type="search" id="source-search" placeholder="Search publisher, topic or university" value="${esc(sourceSearch)}"></label><span role="status" class="small muted">${list.length} source records</span></div><div class="source-list">${list.map((s) => `<article><div><span class="eyebrow" data-original-language lang="en">${esc(s.publisher)}</span><h2 data-original-language lang="en">${link(s.url, s.title)}</h2><p class="source-url">${esc(s.url)}</p><p class="small" data-original-language lang="en">${esc(s.cycle)}</p></div><span class="small muted">Reviewed<br>${date(s.verified)}</span></article>`).join("") || '<p class="empty-state">No sources match this search.</p>'}</div><details class="methodology"><summary>Research method & known limitations</summary><p>University admissions and program pages take precedence over aggregators. Official testing bodies, government agencies and publishers support testing, travel and materials. Books and essay advice are supplemental, not admissions requirements. An inaccessible or conflicting source is disclosed rather than filled with a guessed fact.</p><p>Fall 2028 application deadlines and most testing-policy commitments require rechecking. 2027–28 SAT dates are anticipated; 2028 AP dates are not yet published in the reviewed schedule. Cost figures retain their published year and exclusions. Ontario equivalents and English waivers require school-specific assessment.</p><p>This is an independently prepared planning tool, not a university service or an admissions prediction model.</p></details>`;
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
  app.innerHTML = `<aside class="sidebar"><a class="brand" href="#timeline" aria-label="UniNavo home"><span class="brand-symbol">u<span>↗</span></span><span>UniNavo<span class="brand-sub">YOUR NEXT CHAPTER</span></span></a><nav aria-label="Main navigation">${nav.map((n) => `<a href="#${n.id}" ${r === n.id ? 'aria-current="page"' : ""}><span aria-hidden="true">${n.icon}</span>${n.label}${n.id === "timeline" ? "<i></i>" : ""}</a>`).join("")}</nav></aside><div class="workspace"><header class="topbar"><div class="personal-heading"><strong data-original-language lang="ko">태율이의 미국 대학교 입시</strong><span>Grade 11 → Fall 2028</span></div><div class="top-actions"><a class="education-brand" href="https://yoloedu.org/" target="_blank" rel="noopener noreferrer" aria-label="YOLO Education" data-original-language><img src="${import.meta.env.BASE_URL}branding/yolo-education.png" width="483" height="194" alt="YOLO Education"><span>YOLO Education ↗</span></a><button id="language-toggle" class="language-toggle" lang="${getLanguage() === "en" ? "ko" : "en"}" aria-label="${getLanguage() === "en" ? "한국어로 보기" : "Switch to English"}"><span aria-hidden="true">◎</span> ${getLanguage() === "en" ? "한국어" : "English"}</button></div></header><main id="main" tabindex="-1">${r === "timeline" ? timelinePage() : r === "universities" ? universitiesPage() : r === "sat" || r === "ap" ? examsPage(r) : r === "resources" ? resourcesPage() : sourcesPage()}</main><footer><p>Planning guidance, not an admission guarantee.</p><details class="footer-notes"><summary>Sources & important notes</summary><p>Research reviewed: October 21–22, 2026. Admission policies and deadlines can change. Always confirm final requirements on the university’s official admissions website before applying.</p><p>${persistenceAvailable ? "Your checklist and profile stay in this browser." : "Browser storage is unavailable. Changes are kept for this session only."}</p></details><a href="#sources">View sources ↗</a></footer></div><dialog id="task-dialog" aria-labelledby="task-dialog-title"></dialog><dialog id="university-dialog" aria-labelledby="dialog-title"></dialog><div id="live-status" class="sr-only" role="status" aria-live="polite"></div>`;
  document.documentElement.lang = getLanguage();
  document.title =
    getLanguage() === "ko"
      ? "태율이의 미국 대학교 입시 | UniNavo"
      : "태율이의 미국 대학교 입시 | UniNavo";
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
function bind() {
  document
    .querySelectorAll<HTMLButtonElement>("[data-explorer-mode]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        explorerMode = button.dataset.explorerMode as ExplorerMode;
        render();
      }),
    );
  const satField = document.querySelector<HTMLInputElement>("#scenario-sat");
  if (satField) {
    const saveSat = () => {
      if (!satField.checkValidity()) return false;
      scenarioInput = normalizeCandidateInput({
        ...scenarioInput,
        sat: satField.value === "" ? null : Number(satField.value),
      });
      persistenceAvailable =
        writeLocal("scenario", scenarioInput) && persistenceAvailable;
      return true;
    };
    satField.addEventListener("input", saveSat);
    satField.addEventListener("change", saveSat);
    satField.addEventListener("blur", () => {
      if (saveSat()) {
        // Let a tab/cell click finish before replacing its DOM target.
        setTimeout(() => {
          if (satField.isConnected) render();
        }, 0);
      } else satField.reportValidity();
    });
    satField.addEventListener("keydown", (event) => {
      if (event.key === "Enter") satField.blur();
    });
  }
  document
    .querySelectorAll<HTMLButtonElement>("[data-scenario-choice]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        const [band, sat] = button.dataset.scenarioChoice!.split("|");
        scenarioInput = normalizeCandidateInput({
          ...scenarioInput,
          band,
          sat: Number(sat),
          exactAverage: null,
          readingWriting: null,
          math: null,
        });
        explorerMode = "scenario";
        persistenceAvailable =
          writeLocal("scenario", scenarioInput) && persistenceAvailable;
        render();
        document
          .querySelector(".scenario-result-head")
          ?.scrollIntoView({ block: "start" });
      }),
    );
  document
    .querySelector<HTMLInputElement>("#scenario-search")
    ?.addEventListener("input", (event) => {
      explorerSearch = (event.target as HTMLInputElement).value;
      render(true);
    });
  document.querySelector("#export-scenarios")?.addEventListener("click", () => {
    const csv = candidateCsv();
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "uninavo-40-scenarios-400-research-candidates.csv";
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
        render();
        document
          .getElementById(`month-${a.dataset.jumpMonth}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }),
    );
  document.getElementById("language-toggle")?.addEventListener("click", () => {
    persistenceAvailable =
      setLanguage(getLanguage() === "en" ? "ko" : "en") && persistenceAvailable;
    render(true);
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
    .querySelector<HTMLInputElement>("#source-search")
    ?.addEventListener("input", (e) => {
      sourceSearch = (e.target as HTMLInputElement).value;
      render(true);
    });
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
  const e = evidenceMap.get(u.id);
  const catalogs = comparisonContext.catalogs as Record<string, string>;
  const catalog = catalogs[u.id] ?? e?.catalog?.url ?? e?.majorsDirectory?.url;
  return catalog
    ? `<p>${link(catalog, words("Browse the full official major directory", "공식 전체 학과 목록 보기"), "text-link")}</p>`
    : "";
}
function openUniversity(id: string) {
  const school = scenarioSchoolMap.get(id);
  if (!school) return;
  const dialog =
    document.querySelector<HTMLDialogElement>("#university-dialog")!;
  dialog.innerHTML = renderScenarioDetail(school, scenarioInput);
  const legacy = universities.find((u) => u.id === id);
  if (legacy)
    dialog.querySelector(".dialog-body")!.insertAdjacentHTML(
      "beforeend",
      `<details class="methodology"><summary>${words("Additional application, cost & credit references", "추가 지원 자료 · 비용 · 학점 인정")}</summary>${researchDetails(legacy)}<div class="detail-facts">${Object.entries(
        legacy.facts,
      )
        .filter(([key]) =>
          [
            "deadlines",
            "application",
            "materials",
            "coursework",
            "english",
            "englishExemption",
            "ap",
            "cost",
            "aid",
          ].includes(key),
        )
        .map(([key, f]) => fact(f, factLabels[key] ?? key))
        .join("")}</div></details>`,
    );
  dialog
    .querySelector(".close-dialog")!
    .addEventListener("click", () => dialog.close());
  dialog.onclick = (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      dialog.close();
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
