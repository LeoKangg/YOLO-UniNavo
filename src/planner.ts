import type { Month, Task } from "./types.ts";
export interface TaskEdit {
  id: string;
  monthId: string;
  title: string;
  detail: string;
}
export interface PlannerState {
  version: 1;
  edits: TaskEdit[];
  deleted: string[];
}
export type PersonalTask = Task & { personal?: boolean; original?: Task };
export const emptyPlanner = (): PlannerState => ({
  version: 1,
  edits: [],
  deleted: [],
});
export function normalizePlanner(
  input: unknown,
  months: Month[],
): PlannerState {
  if (!input || typeof input !== "object") return emptyPlanner();
  const p = input as Partial<PlannerState>;
  if (p.version !== 1) return emptyPlanner();
  const monthIds = new Set(months.map((m) => m.id));
  const validId = (id: unknown): id is string =>
    typeof id === "string" && /^[a-zA-Z0-9-]{1,100}$/.test(id);
  const edits = new Map<string, TaskEdit>();
  if (Array.isArray(p.edits))
    for (const edit of p.edits.slice(0, 1000)) {
      if (
        !edit ||
        typeof edit !== "object" ||
        !validId(edit.id) ||
        !monthIds.has(edit.monthId) ||
        typeof edit.title !== "string" ||
        !edit.title.trim() ||
        typeof edit.detail !== "string"
      )
        continue;
      edits.set(edit.id, {
        id: edit.id,
        monthId: edit.monthId,
        title: edit.title.trim().slice(0, 180),
        detail: edit.detail.slice(0, 5000),
      });
    }
  return {
    version: 1,
    edits: [...edits.values()],
    deleted: Array.isArray(p.deleted)
      ? [...new Set(p.deleted.filter(validId))].slice(0, 1000)
      : [],
  };
}
export function personalTimeline(
  months: Month[],
  state: PlannerState,
): (Omit<Month, "tasks"> & { tasks: PersonalTask[] })[] {
  const originals = new Map(
    months.flatMap((m) => m.tasks).map((t) => [t.id, t]),
  );
  const editedIds = new Set(state.edits.map((e) => e.id));
  const deleted = new Set(state.deleted);
  return months.map((m) => ({
    ...m,
    tasks: [
      ...m.tasks.filter((t) => !editedIds.has(t.id)),
      ...state.edits
        .filter((e) => e.monthId === m.id)
        .map((e) => ({
          id: e.id,
          title: e.title,
          detail: e.detail,
          sourceIds: [],
          kind: "Planning task" as const,
          personal: true,
          original: originals.get(e.id),
        })),
    ].filter((t) => !deleted.has(t.id)),
  }));
}
export function saveTaskEdit(
  state: PlannerState,
  edit: TaskEdit,
): PlannerState {
  return {
    ...state,
    edits: [...state.edits.filter((e) => e.id !== edit.id), edit],
    deleted: state.deleted.filter((id) => id !== edit.id),
  };
}
