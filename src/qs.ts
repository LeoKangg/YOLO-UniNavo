import raw from "./data/qs-rankings.json" with { type: "json" };
export interface QsRank {
  rank: number;
  edition: number;
  sourceUrl: string;
  tied: boolean;
  scope?: string;
}
export const qsRanks: Record<string, QsRank> = raw;
export const qsOrder = (
  a: { id: string; name: string },
  b: { id: string; name: string },
) =>
  (qsRanks[a.id]?.rank ?? Infinity) - (qsRanks[b.id]?.rank ?? Infinity) ||
  a.name.localeCompare(b.name);
