import { getLanguage } from "./i18n.ts";
import { upcomingDeadlines } from "./data/deadlines.ts";
import type { EditorId, GradesState } from "./grades.ts";
import {
  addMeeting,
  addNote,
  removeMeeting,
  removeNote,
  type JournalState,
} from "./journal.ts";
import { dayLabel, reportTasks, type PersonalMonth } from "./home-page.ts";
import {
  buildReport,
  nextRange,
  previousRange,
  rangeFor,
  type Period,
  type Range,
} from "./report.ts";

const w = (en: string, ko: string) => (getLanguage() === "ko" ? ko : en);
const esc = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export interface ReportUi {
  period: Period;
  anchor: string;
}

function rangeTitle(period: Period, r: Range) {
  return period === "week"
    ? `${dayLabel(r.start)} – ${dayLabel(r.end)}`
    : new Date(`${r.start}T12:00:00Z`).toLocaleDateString(
        getLanguage() === "ko" ? "ko-KR" : "en-CA",
        { year: "numeric", month: "long", timeZone: "UTC" },
      );
}

export function renderReportPage(input: {
  ui: ReportUi;
  today: string;
  months: PersonalMonth[];
  checked: Set<string>;
  journal: JournalState;
  grades: GradesState;
}) {
  const { ui, today, months, checked, journal, grades } = input;
  const range = rangeFor(ui.period, ui.anchor);
  const tasks = reportTasks(months);
  const personal = new Set(
    months.flatMap((m) => m.tasks.filter((t) => t.personal)).map((t) => t.id),
  );
  const report = buildReport({ range, tasks, checked, journal, grades });
  const thisMonth = range.end.slice(0, 7);
  const isCurrent = range.end >= today;
  const deadline = upcomingDeadlines(
    range.end < today ? range.end : today,
    1,
  )[0];
  const satDelta =
    report.sat.best !== null && report.sat.previous !== null
      ? report.sat.best - report.sat.previous
      : null;
  const unit = ui.period === "week" ? w("week", "주") : w("month", "달");
  const sentence = [
    report.done.length
      ? w(
          `${report.done.length} task(s) completed.`,
          `할 일 ${report.done.length}개를 끝냈어요.`,
        )
      : w("No tasks were checked off.", "체크한 할 일이 없어요."),
    report.sat.best !== null
      ? satDelta !== null && satDelta !== 0
        ? w(
            `SAT best ${report.sat.best} (${satDelta > 0 ? "+" : ""}${satDelta}).`,
            `SAT ${report.sat.best}점으로 ${satDelta > 0 ? `${satDelta}점 올랐어요` : `${-satDelta}점 내려갔어요`}.`,
          )
        : w(`SAT ${report.sat.best}.`, `SAT ${report.sat.best}점을 봤어요.`)
      : "",
    report.overdue
      ? w(
          `${report.overdue} task(s) carried over from earlier months.`,
          `지난 달부터 밀린 일이 ${report.overdue}개 있어요.`,
        )
      : "",
    deadline
      ? w(
          `Next official date: ${deadline.en}, ${dayLabel(deadline.date)}.`,
          `다음 공식 일정: ${dayLabel(deadline.date)} ${deadline.ko}.`,
        )
      : "",
  ]
    .filter(Boolean)
    .join(" ");
  const tone = {
    good: w("On track", "순조로워요"),
    watch: w("Needs attention", "챙겨야 해요"),
    quiet: w("Quiet", "조용했어요"),
  }[report.tone];
  const lang = (id: string) =>
    personal.has(id) ? "data-original-language" : "";
  const past = [1, 2, 3, 4].reduce<Range[]>(
    (list) => [...list, previousRange(ui.period, list.at(-1) ?? range)],
    [],
  );
  return `<div class="report-toolbar"><div class="segmented" role="group" aria-label="${w("Report type", "리포트 종류")}"><button data-report-period="week" aria-pressed="${ui.period === "week"}">${w("Weekly", "주간")}</button><button data-report-period="month" aria-pressed="${ui.period === "month"}">${w("Monthly", "월간")}</button></div><div class="report-nav"><button class="icon-button" data-report-go="${previousRange(ui.period, range).start}" aria-label="${w("Previous", "이전")}">‹</button><button class="icon-button" data-report-go="${nextRange(ui.period, range).start}" aria-label="${w("Next", "다음")}" ${isCurrent ? "disabled" : ""}>›</button></div><div class="report-actions"><button class="button button-light" id="print-report">${w("Save PDF", "PDF 저장")}</button><button class="button" id="copy-report">${w("Copy link", "링크 복사")}</button></div></div>
  <section class="report-head"><span class="eyebrow">${rangeTitle(ui.period, range)}</span><h1 class="home-title">${ui.period === "week" ? w("Taeyul's week", "태율이의 한 주") : w("Taeyul's month", "태율이의 한 달")}</h1></section>
  <section class="report-status tone-${report.tone}" aria-label="${w("Status", "상태")}"><span class="report-tone">${tone}</span><p>${esc(sentence)}</p></section>
  <section class="home-stats report-stats" aria-label="${w("Summary", "요약")}"><div class="panel"><span class="small muted">${w("Completed", "끝낸 일")}</span><strong class="stat">${report.done.length}</strong></div><div class="panel"><span class="small muted">SAT</span><strong class="stat">${report.sat.best ?? "—"}</strong>${satDelta ? `<span class="small ${satDelta > 0 ? "up" : "overdue"}">${satDelta > 0 ? "+" : ""}${satDelta}</span>` : ""}</div><div class="panel"><span class="small muted">${w("Marks entered", "내신 입력")}</span><strong class="stat">${report.coursesUpdated}<small>${w(" courses", "과목")}</small></strong></div><div class="panel"><span class="small muted">${w("Still open", "남은 일")}</span><strong class="stat">${report.open.length}</strong>${report.overdue ? `<span class="small overdue">${w(`${report.overdue} carried over`, `${report.overdue}개 밀림`)}</span>` : ""}</div></section>
  <div class="home-split"><div class="report-main"><section class="panel" aria-labelledby="done-title"><h2 id="done-title">${w("Done", "한 일")}</h2>${report.done.map((d) => `<div class="date-row"><span ${lang(d.task.id)}>${esc(d.task.title)}</span><span class="small muted">${dayLabel(d.date)}</span></div>`).join("") || `<p class="muted">${w(`Nothing checked off this ${unit}.`, `이번 ${unit}에 체크한 할 일이 없어요.`)}</p>`}</section><section class="panel" aria-labelledby="open-title"><h2 id="open-title">${w("Still to do", "남은 일")}</h2>${report.open.map((t) => `<div class="date-row"><span ${lang(t.id)}>${esc(t.title)}</span><span class="small ${t.monthId < thisMonth ? "overdue" : "muted"}">${t.monthId < thisMonth ? w("carried over", "밀림") : t.monthId.slice(5) + w("", "월")}</span></div>`).join("") || `<p class="muted">${w("All caught up.", "남은 일이 없어요.")}</p>`}</section></div>
  <div class="home-side"><section class="panel" aria-labelledby="meet-title"><h2 id="meet-title">${w("Meetings with the teacher", "선생님과 만남")}</h2>${report.meetings.map((m) => `<article class="journal-item"><div class="small strong-green">${dayLabel(m.date)} · ${m.minutes}${w(" min", "분")}</div><p data-original-language>${esc(m.summary)}</p><button class="text-button" data-delete-meeting="${m.id}">${w("Delete", "삭제")}</button></article>`).join("") || `<p class="muted">${w("No meetings recorded.", "기록된 만남이 없어요.")}</p>`}<form id="meeting-form" class="journal-form"><div class="grades-form-pair"><label>${w("Date", "날짜")}<input type="date" name="date" required value="${today}"></label><label>${w("Minutes", "시간(분)")}<input type="number" name="minutes" required min="5" max="600" step="5" value="60"></label></div><label>${w("What you did", "한 일")}<textarea name="summary" required rows="2" maxlength="2000"></textarea></label><button class="button" type="submit">${w("Record meeting", "만남 기록")}</button></form></section>
  <section class="panel" aria-labelledby="memo-title"><h2 id="memo-title">${w("Notes", "메모")}</h2>${report.notes.map((n) => `<article class="journal-item"><div class="small strong-green">${dayLabel(n.date)}</div><p data-original-language>${esc(n.text)}</p><div class="journal-actions"><button class="text-button" data-note-task="${n.id}">＋ ${w("Add as a task", "할 일로 추가")}</button><button class="text-button" data-delete-note="${n.id}">${w("Delete", "삭제")}</button></div></article>`).join("") || `<p class="muted">${w("No notes yet.", "아직 메모가 없어요.")}</p>`}<form id="note-form" class="journal-form"><label>${w("Leave a note", "메모 남기기")}<textarea name="text" required rows="3" maxlength="2000"></textarea></label><button class="button" type="submit">${w("Save note", "남기기")}</button></form></section>
  <section class="panel" aria-labelledby="past-title"><h2 id="past-title">${w("Past reports", "지난 리포트")}</h2>${past
    .map((r) => {
      const n = buildReport({ range: r, tasks, checked, journal, grades }).done
        .length;
      return `<button class="date-row past-report" data-report-go="${r.start}"><span>${rangeTitle(ui.period, r)}</span><span class="muted">${w(`${n} done`, `${n}개 완료`)}</span></button>`;
    })
    .join("")}</section></div></div>`;
}

export interface ReportContext {
  ui: ReportUi;
  today: string;
  editor: () => EditorId;
  journal: () => JournalState;
  saveJournal: (next: JournalState) => void;
  addTaskFromNote: (text: string) => void;
  rerender: () => void;
  announce: (message: string) => void;
}

export function bindReportPage(ctx: ReportContext) {
  document
    .querySelectorAll<HTMLButtonElement>("[data-report-period]")
    .forEach((b) =>
      b.addEventListener("click", () => {
        ctx.ui.period = b.dataset.reportPeriod as Period;
        ctx.rerender();
      }),
    );
  document
    .querySelectorAll<HTMLButtonElement>("[data-report-go]")
    .forEach((b) =>
      b.addEventListener("click", () => {
        ctx.ui.anchor = b.dataset.reportGo!;
        ctx.rerender();
      }),
    );
  document.querySelector("#print-report")?.addEventListener("click", () => {
    window.print();
  });
  document
    .querySelector("#copy-report")
    ?.addEventListener("click", async () => {
      const url = `${location.origin}${location.pathname}#report`;
      try {
        await navigator.clipboard.writeText(url);
        ctx.announce(w("Link copied.", "링크를 복사했어요."));
      } catch {
        window.prompt(w("Copy this link", "이 링크를 복사하세요"), url);
      }
    });
  document
    .querySelector<HTMLFormElement>("#note-form")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget as HTMLFormElement;
      const text = String(new FormData(form).get("text") ?? "").trim();
      if (!text) return;
      ctx.saveJournal(
        addNote(ctx.journal(), {
          id: `note-${crypto.randomUUID()}`,
          author: ctx.editor(),
          date: ctx.today,
          text,
        }),
      );
    });
  document
    .querySelector<HTMLFormElement>("#meeting-form")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget as HTMLFormElement;
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      ctx.saveJournal(
        addMeeting(ctx.journal(), {
          id: `meeting-${crypto.randomUUID()}`,
          author: ctx.editor(),
          date: String(data.get("date")),
          minutes: Number(data.get("minutes")),
          summary: String(data.get("summary") ?? "").trim(),
        }),
      );
    });
  document
    .querySelectorAll<HTMLButtonElement>("[data-delete-note]")
    .forEach((b) =>
      b.addEventListener("click", () =>
        ctx.saveJournal(removeNote(ctx.journal(), b.dataset.deleteNote!)),
      ),
    );
  document
    .querySelectorAll<HTMLButtonElement>("[data-delete-meeting]")
    .forEach((b) =>
      b.addEventListener("click", () =>
        ctx.saveJournal(removeMeeting(ctx.journal(), b.dataset.deleteMeeting!)),
      ),
    );
  document
    .querySelectorAll<HTMLButtonElement>("[data-note-task]")
    .forEach((b) =>
      b.addEventListener("click", () => {
        const note = ctx
          .journal()
          .notes.find((n) => n.id === b.dataset.noteTask);
        if (note) ctx.addTaskFromNote(note.text);
      }),
    );
}
