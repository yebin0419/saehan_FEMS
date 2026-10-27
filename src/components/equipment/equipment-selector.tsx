"use client";

import { useRouter } from "next/navigation";

export function EquipmentSelector({
  current,
  items,
}: {
  current: string;
  items: { code: string; name: string }[];
}) {
  const router = useRouter();
  return (
    <select
      value={current}
      onChange={(e) => {
        const next = e.target.value;
        if (next) router.push(`/equipment/${encodeURIComponent(next)}`);
      }}
      className="border border-slate-200 rounded-md px-3 py-1.5 text-sm bg-white"
    >
      {items.map((e) => (
        <option key={e.code} value={e.code}>
          {e.name}
        </option>
      ))}
    </select>
  );
}
