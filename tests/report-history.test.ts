import { test } from "node:test";
import assert from "node:assert/strict";
import {
  courseChanges,
  emptyGrades,
  normalizeGrades,
  removeCourse,
  saveCourse,
  scoreAt,
  type CourseGrade,
} from "../src/grades.ts";
import {
  buildReport,
  monthRange,
  parseReportHash,
  periodSeries,
  reportHash,
  weekRange,
} from "../src/report.ts";
import { addMeeting, emptyJournal } from "../src/journal.ts";

const course = (over: Partial<CourseGrade> = {}): CourseGrade => ({
  id: "phy",
  code: "SPH3U",
  name: "Physics",
  grade: 11,
  midterm: 74,
  final: null,
  tag: "science",
  updatedBy: "student",
  updatedAt: "2026-09-20",
  ...over,
});

test("changing a mark keeps the previous value with its date", () => {
  let g = saveCourse(emptyGrades(), course());
  g = saveCourse(g, course({ midterm: 74, name: "Physics 11" }));
  assert.equal(g.history.length, 0);
  g = saveCourse(g, course({ midterm: 71, updatedAt: "2026-10-21" }));
  assert.deepEqual(g.history, [
    { courseId: "phy", date: "2026-09-20", value: 74 },
  ]);
  assert.deepEqual(
    normalizeGrades(JSON.parse(JSON.stringify(g))).history,
    g.history,
  );
  assert.equal(removeCourse(g, "phy").history.length, 0);
});

test("the score on a date uses the record that was current then", () => {
  let g = saveCourse(emptyGrades(), course());
  g = saveCourse(g, course({ midterm: 71, updatedAt: "2026-10-21" }));
  assert.equal(scoreAt(g, "phy", "2026-09-10"), null);
  assert.equal(scoreAt(g, "phy", "2026-09-30"), 74);
  assert.equal(scoreAt(g, "phy", "2026-10-31"), 71);
});

test("monthly course changes compare the end of the month with the end of the previous one", () => {
  let g = saveCourse(emptyGrades(), course());
  g = saveCourse(g, course({ midterm: 71, updatedAt: "2026-10-21" }));
  g = saveCourse(
    g,
    course({
      id: "eng",
      code: "ENG3U",
      name: "English",
      midterm: 82,
      tag: "required",
      updatedAt: "2026-10-20",
    }),
  );
  const changes = courseChanges(g, monthRange("2026-10-15"));
  assert.deepEqual(
    changes.map((c) => [c.course.id, c.before, c.after]),
    [
      ["phy", 74, 71],
      ["eng", null, 82],
    ],
  );
});

test("reports total meeting time", () => {
  let j = addMeeting(emptyJournal(), {
    id: "m1",
    author: "teacher",
    date: "2026-10-20",
    minutes: 60,
    summary: "SAT",
  });
  j = addMeeting(j, {
    id: "m2",
    author: "teacher",
    date: "2026-10-23",
    minutes: 45,
    summary: "AP",
  });
  const r = buildReport({
    range: weekRange("2026-10-23"),
    tasks: [],
    checked: new Set(),
    journal: j,
    grades: emptyGrades(),
  });
  assert.equal(r.meetingMinutes, 105);
});

test("period series ends at the anchor period and runs oldest first", () => {
  assert.deepEqual(
    periodSeries("week", "2026-10-23", 3).map((r) => r.start),
    ["2026-10-05", "2026-10-12", "2026-10-19"],
  );
  assert.deepEqual(
    periodSeries("month", "2026-10-23", 2).map((r) => r.start),
    ["2026-09-01", "2026-10-01"],
  );
});

test("a report link names its period and survives a round trip", () => {
  const hash = reportHash("week", weekRange("2026-10-23"));
  assert.equal(hash, "#report/week/2026-10-19");
  assert.deepEqual(parseReportHash(hash), {
    period: "week",
    anchor: "2026-10-19",
  });
  assert.deepEqual(parseReportHash("#report/month/2026-10-01"), {
    period: "month",
    anchor: "2026-10-01",
  });
  assert.equal(parseReportHash("#report"), null);
  assert.equal(parseReportHash("#report/year/2026-01-01"), null);
  assert.equal(parseReportHash("#report/week/yesterday"), null);
});
