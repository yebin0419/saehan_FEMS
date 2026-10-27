import { aggregateCauses, computeKPIs } from "./classify";
import { CAUSE_CATEGORIES, UNITS_PER_MIN_DEFAULT } from "@/lib/causes";
import type { StoredEquipment, StoredEvent } from "@/lib/store/types";

export type EquipmentSummary = {
  code: string;
  name: string;
  totalMin: number;
  runMin: number;
  idleMin: number;
  stopMin: number;
  utilPct: number;
  thresholds: { running: number; stop: number };
  eventCount: number;
};

export function summarizeEquipment(
  equip: StoredEquipment,
  events: StoredEvent[],
): EquipmentSummary {
  const mine = events.filter((e) => e.equipmentId === equip.id);
  const runMin = mine
    .filter((e) => e.state === "run")
    .reduce((a, b) => a + b.durationMin, 0);
  const idleMin = mine
    .filter((e) => e.state === "idle")
    .reduce((a, b) => a + b.durationMin, 0);
  const stopMin = mine
    .filter((e) => e.state === "stop")
    .reduce((a, b) => a + b.durationMin, 0);
  const totalMin = runMin + idleMin + stopMin;
  const utilPct = totalMin === 0 ? 0 : (runMin / totalMin) * 100;
  return {
    code: equip.code,
    name: equip.name,
    thresholds: equip.thresholds,
    totalMin,
    runMin,
    idleMin,
    stopMin,
    utilPct,
    eventCount: mine.length,
  };
}

export function dashboardKPIs(events: StoredEvent[]) {
  const kpis = computeKPIs(
    events.map((e) => ({
      equipmentCode: e.equipmentCode,
      equipmentName: e.equipmentName,
      start: e.startTs,
      end: e.endTs,
      durationMin: e.durationMin,
      state: e.state,
      causeCategory: e.causeCategory,
      causeDetail: e.causeDetail,
    })),
    { unitsPerMin: UNITS_PER_MIN_DEFAULT },
  );
  return kpis;
}

export function paretoRows(events: StoredEvent[]) {
  const classified = events.map((e) => ({
    equipmentCode: e.equipmentCode,
    equipmentName: e.equipmentName,
    start: e.startTs,
    end: e.endTs,
    durationMin: e.durationMin,
    state: e.state,
    causeCategory: e.causeCategory,
    causeDetail: e.causeDetail,
  }));
  return aggregateCauses(classified, CAUSE_CATEGORIES).map((r) => {
    const meta = CAUSE_CATEGORIES.find((c) => c.code === r.code);
    return {
      ...r,
      name: meta?.name ?? r.code,
      color: meta?.color ?? "#999",
    };
  });
}
