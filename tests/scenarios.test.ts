import { validateScenarioData } from "../scripts/validate-scenarios.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  scenarioSchools,
  scenarioSchoolMap,
  scenarioSourceMap,
} from "../src/data/scenario-catalog.ts";
import {
  assessSchool,
  planScenario,
  scenarioMatrix,
  defaultScenario,
  normalizeScenario,
  scenarioCsv,
} from "../src/scenarios.ts";
import type { ScenarioInput } from "../src/scenario-types.ts";
const input = (extra: Partial<ScenarioInput> = {}): ScenarioInput => ({
  ...defaultScenario,
  band: "80–85%",
  sat: 1300,
  ...extra,
});
const school = (id: string) => {
  const s = scenarioSchoolMap.get(id);
  assert.ok(s, id);
  return s;
};

test("research pool exceeds60schools with unique records and fully traceable sourced fields", () => {
  assert.deepEqual(validateScenarioData(), []);
  assert.ok(scenarioSchools.length >= 60);
  assert.equal(
    new Set(scenarioSchools.map((s) => s.id)).size,
    scenarioSchools.length,
  );
  for (const s of scenarioSchools) {
    assert.ok(s.name && s.nameKo && s.entry.program && s.entry.programKo);
    assert.ok(s.entry.sourceIds.length, s.id + " program sources");
    for (const value of Object.values(s))
      if (value && typeof value === "object" && "sourceIds" in value) {
        for (const id of value.sourceIds as string[])
          assert.ok(scenarioSourceMap.has(id), s.id + ":" + id);
      }
    if (s.rank.value !== null) {
      assert.equal(s.rank.edition, "2026");
      assert.ok(s.rank.sourceIds.length);
    }
    if (s.ontario.minimum !== null)
      assert.ok(s.ontario.basisKey && s.ontario.sourceIds.length);
  }
});
test("strict recommendations do not use SATpercentiles or invented Ontario GPA conversions", () => {
  for (const cell of scenarioMatrix(
    scenarioSchools,
    input({ averageBasis: "unknown" }),
  )) {
    assert.ok(cell.selected.length <= 10);
    assert.equal(cell.shortage, 10 - cell.selected.length);
    for (const x of cell.selected) {
      assert.equal(x.assessment.reason, "matched-sat-alternative");
      assert.ok(x.school.satAlternative?.replacesGpa);
    }
    assert.ok(
      !cell.selected.some((x) => x.school.id === "southern-california"),
    );
  }
  assert.equal(
    assessSchool(
      school("michigan-ann-arbor"),
      input({ band: "95–100%", sat: 1500 }),
    ).matched,
    false,
  );
});
test("a shortage is explicit and low-gradeSAT1100does not invent ten direct-entry schools", () => {
  const result = planScenario(
    scenarioSchools,
    input({ band: "60–65%", sat: 1100 }),
  );
  assert.equal(result.selected.length, 0);
  assert.equal(result.shortage, 10);
  assert.equal(result.excluded.length, scenarioSchools.length);
  assert.ok(
    planScenario(
      scenarioSchools,
      input({ band: "60–65%", sat: 1200 }),
    ).selected.some((x) => x.school.id === "iowa-state"),
  );
});
test("published averages cannot be silently substituted for Grade12top-six marks", () => {
  const uni = school("northern-iowa");
  assert.equal(
    assessSchool(uni, input({ averageBasis: "grade12-top6" })).matched,
    false,
  );
  assert.equal(
    assessSchool(uni, input({ averageBasis: "unknown" })).matched,
    false,
  );
  assert.equal(
    assessSchool(
      uni,
      input({
        averageBasis: "cumulative-academic",
        band: "75–80%",
        confirmedCalculations: ["northern-iowa"],
      }),
    ).matched,
    true,
  );
  assert.equal(
    assessSchool(
      uni,
      input({ averageBasis: "cumulative-academic", band: "70–75%" }),
    ).matched,
    false,
  );
  assert.equal(
    assessSchool(
      school("iowa"),
      input({
        averageBasis: "core-secondary",
        band: "70–75%",
        confirmedCalculations: ["iowa"],
      }),
    ).matched,
    true,
  );
});
test("greater-than70is not70-or-more; crossing bands need an exact average", () => {
  const s = school("portland-state"),
    p = input({
      band: "70–75%",
      averageBasis: "overall-secondary",
      confirmedCalculations: ["portland-state"],
    });
  assert.equal(assessSchool(s, p).reason, "straddles-percentage");
  assert.equal(assessSchool(s, { ...p, exactAverage: 70 }).matched, false);
  assert.equal(assessSchool(s, { ...p, exactAverage: 70.1 }).matched, true);
});
test("Wichita section minima need real or mathematically sufficient evidence, not just1060total", () => {
  const s = school("wichita-state");
  assert.equal(assessSchool(s, input({ sat: 1100 })).reason, "sections-needed");
  assert.equal(
    assessSchool(s, input({ sat: 1100, readingWriting: 600, math: 500 }))
      .matched,
    true,
  );
  assert.equal(
    assessSchool(s, input({ sat: 1100, readingWriting: 600 })).matched,
    true,
  );
  assert.equal(assessSchool(s, input({ sat: 1280 })).matched, false);
  assert.equal(assessSchool(s, input({ sat: 1290 })).matched, true);
  assert.equal(
    assessSchool(s, input({ sat: 1300, readingWriting: 500, math: 700 }))
      .matched,
    false,
  );
  assert.equal(
    assessSchool(s, input({ sat: 1300, readingWriting: 400 })).matched,
    false,
  );
});
test("international GPAalternatives never apply to an unreviewed U.S.route, and source conflicts are excluded", () => {
  assert.equal(
    assessSchool(
      school("iowa-state"),
      input({ applicantRoute: "us", sat: 1500 }),
    ).reason,
    "route-unreviewed",
  );
  assert.equal(
    assessSchool(school("south-dakota"), input({ sat: 1500 })).reason,
    "conflicting-rule",
  );
});
test("all40combinations are independent, preserve shortages, and rank only matching records", () => {
  const matrix = scenarioMatrix(
    scenarioSchools,
    input({
      averageBasis: "core-secondary",
      confirmedCalculations: ["iowa", "missouri"],
    }),
  );
  assert.equal(matrix.length, 40);
  assert.equal(new Set(matrix.map((r) => r.band + "|" + r.sat)).size, 40);
  for (const row of matrix) {
    assert.equal(row.selected.length + row.shortage, 10);
    assert.equal(
      new Set(row.selected.map((x) => x.school.id)).size,
      row.selected.length,
    );
    for (const item of row.selected)
      assert.equal(item.assessment.matched, true);
  }
  const below = matrix.find((x) => x.band === "75–80%" && x.sat === 1100)!;
  const above = matrix.find((x) => x.band === "80–85%" && x.sat === 1100)!;
  assert.ok(!below.selected.some((x) => x.school.id === "missouri"));
  assert.ok(above.selected.some((x) => x.school.id === "missouri"));
});
test("CSV retains per-scenario shortages, exact evidenceURLs, and no fabricated eligibility", () => {
  const csv = scenarioCsv(
    scenarioSchools,
    input({
      averageBasis: "core-secondary",
      confirmedCalculations: ["iowa", "missouri"],
    }),
    (id) => scenarioSourceMap.get(id)?.url ?? "",
  );
  assert.ok(csv.startsWith("\uFEFF"));
  assert.match(csv, /Shortage to10/);
  assert.match(csv, /no admission decision/);
  assert.match(csv, /https:\/\//);
  assert.match(csv, /School-specific calculation assumptions/);
  assert.match(csv, /Minimum >= 80%/);
  const alternative = school("iowa-state").satAlternative!;
  assert.ok(
    csv.includes(alternative.remainingRequirements.replaceAll('"', '""')),
  );
});
test("invalid saved scenario values fall back; invalid exact average cannot leak across bands", () => {
  const p = normalizeScenario({
    band: "70–75%",
    sat: 1203,
    exactAverage: 98,
    averageBasis: "gpa-magic",
    readingWriting: 999,
  });
  assert.equal(p.sat, null);
  assert.equal(p.exactAverage, null);
  assert.equal(p.averageBasis, "unknown");
  assert.equal(p.readingWriting, null);
});

test("each school's calculation needs its own confirmation, never a generic core average", () => {
  const s = school("missouri");
  assert.equal(
    assessSchool(s, input({ averageBasis: "core-secondary" })).reason,
    "calculation-needed",
  );
  assert.equal(
    assessSchool(
      s,
      input({
        averageBasis: "core-secondary",
        confirmedCalculations: ["iowa"],
      }),
    ).matched,
    false,
  );
  assert.equal(
    assessSchool(
      s,
      input({
        averageBasis: "core-secondary",
        confirmedCalculations: ["missouri"],
      }),
    ).matched,
    true,
  );
});
test("contradictory SAT sections invalidate every route including alternatives without section minima", () => {
  const p = input({
    sat: 1200,
    readingWriting: 800,
    math: 800,
    averageBasis: "core-secondary",
    confirmedCalculations: ["iowa"],
  });
  for (const s of scenarioSchools)
    assert.equal(assessSchool(s, p).reason, "invalid-sat");
  assert.equal(planScenario(scenarioSchools, p).selected.length, 0);
});
