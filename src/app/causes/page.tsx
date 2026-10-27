import { ParetoChart } from "@/components/causes/pareto-chart";
import { EventTable } from "@/components/equipment/event-table";
import { CAUSE_CATEGORIES, CATEGORY_MAP } from "@/lib/causes";
import { paretoRows } from "@/lib/analysis/aggregate";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CausesPage() {
  const events = await store.getEvents();
  const rows = paretoRows(events);
  const unclassified = events
    .filter((e) => e.state !== "run" && !e.causeCategory)
    .sort((a, b) => b.durationMin - a.durationMin)
    .slice(0, 20);
  const details = events.filter((e) => e.causeDetail);

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">원인 분석 (파레토)</h2>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">대분류별 손실 시간 · 누적 비율</h3>
          <ul className="flex flex-wrap gap-2 text-xs">
            {CAUSE_CATEGORIES.map((c) => (
              <li
                key={c.code}
                className="rounded px-2 py-0.5 text-white"
                style={{ background: c.color }}
              >
                {c.name}
              </li>
            ))}
          </ul>
        </div>
        <ParetoChart rows={rows} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold mb-3">
          원인 미분류 상위 이벤트{" "}
          <span className="text-xs text-slate-400">
            (지속시간 긴 순 상위 20건)
          </span>
        </h3>
        <EventTable
          variant="cause"
          rows={unclassified.map((e) => ({
            id: e.id,
            startTs: e.startTs.toISOString(),
            endTs: e.endTs.toISOString(),
            durationMin: e.durationMin,
            state: e.state,
            causeCategory: e.causeCategory,
            causeDetail: e.causeDetail,
            equipmentCode: e.equipmentCode,
            equipmentName: e.equipmentName,
          }))}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold mb-3">세부원인 로그</h3>
        {details.length === 0 ? (
          <p className="text-sm text-slate-400">입력된 세부원인이 없습니다.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {details.map((e) => {
              const cat = e.causeCategory
                ? CATEGORY_MAP[e.causeCategory]
                : null;
              return (
                <li key={e.id}>
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1 align-middle"
                    style={{ background: cat?.color ?? "#999" }}
                  />
                  <b>{e.equipmentName}</b>{" "}
                  <span className="text-slate-500">
                    [{cat?.name ?? "미분류"}]
                  </span>{" "}
                  {e.causeDetail}{" "}
                  <span className="text-slate-400">({e.durationMin}분)</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
