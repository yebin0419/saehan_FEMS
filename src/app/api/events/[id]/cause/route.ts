import { NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/store";
import { CAUSE_CATEGORY_CODES } from "@/lib/db/schema";

const bodySchema = z.object({
  causeCategory: z.enum(CAUSE_CATEGORY_CODES).nullable(),
  causeDetail: z.string().max(500).default(""),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const idNum = Number(id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  let raw: unknown;
  try {
    raw = await req.json();
  } catch (e) {
    return NextResponse.json(
      { error: "invalid JSON body", detail: (e as Error).message },
      { status: 400 },
    );
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "schema validation failed", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const updated = await store.updateEventCause(idNum, parsed.data);
  if (!updated) {
    return NextResponse.json({ error: "event not found" }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    event: {
      id: updated.id,
      causeCategory: updated.causeCategory,
      causeDetail: updated.causeDetail,
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
}
