import { validateScenarioData } from "./validate-scenarios.ts";
import { scenarioSchools } from "../src/data/scenario-catalog.ts";
import {
  universities,
  sources,
  sourceMap,
  planning,
  pathways,
  RESEARCH_DATE,
} from "../src/data/index.ts";
import { timeline } from "../src/data/timeline.ts";
import { strategies } from "../src/data/strategies.ts";
import { GRADE_BANDS } from "../src/types.ts";
import type { Fact } from "../src/types.ts";
import { pathToFileURL } from "node:url";
export function validateData(): string[] {
  const errors: string[] = [];
  const check = (ok: unknown, message: string) => {
    if (!ok) errors.push(message);
  };
  const unique = (values: string[], label: string) =>
    check(new Set(values).size === values.length, `Duplicate ${label}`);
  unique(
    universities.map((u) => u.id),
    "university IDs",
  );
  unique(
    sources.map((s) => s.id),
    "source IDs",
  );
  for (const s of sources) {
    try {
      const url = new URL(s.url);
      check(url.protocol === "https:", `${s.id}: non-HTTPS`);
      check(
        !["example.com", "localhost"].includes(url.hostname),
        `${s.id}: placeholder`,
      );
    } catch {
      errors.push(`${s.id}: malformed URL`);
    }
    check(s.title && s.publisher && s.cycle, `${s.id}: incomplete metadata`);
    check(
      /^2026-10-(21|22)$/.test(s.verified) && s.verified <= RESEARCH_DATE,
      `${s.id}: verification date mismatch`,
    );
  }
  const checkFact = (f: Fact, location: string) => {
    check(f.text && f.status, `${location}: incomplete fact`);
    for (const id of f.sourceIds)
      check(sourceMap.has(id), `${location}: missing source ${id}`);
    if (/^(verified|Verified)/.test(f.status))
      check(
        f.sourceIds.length > 0,
        `${location}: verified claim has no source`,
      );
  };
  for (const u of universities) {
    check(u.name && u.city && u.state && u.type, `${u.id}: missing identity`);
    check(u.sources.length > 0, `${u.id}: missing sources`);
    for (const [key, f] of Object.entries(u.facts))
      checkFact(f, `${u.id}.${key}`);
    for (const field of [
      "coursework",
      "english",
      "application",
      "deadlines",
      "ap",
      "cost",
      "aid",
    ])
      check(u.facts[field], `${u.id}: missing ${field}`);
    const s = strategies[u.id];
    check(s, `${u.id}: missing strategy`);
    if (s) {
      check(s.bands.length === GRADE_BANDS.length, `${u.id}: invalid bands`);
      check(
        s.bands.every((b) =>
          ["Very High Reach", "Reach", "Target", "More Realistic"].includes(b),
        ),
        `${u.id}: invalid category`,
      );
      check(
        s.majors.length >= 2 && s.majors.length <= 4,
        `${u.id}: invalid major count`,
      );
      s.range?.sourceIds.forEach((id) =>
        check(sourceMap.has(id), `${u.id}: missing range source`),
      );
    }
  }
  for (const f of planning.facts) checkFact(f, f.id);
  for (const f of pathways.facts) checkFact(f, "pathway");
  unique(
    timeline.map((m) => m.id),
    "timeline months",
  );
  unique(
    timeline.flatMap((m) => m.tasks.map((t) => t.id)),
    "task IDs",
  );
  check(timeline.length === 23, "Timeline must cover 23 months");
  check(
    timeline[0].id === "2026-10" && timeline.at(-1)?.id === "2028-08",
    "Timeline endpoints",
  );
  for (let i = 0; i < timeline.length; i++) {
    const expected = new Date(Date.UTC(2026, 9 + i, 1))
      .toISOString()
      .slice(0, 7);
    check(timeline[i].id === expected, `Timeline gap ${expected}`);
    for (const t of timeline[i].tasks) {
      check(t.title && t.detail, `${t.id}: incomplete task`);
      check(
        t.kind !== "Official date" || t.sourceIds.length,
        `${t.id}: official date without source`,
      );
      t.sourceIds.forEach((id) =>
        check(sourceMap.has(id), `${t.id}: missing source ${id}`),
      );
    }
  }
  for (const r of planning.resources) {
    check(
      r.title && r.author && r.edition && r.url,
      `Incomplete resource ${r.title}`,
    );
    r.sourceIds.forEach((id) =>
      check(sourceMap.has(id), `${r.title}: missing source ${id}`),
    );
  }
  for (const exam of [...planning.satDates, ...planning.satAnticipatedDates]) {
    exam.sourceIds.forEach((id) =>
      check(sourceMap.has(id), `Exam source ${id}`),
    );
    if (exam.status.includes("Anticipated"))
      check(
        exam.registrationDeadline === null && exam.scoreRelease === null,
        "Future SAT dates must not invent deadlines",
      );
  }
  for (const a of planning.apPriorities)
    a.sourceIds.forEach((id) =>
      check(sourceMap.has(id), `${a.name}: missing source ${id}`),
    );
  return [...errors, ...validateScenarioData()];
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const errors = validateData();
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else
    console.log(
      `Validated ${scenarioSchools.length} researched universities (${universities.length} with extended details), ${sources.length} source records, ${timeline.length} months, ${timeline.flatMap((m) => m.tasks).length} tasks.`,
    );
}
