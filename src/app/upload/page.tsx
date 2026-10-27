import { UploadForm } from "@/components/upload/upload-form";

export default function UploadPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">데이터 수집</h2>
      <p className="text-sm text-slate-500">
        EMS 1분 단위 전류 JSON을 업로드하거나 샘플 데이터를 생성하세요. 업로드
        결과는 즉시 대시보드/상세/원인/추세 뷰에 반영됩니다.
      </p>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <UploadForm />
      </div>
    </section>
  );
}
