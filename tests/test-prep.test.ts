import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyGrades, normalizeGrades, setSatTarget } from "../src/grades.ts";
import { nextSatSitting, resourceStage, satBands } from "../src/test-prep.ts";
import { scenarioSchools } from "../src/data/scenario-catalog.ts";

test("schools with a published SAT range are grouped by the middle of that range", () => {
  const bands = satBands(scenarioSchools, 1210);
  assert.deepEqual(
    bands.map((b) => b.label),
    ["~1199", "1200–1299", "1300–1399", "1400–1499", "1500+"],
  );
  const total = bands.reduce((n, b) => n + b.schools.length, 0);
  assert.equal(
    total,
    scenarioSchools.filter(
      (s) => s.satRange && s.testing.policy !== "not-considered",
    ).length,
  );
  const indiana = bands.find((b) =>
    b.schools.some((s) => s.id === "indiana-bloomington"),
  )!;
  assert.equal(indiana.label, "1300–1399");
  assert.deepEqual(
    bands.map((b) => b.containsScore),
    [false, true, false, false, false],
  );
  for (const b of bands) {
    const mids = b.schools.map((s) => s.satRange!.low + s.satRange!.high);
    assert.deepEqual(
      mids,
      [...mids].sort((x, y) => x - y),
    );
  }
  assert.ok(satBands(scenarioSchools, null).every((b) => !b.containsScore));
  assert.equal(satBands(scenarioSchools, 1600)[4].containsScore, true);
});

test("the next sitting is the first whose registration deadline has not passed", () => {
  assert.deepEqual(nextSatSitting("2026-10-23"), {
    date: "2026-11-07",
    registrationDeadline: "2026-10-23",
  });
  assert.deepEqual(nextSatSitting("2026-10-24"), {
    date: "2026-12-05",
    registrationDeadline: "2026-11-20",
  });
  assert.equal(nextSatSitting("2030-01-01"), null);
});

test("a target SAT is kept only as a valid total and survives storage", () => {
  const withTarget = setSatTarget(emptyGrades(), 1300);
  assert.equal(withTarget.satTarget, 1300);
  assert.equal(
    normalizeGrades(JSON.parse(JSON.stringify(withTarget))).satTarget,
    1300,
  );
  assert.equal(setSatTarget(emptyGrades(), 1305).satTarget, null);
  assert.equal(setSatTarget(withTarget, null).satTarget, null);
  assert.equal(
    normalizeGrades({ version: 1, satTarget: 2000 }).satTarget,
    null,
  );
  assert.equal(emptyGrades().satTarget, null);
});

test("study stage starts at the diagnostic and moves on after the first score", () => {
  assert.equal(resourceStage(emptyGrades()), 0);
  const g = normalizeGrades({
    version: 1,
    sat: [
      {
        id: "s",
        date: "2026-10-18",
        kind: "practice",
        readingWriting: 600,
        math: 560,
        updatedBy: "student",
        updatedAt: "2026-10-18",
      },
    ],
  });
  assert.equal(resourceStage(g), 1);
});
