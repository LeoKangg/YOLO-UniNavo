import { readLocal, writeLocal } from "./storage.ts";
import { uiKo } from "./locales/ko-ui.ts";
import { contentKo } from "./locales/ko-content.ts";

export type Language = "en" | "ko";
export const normalizeLanguage = (value: unknown): Language =>
  value === "ko" ? "ko" : "en";
let language = normalizeLanguage(readLocal("language"));
export const getLanguage = () => language;
export function setLanguage(next: Language) {
  language = next;
  return writeLocal("language", next);
}
const dictionary: Record<string, string> = { ...uiKo, ...contentKo };
export function translate(text: string, lang: Language = language): string {
  if (lang === "en") return text;
  const key = text.trim();
  let translated = dictionary[key];
  if (!translated) {
    const patterns: [RegExp, (...matches: string[]) => string][] = [
      [/^Saved \((\d+)\)$/, (_, n) => `저장한 대학 (${n})`],
      [/^(\d+) (?:university|universities)$/, (_, n) => `대학교 ${n}곳`],
      [/^(\d+) source records$/, (_, n) => `출처 ${n}건`],
      [
        /^(\d+) of (\d+) tasks complete$/,
        (_, n, total) => `전체 ${total}개 중 ${n}개 완료`,
      ],
      [/^(\d+) \/ (\d+) complete$/, (_, n, total) => `${n} / ${total} 완료`],
      [/^Explore all (\d+) →$/, (_, n) => `대학교 ${n}곳 모두 보기 →`],
      [
        /^View all (\d+) working picks →$/,
        (_, n) => `추천 대학 ${n}곳 모두 보기 →`,
      ],
      [/^Advanced filters ([−+])$/, (_, sign) => `상세 필터 ${sign}`],
      [/^Above (\d+)$/, (_, n) => `${n}점 초과`],
      [
        /^Recheck testing for 2028\. (.+)$/,
        (_, majors) =>
          `2028년 시험 정책을 다시 확인하세요. ${translate(majors, "ko")}`,
      ],
      [
        /^Brand reference: (Very High|High|Moderate) \(editorial, not an admissions metric\)\.$/,
        (_, rating) =>
          `인지도 참고: ${translate(rating, "ko")} (편집 판단이며 입학 심사 지표가 아님).`,
      ],
      [
        /^PRIORITY 0(\d)( · OPTIONAL)?$/,
        (_, n, optional) => `우선순위 0${n}${optional ? " · 선택 사항" : ""}`,
      ],
      [
        /^(NOW|NEXT|LATER) · (HIGH|STEADY) PRIORITY$/,
        (_, when, priority) =>
          `${({ NOW: "지금", NEXT: "다음", LATER: "추후" } as Record<string, string>)[when]} · ${priority === "HIGH" ? "우선순위 높음" : "꾸준히 진행"}`,
      ],
      [
        /^Explore (\d+) U.S. universities through an Ontario lens. Every important claim connects to its source.$/,
        (_, n) =>
          `온타리오 학생의 관점에서 미국 대학교 ${n}곳을 살펴보세요. 주요 정보마다 근거가 되는 출처를 연결했습니다.`,
      ],
      [
        /^Published middle 50%: (\d+)–(\d+). Add a diagnostic score to compare.$/,
        (_, low, high) =>
          `공식 중간 50% 점수 범위: ${low}–${high}. 진단 점수를 입력해 비교해 보세요.`,
      ],
      [
        /^(Save|Remove) (.+) (?:to|from) my shortlist$/,
        (_, action, name) =>
          `${translate(name, "ko")}${action === "Save" ? " 관심 대학에 저장" : " 관심 대학에서 삭제"}`,
      ],
    ];
    for (const [pattern, replacement] of patterns) {
      const match = key.match(pattern);
      if (match) {
        translated = replacement(...match);
        break;
      }
    }
  }
  // Composite labels retain the original separators and translate each segment.
  if (!translated && key.includes(" · "))
    translated = key
      .split(" · ")
      .map((part) => translate(part, "ko"))
      .join(" · ");
  if (!translated) return text;
  return text.replace(key, () => translated);
}

/** Localize freshly rendered templates without touching IDs, URLs or form values. */
export function localize(root: HTMLElement) {
  // An option without a value derives its value from its visible text.
  // Pin it before translating so all filters and stored selections stay canonical.
  root
    .querySelectorAll("option:not([value])")
    .forEach((option) =>
      option.setAttribute("value", option.textContent ?? ""),
    );
  if (language === "en") return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (parent?.closest("[data-original-language], script, style")) continue;
    node.textContent = translate(node.textContent ?? "");
  }
  root
    .querySelectorAll<HTMLElement>("[aria-label], [title], [placeholder]")
    .forEach((element) => {
      for (const attribute of ["aria-label", "title", "placeholder"]) {
        const value = element.getAttribute(attribute);
        if (value) element.setAttribute(attribute, translate(value));
      }
    });
}
