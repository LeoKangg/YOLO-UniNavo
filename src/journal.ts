import { EDITORS, type EditorId } from "./grades.ts";

// Notes, meetings with the teacher, and the date each roadmap task was checked
// off. Reports read these; nothing here is an access control.
export interface Note {
  id: string;
  author: EditorId;
  date: string;
  text: string;
  schoolId?: string;
}
export interface Meeting {
  id: string;
  author: EditorId;
  date: string;
  minutes: number;
  summary: string;
}
export interface JournalState {
  version: 1;
  completedAt: Record<string, string>;
  notes: Note[];
  meetings: Meeting[];
}
export const emptyJournal = (): JournalState => ({
  version: 1,
  completedAt: {},
  notes: [],
  meetings: [],
});

const byDate = <T extends { date: string }>(list: T[]) =>
  [...list].sort((a, b) => b.date.localeCompare(a.date));
export function markCompleted(
  s: JournalState,
  taskId: string,
  date: string | null,
): JournalState {
  const completedAt = { ...s.completedAt };
  if (date) completedAt[taskId] = date;
  else delete completedAt[taskId];
  return { ...s, completedAt };
}
export const addNote = (s: JournalState, note: Note): JournalState => ({
  ...s,
  notes: byDate([...s.notes.filter((n) => n.id !== note.id), note]),
});
export const schoolNotes = (s: JournalState, schoolId: string) =>
  s.notes.filter((n) => n.schoolId === schoolId);
export const removeNote = (s: JournalState, id: string): JournalState => ({
  ...s,
  notes: s.notes.filter((n) => n.id !== id),
});
export const addMeeting = (s: JournalState, m: Meeting): JournalState => ({
  ...s,
  meetings: byDate([...s.meetings.filter((x) => x.id !== m.id), m]),
});
export const removeMeeting = (s: JournalState, id: string): JournalState => ({
  ...s,
  meetings: s.meetings.filter((m) => m.id !== id),
});

const validId = (v: unknown): v is string =>
  typeof v === "string" && /^[a-zA-Z0-9-]{1,100}$/.test(v);
const validDate = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const text = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
const author = (v: unknown): EditorId =>
  EDITORS.includes(v as EditorId) ? (v as EditorId) : "student";

export function normalizeJournal(input: unknown): JournalState {
  if (!input || typeof input !== "object") return emptyJournal();
  const j = input as Record<string, unknown>;
  if (j.version !== 1) return emptyJournal();
  const completedAt: Record<string, string> = {};
  if (j.completedAt && typeof j.completedAt === "object")
    for (const [id, date] of Object.entries(j.completedAt).slice(0, 2000))
      if (validId(id) && validDate(date)) completedAt[id] = date;
  const list = (v: unknown) =>
    (Array.isArray(v) ? v.slice(0, 1000) : []).filter(
      (x): x is Record<string, unknown> => !!x && typeof x === "object",
    );
  const notes: Note[] = list(j.notes)
    .filter((n) => validId(n.id) && validDate(n.date) && text(n.text, 2000))
    .map((n) => ({
      id: n.id as string,
      author: author(n.author),
      date: n.date as string,
      text: text(n.text, 2000),
      ...(validId(n.schoolId) ? { schoolId: n.schoolId } : {}),
    }));
  const meetings: Meeting[] = list(j.meetings)
    .filter(
      (m) =>
        validId(m.id) &&
        validDate(m.date) &&
        typeof m.minutes === "number" &&
        Number.isInteger(m.minutes) &&
        m.minutes > 0 &&
        m.minutes <= 600 &&
        text(m.summary, 2000),
    )
    .map((m) => ({
      id: m.id as string,
      author: author(m.author),
      date: m.date as string,
      minutes: m.minutes as number,
      summary: text(m.summary, 2000),
    }));
  return {
    version: 1,
    completedAt,
    notes: byDate(notes),
    meetings: byDate(meetings),
  };
}
