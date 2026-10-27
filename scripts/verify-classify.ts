import {
  aggregateCauses,
  classifyReading,
  computeKPIs,
  detectEvents,
} from "@/lib/analysis/classify";
import { buildDeterministicSample } from "@/lib/analysis/sample";
import { CAUSE_CATEGORIES } from "@/lib/causes";

const samples = buildDeterministicSample({ minutes: 60 });

const allEvents = samples.flatMap((eq) => detectEvents(eq));

const kpis = computeKPIs(allEvents);

const t: Record<string, string | number> = {
  equipments: samples.length,
  readingsPerEquip: samples[0].readings.length,
  classifyExamples: [
    `12A @ 10/2 => ${classifyReading(12, { running: 10, stop: 2 })}`,
    `5A @ 10/2 => ${classifyReading(5, { running: 10, stop: 2 })}`,
    `0.5A @ 10/2 => ${classifyReading(0.5, { running: 10, stop: 2 })}`,
  ].join(" | "),
  totalEvents: allEvents.length,
  totalMin: kpis.totalMin,
  downMin: kpis.downMin,
  utilPct: kpis.utilPct.toFixed(1),
  estLossEA: kpis.estLossEA,
  stopEvents: kpis.stopEvents,
};

console.log("=== classify / KPI 자가검증 ===");
for (const [k, v] of Object.entries(t)) console.log(`${k.padEnd(18)} ${v}`);

allEvents.slice(0, 3).forEach((e, i) => {
  const marked = { ...e, causeCategory: i === 0 ? ("MOLD" as const) : null };
  if (marked.causeCategory) allEvents[i] = marked;
});
const pareto = aggregateCauses(allEvents, CAUSE_CATEGORIES);
console.log("=== pareto (1건 샘플 분류 반영) ===");
console.table(pareto);
