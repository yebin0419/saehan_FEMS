import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { buildDeterministicSample } from "@/lib/analysis/sample";

export async function POST(req: Request) {
  let minutes = 240;
  try {
    const body = await req.json().catch(() => ({}));
    if (
      body &&
      typeof body === "object" &&
      "minutes" in body &&
      typeof body.minutes === "number"
    ) {
      minutes = Math.max(60, Math.min(1440, body.minutes));
    }
  } catch {
    // 바디 없음 — 기본값 사용
  }
  void req;

  const samples = buildDeterministicSample({ minutes });
  await store.reset();
  const inputs = samples.map((s) => ({
    code: s.code,
    name: s.name,
    thresholds: s.thresholds,
    readings: s.readings,
  }));
  const summary = await store.ingest(inputs);
  return NextResponse.json({ ok: true, minutes, ...summary });
}
