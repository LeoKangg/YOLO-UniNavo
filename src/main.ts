import "./style.css";
import {
  universities,
  sources,
  sourceMap,
  planning,
  pathways,
  RESEARCH_DATE,
} from "./data/index.ts";
import { strategies } from "./data/strategies.ts";
import { timeline } from "./data/timeline.ts";
import { GRADE_BANDS } from "./types.ts";
import type { Fact, University, Task } from "./types.ts";
import { categoryFor, recommend, scoreContext } from "./recommendations.ts";
import { loadProfile, loadChecked, loadSaved, writeLocal } from "./storage.ts";

const app = document.querySelector<HTMLDivElement>("#app")!;
const profile = loadProfile();
const checked = loadChecked(),
  saved = loadSaved();
let persistenceAvailable = true;
let universityMode = "explore",
  difficulty = "",
  recognition = "",
  testing = "",
  state = "",
  sector = "",
  universitySearch = "";
let phase = "all",
  hideCompleted = false,
  examTab = "sat",
  sourceSearch = "";
let profileExpanded = false,
  advancedExpanded = false;
const openedMonths = new Set(["2026-10"]);
const nav = [
  { id: "overview", label: "Overview", icon: "⌂" },
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
    : "overview";
const date = (s: string) =>
  new Date(`${s}T12:00:00Z`).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
const month = (s: string) =>
  new Date(`${s}-01T12:00:00Z`).toLocaleDateString("en-CA", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
const link = (url: string, label: string, cls = "") =>
  `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a>`;
function refs(ids: string[]) {
  return `<span class="references">${[...new Set(ids)]
    .map((id) => {
      const s = sourceMap.get(id);
      return s ? link(s.url, s.title) : "";
    })
    .join("")}</span>`;
}
function fact(f: Fact, title?: string) {
  return `<div class="fact">${title ? `<h3>${esc(title)}</h3>` : ""}<p>${esc(f.text)}</p><span class="fact-status">${esc(f.status.replaceAll("-", " "))}</span>${refs(f.sourceIds)}</div>`;
}
function planFact(id: string) {
  const f = planning.facts.find((f) => f.id === id);
  return f ? fact(f) : "";
}
function badge(id: string) {
  const c = categoryFor(id, profile);
  return `<span class="badge ${c === "Reach" || c === "Very High Reach" ? "reach" : c === "More Realistic" ? "realistic" : ""}">${c ?? "Select your grade range"}</span>`;
}
function targetInfo() {
  const picks = recommend(universities, profile);
  const ranges = picks.flatMap((u) =>
    strategies[u.id].range ? [strategies[u.id].range!] : [],
  );
  return {
    value: ranges.length ? Math.max(...ranges.map((r) => r.high)) : null,
    ranges,
  };
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
function card(u: University, compact = false) {
  const s = strategies[u.id];
  const testingFact = u.facts.testing ?? u.facts.sat;
  return `<article class="university-card"><div class="card-top"><span class="monogram" style="--school:${s.color}">${s.initials}</span><button class="save-button ${saved.has(u.id) ? "saved" : ""}" data-save="${u.id}" aria-label="${saved.has(u.id) ? "Remove" : "Save"} ${esc(u.name)} ${saved.has(u.id) ? "from" : "to"} my shortlist" aria-pressed="${saved.has(u.id)}">${saved.has(u.id) ? "✓" : "+"}</button></div><span class="small muted">${esc(u.city)}, ${esc(u.state)} · ${u.type.toLowerCase().includes("private") ? "Private" : "Public"}</span><h3>${esc(u.name)}</h3>${badge(u.id)}<p class="fit">${esc(s.fit)}</p><dl class="card-meta"><div><dt>Brand reference</dt><dd>${s.recognition} <span title="Editorial judgment; not a measured Korean recognition rate">ⓘ</span></dd></div><div><dt>Published SAT / ACT</dt><dd>${s.testing}</dd></div><div><dt>Fall 2028 deadline</dt><dd>Not yet confirmed</dd></div></dl><p class="small muted">Recheck testing for 2028. ${compact ? "" : esc(s.majors.join(" · "))}</p>${refs(testingFact?.sourceIds.slice(0, 1) ?? [])}<button class="detail-button" data-detail="${u.id}">View details <span aria-hidden="true">↗</span></button></article>`;
}
function taskRow(t: Task) {
  return `<div class="task-row ${checked.has(t.id) ? "is-complete" : ""}"><label><input type="checkbox" data-task="${t.id}" ${checked.has(t.id) ? "checked" : ""}><span>${esc(t.title)}</span></label><div class="task-detail"><p>${esc(t.detail)}</p><span class="fact-status">${t.kind}</span>${refs(t.sourceIds)}</div></div>`;
}
function pathwayPanel() {
  return `<aside class="pathway"><span class="eyebrow">A DIFFERENT ROUTE</span><h3>Build options, not false certainty.</h3><p>At 60–70%, this research does not support a balanced direct-entry shortlist at the featured universities. At 70–75%, the few options shown are research leads, not targets. Prioritize stronger marks and a transcript assessment.</p>${pathways.facts.map((f) => fact(f)).join("")}<p class="small">Conditional English admission is not an academic waiver. A branch-campus offer is not an offer at the flagship campus. Check the exact campus, pathway contract and progression rules.</p></aside>`;
}
function overview() {
  const picks = recommend(universities, profile),
    target = targetInfo();
  const now = timeline[0];
  const done = now.tasks.filter((t) => checked.has(t.id)).length;
  return `<section class="hero"><div class="hero-copy"><span class="eyebrow">ONTARIO → UNITED STATES</span><h1>Your next chapter.<br><em>A clearer path.</em></h1><p>A practical roadmap from Grade 11 to a U.S. university. Know what to do now, explore your options, and make each step count.</p><p class="hero-now"><strong>Do this now</strong>Review your courses · Take a SAT diagnostic · Confirm an AP host</p><a class="button" href="#timeline">Open my timeline <span aria-hidden="true">↗</span></a></div><div class="journey" aria-label="Your roadmap: Grade 11 in 2026–27, Grade 12 in 2027–28, university entry Fall 2028"><span class="eyebrow">THE JOURNEY AHEAD</span><div class="journey-step active"><span class="journey-dot"></span><div><small>YOU ARE HERE · OCT 2026</small><strong>Grade 11</strong><span>Explore & build your foundation</span></div><b>01</b></div><div class="journey-step"><span class="journey-dot"></span><div><small>2027–2028</small><strong>Grade 12</strong><span>Apply with intention</span></div><b>02</b></div><div class="journey-step"><span class="journey-dot"></span><div><small>FALL 2028</small><strong>Your U.S. university</strong><span>A new beginning</span></div><b>03</b></div><p class="small">Planning assumes normal grade progression and graduation in June 2028.</p></div></section>
 ${profilePanel()}<div class="snapshot"><div><span>ENTRY GOAL</span><strong>Fall 2028</strong><small>Grade 11 → Grade 12 → university</small></div><div><span>WORKING SHORTLIST</span><strong>${profile.band ? picks.length : "—"} <small>/ up to 6</small></strong><small>${profile.band ? "Conditional planning suggestions" : "Select your grade range"}</small></div><div><span>SAT STRATEGIC GOAL</span><strong>${target.value ?? "Diagnostic first"}</strong><small>${target.value ? "Upper-range reference · not a cutoff" : "Choose schools before setting a score"}</small></div><div><span>NEXT PLANNING CHECKPOINT</span><strong>AP registration</strong><small>Ask your host now · school order Nov 13</small></div></div><div class="small context-line">${target.value ? "SAT goal covers only shortlisted schools with verified distributions; other schools still need research. " : ""}${refs(target.ranges.flatMap((r) => r.sourceIds))}${refs(["ap-order"])}</div>
 <section class="now-layout"><div><div class="section-heading"><div><span class="eyebrow">DO THIS NOW</span><h2>Small steps. Real progress.</h2></div><span class="progress-label">${done} / ${now.tasks.length} complete</span></div><p class="muted">October 2026 · Your first three priorities, plus one useful habit.</p><div class="now-tasks">${now.tasks.map(taskRow).join("")}</div><a class="text-link" href="#timeline">See the full monthly plan →</a><details class="methodology"><summary>Ontario diploma & transcript checklist</summary>${planFact("ossd-cohort")}${planFact("ossd-financial-literacy")}${planFact("ontario-um")}${planFact("ontario-gpa")}</details></div><aside class="note-card"><span class="eyebrow">THE ONTARIO DIFFERENCE</span><h3>Your transcript.<br>Your context.</h3><p>Keep your Ontario grades in their original scale. U.S. universities assess your courses, academic history and school context individually.</p>${refs(["common-gpa", "ontario-courses"])}<hr><h4>Do this next</h4><p>Build a focused SAT routine and confirm your Grade 12 course choices.</p><h4>Later</h4><p>Summer 2027: essays and application preparation. Recheck Fall 2028 policies before applying.</p><a class="text-link" href="#exams">Plan SAT & AP →</a></aside></section>
 <section class="section"><div class="section-heading"><div><span class="eyebrow">FIND YOUR DIRECTION</span><h2>A thoughtful university shortlist.</h2></div><a href="#universities" class="text-link">Explore all ${universities.length} →</a></div><p class="muted">University name matters to you. Academic fit and a realistic application plan matter too.</p>${
   !profile.band
     ? `<div class="empty-state"><h3>Start with your expected average.</h3><p>Choose a range above to see conditional picks. We will not turn an Ontario average into an admission probability.</p></div>`
     : picks.length
       ? `<div class="cards">${picks
           .slice(0, 3)
           .map((u) => card(u, true))
           .join(
             "",
           )}</div><button data-top-picks class="text-button">View all ${picks.length} working picks →</button>`
       : pathwayPanel()
 }</section>`;
}
function timelinePage() {
  const tasks = timeline.flatMap((m) => m.tasks),
    count = tasks.filter((t) => checked.has(t.id)).length;
  const shown = timeline.filter((m) => phase === "all" || m.phase === phase);
  return `<div class="page-intro"><span class="eyebrow">ONE MONTH AT A TIME</span><h1>My U.S. College Timeline</h1><p>From October 2026 to your Fall 2028 arrival. A clear next step, every month.</p></div><div class="timeline-toolbar"><div><strong>${count} of ${tasks.length} tasks complete</strong><progress value="${count}" max="${tasks.length}" aria-label="Timeline completion"></progress><span class="small muted">Saved in this browser · no account needed</span></div><label>Show a stage<select id="phase"><option value="all">Entire journey</option>${[...new Set(timeline.map((m) => m.phase))].map((p) => `<option ${phase === p ? "selected" : ""}>${p}</option>`).join("")}</select></label><label class="checkline"><input type="checkbox" id="hide-completed" ${hideCompleted ? "checked" : ""}>Hide completed tasks</label></div><div class="notice">This is a planning calendar anchored to October 21, 2026. College application dates for Fall 2028 remain unconfirmed; future task months are preparation windows, not official deadlines. ${refs(["sat-dates", "ap-order"])}</div><div class="timeline">${shown
    .map((m) => {
      const allDone = m.tasks.every((t) => checked.has(t.id));
      const visible = m.tasks.filter(
        (t) => !hideCompleted || !checked.has(t.id),
      );
      return `<details class="month-card ${m.id === "2026-10" ? "current" : ""}" data-month="${m.id}" ${openedMonths.has(m.id) ? "open" : ""}><summary><div class="month-date"><span>${esc(month(m.id))}</span><small>${esc(m.phase)}</small></div><div class="month-summary"><span class="eyebrow">${m.id === "2026-10" ? "NOW" : m.id < "2027-07" ? "NEXT" : "LATER"} · ${m.priority.toUpperCase()} PRIORITY</span><h2>${esc(m.title)}</h2><p>${esc(m.focus)}</p></div><span class="month-count">${m.tasks.filter((t) => checked.has(t.id)).length}/${m.tasks.length} ${allDone ? "✓" : "+"}</span></summary><div class="month-tasks">${visible.length ? visible.map(taskRow).join("") : '<p class="empty-state">All tasks for this month are complete.</p>'}</div></details>`;
    })
    .join(
      "",
    )}</div><section class="section"><h2>Application plans, without the confusion.</h2>${planFact("early-options")}<p>Regular Decision has a published standard deadline; rolling admission reviews applications over a period, often while space remains. Neither guarantees admission. University-specific deadlines and required-material dates belong to the actual entry year.</p><a href="#universities" class="text-link">Check each university’s published reference dates →</a></section><section class="section"><h2>Before you cross the border</h2>${planFact("canadian-entry")}${planFact("federal-aid")}</section>`;
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
        `${u.name} ${s.majors.join(" ")}`
          .toLowerCase()
          .includes(universitySearch.toLowerCase()))
    );
  });
  return `<div class="page-intro"><span class="eyebrow">FIND YOUR DIRECTION</span><h1>A name you know.<br><em>A path that fits.</em></h1><p>Explore ${universities.length} U.S. universities through an Ontario lens. Every important claim connects to its source.</p></div>${profilePanel()}<div class="tabs" aria-label="University view">${[
    ["explore", "All universities"],
    ["picks", "My 6 picks"],
    ["saved", `Saved (${saved.size})`],
  ]
    .map(
      ([v, l]) =>
        `<button data-university-mode="${v}" aria-pressed="${universityMode === v}" class="${universityMode === v ? "active" : ""}">${l}</button>`,
    )
    .join(
      "",
    )}</div><div class="filter-bar"><label class="search-field"><span class="sr-only">Search universities or majors</span><input id="university-search" type="search" placeholder="Search a university or subject" value="${esc(universitySearch)}"></label><button class="text-button" id="advanced-toggle" aria-expanded="${advancedExpanded}">Advanced filters ${advancedExpanded ? "−" : "+"}</button><span class="small muted" role="status">${list.length} ${list.length === 1 ? "university" : "universities"}</span></div>${advancedExpanded ? `<div class="advanced-filters">${filterSelect("difficulty", "Planning category", ["Very High Reach", "Reach", "Target", "More Realistic"], difficulty)}${filterSelect("recognition", "Brand reference", ["Very High", "High", "Moderate"], recognition)}${filterSelect("testing", "Published SAT policy", ["Test optional", "Test required", "Confirm policy"], testing)}${filterSelect("state", "State", [...new Set(universities.map((u) => u.state))].sort(), state)}${filterSelect("sector", "University type", ["Public", "Private"], sector)}<button class="text-button" id="clear-filters">Clear filters</button></div>` : ""}<p class="planning-disclaimer">This is planning guidance, not an admission guarantee. Categories are editorial exploration scenarios, not validated Ontario cutoffs. ${profile.program === "specialized" ? "Specialized-program fit requires a separate review." : ""}</p>${profile.band && GRADE_BANDS.indexOf(profile.band) < 3 ? pathwayPanel() : ""}${universityMode === "picks" ? `<div class="notice">${profile.band ? "Up to six working picks, balancing available planning categories before brand reference. We do not fill a list with unsuitable names. “Target” still requires a full transcript assessment; “More Realistic” appears only after course checks and strong preparation are reported." : "Choose a grade range to generate your working shortlist."}</div>` : ""}${list.length ? `<div class="cards">${list.map((u) => card(u)).join("")}</div>` : `<div class="empty-state"><h3>${universityMode === "saved" ? "Build your own shortlist." : "No matching universities."}</h3><p>${universityMode === "saved" ? "Use the + button on a university card to save it here." : "Adjust your filters, or review the separate pathway strategy. An empty shortlist is more honest than an invented fit."}</p><button class="text-button" id="clear-filters-empty">Clear filters</button></div>`}<details class="methodology"><summary>How these recommendations work</summary><p>Grade bands select manually authored, conservative exploration scenarios. Course eligibility and course rigor constrain “More Realistic”; specialized interests and an unreviewed U.S. applicant route prevent more favorable labels. SAT scores are compared with verified distributions for planning and never automatically raise the category. Acceptance rates, where verified, describe a cohort and are not individualized probabilities.</p><p>Brand Recognition is an editorial reference based on broad national/international visibility, not a measured Korean survey or a ranking. “Very High”, “High” and “Moderate” describe this limited comparison set. Major suggestions reflect breadth and documented program structures, not easier admission.</p><p>No transcript has been reviewed by this website. Grades 9–12, rigor, essays, activities, recommendations where required, English evidence, citizenship and program-specific rules can materially change an assessment. NYU is always a reach; no school here is a guaranteed safety.</p></details>`;
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
  return `<div class="page-intro"><span class="eyebrow">PREPARE WITH PURPOSE</span><h1>Make testing work for you.</h1><p>School grades first. Focused preparation next. A score is one part of your application.</p></div><div class="tabs">${[
    ["sat", "SAT strategy"],
    ["ap", "AP priorities"],
  ]
    .map(
      ([v, l]) =>
        `<button data-exam-tab="${v}" class="${examTab === v ? "active" : ""}" aria-pressed="${examTab === v}">${l}</button>`,
    )
    .join("")}</div>${
    examTab === "sat"
      ? `<section class="exam-hero"><span class="eyebrow">START WITH A DIAGNOSTIC</span><h2>Know your baseline.<br>Then choose your goal.</h2>${planFact("sat-definition")}${planFact("sat-plan")}<a class="button" href="https://satsuite.collegeboard.org/practice/practice-tests/bluebook" target="_blank" rel="noopener noreferrer">Start with official practice ↗</a></section><section class="section"><h2>Your SAT goals, grounded in real cohorts.</h2><p>These are strategic references, not official cutoffs. The lower end is a baseline comparison, not an admission minimum; the upper end is a strong study goal. Above that is a stretch goal without a promise of admission. Only verified distributions are used.</p><div class="cards">${ranged
          .map((u) => {
            const s = strategies[u.id],
              r = s.range!;
            return `<article class="score-card"><span class="eyebrow">${esc(s.shortName)}</span><h3>${r.low}–${r.high}</h3><p class="small">Official middle 50%<br>${esc(r.cohort)}</p><dl><div><dt>Baseline reference</dt><dd>${r.low}</dd></div><div><dt>Strong strategic target</dt><dd>${r.high}</dd></div><div><dt>Excellent / stretch goal</dt><dd>Above ${r.high}</dd></div></dl><p class="small">${esc(scoreContext(s, profile))}</p>${refs(r.sourceIds)}</article>`;
          })
          .join(
            "",
          )}</div><p class="small muted">For other schools, an official range was not verified here. No numerical target is assigned. An optional-test policy does not waive English proficiency requirements.</p></section><section class="section"><h2>Confirmed SAT dates · 2026–27</h2>${planFact("sat-registration")}<div class="table-wrap"><table><caption>Remaining test dates as of October 21, 2026 · times in Eastern Time</caption><thead><tr><th>Test date</th><th>Register by</th><th>Late / changes</th><th>Score release</th></tr></thead><tbody>${planning.satDates
          .filter((d) => d.date >= RESEARCH_DATE)
          .map(
            (d) =>
              `<tr><th>${date(d.date)}</th><td>${date(d.registrationDeadline)}</td><td>${date(d.lateDeadline)}</td><td>${date(d.scoreRelease)}</td></tr>`,
          )
          .join(
            "",
          )}</tbody></table></div>${refs(["sat-dates", "sat-release"])}<details class="methodology"><summary>2027–28 anticipated dates — not confirmed</summary>${planFact("sat-future")}<p>${planning.satAnticipatedDates.map((d) => date(d.date)).join(" · ")}</p></details></section><section class="two-column section"><div><h2>Sending scores</h2>${planFact("sat-score-choice")}${planFact("sat-superscore")}</div><div><h2>What “test optional” means</h2><p>You may choose whether SAT/ACT scores are considered where the applicable policy allows. Program admission, scholarships, placement and English evidence may have separate rules. Check the entry year and campus.</p>${refs(["msu-apply", "isu-merit", "psu-requirements"])}<p>Penn State currently uses the best combined score from a single sitting rather than superscoring.</p>${refs(["psu-requirements"])}<a href="#universities" class="text-link">Read school-specific policies →</a></div></section>`
      : `<section class="exam-hero"><span class="eyebrow">A SHORTLIST, NOT A CHECKLIST</span><h2>Choose APs that strengthen<br>the work you already do.</h2>${planFact("ap-selection")}${planFact("ap-course-exam")}</section><section class="section"><h2>Four priorities to consider</h2><p>Priorities and workload descriptions are editorial planning advice. AP courses can demonstrate advanced work, but each college evaluates rigor in school context. An exam-only score does not add a completed AP course to your transcript.</p><div class="ap-grid">${planning.apPriorities.map((a) => `<article class="ap-card"><span class="eyebrow">PRIORITY 0${a.priority} ${a.priority === 4 ? "· OPTIONAL" : ""}</span><h3>${esc(a.name)}</h3><p>${esc(a.reason)}</p><dl class="stacked"><dt>Workload & preparation</dt><dd>${esc(a.difficulty)}</dd><dt>When to consider it</dt><dd>${esc(a.timing)}</dd><dt>2027 exam</dt><dd>${date(a.examDate)} · ${esc(a.session)}</dd><dt>Score goal & credit relevance</dt><dd>${esc(a.target)}. ${esc(a.credit)}</dd></dl>${refs(a.sourceIds)}</article>`).join("")}</div><p class="small">These ASU credit examples do not transfer automatically to other universities. NYU CAS, for example, awards no credit for AP English Language; its Statistics credit does not replace Sociology’s required statistics course.</p>${refs(["nyu-ap", "nyu-sociology"])}</section><section class="section"><h2>Arrange your exam before preparing for it.</h2>${planFact("ap-order-deadline")}${planFact("ap-local-deadline")}${planFact("ap-2028")}${planFact("ap-score-policy")}</section>`
  }`;
}
function resourcesPage() {
  return `<div class="page-intro"><span class="eyebrow">A SMALL, USEFUL TOOLKIT</span><h1>Start free.<br><em>Buy with a purpose.</em></h1><p>Official practice comes first. Choose a book only when you know the gap it needs to fill.</p></div><div class="resource-grid">${planning.resources.map((r, i) => `<article class="resource-card"><div class="resource-number">${String(i + 1).padStart(2, "0")}</div><div><span class="eyebrow">${esc(r.priority)}</span><h2>${esc(r.title)}</h2><p class="byline">${esc(r.author)} · ${esc(r.edition)}</p><p>${esc(r.reason)}</p><p class="small"><strong>Use for:</strong> ${esc(r.purpose)}</p>${link(r.url, r.priority.includes("free") ? "Open free resource" : "View publisher / edition", "text-link")}${refs(r.sourceIds)}</div></article>`).join("")}</div><p class="notice">Editions and availability were reviewed on October 21, 2026. No live prices or affiliate links. College Essay Essentials’ November 2026 edition was still forthcoming at this review.</p>`;
}
function sourcesPage() {
  const list = sources.filter((s) =>
    `${s.title} ${s.publisher} ${s.url} ${s.cycle}`
      .toLowerCase()
      .includes(sourceSearch.toLowerCase()),
  );
  return `<div class="page-intro"><span class="eyebrow">FOLLOW THE EVIDENCE</span><h1>Clear sources.<br><em>Honest unknowns.</em></h1><p>Admissions offices, university catalogs, College Board, Ontario education and official government guidance. Every link opens the underlying page.</p></div><div class="source-summary"><div><strong>${universities.length}</strong><span>universities researched</span></div><div><strong>${sources.length}</strong><span>source records</span></div><div><strong>Oct 21, 2026</strong><span>research snapshot</span></div></div><div class="notice">“Verified” records when a source was reviewed, not a guarantee that every field is known or still current. Source cycle and each fact’s status distinguish historical references, conflicts, editorial guidance and unverified information.</div><div class="filter-bar"><label class="search-field"><span class="sr-only">Search sources</span><input type="search" id="source-search" placeholder="Search publisher, topic or university" value="${esc(sourceSearch)}"></label><span role="status" class="small muted">${list.length} source records</span></div><div class="source-list">${list.map((s) => `<article><div><span class="eyebrow">${esc(s.publisher)}</span><h2>${link(s.url, s.title)}</h2><p class="source-url">${esc(s.url)}</p><p class="small">${esc(s.cycle)}</p></div><span class="small muted">Reviewed<br>${date(s.verified)}</span></article>`).join("") || '<p class="empty-state">No sources match this search.</p>'}</div><details class="methodology"><summary>Research method & known limitations</summary><p>University admissions and program pages take precedence over aggregators. Official testing bodies, government agencies and publishers support testing, travel and materials. Books and essay advice are supplemental, not admissions requirements. An inaccessible or conflicting source is disclosed rather than filled with a guessed fact.</p><p>Fall 2028 application deadlines and most testing-policy commitments require rechecking. 2027–28 SAT dates are anticipated; 2028 AP dates are not yet published in the reviewed schedule. Cost figures retain their published year and exclusions. Ontario equivalents and English waivers require school-specific assessment.</p><p>This is an independently prepared planning tool, not a university service or an admissions prediction model.</p></details>`;
}
function render(restoreFocus = false) {
  const active = document.activeElement as HTMLInputElement | null;
  const focusId = restoreFocus ? active?.id : "";
  const selection = active?.type === "search" ? active.selectionStart : null;
  const r = route();
  app.innerHTML = `<aside class="sidebar"><a class="brand" href="#overview" aria-label="UniNavo home"><span class="brand-symbol">u<span>↗</span></span><span>UniNavo<span class="brand-sub">YOUR NEXT CHAPTER</span></span></a><nav aria-label="Main navigation">${nav.map((n) => `<a href="#${n.id}" ${r === n.id ? 'aria-current="page"' : ""}><span aria-hidden="true">${n.icon}</span>${n.label}${n.id === "timeline" ? "<i></i>" : ""}</a>`).join("")}</nav><div class="sidebar-bottom"><div class="student-icon">11</div><strong>Ontario, Canada</strong><span>Grade 11 · Semester 1</span><span class="sidebar-tag">FALL 2028 ENTRY</span><p>One thoughtful step<br>at a time.</p></div></aside><div class="workspace"><header class="topbar"><span>YOUR U.S. UNIVERSITY PLANNER</span><span class="top-status"><i></i> Planning from October 2026</span></header><main id="main" tabindex="-1">${r === "overview" ? overview() : r === "timeline" ? timelinePage() : r === "universities" ? universitiesPage() : r === "exams" ? examsPage() : r === "resources" ? resourcesPage() : sourcesPage()}</main><footer><a class="footer-brand" href="#overview">UniNavo</a><div><strong>Built around your next step.</strong><p>Last verified: October 21, 2026. Admission policies and deadlines can change. Always confirm final requirements on the university’s official admissions website before applying.</p><span>This is planning guidance, not an admission guarantee. ${persistenceAvailable ? "Your checklist and profile stay in this browser." : "Browser storage is unavailable. Changes are kept for this session only."}</span></div><a href="#sources">View sources ↗</a></footer></div><dialog id="university-dialog" aria-labelledby="dialog-title"></dialog><div id="live-status" class="sr-only" role="status" aria-live="polite"></div>`;
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
  document.querySelectorAll<HTMLDetailsElement>("[data-month]").forEach((d) =>
    d.addEventListener("toggle", () => {
      if (d.open) openedMonths.add(d.dataset.month!);
      else openedMonths.delete(d.dataset.month!);
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
function openUniversity(id: string) {
  const u = universities.find((u) => u.id === id)!;
  const s = strategies[id];
  const dialog =
    document.querySelector<HTMLDialogElement>("#university-dialog")!;
  dialog.innerHTML = `<div class="dialog-header"><span class="monogram" style="--school:${s.color}">${s.initials}</span><button class="close-dialog" aria-label="Close university details">×</button></div><div class="dialog-body"><span class="eyebrow">${esc(u.city)}, ${esc(u.state)} · ${esc(u.type)}</span><h2 id="dialog-title">${esc(u.name)}</h2>${badge(id)}<p class="lead">${esc(s.fit)}</p><div class="notice">Fall 2028 entry: do not reuse reference-cycle deadlines as your application deadlines. ${s.testing === "Confirm policy" ? "NYU New York testing policy needs direct confirmation." : "Published test-optional policy is not a verified Fall 2028 commitment."}</div><section><h3>Academic direction</h3><p>${esc(s.majors.join(" · "))}</p><p class="small">${esc(s.structure)} · Brand reference: ${s.recognition} (editorial, not an admissions metric).</p><p class="small">${esc(scoreContext(s, profile))}</p></section><div class="detail-facts">${Object.entries(
    u.facts,
  )
    .map(([key, f]) => fact(f, factLabels[key] ?? key))
    .join(
      "",
    )}</div><section class="detail-sources"><h3>Official sources</h3>${u.sources.map((source) => `<div>${link(source.url, source.title)}<p class="source-url">${esc(source.url)}</p><small>${esc(source.publisher)} · ${esc(source.cycle)} · Reviewed ${date(source.verified)}</small></div>`).join("")}</section></div>`;
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
