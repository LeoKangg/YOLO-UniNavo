import { test } from "node:test";
import assert from "node:assert/strict";
import { SAT_BANDS, bandPosition, groupSatBand } from "../src/sat-bands.ts";
import { universities, sourceMap } from "../src/data/index.ts";
import { strategies } from "../src/data/strategies.ts";
import { researchedSatRanges } from "../src/data/sat-research.ts";
import { categoryFor, defaultProfile } from "../src/recommendations.ts";

test("score bands cover all valid SAT totals1100–1600 once, with no endpoint gaps", () => {
  for (let score = 1100; score <= 1600; score += 10)
    assert.equal(
      SAT_BANDS.filter((b) => score >= b.low && score <= b.high).length,
      1,
      String(score),
    );
});
test("whole-band position treats boundary crossings as overlap, never as wholly above or below", () => {
  const range = { low: 1300, high: 1450, cohort: "Test", sourceIds: [] };
  assert.equal(bandPosition({ low: 1200, high: 1290 }, range), "below");
  assert.equal(bandPosition({ low: 1300, high: 1340 }, range), "overlap");
  assert.equal(bandPosition({ low: 1450, high: 1490 }, range), "overlap");
  assert.equal(bandPosition({ low: 1500, high: 1540 }, range), "above");
  assert.equal(bandPosition({ low: 1500, high: 1540 }), "unknown");
});
test("every school appears exactly once in every band; unknown totals remain unclassified", () => {
  for (const band of SAT_BANDS) {
    const groups = groupSatBand(band, universities, strategies);
    const ids = Object.values(groups)
      .flat()
      .map((u) => u.id);
    assert.equal(ids.length, 20);
    assert.equal(new Set(ids).size, 20);
    for (const school of groups.unknown)
      assert.equal(strategies[school.id].range, undefined);
    assert.ok(groups.unknown.some((u) => u.id === "buffalo"));
  }
});
test("new numeric ranges retain official source and bilingual cohort context; high SAT does not erase a reach", () => {
  for (const r of researchedSatRanges) {
    assert.ok(r.cohort.includes("2025"));
    assert.ok(r.cohortKo);
    assert.ok(r.low <= r.high && r.low >= 400 && r.high <= 1600);
    r.sourceIds.forEach((id) => assert.ok(sourceMap.has(id), id));
    assert.equal(strategies[r.id].range?.low, r.low);
    const facts = universities.find((u) => u.id === r.id)!.facts;
    const fact = facts.satRange ?? facts.satMiddle50;
    assert.equal(fact.status, "verified");
    assert.ok(fact.text.includes(`${r.low}–${r.high}`));
    assert.deepEqual(fact.sourceIds, r.sourceIds);
  }
  assert.equal(strategies["penn-state"].range?.low, 1280);
  assert.equal(strategies["wisconsin-madison"].range?.high, 1490);
  assert.equal(
    categoryFor("michigan-ann-arbor", {
      ...defaultProfile,
      band: "95–100%",
      sat: 1600,
      rigor: "strong",
      coursework: true,
    }),
    "Reach",
  );
});
