import { test } from "node:test";
import assert from "node:assert/strict";
import { timeline } from "../src/data/timeline.ts";
import {
  emptyPlanner,
  normalizePlanner,
  personalTimeline,
  saveTaskEdit,
} from "../src/planner.ts";
test("editing and moving an official task preserves original guidance without labeling personal edits official", () => {
  const original = timeline[1].tasks[0];
  const state = saveTaskEdit(emptyPlanner(), {
    id: original.id,
    monthId: timeline[2].id,
    title: "My changed date",
    detail: "Personal reminder",
  });
  const result = personalTimeline(timeline, state);
  assert.equal(
    result[1].tasks.some((t) => t.id === original.id),
    false,
  );
  const edited = result[2].tasks.find((t) => t.id === original.id)!;
  assert.equal(edited.kind, "Planning task");
  assert.equal(edited.original?.detail, original.detail);
  assert.equal(timeline[1].tasks[0].title, original.title);
  assert.equal(result.flatMap((m) => m.tasks).length, 72);
});
test("custom tasks survive serialization, deletions hide tasks, and malformed stored input is rejected", () => {
  const state = saveTaskEdit(emptyPlanner(), {
    id: "custom-example",
    monthId: "2026-10",
    title: "My task",
    detail: "Notes",
  });
  state.deleted.push(timeline[0].tasks[0].id);
  const restored = normalizePlanner(
    JSON.parse(JSON.stringify(state)),
    timeline,
  );
  const tasks = personalTimeline(timeline, restored).flatMap((m) => m.tasks);
  assert.ok(tasks.some((t) => t.id === "custom-example"));
  assert.ok(!tasks.some((t) => t.id === state.deleted[0]));
  assert.deepEqual(
    normalizePlanner({ version: 9, edits: state.edits }, timeline),
    emptyPlanner(),
  );
  const bad = normalizePlanner(
    {
      version: 1,
      edits: [
        null,
        { id: 'bad"markup', monthId: "2026-10", title: "x", detail: "" },
        { id: "custom-a", monthId: "2030-01", title: "x", detail: "" },
      ],
      deleted: [null, 1],
    },
    timeline,
  );
  assert.deepEqual(bad, emptyPlanner());
});
