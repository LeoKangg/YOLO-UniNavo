import { getLanguage } from "./i18n.ts";
import { apCourseGroups } from "./data/ap-courses.ts";
import { planning } from "./data/index.ts";
import { upcomingDeadlines } from "./data/deadlines.ts";
import { scenarioSchools } from "./data/scenario-catalog.ts";
import { candidatePlan, normalizeCandidateInput } from "./candidate-plans.ts";
import {
  bestSat,
  saveAp,
  setSatTarget,
  type EditorId,
  type GradesState,
} from "./grades.ts";
import { gradeInput, satPosition } from "./matching.ts";
import { dayLabel, positionLabels } from "./home-page.ts";
import { nextSatSitting, resourceStage, satBands } from "./test-prep.ts";

const w = (en: string, ko: string) => (getLanguage() === "ko" ? ko : en);
const esc = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const daysUntil = (from: string, to: string) =>
  Math.round(
    (Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) /
      86_400_000,
  );
const dday = (from: string, to: string) => {
  const n = daysUntil(from, to);
  return n === 0 ? w("today", "오늘") : `D-${n}`;
};

export type PrepTab = "sat" | "ap" | "resources";
export interface PrepUi {
  sat: "schedule" | "targets" | "study" | "sending";
  ap: "picks" | "apply" | "catalog";
  apSearch: string;
  apGroup: string;
}
export interface PrepHelpers {
  planFact: (id: string) => string;
  refs: (ids: string[]) => string;
  link: (url: string, label: string, cls?: string) => string;
}

const sectionTabs = (
  name: "sat" | "ap",
  active: string,
  items: [string, string, string][],
) =>
  `<div class="section-tabs" role="tablist" aria-label="${name.toUpperCase()}">${items
    .map(
      ([id, en, ko]) =>
        `<button role="tab" aria-selected="${active === id}" data-prep-section="${name}|${id}">${w(en, ko)}</button>`,
    )
    .join("")}</div>`;

function candidateIds(grades: GradesState) {
  const mine = gradeInput(grades);
  if (!mine?.band || mine.sat === null) return new Set<string>();
  return new Set(
    candidatePlan(
      normalizeCandidateInput({ band: mine.band, sat: mine.sat }),
    ).selected.map((s) => s.id),
  );
}

function satTab(
  ui: PrepUi,
  grades: GradesState,
  today: string,
  h: PrepHelpers,
) {
  const best = bestSat(grades.sat);
  const latest = grades.sat.at(-1);
  const target = grades.satTarget;
  const next = nextSatSitting(today);
  const summary = `<section class="basis-strip prep-summary" aria-label="${w("My SAT", "내 SAT")}"><div><span class="small muted">${w("Best score", "내 최고점")}</span>${best !== null ? `<strong>${best}</strong><span class="small muted">${latest ? `${dayLabel(latest.date)} · ${w("R&W", "읽기·쓰기")} ${latest.readingWriting} · ${w("Math", "수학")} ${latest.math}` : ""}</span>` : `<a class="text-link" href="#grades">${w("Add a score →", "점수 입력하기 →")}</a>`}</div><div><span class="small muted">${w("Target", "목표")}</span><form id="sat-target-form" class="target-form"><label><span class="sr-only">${w("Target SAT", "목표 SAT")}</span><input name="target" type="number" min="400" max="1600" step="10" inputmode="numeric" value="${target ?? ""}" placeholder="1300"></label><button class="text-button" type="submit">${w("Save", "저장")}</button></form>${target !== null && best !== null ? `<span class="small ${best >= target ? "up" : "overdue"}">${best >= target ? w("Reached", "달성") : w(`+${target - best} to go`, `+${target - best} 필요`)}</span>` : ""}</div><div class="is-manual">${next ? `<span class="small">${w("Next test", "다음 시험")}</span><strong>${dayLabel(next.date)}</strong><span class="small">${w("Register by", "등록 마감")} ${dayLabel(next.registrationDeadline)} · ${dday(today, next.registrationDeadline)}</span>` : `<span class="small">${w("No confirmed dates left", "확정된 일정이 더 없어요")}</span>`}</div></section>`;
  let body = "";
  if (ui.sat === "targets") {
    const sat = best;
    const mine = candidateIds(grades);
    const bands = satBands(scenarioSchools, sat);
    const openId = (bands.find((b) => b.containsScore) ?? bands[1]).id;
    const total = bands.reduce((n, b) => n + b.schools.length, 0);
    const missing = scenarioSchools.filter(
      (s) => mine.has(s.id) && !bands.some((b) => b.schools.includes(s)),
    );
    body = `<section class="bands" aria-labelledby="band-title"><div class="panel-head"><h2 id="band-title">${w(`Universities by SAT band · ${total}`, `점수 구간별 대학 · ${total}곳`)}</h2><span class="small muted">${w("Grouped by the middle of each published middle-50% range", "각 대학 SAT 중간 50%의 가운데 값 기준")}</span></div><div class="band-chips">${bands
      .map(
        (b) =>
          `<button data-band-jump="${b.id}" class="${b.containsScore ? "is-now" : target !== null && target >= b.min && target < b.max ? "is-target" : ""}"><strong>${b.label}</strong><span>${w(`${b.schools.length} schools`, `${b.schools.length}곳`)}${b.containsScore ? ` · ${w("now", "지금")} ${sat}` : target !== null && target >= b.min && target < b.max ? ` · ${w("target", "목표")} ${target}` : ""}</span></button>`,
      )
      .join("")}</div>${bands
      .map((b) => {
        const count = b.schools.filter((s) => mine.has(s.id)).length;
        return `<details class="band ${b.containsScore ? "is-now" : ""}" id="band-${b.id}" ${b.id === openId ? "open" : ""}><summary><strong>${b.label}</strong><span class="muted">${w(`${b.schools.length}`, `${b.schools.length}곳`)}</span><span class="band-preview">${
          b.containsScore
            ? w("Your current band", "지금 내 점수 구간")
            : esc(
                b.schools
                  .slice(0, 4)
                  .map((s) => w(s.name, s.nameKo))
                  .join(" · "),
              )
        }</span>${count ? `<span class="small up">${w(`${count} on my list`, `내 후보 ${count}`)}</span>` : ""}</summary><div class="band-rows"><div class="band-row band-head"><span>${w("University", "대학")}</span><span>${w("Middle 50%", "중간 50%")}</span><span>${sat !== null ? w(`My ${sat}`, `내 점수 ${sat}`) : ""}</span></div>${b.schools
          .map((s) => {
            const p = satPosition(s, sat);
            const label =
              p === "below"
                ? w(
                    `${s.satRange!.low - sat!} below`,
                    `${s.satRange!.low - sat!}점 아래`,
                  )
                : p === "above"
                  ? w(
                      `${sat! - s.satRange!.high} above`,
                      `${sat! - s.satRange!.high}점 위`,
                    )
                  : p === "within"
                    ? w("Within range", "범위 안")
                    : w(...positionLabels[p]);
            return `<div class="band-row"><span><button class="link-button" data-detail="${s.id}">${esc(w(s.name, s.nameKo))}</button>${mine.has(s.id) ? `<span class="mine-tag">${w("My list", "내 후보")}</span>` : ""}</span><span>${s.satRange!.low}–${s.satRange!.high}</span><span>${sat !== null ? `<span class="pos-chip ${p === "within" ? "pos-within" : p === "below" ? "pos-below" : "pos-other"}">${label}</span>` : ""}</span></div>`;
          })
          .join("")}</div></details>`;
      })
      .join(
        "",
      )}${missing.length ? `<p class="small muted">${w("On my list without a published range:", "SAT 분포가 없는 내 후보:")} ${missing.map((s) => esc(w(s.name, s.nameKo))).join(" · ")}</p>` : ""}</section>`;
  } else if (ui.sat === "schedule") {
    body = `<section class="panel"><h2>${w("Confirmed SAT dates", "확정된 SAT 일정")}</h2><div class="table-wrap"><table><thead><tr><th>${w("Test date", "시험일")}</th><th>${w("Register by", "등록 마감")}</th><th>${w("Late / changes", "추가 등록·변경")}</th><th>${w("Scores", "점수 발표")}</th></tr></thead><tbody>${planning.satDates
      .filter((d) => d.date >= today)
      .map(
        (d) =>
          `<tr class="${d.date === next?.date ? "is-next" : ""}"><th>${dayLabel(d.date)}</th><td>${dayLabel(d.registrationDeadline)}</td><td>${dayLabel(d.lateDeadline)}</td><td>${dayLabel(d.scoreRelease)}</td></tr>`,
      )
      .join(
        "",
      )}</tbody></table></div>${h.refs(["sat-dates", "sat-release"])}<details class="methodology"><summary>${w("2027–28 anticipated dates (not confirmed)", "2027–28년 예상 일정 (미확정)")}</summary>${h.planFact("sat-future")}<p>${planning.satAnticipatedDates.map((d) => dayLabel(d.date)).join(" · ")}</p></details></section>`;
  } else if (ui.sat === "study") {
    body = `<section class="panel"><h2>${w("Your SAT routine", "SAT 공부 방법")}</h2>${h.planFact("sat-plan")}<a class="button" href="https://satsuite.collegeboard.org/practice/practice-tests/bluebook" target="_blank" rel="noopener noreferrer">${w("Start with official practice ↗", "공식 모의고사로 시작 ↗")}</a></section>`;
  } else {
    body = `<section class="panel"><h2>${w("Sending scores", "점수 보내기")}</h2>${h.planFact("sat-score-choice")}${h.planFact("sat-superscore")}<p>${w("Penn State currently uses the best combined score from a single sitting rather than superscoring.", "펜실베이니아 주립대는 현재 슈퍼스코어 대신 한 번의 시험에서 받은 최고 총점을 봐요.")}</p>${h.refs(["psu-requirements"])}</section>`;
  }
  return `${summary}${sectionTabs("sat", ui.sat, [
    ["schedule", "Test dates", "시험 일정"],
    ["targets", "Scores by university", "대학별 목표 점수"],
    ["study", "How to study", "공부 방법"],
    ["sending", "Sending scores", "점수 보내기"],
  ])}${body}<details class="methodology"><summary>${w("What is the SAT?", "SAT는 어떤 시험인가요")}</summary>${h.planFact("sat-definition")}</details><details class="methodology"><summary>${w("What “test optional” means", "시험 선택 제출(test optional)이란")}</summary><p>${w("You may choose whether SAT/ACT scores are considered where the applicable policy allows. Program admission, scholarships, placement and English evidence may have separate rules. Check the entry year and campus.", "해당 정책이 허용하면 SAT/ACT 점수를 낼지 스스로 정할 수 있어요. 전공 입학, 장학금, 배치, 영어 증빙은 따로 규정이 있을 수 있어요. 입학 연도와 캠퍼스를 확인하세요.")}</p>${h.refs(["msu-apply", "isu-merit", "psu-requirements"])}</details>`;
}

const apStatus: Record<string, [string, string]> = {
  considering: ["Considering", "검토 중"],
  "checking-school": ["Finding a test school", "응시 학교 확인 중"],
  registered: ["Registered", "신청 완료"],
  done: ["Exam taken", "응시 완료"],
};

function apTab(ui: PrepUi, grades: GradesState, today: string, h: PrepHelpers) {
  const plan = grades.ap[0];
  const planned = new Set(grades.ap.map((p) => p.course.toLowerCase()));
  const isPlanned = (name: string) =>
    [...planned].some(
      (c) => c.includes(name.toLowerCase()) || name.toLowerCase().includes(c),
    );
  const priority = plan
    ? planning.apPriorities.find((a) => isPlanned(a.name))
    : undefined;
  const deadline = upcomingDeadlines(today, 10).find((d) =>
    d.sourceIds.includes("ap-order"),
  );
  const summary = `<section class="basis-strip prep-summary" aria-label="${w("My AP", "내 AP")}"><div><span class="small muted">${w("My AP plan", "내 AP 계획")}</span>${plan ? `<strong data-original-language>${esc(plan.course)}</strong><span class="small muted">${plan.mode === "exam-only" ? w("Exam only", "시험만 응시") : w("Course and exam", "수업과 시험")}${grades.ap.length > 1 ? ` · ${w(`+${grades.ap.length - 1} more`, `외 ${grades.ap.length - 1}과목`)}` : ""}</span>` : `<span class="muted">${w("Add a subject below", "아래에서 과목을 추가하세요")}</span>`}</div><div><span class="small muted">${w("Status", "상태")}</span>${plan ? `<span class="pos-chip ${plan.status === "registered" || plan.status === "done" ? "pos-within" : "pos-below"}">${w(...apStatus[plan.status])}</span>${priority ? `<span class="small muted">${w("Exam", "시험일")} ${dayLabel(priority.examDate)}</span>` : ""}<a class="text-link small" href="#grades">${w("Change status →", "상태 바꾸기 →")}</a>` : "—"}</div><div class="is-manual">${deadline ? `<span class="small">${w("Next deadline", "다음 마감")}</span><strong>${dayLabel(deadline.date)}</strong><span class="small">${w(deadline.en, deadline.ko)} · ${dday(today, deadline.date)}</span>` : `<span class="small">${w("No upcoming AP deadline", "다가오는 AP 마감 없음")}</span>`}</div></section>`;
  let body = "";
  if (ui.ap === "picks") {
    body = `<section class="panel ap-picks" aria-label="${w("Suggested subjects", "추천 과목")}">${planning.apPriorities
      .map(
        (a) =>
          `<div class="ap-pick ${isPlanned(a.name) ? "is-planned" : ""}"><span class="ap-num">0${a.priority}</span><div><strong data-original-language>${esc(a.name)}</strong>${a.priority === 4 ? ` <span class="grade-tag tag-other">${w("Optional", "선택")}</span>` : ""}<p class="small muted">${esc(a.reason)}</p></div><span class="small">${dayLabel(a.examDate)}</span>${isPlanned(a.name) ? `<span class="pos-chip pos-within">${w("Planned", "계획 중")}</span>` : `<button class="button button-light" data-add-ap="${esc(a.name)}">＋ ${w("Add to my plan", "내 계획에")}</button>`}</div>`,
      )
      .join("")}</section>`;
  } else if (ui.ap === "apply") {
    body = `<section class="panel"><h2>${w("Arrange your exam before preparing for it", "공부보다 시험 신청이 먼저예요")}</h2>${h.planFact("ap-order-deadline")}${h.planFact("ap-local-deadline")}${h.planFact("ap-course-exam")}${h.planFact("ap-2028")}${h.planFact("ap-score-policy")}</section>`;
  } else {
    const q = ui.apSearch.toLowerCase();
    const groups = apCourseGroups
      .filter((g) => !ui.apGroup || g.en === ui.apGroup)
      .map((g) => ({
        ...g,
        courses: g.courses.filter(([en, ko]) =>
          `${en} ${ko}`.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.courses.length);
    body = `<section class="panel"><div class="panel-head"><h2>${w("All 42 AP courses", "전체 42과목에서 찾기")}</h2><label><span class="sr-only">${w("Search courses", "과목 검색")}</span><input id="ap-search" type="search" class="ap-search" placeholder="${w("Search a course", "과목 이름 검색")}" value="${esc(ui.apSearch)}"></label></div><div class="band-chips ap-groups"><button data-ap-group="" class="${ui.apGroup ? "" : "is-now"}"><strong>${w("All", "전체")}</strong></button>${apCourseGroups.map((g) => `<button data-ap-group="${esc(g.en)}" class="${ui.apGroup === g.en ? "is-now" : ""}"><strong>${esc(w(g.en, g.ko))}</strong><span>${g.courses.length}</span></button>`).join("")}</div>${
      groups.length
        ? groups
            .map(
              (g) =>
                `<h3 class="ap-group-title">${esc(w(g.en, g.ko))}</h3><ul class="ap-course-list">${g.courses.map(([en, ko, slug]) => `<li>${h.link(`https://apcentral.collegeboard.org/courses/${slug}`, w(`AP ${en}`, `AP ${ko} (${en})`))}</li>`).join("")}</ul>`,
            )
            .join("")
        : `<p class="muted">${w("No courses match.", "맞는 과목이 없어요.")}</p>`
    }${h.refs(["ap-course-catalog", "ap-networking"])}</section>`;
  }
  return `${summary}${sectionTabs("ap", ui.ap, [
    ["picks", "Suggested 4", "추천 4과목"],
    ["apply", "How to register", "시험 신청 방법"],
    ["catalog", "All 42 courses", "전체 42과목"],
  ])}${body}<details class="methodology"><summary>${w("AP credit differs by university", "AP 학점은 대학마다 다르게 인정돼요")}</summary><p>${w("These ASU credit examples do not transfer automatically to other universities. NYU CAS, for example, awards no credit for AP English Language; its Statistics credit does not replace Sociology’s required statistics course.", "ASU 학점 인정 예시는 다른 대학에 그대로 적용되지 않아요. 예를 들어 NYU CAS는 AP English Language 학점을 주지 않고, AP Statistics 학점도 사회학 전공 필수 통계 과목을 대신하지 못해요.")}</p>${h.refs(["nyu-ap", "nyu-sociology"])}</details>`;
}

function resourcesTab(grades: GradesState, h: PrepHelpers) {
  const find = (part: string) =>
    planning.resources.find((r) => r.title.includes(part))!;
  const free = (r: (typeof planning.resources)[number]) =>
    /free/i.test(r.priority);
  const item = (
    r: (typeof planning.resources)[number],
    note?: string,
    dim = false,
  ) =>
    `<div class="res-item ${dim ? "is-dim" : ""}">${h.link(r.url, r.title, "res-title")}<span class="small muted">${note ?? esc(r.purpose)}</span><span class="grade-tag ${free(r) ? "tag-major" : "tag-other"}">${free(r) ? w("Free", "무료") : w("Optional · buy", "선택 · 구매")}</span></div>`;
  const stage = resourceStage(grades);
  const bluebook = find("Bluebook");
  const steps: [string, string, string][] = [
    [
      w("① Diagnose", "① 진단"),
      item(
        bluebook,
        w("One timed test · log mistakes", "시간 재고 1회 · 오답 기록"),
      ),
      "",
    ],
    [
      w("② Fix weak areas", "② 약점 보완"),
      [
        item(
          find("Khan"),
          w("Practice only weak question types", "약한 유형만 골라 연습"),
        ),
        item(
          find("SAT Reading"),
          w("Only if reading is weak", "독해가 약할 때만"),
        ),
        item(
          find("SAT Grammar"),
          w("Only if grammar is weak", "문법이 약할 때만"),
        ),
      ].join(""),
      "",
    ],
    [
      w("③ Full practice", "③ 실전"),
      item(
        bluebook,
        w(
          "Timed full tests, like the real day",
          "실제 시험처럼 시간 재고 반복",
        ),
      ),
      "",
    ],
  ];
  const planned = grades.ap.map((p) => p.course.toLowerCase());
  const plannedHas = (word: string) =>
    planned.some((c) => c.includes(word.toLowerCase()));
  const stats = find("AP Statistics"),
    psych = find("Psychology");
  return `<section class="panel" aria-labelledby="sat-steps"><h2 id="sat-steps">${w("SAT study order", "SAT 공부 순서")}</h2><div class="stage-grid">${steps
    .map(
      ([title, items], i) =>
        `<div class="stage ${i === stage ? "is-now" : ""}"><div class="stage-head"><strong>${title}</strong>${i === stage ? `<span class="grade-tag tag-required">${w("Now", "지금 단계")}</span>` : ""}</div>${items}</div>`,
    )
    .join(
      "",
    )}</div></section><div class="res-split"><section class="panel" aria-labelledby="ap-res"><h2 id="ap-res">${w("AP study", "AP 공부")}</h2>${item(find("Official AP"))}${item(stats, plannedHas("statistics") ? w("In my plan", "내 계획 과목") : w("Only if taking AP Statistics", "AP Statistics 볼 때만"), !plannedHas("statistics"))}${item(psych, plannedHas("psychology") ? w("In my plan", "내 계획 과목") : w("Only if taking AP Psychology", "AP Psychology 볼 때만"), !plannedHas("psychology"))}</section><section class="panel" aria-labelledby="essay-res"><h2 id="essay-res">${w("Essays", "에세이")}</h2>${item(find("Personal Statement"))}${item(find("College Essay Essentials"), w("A library or used copy is enough", "도서관·중고로 충분"))}</section></div><p class="small muted">${w("Editions and availability were reviewed on October 21, 2026. No live prices or affiliate links.", "판본과 구입 가능 여부는 2026년 10월 21일 기준이에요. 가격·제휴 링크는 없어요.")}</p>`;
}

export function renderTestPrep(
  tab: PrepTab,
  ui: PrepUi,
  grades: GradesState,
  today: string,
  h: PrepHelpers,
) {
  return `<div class="prep-head"><h1 class="home-title">${w("Test prep", "시험 준비")}</h1><nav class="prep-tabs" aria-label="${w("Test prep", "시험 준비")}">${(
    [
      ["sat", "SAT", "SAT"],
      ["ap", "AP", "AP"],
      ["resources", "Study resources", "학습 자료"],
    ] as const
  )
    .map(
      ([id, en, ko]) =>
        `<a href="#${id}" ${tab === id ? 'aria-current="page"' : ""}>${w(en, ko)}</a>`,
    )
    .join("")}</nav></div>${
    tab === "sat"
      ? satTab(ui, grades, today, h)
      : tab === "ap"
        ? apTab(ui, grades, today, h)
        : resourcesTab(grades, h)
  }`;
}

export interface PrepContext {
  ui: PrepUi;
  grades: () => GradesState;
  editor: () => EditorId;
  today: string;
  saveGrades: (next: GradesState) => void;
  rerender: (restoreFocus?: boolean) => void;
}

export function bindTestPrep(ctx: PrepContext) {
  document
    .querySelectorAll<HTMLButtonElement>("[data-prep-section]")
    .forEach((b) =>
      b.addEventListener("click", () => {
        const [tab, id] = b.dataset.prepSection!.split("|");
        if (tab === "sat") ctx.ui.sat = id as PrepUi["sat"];
        else ctx.ui.ap = id as PrepUi["ap"];
        ctx.rerender();
      }),
    );
  document
    .querySelectorAll<HTMLButtonElement>("[data-band-jump]")
    .forEach((b) =>
      b.addEventListener("click", () => {
        const band = document.getElementById(
          `band-${b.dataset.bandJump}`,
        ) as HTMLDetailsElement | null;
        if (!band) return;
        band.open = true;
        band.scrollIntoView({ behavior: "smooth", block: "start" });
      }),
    );
  document
    .querySelector<HTMLFormElement>("#sat-target-form")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget as HTMLFormElement;
      if (!form.reportValidity()) return;
      const value = String(new FormData(form).get("target") ?? "");
      ctx.saveGrades(
        setSatTarget(ctx.grades(), value === "" ? null : Number(value)),
      );
    });
  document.querySelectorAll<HTMLButtonElement>("[data-add-ap]").forEach((b) =>
    b.addEventListener("click", () =>
      ctx.saveGrades(
        saveAp(ctx.grades(), {
          id: `ap-${crypto.randomUUID()}`,
          course: b.dataset.addAp!,
          mode: "exam-only",
          status: "considering",
          updatedBy: ctx.editor(),
          updatedAt: ctx.today,
        }),
      ),
    ),
  );
  document.querySelectorAll<HTMLButtonElement>("[data-ap-group]").forEach((b) =>
    b.addEventListener("click", () => {
      ctx.ui.apGroup = b.dataset.apGroup!;
      ctx.rerender();
    }),
  );
  document
    .querySelector<HTMLInputElement>("#ap-search")
    ?.addEventListener("input", (e) => {
      ctx.ui.apSearch = (e.target as HTMLInputElement).value;
      ctx.rerender(true);
    });
}
