import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin/audit-log";
import { requireAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/db/prisma";
import type { ArticleStatus } from "@prisma/client";

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
  const body = (await req.json()) as { status?: ArticleStatus };

  if (
    body.status !== "published" &&
    body.status !== "draft" &&
    body.status !== "needs_review"
  ) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await prisma.article.findUnique({
    where: { id },
    select: { id: true, title: true, type: true, status: true, slug: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const article = await prisma.article.update({
    where: { id },
    data: {
      status: body.status,
      publishedAt: body.status === "published" ? new Date() : null,
    },
  });

  await logAdminAction({
    action: "article.status_update",
    entityType: "article",
    entityId: id,
    actorEmail: session.user.email ?? "admin",
    details: {
      previousStatus: existing.status,
      newStatus: body.status,
      title: existing.title,
      type: existing.type,
      slug: existing.slug,
    },
  });

  return NextResponse.json({ ok: true, article });
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.article.findUnique({
    where: { id },
    select: { id: true, title: true, type: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.article.delete({ where: { id } });

  await logAdminAction({
    action: "article.delete",
    entityType: "article",
    entityId: id,
    actorEmail: session.user.email ?? "admin",
    details: {
      title: existing.title,
      type: existing.type,
    },
  });

  return NextResponse.json({
    ok: true,
    deleted: existing,
  });
}
