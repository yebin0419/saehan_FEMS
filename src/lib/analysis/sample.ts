import type { EquipmentReadingSet } from "./classify";

const BASE = new Date("2026-01-01T08:00:00+09:00");

type EquipDef = {
  code: string;
  name: string;
  thresholds: { running: number; stop: number };
};

const DEFS: EquipDef[] = [
  { code: "PET-1", name: "PET-1호기", thresholds: { running: 10, stop: 2 } },
  { code: "PET-2", name: "PET-2호기", thresholds: { running: 10, stop: 2 } },
  { code: "INJ-1", name: "사출-1호기", thresholds: { running: 8, stop: 1.5 } },
  { code: "INJ-2", name: "사출-2호기", thresholds: { running: 8, stop: 1.5 } },
];

/**
 * 작업자 수동 입력 없이 Classify / KPI / Pareto 로직을 자가 검증하기 위한
 * 결정적(deterministic) 샘플 데이터셋.
 */
export function buildDeterministicSample(opts: {
  minutes?: number;
} = {}): EquipmentReadingSet[] {
  const minutes = opts.minutes ?? 60;
  return DEFS.map((def, defIdx) => {
    const readings: EquipmentReadingSet["readings"] = [];
    for (let m = 0; m < minutes; m++) {
      const seed = (m * 31 + defIdx * 7) % 60;
      let current: number;
      if (seed < 40) {
        current = 11 + (seed % 5);
      } else if (seed < 50) {
        current = 3 + (seed % 4);
      } else {
        current = 0.5;
      }
      readings.push({
        ts: new Date(BASE.getTime() + m * 60_000),
        current,
      });
    }
    return { ...def, readings };
  });
}
