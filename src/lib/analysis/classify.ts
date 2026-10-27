import { differenceInMinutes } from "date-fns";
import type { CauseCategoryCode, StateCode } from "@/lib/db/schema";
import { UNITS_PER_MIN_DEFAULT } from "@/lib/causes";

export type Thresholds = {
  running: number;
  stop: number;
};

export type ReadingPoint = {
  ts: Date;
  current: number;
};

export type ClassifiedEvent = {
  equipmentCode: string;
  equipmentName?: string;
  start: Date;
  end: Date;
  durationMin: number;
  state: StateCode;
  causeCategory: CauseCategoryCode | null;
  causeDetail: string;
};

export type EquipmentReadingSet = {
  code: string;
  name?: string;
  thresholds: Thresholds;
  readings: ReadingPoint[];
};

export type KPIs = {
  totalMin: number;
  downMin: number;
  utilPct: number;
  estLossEA: number;
  stopEvents: number;
};

export function classifyReading(
  currentAmp: number,
  thresholds: Thresholds,
): StateCode {
  if (currentAmp >= thresholds.running) return "run";
  if (currentAmp <= thresholds.stop) return "stop";
  return "idle";
}

/**
 * 전류 시계열(1분 단위)로부터 상태 구간 이벤트 리스트를 추출한다.
 * 상태 전환 시점을 경계로 삼아 start/end/duration/state 를 포함한 이벤트를 반환.
 * 비어 있으면 빈 배열을 반환.
 */
export function detectEvents(
  equip: EquipmentReadingSet,
): ClassifiedEvent[] {
  const readings = equip.readings;
  if (readings.length === 0) return [];

  const stateOf = (c: number) => classifyReading(c, equip.thresholds);

  const first = readings[0];
  let curState = stateOf(first.current);
  let curStart = first.ts;
  const out: ClassifiedEvent[] = [];

  for (let i = 1; i < readings.length; i++) {
    const point = readings[i];
    const s = stateOf(point.current);
    if (s !== curState) {
      out.push({
        equipmentCode: equip.code,
        equipmentName: equip.name,
        start: curStart,
        end: point.ts,
        durationMin: Math.max(1, differenceInMinutes(point.ts, curStart)),
        state: curState,
        causeCategory: null,
        causeDetail: "",
      });
      curState = s;
      curStart = point.ts;
    }
  }

  const last = readings[readings.length - 1];
  const tail = addMinutes(last.ts, 1);
  out.push({
    equipmentCode: equip.code,
    equipmentName: equip.name,
    start: curStart,
    end: tail,
    durationMin: Math.max(1, differenceInMinutes(tail, curStart)),
    state: curState,
    causeCategory: null,
    causeDetail: "",
  });

  return out;
}

export function computeKPIs(
  events: ClassifiedEvent[],
  opts: { unitsPerMin?: number } = {},
): KPIs {
  const unitsPerMin = opts.unitsPerMin ?? UNITS_PER_MIN_DEFAULT;
  const totalMin = events.reduce((a, b) => a + b.durationMin, 0);
  const stops = events.filter((e) => e.state !== "run");
  const downMin = stops.reduce((a, b) => a + b.durationMin, 0);
  const utilPct = totalMin === 0 ? 0 : ((totalMin - downMin) / totalMin) * 100;
  return {
    totalMin,
    downMin,
    utilPct,
    estLossEA: Math.round(downMin * unitsPerMin),
    stopEvents: stops.length,
  };
}

/**
 * 원인 대분류별 손실 시간을 집계하고 파레토 누적비율을 계산.
 */
export function aggregateCauses(
  events: ClassifiedEvent[],
  categories: readonly { code: CauseCategoryCode }[],
): {
  code: CauseCategoryCode;
  totalMin: number;
  cumulativePct: number;
}[] {
  const agg = new Map<CauseCategoryCode, number>();
  for (const c of categories) agg.set(c.code, 0);
  for (const e of events) {
    if (e.causeCategory) {
      agg.set(e.causeCategory, (agg.get(e.causeCategory) ?? 0) + e.durationMin);
    }
  }
  const rows = Array.from(agg.entries())
    .map(([code, totalMin]) => ({ code, totalMin }))
    .sort((a, b) => b.totalMin - a.totalMin);
  const sum = rows.reduce((a, b) => a + b.totalMin, 0) || 1;
  let cum = 0;
  return rows.map((r) => {
    cum += r.totalMin;
    return { ...r, cumulativePct: (cum / sum) * 100 };
  });
}

function addMinutes(d: Date, minutes: number) {
  return new Date(d.getTime() + minutes * 60_000);
}
