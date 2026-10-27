import {
  CATEGORY_MAP,
  STATE_COLOR,
  STATE_LABEL,
} from "@/lib/causes";
import type { CauseCategoryCode, StateCode } from "@/lib/db/schema";

export function StateBadge({ state }: { state: StateCode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span
        className="inline-block w-2.5 h-2.5 rounded-full"
        style={{ background: STATE_COLOR[state] }}
      />
      {STATE_LABEL[state]}
    </span>
  );
}

export function CauseBadge({
  code,
}: {
  code: CauseCategoryCode | null | undefined;
}) {
  if (!code) {
    return <span className="text-slate-400 text-xs">미분류</span>;
  }
  const def = CATEGORY_MAP[code];
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs text-white"
      style={{ background: def.color }}
    >
      {def.name}
    </span>
  );
}
