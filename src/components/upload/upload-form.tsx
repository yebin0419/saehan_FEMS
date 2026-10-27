"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/toast";

export function UploadForm() {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"idle" | "ems" | "sample">("idle");

  async function postJson(url: string, body?: unknown) {
    const res = await fetch(url, {
      method: "POST",
      headers: body ? { "content-type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      throw new Error(
        (data.error as string) ??
          `${res.status} ${res.statusText}`,
      );
    }
    return data;
  }

  async function handleEmsUpload(file: File) {
    setBusy("ems");
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/ingest/ems", {
        method: "POST",
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        equipmentsUpserted?: number;
        eventsStored?: number;
      };
      if (!res.ok) throw new Error(data.error ?? `${res.status}`);
      toast.push(
        `EMS 적재: 설비 ${data.equipmentsUpserted}대, 이벤트 ${data.eventsStored}건`,
        "success",
      );
      startTransition(() => router.refresh());
    } catch (e) {
      toast.push((e as Error).message, "error");
    } finally {
      setBusy("idle");
    }
  }

  async function handleSample() {
    setBusy("sample");
    try {
      const data = (await postJson("/api/sample")) as {
        equipmentsUpserted?: number;
        eventsStored?: number;
      };
      toast.push(
        `샘플 적재: 설비 ${data.equipmentsUpserted}대, 이벤트 ${data.eventsStored}건`,
        "success",
      );
      startTransition(() => router.refresh());
    } catch (e) {
      toast.push((e as Error).message, "error");
    } finally {
      setBusy("idle");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <label
          className={`px-3 py-1.5 text-sm text-white rounded-md cursor-pointer ${
            busy === "ems" ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {busy === "ems" ? "업로드 중..." : "EMS JSON 업로드"}
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            disabled={busy !== "idle"}
            onChange={(e) => {
              const f = e.currentTarget.files?.[0];
              if (f) handleEmsUpload(f);
              e.currentTarget.value = "";
            }}
          />
        </label>
        <button
          type="button"
          onClick={handleSample}
          disabled={busy !== "idle" || pending}
          className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 disabled:opacity-60"
        >
          {busy === "sample" ? "생성 중..." : "샘플 데이터 생성"}
        </button>
      </div>
      <pre className="text-xs bg-slate-100 border border-slate-200 rounded p-3 overflow-x-auto">
{`{
  "baseTs": "2026-01-01T08:00:00+09:00",
  "equipments": [
    {
      "code": "PET-1",
      "name": "PET-1호기",
      "thresholds": { "running": 10, "stop": 2 },
      "readings": [[0, 11.2], [1, 10.8], ...]
    }
  ]
}`}
      </pre>
      <p className="text-xs text-slate-500">
        readings는 <code>[분, 전류A]</code> 튜플 또는{" "}
        <code>{"{ ts, current }"}</code> / <code>{"{ t, c }"}</code> 객체도
        허용합니다. 분 인덱스로 보낼 경우 baseTs 기준으로 Date로 환산됩니다.
      </p>
    </div>
  );
}
