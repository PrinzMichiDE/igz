import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_req: NextRequest, { params }: Props) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      asin: true,
      _count: { select: { articles: true, experienceComments: true } },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Cascades articles, comments, price snapshots; comparison winners become null.
  await prisma.product.delete({ where: { id } });

  return NextResponse.json({
    ok: true,
    deleted: existing,
  });
}
