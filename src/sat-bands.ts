import type { Strategy, University } from "./types.ts";

export const SAT_BANDS = [
  { low: 1100, high: 1190 },
  { low: 1200, high: 1290 },
  { low: 1300, high: 1340 },
  { low: 1350, high: 1390 },
  { low: 1400, high: 1440 },
  { low: 1450, high: 1490 },
  { low: 1500, high: 1540 },
  { low: 1550, high: 1590 },
  { low: 1600, high: 1600 },
] as const;
export interface SatBand {
  low: number;
  high: number;
}
export type BandPosition = "above" | "overlap" | "below" | "unknown";
// Compare the entire band. A band crossing a percentile boundary overlaps;
// no midpoint or invented admission probability decides its position.
export function bandPosition(
  band: SatBand,
  range?: Strategy["range"],
): BandPosition {
  if (!range) return "unknown";
  if (band.low > range.high) return "above";
  if (band.high < range.low) return "below";
  return "overlap";
}
export function groupSatBand(
  band: SatBand,
  schools: University[],
  data: Record<string, Strategy>,
) {
  const groups: Record<BandPosition, University[]> = {
    above: [],
    overlap: [],
    below: [],
    unknown: [],
  };
  for (const school of schools)
    groups[bandPosition(band, data[school.id].range)].push(school);
  // Show nearest score distributions first; this is display order, not an admissions rank.
  const center = (band.low + band.high) / 2;
  for (const position of ["above", "overlap", "below"] as const)
    groups[position].sort((a, b) => {
      const ar = data[a.id].range!,
        br = data[b.id].range!;
      const distance = (r: NonNullable<Strategy["range"]>) =>
        position === "above"
          ? band.low - r.high
          : position === "below"
            ? r.low - band.high
            : Math.abs((r.low + r.high) / 2 - center);
      return distance(ar) - distance(br) || a.name.localeCompare(b.name);
    });
  return groups;
}
