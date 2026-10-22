import { test } from "node:test";
import assert from "node:assert/strict";
import { GRADE_BANDS } from "../src/types.ts";
import { universities, sourceMap } from "../src/data/index.ts";
import { strategies } from "../src/data/strategies.ts";
import { expandedEvidence } from "../src/data/evidence.ts";
import {
  comparisonCsv,
  SAT_SCENARIOS,
  compareSat,
  meetsPublishedAlternative,
} from "../src/comparison.ts";
import {
  defaultProfile,
  categoryFor,
  normalizeProfile,
} from "../src/recommendations.ts";
test("all 40 grade-SAT scenarios cover20schools without claiming a high SAT overrides academics", () => {
  assert.equal(universities.length, 20);
  assert.equal(GRADE_BANDS.length * SAT_SCENARIOS.length, 40);
  assert.equal(normalizeProfile({ band: "95–100%" }).band, "95–100%");
  for (const u of universities)
    for (const band of GRADE_BANDS) {
      const p = { ...defaultProfile, band };
      for (const sat of SAT_SCENARIOS) {
        assert.equal(categoryFor(u.id, { ...p, sat }), categoryFor(u.id, p));
        assert.ok(
          ["below", "within", "above", "unknown"].includes(
            compareSat(sat, strategies[u.id].range),
          ),
        );
      }
    }
});
test("SAT comparisons include endpoints and never infer composite percentiles from component scores", () => {
  const r = { low: 1200, high: 1400, cohort: "Test cohort", sourceIds: [] };
  assert.equal(compareSat(1100, r), "below");
  assert.equal(compareSat(1200, r), "within");
  assert.equal(compareSat(1400, r), "within");
  assert.equal(compareSat(1500, r), "above");
  assert.equal(compareSat(1500), "unknown");
  assert.equal(strategies.buffalo.range, undefined);
});
test("Iowa GPA alternative is conditional and never applied to the U.S.applicant route or other schools", () => {
  assert.equal(
    meetsPublishedAlternative("iowa-state", 1100, defaultProfile),
    false,
  );
  assert.equal(
    meetsPublishedAlternative("iowa-state", 1200, {
      ...defaultProfile,
      citizenship: "canadian",
    }),
    true,
  );
  assert.equal(
    meetsPublishedAlternative("iowa-state", 1500, {
      ...defaultProfile,
      citizenship: "us",
    }),
    false,
  );
  assert.equal(
    meetsPublishedAlternative("kansas", 1500, defaultProfile),
    false,
  );
});
test("new evidence keeps source-linked majors, Ontario unknowns and separately named program cohorts", () => {
  for (const e of expandedEvidence) {
    for (const m of e.majorEvidence) {
      assert.ok(m.name);
      assert.ok(m.sourceIds.length);
      m.sourceIds.forEach((id) => assert.ok(sourceMap.has(id), id));
    }
    e.eligibility.sourceIds.forEach((id) => assert.ok(sourceMap.has(id), id));
    for (const r of e.programRanges ?? []) {
      assert.ok(r.unit && r.cohort);
      assert.ok(r.low <= r.high);
      r.sourceIds.forEach((id) => assert.ok(sourceMap.has(id), id));
    }
    if (e.ranking.rank !== null) {
      assert.equal(e.ranking.edition, "2026");
      assert.ok(e.ranking.sourceId && sourceMap.has(e.ranking.sourceId));
    }
  }
  assert.equal(strategies.alabama.testing, "Test required");
});

test("download contains all800 school-scenario rows with sourced context and conditional labels", () => {
  const csv = comparisonCsv(defaultProfile, () => null);
  const lines = csv.split("\r\n");
  assert.equal(lines.length, 801);
  assert.ok(csv.startsWith("\uFEFF"));
  for (const band of GRADE_BANDS)
    assert.equal(
      lines.filter((line) => line.startsWith(`"${band}"`)).length,
      100,
    );
  assert.match(csv, /If international route applies/);
  assert.match(csv, /https:\/\/www.iastate.edu/);
  assert.ok(
    !comparisonCsv(
      { ...defaultProfile, citizenship: "us" },
      () => null,
    ).includes("If international route applies"),
  );
});
