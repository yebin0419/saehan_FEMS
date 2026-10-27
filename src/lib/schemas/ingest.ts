import { z } from "zod";

const timestampSchema = z.union([z.string(), z.number(), z.date()]).transform(
  (v) => (v instanceof Date ? v : new Date(v)),
);

const readingSchema = z.union([
  z.object({
    ts: timestampSchema,
    current: z.number(),
  }),
  z.object({
    t: z.union([z.number(), z.string(), z.date()]),
    c: z.number(),
  }),
  z.tuple([z.union([z.number(), z.string(), z.date()]), z.number()]),
]);

export const ingestEquipmentSchema = z.object({
  code: z.string().min(1).max(32),
  name: z.string().min(1).max(128).optional(),
  thresholds: z.object({
    running: z.number().positive(),
    stop: z.number().min(0),
  }),
  readings: z.array(readingSchema).min(1),
});

export const ingestPayloadSchema = z.object({
  equipments: z.array(ingestEquipmentSchema).min(1),
  /** 선택: 기본 시작 시각(epoch 밀리초). readings가 분 인덱스일 때 사용. */
  baseTs: z.union([z.string(), z.number(), z.date()]).optional(),
});

export type IngestPayload = z.infer<typeof ingestPayloadSchema>;

/**
 * readings가 [t, c] 또는 {t, c} 형태(t는 숫자 분)인 경우 baseTs를 기준으로
 * Date로 승격. {ts, current}는 그대로 유지.
 */
export function normalizePayload(input: IngestPayload) {
  const base = input.baseTs
    ? input.baseTs instanceof Date
      ? input.baseTs
      : new Date(input.baseTs)
    : new Date();

  return input.equipments.map((eq) => {
    const readings = eq.readings.map((r) => {
      if (Array.isArray(r)) {
        const [rawT, c] = r;
        return { ts: coerceTs(rawT, base), current: c };
      }
      if ("ts" in r) {
        return { ts: r.ts, current: r.current };
      }
      return { ts: coerceTs(r.t, base), current: r.c };
    });
    return {
      code: eq.code,
      name: eq.name ?? eq.code,
      thresholds: eq.thresholds,
      readings,
    };
  });
}

function coerceTs(raw: number | string | Date, base: Date): Date {
  if (raw instanceof Date) return raw;
  if (typeof raw === "number") {
    if (raw < 100_000) {
      // 분 인덱스로 간주 (예: 0..479 for 8시간)
      return new Date(base.getTime() + raw * 60_000);
    }
    return new Date(raw);
  }
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) return parsed;
  const asNum = Number(raw);
  if (!isNaN(asNum)) return new Date(base.getTime() + asNum * 60_000);
  throw new Error(`Invalid timestamp: ${raw}`);
}
