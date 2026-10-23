import profiles from "../../research/elite-sat-profiles.json" with { type: "json" };
import sections from "../../research/elite-sat-sections.json" with { type: "json" };
import type { Source } from "../types.ts";
export const eliteSatProfiles = profiles;
export const harvardSat = {
  sourceId: "elite-sat-harvard-2025",
  url: "https://oira.harvard.edu/files/2026/07/CDS_2025-2026.pdf#page=9",
  text: "2025–26 CDS C9, Fall 2025 enrolled SAT submitters (1,325; 79%). Reading and Writing 720–770; Math 730–790 (25th–75th percentiles). SAT composite percentiles are blank. Section percentiles cannot be added to construct a composite range.",
  textKo:
    "2025–26 CDS C9 · 2025년 가을 등록 신입생 중 SAT 제출자 1,325명(79%). 읽기·쓰기 720–770, 수학 730–790(25–75백분위). SAT 총점 백분위는 공란입니다. 영역별 백분위를 더해 총점 분포로 만들 수 없습니다.",
};
export const eliteSatSections: Record<
  string,
  { sourceId: string; text: string; textKo: string }
> = {
  harvard: harvardSat,
  ...Object.fromEntries(
    sections.map((p) => [
      p.id,
      {
        sourceId: `elite-sat-${p.id}`,
        text: `${p.cohort}. Reading and Writing ${p.rw[0]}–${p.rw[1]}; Math ${p.math[0]}–${p.math[1]} (25th–75th percentiles). Composite percentiles are not reported. Section percentiles cannot be added to construct a composite range.`,
        textKo: `${p.cohortKo}. 읽기·쓰기 ${p.rw[0]}–${p.rw[1]}, 수학 ${p.math[0]}–${p.math[1]}(25–75백분위). 총점 백분위는 공개하지 않습니다. 영역별 백분위를 더해 총점 분포로 만들 수 없습니다.`,
      },
    ]),
  ),
};
export const eliteSatSources: Source[] = [
  ...[...profiles, ...sections].map((p) => ({
    id: `elite-sat-${p.id}`,
    title: p.title,
    publisher: p.publisher,
    url: p.sourceUrl,
    cycle: p.cycle,
    verified: p.verified,
  })),
  {
    id: harvardSat.sourceId,
    title: "Harvard Common Data Set 2025–26 · C9 p.9",
    publisher: "Harvard University OIRA",
    url: harvardSat.url,
    cycle: "Fall 2025 enrolled first-year SAT submitters",
    verified: "2026-10-22",
  },
];
