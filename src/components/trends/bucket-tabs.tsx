"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { TrendBucket } from "@/lib/analysis/trends";

const OPTIONS: { value: TrendBucket; label: string }[] = [
  { value: "day", label: "일간" },
  { value: "week", label: "주간" },
  { value: "month", label: "월간" },
];

export function BucketTabs({ current }: { current: TrendBucket }) {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <div className="inline-flex rounded-md border border-slate-200 bg-white overflow-hidden text-sm">
      {OPTIONS.map((o) => {
        const active = o.value === current;
        return (
          <button
            key={o.value}
            onClick={() => {
              const next = new URLSearchParams(params);
              next.set("bucket", o.value);
              router.push(`/trends?${next.toString()}`);
            }}
            className={`px-3 py-1.5 ${
              active
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
