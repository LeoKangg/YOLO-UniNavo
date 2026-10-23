import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyGrades, saveCourse, saveSat } from "../src/grades.ts";
import { gradeInput, satOutlook, satPosition } from "../src/matching.ts";
import { scenarioSchoolMap } from "../src/data/scenario-catalog.ts";

const school = (id: string) => scenarioSchoolMap.get(id)!;

test("grade input uses the latest grade level with marks and the best SAT", () => {
  assert.equal(gradeInput(emptyGrades()), null);
  let g = saveCourse(emptyGrades(), {
    id: "a",
    code: "ENG2D",
    name: "English 10",
    grade: 10,
    midterm: 95,
    final: null,
    tag: "required",
    updatedBy: "student",
    updatedAt: "2026-06-01",
  });
  g = saveCourse(g, {
    id: "b",
    code: "ENG3U",
    name: "English",
    grade: 11,
    midterm: 78,
    final: null,
    tag: "required",
    updatedBy: "student",
    updatedAt: "2026-10-17",
  });
  assert.deepEqual(gradeInput(g), { average: 78, band: "75–80%", sat: null });
  g = saveSat(g, {
    id: "s",
    date: "2026-10-18",
    kind: "practice",
    readingWriting: 630,
    math: 580,
    updatedBy: "student",
    updatedAt: "2026-10-18",
  });
  assert.deepEqual(gradeInput(g), { average: 78, band: "75–80%", sat: 1210 });
});

test("SAT position compares the score with each school's published middle 50%", () => {
  assert.equal(satPosition(school("arizona"), 1210), "within");
  assert.equal(satPosition(school("indiana-bloomington"), 1210), "below");
  assert.equal(satPosition(school("kansas"), 1300), "above");
  assert.equal(satPosition(school("asu"), 1210), "no-data");
  assert.equal(satPosition(school("washington-state"), 1210), "not-considered");
  assert.equal(satPosition(school("arizona"), null), "no-data");
});

test("the outlook names the smallest SAT that brings another listed school into range", () => {
  const list = ["arizona", "indiana-bloomington", "kansas"].map(school);
  assert.deepEqual(
    satOutlook(list, 1210).map((o) => ({
      sat: o.sat,
      within: o.within,
      added: o.added.map((s) => s.id),
    })),
    [
      { sat: 1210, within: 2, added: [] },
      { sat: 1250, within: 3, added: ["indiana-bloomington"] },
    ],
  );
  assert.deepEqual(
    satOutlook(list.slice(0, 1), 1210).map((o) => o.sat),
    [1210],
  );
});
