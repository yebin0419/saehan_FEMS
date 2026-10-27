import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { summarizeEquipment } from "@/lib/analysis/aggregate";

export const dynamic = "force-dynamic";

export async function GET() {
  const [equipments, events] = await Promise.all([
    store.listEquipments(),
    store.getEvents(),
  ]);
  const items = equipments.map((e) => summarizeEquipment(e, events));
  return NextResponse.json({ items });
}
