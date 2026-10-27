"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { CAUSE_CATEGORIES, STATE_LABEL } from "@/lib/causes";
import type { CauseCategoryCode, StateCode } from "@/lib/db/schema";
import { useToast } from "@/components/ui/toast";

export type EventRow = {
  id: number;
  startTs: string;
  endTs: string;
  durationMin: number;
  state: StateCode;
  causeCategory: CauseCategoryCode | null;
  causeDetail: string;
  equipmentCode?: string;
  equipmentName?: string;
};

export function CauseModal({
  row,
  onClose,
  onSave,
}: {
  row: EventRow | null;
  onClose: () => void;
  onSave: (
    id: number,
    patch: { causeCategory: CauseCategoryCode | null; causeDetail: string },
  ) => Promise<void>;
}) {
  const toast = useToast();
  const [cat, setCat] = useState<CauseCategoryCode | "">("");
  const [detail, setDetail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (row) {
      setCat(row.causeCategory ?? "");
      setDetail(row.causeDetail ?? "");
    }
  }, [row]);

  async function handleSave() {
    if (!row) return;
    if (!cat) {
      toast.push("대분류를 선택하세요.", "warn");
      return;
    }
    setSaving(true);
    try {
      await onSave(row.id, { causeCategory: cat, causeDetail: detail.trim() });
    } finally {
      setSaving(false);
    }
  }

  const label = row
    ? `${row.equipmentName ?? row.equipmentCode ?? ""} · ${STATE_LABEL[row.state]} · ${row.durationMin}분 (${format(
        new Date(row.startTs),
        "HH:mm",
      )}~${format(new Date(row.endTs), "HH:mm")})`
    : "";

  return (
    <Modal
      open={Boolean(row)}
      onClose={onClose}
      title="비가동 원인 입력"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm bg-slate-200 hover:bg-slate-300 rounded"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-60"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </>
      }
    >
      <div className="text-xs text-slate-500 mb-3">{label}</div>
      <label className="block text-xs font-medium mb-1">대분류</label>
      <select
        value={cat}
        onChange={(e) => setCat(e.target.value as CauseCategoryCode | "")}
        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm mb-3"
      >
        <option value="">-- 선택하세요 --</option>
        {CAUSE_CATEGORIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
      <label className="block text-xs font-medium mb-1">
        세부원인 (예: 실린더 3번 히터 단선)
      </label>
      <textarea
        rows={3}
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm resize-none"
        placeholder="세부 상황을 자유롭게 입력..."
      />
    </Modal>
  );
}
