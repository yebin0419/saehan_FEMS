import type { KPIs } from "@/lib/analysis/classify";

export function KpiCards({ kpis }: { kpis: KPIs | null }) {
  const cards: {
    label: string;
    value: string;
    unit: string;
    note?: string;
  }[] = kpis
    ? [
        {
          label: "총 비가동 시간",
          value: kpis.downMin.toFixed(0),
          unit: "분",
          note: `전체 ${kpis.totalMin}분 중`,
        },
        {
          label: "평균 가동률",
          value: kpis.utilPct.toFixed(1),
          unit: "%",
          note: "전체 설비 기준",
        },
        {
          label: "추정 손실 수량",
          value: String(kpis.estLossEA),
          unit: "EA",
          note: "가정: 1분당 12EA",
        },
        {
          label: "정지 이벤트",
          value: String(kpis.stopEvents),
          unit: "건",
          note: "임계값 기반 탐지",
        },
      ]
    : [
        { label: "총 비가동 시간", value: "—", unit: "분", note: "데이터 없음" },
        { label: "평균 가동률", value: "—", unit: "%", note: "데이터 없음" },
        { label: "추정 손실 수량", value: "—", unit: "EA", note: "데이터 없음" },
        { label: "정지 이벤트", value: "—", unit: "건", note: "데이터 없음" },
      ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-white rounded-xl border border-slate-200 p-4"
        >
          <p className="text-xs text-slate-500">{c.label}</p>
          <p className="text-2xl font-bold mt-1">
            {c.value}
            <span className="text-sm text-slate-400 ml-1">{c.unit}</span>
          </p>
          {c.note && (
            <p className="text-xs mt-1 text-slate-400">{c.note}</p>
          )}
        </div>
      ))}
    </div>
  );
}
