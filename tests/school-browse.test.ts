import { test } from "node:test";
import assert from "node:assert/strict";
import { scenarioSchools } from "../src/data/scenario-catalog.ts";
import { qsRanks } from "../src/qs.ts";
import { browseSchools, emptyBrowse } from "../src/school-browse.ts";
import {
  addNote,
  emptyJournal,
  normalizeJournal,
  schoolNotes,
} from "../src/journal.ts";

test("with no filters every researched school is listed in QS order", () => {
  const list = browseSchools(scenarioSchools, emptyBrowse());
  assert.equal(list.length, scenarioSchools.length);
  const ranked = list
    .filter((s) => qsRanks[s.id])
    .map((s) => qsRanks[s.id].rank);
  assert.deepEqual(
    ranked,
    [...ranked].sort((a, b) => a - b),
  );
});

test("search matches English and Korean names and the program", () => {
  const byKo = browseSchools(scenarioSchools, {
    ...emptyBrowse(),
    search: "인디애나",
  });
  assert.ok(byKo.some((s) => s.id === "indiana-bloomington"));
  const byProgram = browseSchools(scenarioSchools, {
    ...emptyBrowse(),
    search: "sociology",
  });
  assert.ok(byProgram.length > 5);
  assert.ok(
    byProgram.every((s) =>
      /sociology/i.test(`${s.entry.program} ${s.entry.programKo}`),
    ),
  );
});

test("the SAT band filter uses the middle of each published range", () => {
  const list = browseSchools(scenarioSchools, {
    ...emptyBrowse(),
    band: "1200",
  });
  assert.ok(list.length > 0);
  for (const s of list) {
    const mid = (s.satRange!.low + s.satRange!.high) / 2;
    assert.ok(mid >= 1200 && mid < 1300, s.id);
  }
});

test("flag filters narrow to test-optional, UC or private schools", () => {
  const optional = browseSchools(scenarioSchools, {
    ...emptyBrowse(),
    optionalOnly: true,
  });
  assert.ok(
    optional.length && optional.every((s) => s.testing.policy === "optional"),
  );
  const uc = browseSchools(scenarioSchools, { ...emptyBrowse(), ucOnly: true });
  assert.equal(uc.length, 9);
  const priv = browseSchools(scenarioSchools, {
    ...emptyBrowse(),
    privateOnly: true,
  });
  assert.ok(priv.length && priv.every((s) => /private/i.test(s.type)));
});

test("sorting by SAT puts the lowest published range first and schools without one last", () => {
  const list = browseSchools(scenarioSchools, {
    ...emptyBrowse(),
    sort: "sat",
  });
  const lows = list.filter((s) => s.satRange).map((s) => s.satRange!.low);
  assert.deepEqual(
    lows,
    [...lows].sort((a, b) => a - b),
  );
  assert.equal(list.at(-1)!.satRange, null);
});

test("notes can belong to a school and survive storage", () => {
  const j = addNote(emptyJournal(), {
    id: "n1",
    author: "teacher",
    date: "2026-10-21",
    text: "Look at the CAS sociology curriculum",
    schoolId: "indiana-bloomington",
  });
  assert.equal(schoolNotes(j, "indiana-bloomington").length, 1);
  assert.equal(schoolNotes(j, "arizona").length, 0);
  assert.equal(
    normalizeJournal(JSON.parse(JSON.stringify(j))).notes[0].schoolId,
    "indiana-bloomington",
  );
  const bad = normalizeJournal({
    version: 1,
    notes: [
      {
        id: "x",
        author: "mom",
        date: "2026-10-21",
        text: "hi",
        schoolId: "../bad",
      },
    ],
  });
  assert.equal(bad.notes[0].schoolId, undefined);
});
