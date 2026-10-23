import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addMeeting,
  addNote,
  emptyJournal,
  markCompleted,
  normalizeJournal,
} from "../src/journal.ts";
import {
  buildReport,
  monthRange,
  previousRange,
  weekRange,
  type ReportTask,
} from "../src/report.ts";
import { emptyGrades, saveSat, saveCourse } from "../src/grades.ts";

const tasks: ReportTask[] = [
  { id: "2026-09-0", monthId: "2026-09", title: "Old task" },
  { id: "2026-10-0", monthId: "2026-10", title: "SAT diagnostic" },
  { id: "2026-10-1", monthId: "2026-10", title: "Find AP coordinator" },
  { id: "2026-11-0", monthId: "2026-11", title: "Confirm AP order" },
];

test("weeks run Monday to Sunday and months cover the calendar month", () => {
  assert.deepEqual(weekRange("2026-10-23"), {
    start: "2026-10-19",
    end: "2026-10-25",
  });
  assert.deepEqual(weekRange("2026-10-19"), {
    start: "2026-10-19",
    end: "2026-10-25",
  });
  assert.deepEqual(weekRange("2026-10-25"), {
    start: "2026-10-19",
    end: "2026-10-25",
  });
  assert.deepEqual(monthRange("2026-02-10"), {
    start: "2026-02-01",
    end: "2026-02-28",
  });
  assert.deepEqual(previousRange("week", weekRange("2026-10-23")), {
    start: "2026-10-12",
    end: "2026-10-18",
  });
  assert.deepEqual(previousRange("month", monthRange("2027-01-15")), {
    start: "2026-12-01",
    end: "2026-12-31",
  });
});

test("journal keeps completion dates, notes and meetings, and drops malformed entries", () => {
  let j = markCompleted(emptyJournal(), "2026-10-0", "2026-10-18");
  j = markCompleted(j, "2026-10-1", "2026-10-20");
  j = markCompleted(j, "2026-10-1", null);
  j = addNote(j, {
    id: "n1",
    author: "teacher",
    date: "2026-10-19",
    text: "Math is weak",
  });
  j = addMeeting(j, {
    id: "m1",
    author: "teacher",
    date: "2026-10-16",
    minutes: 60,
    summary: "SAT plan",
  });
  assert.deepEqual(j.completedAt, { "2026-10-0": "2026-10-18" });
  assert.deepEqual(normalizeJournal(JSON.parse(JSON.stringify(j))), j);
  const cleaned = normalizeJournal({
    version: 1,
    completedAt: { ok: "2026-10-18", bad: "yesterday" },
    notes: [{ id: "x", author: "mom", date: "2026-10-19", text: "  " }],
    meetings: [
      { id: "y", author: "dad", date: "2026-10-16", minutes: -5, summary: "?" },
    ],
  });
  assert.deepEqual(cleaned, {
    ...emptyJournal(),
    completedAt: { ok: "2026-10-18" },
  });
  assert.deepEqual(normalizeJournal("nope"), emptyJournal());
});

test("a weekly report lists work done in that week and what is still open", () => {
  let journal = markCompleted(emptyJournal(), "2026-10-0", "2026-10-14");
  journal = markCompleted(journal, "2026-09-0", "2026-09-28");
  const report = buildReport({
    range: weekRange("2026-10-14"),
    tasks,
    checked: new Set(["2026-10-0", "2026-09-0"]),
    journal,
    grades: emptyGrades(),
  });
  assert.deepEqual(
    report.done.map((d) => d.task.id),
    ["2026-10-0"],
  );
  assert.deepEqual(
    report.open.map((t) => t.id),
    ["2026-10-1"],
  );
  assert.equal(report.overdue, 0);
  assert.equal(report.tone, "good");
});

test("unfinished tasks from an earlier month make the report a watch item", () => {
  const report = buildReport({
    range: weekRange("2026-10-14"),
    tasks,
    checked: new Set(),
    journal: emptyJournal(),
    grades: emptyGrades(),
  });
  assert.equal(report.overdue, 1);
  assert.equal(report.tone, "watch");
  assert.deepEqual(
    report.open.map((t) => t.id),
    ["2026-09-0", "2026-10-0", "2026-10-1"],
  );
});

test("SAT change compares the best score in the period with the best before it", () => {
  let grades = saveSat(emptyGrades(), {
    id: "s1",
    date: "2026-09-20",
    kind: "practice",
    readingWriting: 580,
    math: 540,
    updatedBy: "student",
    updatedAt: "2026-09-20",
  });
  grades = saveSat(grades, {
    id: "s2",
    date: "2026-10-18",
    kind: "practice",
    readingWriting: 630,
    math: 580,
    updatedBy: "student",
    updatedAt: "2026-10-18",
  });
  grades = saveCourse(grades, {
    id: "c1",
    code: "ENG3U",
    name: "English",
    grade: 11,
    midterm: 82,
    final: null,
    tag: "required",
    updatedBy: "mom",
    updatedAt: "2026-10-17",
  });
  const report = buildReport({
    range: weekRange("2026-10-18"),
    tasks,
    checked: new Set(),
    journal: emptyJournal(),
    grades,
  });
  assert.deepEqual(report.sat, { best: 1210, previous: 1120, attempts: 1 });
  assert.equal(report.coursesUpdated, 1);
  const quiet = buildReport({
    range: weekRange("2026-10-27"),
    tasks,
    checked: new Set(),
    journal: emptyJournal(),
    grades,
  });
  assert.deepEqual(quiet.sat, { best: null, previous: 1210, attempts: 0 });
});

test("an empty week with nothing overdue is quiet", () => {
  const report = buildReport({
    range: weekRange("2026-10-14"),
    tasks: tasks.filter((t) => t.monthId !== "2026-09"),
    checked: new Set(),
    journal: emptyJournal(),
    grades: emptyGrades(),
  });
  assert.equal(report.tone, "quiet");
});
