import { test } from "node:test";
import assert from "node:assert/strict";
import { universities, planning } from "../src/data/index.ts";
import { GRADE_BANDS } from "../src/types.ts";
import {
  categoryFor,
  recommend,
  normalizeProfile,
  defaultProfile,
  scoreContext,
} from "../src/recommendations.ts";
import { strategies } from "../src/data/strategies.ts";
import { validateData } from "../scripts/validate.ts";
test("dataset is complete, unique, source-linked, and calendar contiguous", () =>
  assert.deepEqual(validateData(), []));
test("no profile means no fabricated personalized shortlist", () => {
  assert.deepEqual(recommend(universities, defaultProfile), []);
  assert.equal(categoryFor("nyu", defaultProfile), null);
});
test("60–70 bands never receive misleading prestigious direct-entry picks", () => {
  for (const band of GRADE_BANDS.slice(0, 2)) {
    const p = {
      ...defaultProfile,
      band,
      sat: 1600,
      rigor: "strong" as const,
      coursework: true,
    };
    assert.deepEqual(recommend(universities, p), []);
    for (const u of universities)
      assert.equal(categoryFor(u.id, p), "Very High Reach");
  }
});
test("all seven bands produce at most six unique non-high-reach picks", () => {
  for (const band of GRADE_BANDS) {
    const p = { ...defaultProfile, band };
    const picks = recommend(universities, p);
    assert.ok(picks.length <= 6);
    assert.equal(new Set(picks.map((u) => u.id)).size, picks.length);
    for (const u of picks)
      assert.notEqual(categoryFor(u.id, p), "Very High Reach");
  }
});
test("75–95 scenarios have six working picks, never a guaranteed safety", () => {
  for (const band of GRADE_BANDS.slice(3))
    assert.equal(
      recommend(universities, { ...defaultProfile, band }).length,
      6,
    );
});
test("NYU stays a reach even with high grades and perfect testing", () => {
  for (const band of GRADE_BANDS)
    assert.ok(
      ["Reach", "Very High Reach"].includes(
        categoryFor("nyu", {
          ...defaultProfile,
          band,
          sat: 1600,
          rigor: "strong",
          coursework: true,
        })!,
      ),
    );
});
test("More Realistic requires both course check and strong preparation", () => {
  const p = { ...defaultProfile, band: GRADE_BANDS[6] };
  assert.equal(categoryFor("asu", p), "Target");
  assert.equal(categoryFor("asu", { ...p, coursework: true }), "Target");
  assert.equal(
    categoryFor("asu", { ...p, rigor: "strong", coursework: true }),
    "More Realistic",
  );
});
test("unreviewed specialized programs and domestic route cannot inherit general target categories", () => {
  const p = {
    ...defaultProfile,
    band: GRADE_BANDS[6],
    coursework: true,
    rigor: "strong" as const,
  };
  assert.equal(categoryFor("asu", { ...p, program: "specialized" }), "Reach");
  assert.equal(categoryFor("asu", { ...p, citizenship: "us" }), "Reach");
});
test("SAT never overrides weak academic scenario and comparisons use sourced cohort", () => {
  const p = { ...defaultProfile, band: GRADE_BANDS[2] };
  assert.equal(
    categoryFor("michigan-state", { ...p, sat: 1600 }),
    categoryFor("michigan-state", { ...p, sat: 400 }),
  );
  assert.match(
    scoreContext(strategies["michigan-state"], { ...p, sat: 1300 }),
    /within/,
  );
  assert.match(
    scoreContext(strategies["michigan-state"], { ...p, sat: 1000 }),
    /below/,
  );
});
test("corrupt or obsolete saved profile safely falls back", () => {
  assert.deepEqual(normalizeProfile(null), defaultProfile);
  const p = normalizeProfile({
    band: "100%",
    sat: 9999,
    rigor: "perfect",
    coursework: "true",
    citizenship: "fictional",
  });
  assert.deepEqual(p, defaultProfile);
});
test("future SAT schedule remains anticipated and October date uses updated body", () => {
  assert.ok(planning.satAnticipatedDates.some((d) => d.date === "2027-10-09"));
  assert.ok(
    planning.satAnticipatedDates.every(
      (d) => d.status.startsWith("Anticipated") && d.scoreRelease === null,
    ),
  );
  assert.equal(
    planning.satDates.find((d) => d.date === "2027-06-05")?.scoreRelease,
    "2027-06-21",
  );
});
