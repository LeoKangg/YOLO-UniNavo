import { test } from "node:test";
import assert from "node:assert/strict";
import {
  candidateMatrix,
  candidatePlan,
  candidateCsv,
  candidateSatAdvice,
  normalizeCandidateInput,
} from "../src/candidate-plans.ts";
import {
  scenarioSchoolMap,
  scenarioSourceMap,
} from "../src/data/scenario-catalog.ts";
import { renderExplorer } from "../src/university-explorer.ts";
const input = (band = "60–65%", sat = 1100) =>
  normalizeCandidateInput({ band, sat });

test("all40 cases contain ten unique, source-backed research candidates from a pool larger than20", () => {
  const cells = candidateMatrix();
  assert.equal(cells.length, 40);
  assert.ok(
    new Set(cells.flatMap((c) => c.selected.map((s) => s.id))).size > 40,
  );
  for (const cell of cells) {
    assert.equal(cell.kind, "editorial-review");
    assert.equal(cell.selected.length, 10, `${cell.band}/${cell.sat}`);
    assert.equal(new Set(cell.selected.map((s) => s.id)).size, 10);
    for (const s of cell.selected) {
      assert.ok(s.entry.program && s.academic.text && s.academic.textKo);
      for (const ids of [
        s.entry.sourceIds,
        s.academic.sourceIds,
        s.testing.sourceIds,
      ]) {
        assert.ok(ids.length, s.id);
        for (const id of ids)
          assert.ok(scenarioSourceMap.get(id)?.url.startsWith("https://"), id);
      }
      assert.equal(s.entry.easierMajorVerified, false);
    }
  }
  assert.notDeepEqual(
    candidatePlan(input()).selected,
    candidatePlan(input("95–100%", 1500)).selected,
  );
  assert.notDeepEqual(
    candidatePlan(input("85–90%", 1100)).selected,
    candidatePlan(input("85–90%", 1400)).selected,
  );
});
test("SAT-only state cannot inherit old citizenship, GPA calculations or section assumptions", () => {
  const state = normalizeCandidateInput({
    band: "85–90%",
    sat: 1400,
    applicantRoute: "us",
    averageBasis: "core-secondary",
    exactAverage: 88,
    confirmedCalculations: ["iowa"],
    readingWriting: 700,
    math: 700,
  });
  assert.equal(state.applicantRoute, "international");
  assert.equal(state.averageBasis, "unknown");
  assert.equal(state.exactAverage, null);
  assert.equal(state.readingWriting, null);
  assert.equal(state.math, null);
  assert.deepEqual(state.confirmedCalculations, []);
  assert.equal(candidatePlan(input("80–85%", 1090)).selected.length, 0);
  assert.equal(candidatePlan(input("80–85%", 1190)).referenceSat, 1100);
  assert.equal(candidatePlan(input("80–85%", 1600)).referenceSat, 1500);
  assert.equal(normalizeCandidateInput({ sat: 1111 }).sat, null);
});
test("score advice preserves GPA/section conditions and never rewards a test-blind school", () => {
  const wsu = scenarioSchoolMap.get("washington-state")!;
  assert.equal(
    candidateSatAdvice(wsu, 1100, true),
    candidateSatAdvice(wsu, 1500, true),
  );
  assert.match(
    candidateSatAdvice(scenarioSchoolMap.get("wichita-state")!, 1200, true),
    /영역별 490\/490/,
  );
  assert.match(
    candidateSatAdvice(scenarioSchoolMap.get("iowa-state")!, 1200, true),
    /GPA 항목에 한하며/,
  );
  assert.match(
    candidateSatAdvice(
      scenarioSchoolMap.get("michigan-ann-arbor")!,
      1100,
      true,
    ),
    /미제출/,
  );
  assert.match(
    candidateSatAdvice(scenarioSchoolMap.get("florida")!, 1100, true),
    /점수 개선/,
  );
  assert.match(scenarioSchoolMap.get("texas-state")!.academic.textKo, /2.74/);
});
test("reviewed profiles preserve college scope, conflicting dates and current source URLs", () => {
  assert.deepEqual(
    [
      scenarioSchoolMap.get("purdue-west-lafayette")!.satRange!.low,
      scenarioSchoolMap.get("purdue-west-lafayette")!.satRange!.high,
    ],
    [1110, 1348],
  );
  assert.match(
    scenarioSourceMap.get("purdue-profile")!.url,
    /admissions\.purdue\.edu\/become-student\/class-profile/,
  );
  assert.match(
    scenarioSchoolMap.get("minnesota-twin-cities")!.satRange!.cohortKo,
    /불일치/,
  );
  assert.equal(scenarioSchoolMap.get("florida-state")!.satRange!.low, 1380);
  assert.equal(scenarioSchoolMap.get("iowa")!.satRange!.low, 1130);
  assert.match(scenarioSchoolMap.get("toledo")!.entry.program, /History/);
  assert.doesNotMatch(
    scenarioSchoolMap.get("toledo")!.entry.program,
    /Sociology/,
  );
});
test("live explorer uses names and ten candidates, with one SAT input and no hidden eligibility claim", () => {
  const matrix = renderExplorer(input(), "all-scenarios", "", new Set());
  assert.equal((matrix.match(/data-scenario-choice=/g) ?? []).length, 40);
  assert.match(matrix, /Fort Hays State University/);
  assert.match(matrix, /eligibility is not confirmed/);
  assert.equal((matrix.match(/<input /g) ?? []).length, 1);
  assert.doesNotMatch(
    matrix,
    /<select|data-calculation|scenario-route|scenario-basis|scenario-exact/,
  );
  const result = renderExplorer(input(), "scenario", "", new Set());
  assert.equal(
    (result.match(/class="scenario-school-card"/g) ?? []).length,
    10,
  );
  assert.match(result, /not confirmed eligible/);
  assert.match(result, /The University of Toledo/);
  assert.doesNotMatch(result, /verified component matches|short of10/);
});
test("CSV exports400 research entries with requirements, official links and explicit editorial status", () => {
  const csv = candidateCsv();
  assert.equal(csv.split("\r\n").length, 401);
  assert.equal(
    (
      csv.match(/Editorial research candidate, NOT confirmed eligibility/g) ??
      []
    ).length,
    400,
  );
  assert.match(csv, /https:\/\/www\.utoledo\.edu/);
  assert.match(csv, /college|College/);
});

test("Harvard is not excluded at1500 or presented as safe at1600; list order is not a recommendation ranking", () => {
  const harvard = scenarioSchoolMap.get("harvard")!;
  assert.ok(harvard);
  assert.equal(harvard.ontario.minimum, null);
  assert.equal(harvard.entry.easierMajorVerified, false);
  assert.match(harvard.entry.text, /does not admit by academic program/);
  assert.match(harvard.testing.text, /no testing cutoffs/);
  for (const sat of [1500, 1600]) {
    const plan = candidatePlan(input("95–100%", sat));
    assert.ok(plan.selected.some((s) => s.id === "harvard"));
    assert.match(candidateSatAdvice(harvard, sat, false), /very ambitious/);
  }
  for (const cell of candidateMatrix()) {
    const names = cell.selected.map((s) => s.name);
    assert.deepEqual(
      names,
      [...names].sort((a, b) => a.localeCompare(b, "en")),
    );
  }
  const html = renderExplorer(
    input("95–100%", 1500),
    "scenario",
    "",
    new Set(),
  );
  assert.match(html, /Harvard University/);
  assert.match(html, /not recommendation rank/);
  assert.doesNotMatch(html, /scenario-order/);
  assert.doesNotMatch(candidateCsv(), /Research order/);
});

test("all nine UC campuses retain current test-free and undecided2028 policy without SAT-based list movement", async () => {
  const { ucSchoolIds } = await import("../src/university-review.ts");
  assert.equal(ucSchoolIds.length, 9);
  for (const id of ucSchoolIds) {
    const s = scenarioSchoolMap.get(id)!;
    assert.equal(s.testing.policy, "not-considered");
    assert.equal(s.ontario.minimum, null);
    assert.equal(s.satRange, null);
    assert.match(s.testing.text, /2028.*undecided/);
    assert.equal(
      candidateSatAdvice(s, 1100, true),
      candidateSatAdvice(s, 1600, true),
    );
  }
  const cells = candidateMatrix();
  for (const band of new Set(cells.map((c) => c.band))) {
    const subsets = cells
      .filter((c) => c.band === band)
      .map((c) =>
        c.selected.filter((s) => s.id.startsWith("uc-")).map((s) => s.id),
      );
    for (const subset of subsets) assert.deepEqual(subset, subsets[0]);
  }
  const uc = renderExplorer(input("95–100%", 1500), "uc", "", new Set());
  assert.equal((uc.match(/<tr>/g) ?? []).length, 10);
  assert.match(uc, /Fall2028 undecided/);
  assert.match(uc, /not international/);
});

test("audit coverage is explicit for every school and final updates cannot be overwritten by old program/range adapters", async () => {
  const { universityReviews, universityReviewMap, confirmed2028Policies } =
    await import("../src/university-review.ts");
  const { scenarioSchools } = await import("../src/data/scenario-catalog.ts");
  assert.equal(
    new Set(universityReviews.map((s) => s.id)).size,
    scenarioSchools.length,
  );
  for (const school of scenarioSchools) {
    const review = universityReviewMap.get(school.id);
    assert.ok(review, school.id);
    assert.ok(review.sourceIds.length, school.id);
    for (const id of review.sourceIds) assert.ok(scenarioSourceMap.has(id), id);
  }
  assert.equal(confirmed2028Policies.princeton, "required");
  assert.equal(confirmed2028Policies.columbia, "required");
  assert.equal(confirmed2028Policies.vanderbilt, "optional");
  assert.equal(confirmed2028Policies["uc-berkeley"], undefined);
  assert.match(scenarioSchoolMap.get("iowa")!.entry.text, /History B.A./);
  assert.match(
    scenarioSchoolMap.get("texas-state")!.applicantScope.text,
    /Ontario educational credentials/,
  );
  assert.match(
    scenarioSchoolMap.get("james-madison")!.applicantScope.text,
    /four years/,
  );
  assert.deepEqual(
    [
      scenarioSchoolMap.get("james-madison")!.satRange!.low,
      scenarioSchoolMap.get("james-madison")!.satRange!.high,
    ],
    [1210, 1370],
  );
  assert.match(
    scenarioSchoolMap.get("florida-state")!.applicantScope.text,
    /Regular Decision/,
  );
});
