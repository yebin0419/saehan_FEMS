import { KpiCards } from "@/components/dashboard/kpi-cards";
import { EquipmentStatusList } from "@/components/dashboard/equipment-status-list";
import { dashboardKPIs, summarizeEquipment } from "@/lib/analysis/aggregate";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [equipments, events] = await Promise.all([
    store.listEquipments(),
    store.getEvents(),
  ]);
  const hasData = equipments.length > 0;
  const kpis = hasData ? dashboardKPIs(events) : null;
  const summaries = equipments.map((e) => summarizeEquipment(e, events));

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">대시보드</h2>
        {!hasData && (
          <a
            href="/upload"
            className="text-sm text-blue-600 hover:underline"
          >
            데이터 수집 →
          </a>
        )}
      </div>
      <KpiCards kpis={kpis} />
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">설비별 가동 상태</h3>
          <div className="text-xs text-slate-500 flex gap-3">
            <Legend color="#22c55e" label="가동" />
            <Legend color="#f59e0b" label="비가동" />
            <Legend color="#ef4444" label="정지" />
          </div>
        </div>
        <EquipmentStatusList items={summaries} />
      </div>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span
        className="inline-block w-3 h-3 rounded"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
