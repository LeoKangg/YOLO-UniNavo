import { satTotal, type GradesState } from "./grades.ts";
import type { JournalState, Meeting, Note } from "./journal.ts";

export type Period = "week" | "month";
export interface Range {
  start: string;
  end: string;
}
export interface ReportTask {
  id: string;
  monthId: string;
  title: string;
}

// Calendar dates only; noon UTC keeps day arithmetic clear of time zones.
const toDate = (iso: string) => new Date(`${iso}T12:00:00Z`);
const toIso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (iso: string, days: number) => {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
};
export function weekRange(iso: string): Range {
  const start = addDays(iso, -((toDate(iso).getUTCDay() + 6) % 7));
  return { start, end: addDays(start, 6) };
}
export function monthRange(iso: string): Range {
  const d = toDate(iso);
  const last = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 12),
  );
  return { start: `${iso.slice(0, 7)}-01`, end: toIso(last) };
}
export const rangeFor = (period: Period, iso: string) =>
  period === "week" ? weekRange(iso) : monthRange(iso);
export const previousRange = (period: Period, r: Range) =>
  rangeFor(period, addDays(r.start, -1));
export const nextRange = (period: Period, r: Range) =>
  rangeFor(period, addDays(r.end, 1));
export const inRange = (iso: string, r: Range) =>
  iso >= r.start && iso <= r.end;

export interface Report {
  range: Range;
  done: { task: ReportTask; date: string }[];
  open: ReportTask[];
  overdue: number;
  sat: { best: number | null; previous: number | null; attempts: number };
  coursesUpdated: number;
  notes: Note[];
  meetings: Meeting[];
  tone: "good" | "watch" | "quiet";
}

export function buildReport(input: {
  range: Range;
  tasks: ReportTask[];
  checked: Set<string>;
  journal: JournalState;
  grades: GradesState;
}): Report {
  const { range, tasks, checked, journal, grades } = input;
  const month = range.end.slice(0, 7);
  const done = tasks
    .filter((t) => checked.has(t.id))
    .map((task) => ({ task, date: journal.completedAt[task.id] }))
    .filter((d) => d.date && inRange(d.date, range))
    .sort((a, b) => a.date.localeCompare(b.date));
  const open = tasks.filter((t) => !checked.has(t.id) && t.monthId <= month);
  const overdue = open.filter((t) => t.monthId < month).length;
  const best = (list: GradesState["sat"]) =>
    list.length ? Math.max(...list.map(satTotal)) : null;
  const satIn = grades.sat.filter((a) => inRange(a.date, range));
  const sat = {
    best: best(satIn),
    previous: best(grades.sat.filter((a) => a.date < range.start)),
    attempts: satIn.length,
  };
  const coursesUpdated = grades.courses.filter((c) =>
    inRange(c.updatedAt, range),
  ).length;
  const notes = journal.notes.filter((n) => inRange(n.date, range));
  const meetings = journal.meetings.filter((m) => inRange(m.date, range));
  const tone =
    overdue > 0
      ? "watch"
      : done.length ||
          sat.attempts ||
          coursesUpdated ||
          notes.length ||
          meetings.length
        ? "good"
        : "quiet";
  return {
    range,
    done,
    open,
    overdue,
    sat,
    coursesUpdated,
    notes,
    meetings,
    tone,
  };
}
