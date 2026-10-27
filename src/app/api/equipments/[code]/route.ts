import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { summarizeEquipment } from "@/lib/analysis/aggregate";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  const { code } = await ctx.params;
  const equip = await store.getEquipmentByCode(code);
  if (!equip) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const [readings, events] = await Promise.all([
    store.getReadings(equip.id),
    store.getEvents({ equipmentId: equip.id }),
  ]);
  const summary = summarizeEquipment(equip, events);
  return NextResponse.json({
    equipment: {
      code: equip.code,
      name: equip.name,
      thresholds: equip.thresholds,
    },
    summary,
    readings: readings.map((r) => ({
      ts: r.ts.toISOString(),
      current: r.currentAmp,
    })),
    events: events.map((e) => ({
      id: e.id,
      startTs: e.startTs.toISOString(),
      endTs: e.endTs.toISOString(),
      durationMin: e.durationMin,
      state: e.state,
      causeCategory: e.causeCategory,
      causeDetail: e.causeDetail,
    })),
  });
}
