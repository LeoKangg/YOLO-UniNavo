import { planning } from "./index.ts";

export interface Deadline {
  date: string;
  en: string;
  ko: string;
  sourceIds: string[];
}

// Confirmed official dates only. Anticipated SAT dates stay on the exam page.
export const officialDeadlines: Deadline[] = [
  {
    date: "2026-11-13",
    en: "AP exam school order deadline",
    ko: "AP 시험 학교 주문 마감",
    sourceIds: ["ap-order"],
  },
  ...planning.satDates.flatMap((d) => [
    {
      date: d.registrationDeadline,
      en: `SAT registration deadline · ${d.date.slice(5).replace("-", "/")} test`,
      ko: `SAT 정규 등록 마감 · ${Number(d.date.slice(5, 7))}월 ${Number(d.date.slice(8))}일 시험`,
      sourceIds: d.sourceIds,
    },
    {
      date: d.date,
      en: "SAT test day",
      ko: "SAT 시험일",
      sourceIds: d.sourceIds,
    },
  ]),
].sort((a, b) => a.date.localeCompare(b.date));

export const upcomingDeadlines = (today: string, count = 3) =>
  officialDeadlines.filter((d) => d.date >= today).slice(0, count);
