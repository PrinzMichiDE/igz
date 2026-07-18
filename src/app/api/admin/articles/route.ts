import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/db/prisma";
import type { ArticleStatus, ArticleType, Locale } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type") as ArticleType | null;
  const status = req.nextUrl.searchParams.get("status") as ArticleStatus | null;
  const locale = req.nextUrl.searchParams.get("locale") as Locale | null;
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const take = Math.min(Number(req.nextUrl.searchParams.get("take") || 50), 200);

  const articles = await prisma.article.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(locale ? { locale } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
              { product: { title: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      locale: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      product: { select: { id: true, slug: true, title: true, asin: true } },
      category: { select: { id: true, slug: true, nameDe: true, nameEn: true } },
    },
  });

  return NextResponse.json({ articles });
}
