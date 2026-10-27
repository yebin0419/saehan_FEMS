import { Suspense } from "react";
import { TrendChart } from "@/components/trends/trend-chart";
import { BucketTabs } from "@/components/trends/bucket-tabs";
import { buildTrends, type TrendBucket } from "@/lib/analysis/trends";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;
type Props = { searchParams: Promise<SearchParams> };

export default async function TrendsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.bucket) ? sp.bucket[0] : sp.bucket;
  const bucket: TrendBucket =
    raw === "week" || raw === "month" || raw === "hour" ? raw : "day";

  const [equipments, events] = await Promise.all([
    store.listEquipments(),
    store.getEvents(),
  ]);
  const data = buildTrends(equipments, events, bucket);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-semibold">추세 뷰</h2>
        <Suspense>
          <BucketTabs current={bucket} />
        </Suspense>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">
            설비별 가동률 추세{" "}
            <span className="text-xs text-slate-400 ml-1">
              (bucket: {data.bucket}
              {data.bucket !== bucket && ` ← 데이터 부족으로 자동 조정`})
            </span>
          </h3>
        </div>
        <TrendChart data={data} />
      </div>
    </section>
  );
}
