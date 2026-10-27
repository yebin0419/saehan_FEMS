"use client";

import { format } from "date-fns";
import { useState } from "react";
import { CauseBadge, StateBadge } from "@/components/ui/badges";
import { CauseModal, type EventRow } from "./cause-modal";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export function EventTable({
  rows,
  variant = "detail",
}: {
  rows: EventRow[];
  variant?: "detail" | "cause";
}) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<EventRow | null>(null);

  async function saveCause(
    id: number,
    patch: { causeCategory: EventRow["causeCategory"]; causeDetail: string },
  ) {
    const res = await fetch(`/api/events/${id}/cause`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.push((data?.error as string) ?? `저장 실패 (${res.status})`, "error");
      return;
    }
    toast.push("원인이 저장되었습니다", "success");
    setEditing(null);
    router.refresh();
  }

  return (
    <>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-xs text-slate-500">
            {variant === "cause" && <th className="px-3 py-2">설비</th>}
            <th className="px-3 py-2">시작</th>
            <th className="px-3 py-2">종료</th>
            <th className="px-3 py-2">지속(분)</th>
            <th className="px-3 py-2">상태</th>
            <th className="px-3 py-2">원인</th>
            <th className="px-3 py-2">세부</th>
            <th className="px-3 py-2 text-right">작업</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={variant === "cause" ? 8 : 7}
                className="text-center text-slate-400 py-6"
              >
                이벤트가 없습니다.
              </td>
            </tr>
          ) : (
            rows.map((e) => (
              <tr key={e.id} className="border-b border-slate-100">
                {variant === "cause" && (
                  <td className="px-3 py-2 whitespace-nowrap">
                    {e.equipmentName ?? e.equipmentCode}
                  </td>
                )}
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  {format(new Date(e.startTs), "MM/dd HH:mm")}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  {format(new Date(e.endTs), "MM/dd HH:mm")}
                </td>
                <td className="px-3 py-2">{e.durationMin}</td>
                <td className="px-3 py-2">
                  <StateBadge state={e.state} />
                </td>
                <td className="px-3 py-2">
                  <CauseBadge code={e.causeCategory} />
                </td>
                <td className="px-3 py-2 text-xs">
                  {e.causeDetail ? (
                    <span className="text-slate-700">{e.causeDetail}</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {e.state !== "run" ? (
                    <button
                      className="text-blue-600 hover:underline text-xs"
                      onClick={() => setEditing(e)}
                    >
                      원인 입력
                    </button>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <CauseModal
        row={editing}
        onClose={() => setEditing(null)}
        onSave={saveCause}
      />
    </>
  );
}
