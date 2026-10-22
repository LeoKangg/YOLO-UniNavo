import { test } from "node:test";
import assert from "node:assert/strict";
import { universities, planning, pathways } from "../src/data/index.ts";
import { timeline } from "../src/data/timeline.ts";
import { strategies } from "../src/data/strategies.ts";
import { normalizeLanguage, translate } from "../src/i18n.ts";
import { universityKo } from "../src/locales/ko-universities.ts";
import { timelineKo } from "../src/locales/ko-timeline.ts";

test("every university fact and planning fact has Korean text; English stays intact", () => {
  const texts = [
    ...universities.flatMap((u) => Object.values(u.facts).map((f) => f.text)),
    ...planning.facts.map((f) => f.text),
    ...pathways.facts.map((f) => f.text),
    ...Object.values(strategies).map((s) => s.fit),
  ];
  for (const text of texts) {
    assert.match(translate(text, "ko"), /[가-힣]/, text);
    assert.equal(translate(text, "en"), text);
  }
  for (const u of universities)
    assert.deepEqual(
      Object.keys(universityKo[u.id]).sort(),
      Object.keys(u.facts).sort(),
    );
});
test("all 23 months and 72 tasks have aligned Korean titles and details", () => {
  assert.deepEqual(
    Object.keys(timelineKo),
    timeline.map((m) => m.id),
  );
  for (const month of timeline) {
    assert.equal(timelineKo[month.id][2].length, month.tasks.length, month.id);
    for (const text of [
      month.title,
      month.focus,
      ...month.tasks.flatMap((t) => [t.title, t.detail]),
    ])
      assert.match(translate(text, "ko"), /[가-힣]/, text);
  }
});
test("AP advice and resource explanations are localized, including combined sentences", () => {
  for (const ap of planning.apPriorities) {
    for (const key of [
      "name",
      "reason",
      "difficulty",
      "timing",
      "target",
      "credit",
      "session",
    ] as const)
      assert.match(translate(ap[key], "ko"), /[가-힣]/, ap[key]);
    assert.ok(
      !translate(`${ap.target}. ${ap.credit}`, "ko").includes(ap.credit),
    );
  }
  for (const resource of planning.resources)
    for (const key of ["reason", "purpose", "priority", "edition"] as const)
      assert.match(translate(resource[key], "ko"), /[가-힣]/, resource[key]);
});
test("dynamic labels preserve counts and source score bounds", () => {
  assert.equal(
    translate("  12 of 72 tasks complete  ", "ko"),
    "  전체 72개 중 12개 완료  ",
  );
  assert.equal(translate("Saved (3)", "ko"), "저장한 대학 (3)");
  assert.equal(
    translate(
      "Published middle 50%: 1100–1320. Add a diagnostic score to compare.",
      "ko",
    ),
    "공식 중간 50% 점수 범위: 1100–1320. 진단 점수를 입력해 비교해 보세요.",
  );
  assert.equal(
    translate("Recheck testing for 2028. Sociology · History", "ko"),
    "2028년 시험 정책을 다시 확인하세요. 사회학 · 역사학",
  );
  assert.equal(
    translate("Save Michigan State University to my shortlist", "ko"),
    "미시간 주립대학교 (MSU) 관심 대학에 저장",
  );
  assert.equal(
    translate("https://www.example.edu/2028", "ko"),
    "https://www.example.edu/2028",
  );
});
test("invalid language preferences fall back safely; future schedules keep their caveats", () => {
  for (const value of [null, {}, "fr", "KO", 123])
    assert.equal(normalizeLanguage(value), "en");
  assert.equal(normalizeLanguage("ko"), "ko");
  assert.match(
    translate(planning.facts.find((f) => f.id === "sat-future")!.text, "ko"),
    /예상.*발표|예상.*아직/,
  );
  assert.match(
    translate(planning.facts.find((f) => f.id === "ap-2028")!.text, "ko"),
    /미발표/,
  );
});
