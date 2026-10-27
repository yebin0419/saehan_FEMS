import type { CauseCategoryCode } from "@/lib/db/schema";

export type CauseCategoryDef = {
  code: CauseCategoryCode;
  name: string;
  color: string;
};

export const CAUSE_CATEGORIES: readonly CauseCategoryDef[] = [
  { code: "BREAKDOWN", name: "고장", color: "#E5484D" },
  { code: "MOLD", name: "금형교체", color: "#F76B15" },
  { code: "MATERIAL", name: "자재대기", color: "#FFC53D" },
  { code: "PLANNED", name: "계획정지", color: "#8D8D8D" },
  { code: "QUALITY", name: "품질불량", color: "#8E4EC6" },
] as const;

export const CATEGORY_MAP: Record<CauseCategoryCode, CauseCategoryDef> =
  Object.fromEntries(CAUSE_CATEGORIES.map((c) => [c.code, c])) as Record<
    CauseCategoryCode,
    CauseCategoryDef
  >;

export const STATE_LABEL = {
  run: "가동",
  idle: "비가동",
  stop: "정지",
} as const;

export const STATE_COLOR = {
  run: "#22c55e",
  idle: "#f59e0b",
  stop: "#ef4444",
} as const;

export const UNITS_PER_MIN_DEFAULT = 12;
