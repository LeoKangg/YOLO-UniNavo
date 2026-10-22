export const GRADE_BANDS = [
  "60–65%",
  "65–70%",
  "70–75%",
  "75–80%",
  "80–85%",
  "85–90%",
  "90–95%",
] as const;
export type GradeBand = (typeof GRADE_BANDS)[number];
export type Category =
  | "Very High Reach"
  | "Reach"
  | "Target"
  | "More Realistic";
export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  verified: string;
  cycle: string;
}
export interface Fact {
  text: string;
  sourceIds: string[];
  status: string;
}
export interface University {
  id: string;
  name: string;
  city: string;
  state: string;
  type: string;
  recognition: string;
  sources: Source[];
  facts: Record<string, Fact>;
}
export interface Strategy {
  shortName: string;
  initials: string;
  color: string;
  recognition: "Very High" | "High" | "Moderate";
  majors: string[];
  structure: string;
  selectivity: "exceptional" | "selective" | "broad";
  bands: Category[];
  testing: "Test optional" | "Test required" | "Confirm policy";
  fit: string;
  priority: number;
  range?: { low: number; high: number; cohort: string; sourceIds: string[] };
}
export interface Profile {
  band: GradeBand | "";
  sat: number | null;
  rigor: "unknown" | "standard" | "strong";
  coursework: boolean;
  citizenship: "unknown" | "canadian" | "us" | "other";
  program: "flexible" | "specialized";
}
export interface Month {
  id: string;
  phase: string;
  title: string;
  focus: string;
  priority: "High" | "Steady";
  tasks: Task[];
}
export interface Task {
  id: string;
  title: string;
  detail: string;
  sourceIds: string[];
  kind: "Planning task" | "Official date";
}
