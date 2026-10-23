import { getLanguage } from "./i18n.ts";
import { candidatePlan, normalizeCandidateInput } from "./candidate-plans.ts";
import { upcomingDeadlines } from "./data/deadlines.ts";
import type { GradesState } from "./grades.ts";
import type { JournalState } from "./journal.ts";
import { gradeInput, satPosition, type SatPosition } from "./matching.ts";
import type { PersonalTask } from "./planner.ts";
import { buildReport, weekRange, type ReportTask } from "./report.ts";
import type { Month } from "./types.ts";

const w = (en: string, ko: string) => (getLanguage() === "ko" ? ko : en);
const esc = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export const dayLabel = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(
    getLanguage() === "ko" ? "ko-KR" : "en-CA",
    { month: "short", day: "numeric", timeZone: "UTC" },
  );
const monthName = (id: string) =>
  new Date(`${id}-01T12:00:00Z`).toLocaleDateString(
    getLanguage() === "ko" ? "ko-KR" : "en-CA",
    { month: "short", timeZone: "UTC" },
  );
const daysBetween = (from: string, to: string) =>
  Math.round(
    (Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) /
      86_400_000,
  );

export type PersonalMonth = Omit<Month, "tasks"> & { tasks: PersonalTask[] };
export const reportTasks = (months: PersonalMonth[]): ReportTask[] =>
  months.flatMap((m) =>
    m.tasks.map((t) => ({ id: t.id, monthId: m.id, title: t.title })),
  );
const personalIds = (months: PersonalMonth[]) =>
  new Set(
    months.flatMap((m) => m.tasks.filter((t) => t.personal)).map((t) => t.id),
  );

export const positionLabels: Record<SatPosition, [string, string]> = {
  within: ["Within middle 50%", "SAT 중간 50% 안"],
  below: ["Below", "아래"],
  above: ["Above", "위"],
  "no-data": ["No published range", "분포 자료 없음"],
  "not-considered": ["SAT not considered", "SAT 미반영"],
};

function universitySummary(grades: GradesState) {
  const input = gradeInput(grades);
  if (!input || !input.band || input.sat === null)
    return `<p class="muted">${w("Enter marks and an SAT score to see a shortlist.", "내신과 SAT 점수를 입력하면 후보가 나와요.")}</p><a class="text-link" href="#grades">${w("Enter grades →", "성적 입력하기 →")}</a>`;
  const plan = candidatePlan(
    normalizeCandidateInput({ band: input.band, sat: input.sat }),
  );
  if (!plan.selected.length)
    return `<p class="muted">${w("The researched lists start at SAT 1100.", "조사한 목록은 SAT 1100부터예요.")}</p><a class="text-link" href="#universities">${w("Open universities →", "대학 화면 열기 →")}</a>`;
  const counts = new Map<SatPosition, number>();
  for (const s of plan.selected) {
    const p = satPosition(s, input.sat);
    counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  return `<p class="small muted">${esc(input.band)} · ${w(`SAT ${plan.referenceSat} list`, `SAT ${plan.referenceSat} 기준`)}</p><div class="home-uni-grid">${[
    ...counts.entries(),
  ]
    .map(
      ([p, n]) =>
        `<div class="${p === "within" ? "is-strong" : ""}"><strong>${n}</strong><span>${w(...positionLabels[p])}</span></div>`,
    )
    .join("")}</div>`;
}

export function renderHomePage(input: {
  today: string;
  months: PersonalMonth[];
  checked: Set<string>;
  journal: JournalState;
  grades: GradesState;
}) {
  const { today, months, checked, journal, grades } = input;
  const range = weekRange(today);
  const tasks = reportTasks(months);
  const report = buildReport({ range, tasks, checked, journal, grades });
  const personal = personalIds(months);
  const thisMonth = today.slice(0, 7);
  const deadlines = upcomingDeadlines(today);
  const next = deadlines[0];
  const total = report.done.length + report.open.length;
  const gi = gradeInput(grades);
  const lang = (id: string) =>
    personal.has(id) ? "data-original-language" : "";
  const row = (t: ReportTask, done: string | null) =>
    `<label class="home-task ${done ? "is-complete" : ""}"><input type="checkbox" data-task="${t.id}" ${done ? "checked" : ""}><span><span class="home-task-title" ${lang(t.id)}>${esc(t.title)}</span><span class="small ${!done && t.monthId < thisMonth ? "overdue" : "muted"}">${done ? `${w("Done", "완료")} ${dayLabel(done)}` : t.monthId < thisMonth ? w(`Carried over from ${monthName(t.monthId)}`, `${monthName(t.monthId)}부터 남은 일`) : monthName(t.monthId)}</span></span></label>`;
  return `<section class="home-head"><div><span class="eyebrow">${dayLabel(range.start)} – ${dayLabel(range.end)}</span><h1 class="home-title">${w("This week", "이번 주에 할 일")}</h1></div>${next ? `<div class="dday"><strong>${daysBetween(today, next.date) === 0 ? w("Today", "오늘") : `D-${daysBetween(today, next.date)}`}</strong><span>${w(next.en, next.ko)} · ${dayLabel(next.date)}</span></div>` : ""}</section>
  <section class="home-stats" aria-label="${w("Summary", "요약")}"><div class="panel"><span class="small muted">${w("This week", "이번 주 진행")}</span><strong class="stat">${report.done.length} <small>/ ${total} ${w("done", "완료")}</small></strong><span class="stat-bar"><i style="width:${total ? Math.round((report.done.length / total) * 100) : 0}%"></i></span></div><div class="panel"><span class="small muted">${w("School average", "내신 평균")}</span>${gi ? `<strong class="stat">${gi.average}<small>%</small></strong><span class="small muted">${esc(gi.band || w("Below 60%", "60% 미만"))}</span>` : `<a class="text-link" href="#grades">${w("Enter marks →", "내신 입력하기 →")}</a>`}</div><div class="panel"><span class="small muted">${w("Best SAT", "SAT 최고점")}</span>${gi?.sat ? `<strong class="stat">${gi.sat}</strong>` : `<a class="text-link" href="#grades">${w("Add a score →", "점수 입력하기 →")}</a>`}</div></section>
  <div class="home-split"><section class="panel" aria-labelledby="home-tasks-title"><div class="panel-head"><h2 id="home-tasks-title">${w("To do", "할 일")}</h2><a class="text-link" href="#timeline">${w("Full plan →", "전체 계획 →")}</a></div>${report.done.map((d) => row(d.task, d.date)).join("")}${report.open.map((t) => row(t, null)).join("")}${total ? "" : `<p class="muted">${w("Nothing left for now.", "지금은 남은 할 일이 없어요.")}</p>`}</section>
  <div class="home-side"><section class="panel" aria-labelledby="home-dates-title"><h2 id="home-dates-title">${w("Upcoming official dates", "다가오는 공식 일정")}</h2>${deadlines.map((d) => `<div class="date-row"><strong>${dayLabel(d.date)}</strong><span>${w(d.en, d.ko)}</span></div>`).join("")}</section><section class="panel" aria-labelledby="home-uni-title"><div class="panel-head"><h2 id="home-uni-title">${w("My university shortlist", "내 대학 후보")}</h2><a class="text-link" href="#universities">${w("View →", "보기 →")}</a></div>${universitySummary(grades)}</section></div></div>
  <section class="panel" aria-labelledby="home-road-title"><div class="panel-head"><h2 id="home-road-title">${w("Roadmap · Oct 2026 – Aug 2028", "로드맵 · 2026년 10월 – 2028년 8월")}</h2><span class="small muted">${tasks.filter((t) => checked.has(t.id)).length} / ${tasks.length}</span></div><a class="home-road" href="#timeline" aria-label="${w("Open the full roadmap", "전체 로드맵 열기")}">${months
    .map((m) => {
      const done = m.tasks.filter((t) => checked.has(t.id)).length;
      return `<span class="${m.id === thisMonth ? "current" : ""}"><span class="road-track"><i style="height:${m.tasks.length ? Math.max((done / m.tasks.length) * 100, 4) : 4}%"></i></span><small>${m.id.slice(5)}</small></span>`;
    })
    .join("")}</a></section>`;
}
