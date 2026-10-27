import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { ingestPayloadSchema, normalizePayload } from "@/lib/schemas/ingest";

export async function POST(req: Request) {
  let raw: unknown;
  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof Blob)) {
        return NextResponse.json({ error: "file field required" }, { status: 400 });
      }
      raw = JSON.parse(await file.text());
    } else {
      raw = await req.json();
    }
  } catch (e) {
    return NextResponse.json(
      { error: "invalid JSON body", detail: (e as Error).message },
      { status: 400 },
    );
  }

  const parsed = ingestPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "schema validation failed", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const normalized = normalizePayload(parsed.data);
  const summary = await store.ingest(normalized);

  return NextResponse.json({ ok: true, ...summary });
}
