import Link from "next/link";
import type { EquipmentSummary } from "@/lib/analysis/aggregate";

export function EquipmentStatusList({
  items,
}: {
  items: EquipmentSummary[];
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-10">
        데이터를 업로드하거나 &apos;샘플 데이터&apos; 버튼을 눌러주세요.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((eq) => {
        const total = Math.max(1, eq.totalMin);
        const runW = (eq.runMin / total) * 100;
        const idleW = (eq.idleMin / total) * 100;
        const stopW = (eq.stopMin / total) * 100;
        return (
          <details key={eq.code} className="border border-slate-200 rounded-lg">
            <summary className="p-3 flex items-center gap-3 hover:bg-slate-50 cursor-pointer">
              <div className="w-32 shrink-0">
                <Link
                  href={`/equipment/${encodeURIComponent(eq.code)}`}
                  className="font-medium text-sm hover:text-blue-600"
                >
                  {eq.name}
                </Link>
                <p className="text-xs text-slate-500">
                  가동률 {eq.utilPct.toFixed(1)}%
                </p>
              </div>
              <div className="flex-1 h-5 rounded overflow-hidden bg-slate-100 flex">
                <div
                  className="h-full"
                  style={{ width: `${runW}%`, background: "#22c55e" }}
                  title={`가동 ${eq.runMin}분`}
                />
                <div
                  className="h-full"
                  style={{ width: `${idleW}%`, background: "#f59e0b" }}
                  title={`비가동 ${eq.idleMin}분`}
                />
                <div
                  className="h-full"
                  style={{ width: `${stopW}%`, background: "#ef4444" }}
                  title={`정지 ${eq.stopMin}분`}
                />
              </div>
              <div className="text-xs text-slate-500 w-32 text-right">
                정지 {eq.stopMin}분 / 비가동 {eq.idleMin}분
              </div>
            </summary>
            <div className="px-4 pb-3 pt-1 text-xs text-slate-600">
              이벤트 {eq.eventCount}건 · 임계값: 가동 ≥ {eq.thresholds.running}A,
              정지 ≤ {eq.thresholds.stop}A
            </div>
          </details>
        );
      })}
    </div>
  );
}
