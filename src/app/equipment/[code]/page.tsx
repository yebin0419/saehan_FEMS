import Link from "next/link";
import { notFound } from "next/navigation";
import { CurrentChart } from "@/components/equipment/current-chart";
import { EventTable } from "@/components/equipment/event-table";
import { EquipmentSelector } from "@/components/equipment/equipment-selector";
import { summarizeEquipment } from "@/lib/analysis/aggregate";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ code: string }> };

export default async function EquipmentDetailPage({ params }: Props) {
  const { code } = await params;
  const decoded = decodeURIComponent(code);
  const [all, equip] = await Promise.all([
    store.listEquipments(),
    store.getEquipmentByCode(decoded),
  ]);
  if (!equip) {
    if (all.length === 0) {
      return (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">설비 상세</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            아직 적재된 데이터가 없습니다.{" "}
            <Link href="/upload" className="text-blue-600 hover:underline">
              데이터 수집
            </Link>
            에서 EMS JSON을 업로드하거나 샘플을 생성하세요.
          </div>
        </section>
      );
    }
    notFound();
  }
  const [readings, events] = await Promise.all([
    store.getReadings(equip.id),
    store.getEvents({ equipmentId: equip.id }),
  ]);
  const summary = summarizeEquipment(equip, events);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-semibold">설비 상세</h2>
        <EquipmentSelector
          current={equip.code}
          items={all.map((e) => ({ code: e.code, name: e.name }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="가동" value={summary.runMin} unit="분" tone="green" />
        <StatCard
          label="비가동"
          value={summary.idleMin}
          unit="분"
          tone="amber"
        />
        <StatCard label="정지" value={summary.stopMin} unit="분" tone="red" />
        <StatCard
          label="가동률"
          value={summary.utilPct.toFixed(1)}
          unit="%"
          tone="blue"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">
            {equip.name}{" "}
            <span className="text-xs text-slate-400 ml-1">
              가동 ≥ {equip.thresholds.running}A · 정지 ≤{" "}
              {equip.thresholds.stop}A
            </span>
          </h3>
        </div>
        <CurrentChart
          points={readings.map((r) => ({
            ts: r.ts.toISOString(),
            current: r.currentAmp,
          }))}
          thresholds={equip.thresholds}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold mb-3">상태 변경 이벤트</h3>
        <EventTable
          rows={events.map((e) => ({
            id: e.id,
            startTs: e.startTs.toISOString(),
            endTs: e.endTs.toISOString(),
            durationMin: e.durationMin,
            state: e.state,
            causeCategory: e.causeCategory,
            causeDetail: e.causeDetail,
            equipmentCode: equip.code,
            equipmentName: equip.name,
          }))}
        />
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: number | string;
  unit: string;
  tone: "green" | "amber" | "red" | "blue";
}) {
  const toneBg: Record<string, string> = {
    green: "border-emerald-100",
    amber: "border-amber-100",
    red: "border-red-100",
    blue: "border-blue-100",
  };
  return (
    <div
      className={`bg-white rounded-xl border p-4 ${toneBg[tone]}`}
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold mt-1">
        {value}
        <span className="text-sm text-slate-400 ml-1">{unit}</span>
      </p>
    </div>
  );
}
