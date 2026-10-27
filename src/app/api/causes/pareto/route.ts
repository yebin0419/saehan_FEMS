import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { paretoRows } from "@/lib/analysis/aggregate";

export const dynamic = "force-dynamic";

export async function GET() {
  const events = await store.getEvents();
  const rows = paretoRows(events);
  const details = events
    .filter((e) => e.causeDetail && e.causeDetail.length > 0)
    .map((e) => ({
      id: e.id,
      equipmentCode: e.equipmentCode,
      equipmentName: e.equipmentName,
      state: e.state,
      durationMin: e.durationMin,
      causeCategory: e.causeCategory,
      causeDetail: e.causeDetail,
    }));
  const unclassified = events
    .filter((e) => e.state !== "run" && !e.causeCategory)
    .sort((a, b) => b.durationMin - a.durationMin)
    .slice(0, 20)
    .map((e) => ({
      id: e.id,
      equipmentCode: e.equipmentCode,
      equipmentName: e.equipmentName,
      state: e.state,
      startTs: e.startTs.toISOString(),
      endTs: e.endTs.toISOString(),
      durationMin: e.durationMin,
    }));
  return NextResponse.json({ rows, details, unclassified });
}
