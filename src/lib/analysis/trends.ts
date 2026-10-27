import {
  endOfDay,
  format,
  startOfDay,
  startOfHour,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { StoredEquipment, StoredEvent } from "@/lib/store/types";

export type TrendBucket = "hour" | "day" | "week" | "month";

export type TrendSeries = {
  equipmentCode: string;
  equipmentName: string;
  points: { label: string; utilPct: number; totalMin: number }[];
};

export type TrendData = {
  bucket: TrendBucket;
  labels: string[];
  series: TrendSeries[];
};

export function buildTrends(
  equipments: StoredEquipment[],
  events: StoredEvent[],
  bucket: TrendBucket,
): TrendData {
  if (events.length === 0) {
    return { bucket, labels: [], series: [] };
  }

  // 가장 흔한 케이스: 하루치 데이터만 있을 때는 자동으로 hour 집계로 폴백.
  const span = eventSpanMs(events);
  const effective: TrendBucket =
    bucket === "day" && span < 36 * 3600 * 1000
      ? "hour"
      : bucket === "week" && span < 10 * 24 * 3600 * 1000
        ? "day"
        : bucket;

  const buckets = new Set<string>();
  const perEquip = new Map<
    number,
    Map<string, { runMin: number; totalMin: number }>
  >();

  for (const ev of events) {
    const slices = sliceByBucket(ev.startTs, ev.endTs, effective);
    const perMap = perEquip.get(ev.equipmentId) ?? new Map();
    perEquip.set(ev.equipmentId, perMap);
    for (const slice of slices) {
      buckets.add(slice.key);
      const cur = perMap.get(slice.key) ?? { runMin: 0, totalMin: 0 };
      cur.totalMin += slice.minutes;
      if (ev.state === "run") cur.runMin += slice.minutes;
      perMap.set(slice.key, cur);
    }
  }

  const labels = Array.from(buckets).sort();
  const series: TrendSeries[] = equipments.map((eq) => {
    const perMap = perEquip.get(eq.id);
    const points = labels.map((label) => {
      const cur = perMap?.get(label);
      const utilPct =
        !cur || cur.totalMin === 0 ? 0 : (cur.runMin / cur.totalMin) * 100;
      return { label, utilPct, totalMin: cur?.totalMin ?? 0 };
    });
    return { equipmentCode: eq.code, equipmentName: eq.name, points };
  });

  return { bucket: effective, labels, series };
}

function eventSpanMs(events: StoredEvent[]): number {
  let min = Infinity;
  let max = -Infinity;
  for (const e of events) {
    const s = e.startTs.getTime();
    const t = e.endTs.getTime();
    if (s < min) min = s;
    if (t > max) max = t;
  }
  return max - min;
}

function sliceByBucket(
  start: Date,
  end: Date,
  bucket: TrendBucket,
): { key: string; minutes: number }[] {
  const result: { key: string; minutes: number }[] = [];
  let cursor = new Date(start);
  while (cursor < end) {
    const bStart = bucketStart(cursor, bucket);
    const bEnd = bucketEnd(bStart, bucket);
    const sliceEnd = end < bEnd ? end : bEnd;
    const minutes = Math.max(
      0,
      Math.round((sliceEnd.getTime() - cursor.getTime()) / 60_000),
    );
    if (minutes > 0) {
      result.push({ key: bucketKey(bStart, bucket), minutes });
    }
    cursor = bEnd;
  }
  return result;
}

function bucketStart(d: Date, bucket: TrendBucket) {
  if (bucket === "hour") return startOfHour(d);
  if (bucket === "day") return startOfDay(d);
  if (bucket === "week") return startOfWeek(d, { weekStartsOn: 1 });
  return startOfMonth(d);
}

function bucketEnd(start: Date, bucket: TrendBucket) {
  if (bucket === "hour") return new Date(start.getTime() + 3600 * 1000);
  if (bucket === "day") return new Date(endOfDay(start).getTime() + 1);
  if (bucket === "week") return new Date(start.getTime() + 7 * 86400 * 1000);
  // month
  const m = new Date(start);
  m.setMonth(m.getMonth() + 1);
  return m;
}

function bucketKey(start: Date, bucket: TrendBucket) {
  if (bucket === "hour") return format(start, "MM/dd HH:00");
  if (bucket === "day") return format(start, "MM/dd");
  if (bucket === "week") return format(start, "yyyy-'W'II");
  return format(start, "yyyy-MM");
}
