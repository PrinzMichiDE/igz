import { NextRequest, NextResponse } from "next/server";
import type { ExperienceCommentStatus } from "@prisma/client";
import { requireAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, { params }: Props) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as { status?: ExperienceCommentStatus };

  if (
    body.status !== "published" &&
    body.status !== "pending" &&
    body.status !== "rejected"
  ) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const comment = await prisma.productExperienceComment.update({
    where: { id },
    data: { status: body.status },
  });

  return NextResponse.json({ ok: true, comment });
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.productExperienceComment.findUnique({
    where: { id },
    select: { id: true, authorName: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.productExperienceComment.delete({ where: { id } });

  return NextResponse.json({ ok: true, deleted: existing });
}
