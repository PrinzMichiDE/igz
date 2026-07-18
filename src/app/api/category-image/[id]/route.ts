import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  categoryCoverPath,
  categoryDefaultCoverPath,
} from "@/lib/category-image-src";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const category = await prisma.category.findUnique({
    where: { id },
    select: {
      slug: true,
      imageData: true,
      imageMimeType: true,
      imageUrl: true,
      updatedAt: true,
      imageFetchedAt: true,
    },
  });

  if (!category) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (category.imageData && category.imageData.length > 0) {
    const body = Buffer.from(category.imageData);
    const etag = `"${category.imageFetchedAt?.getTime() || category.updatedAt.getTime()}-${body.length}"`;

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": category.imageMimeType || "image/jpeg",
        "Content-Length": String(body.length),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        ETag: etag,
      },
    });
  }

  if (category.imageUrl) {
    return NextResponse.redirect(category.imageUrl, 302);
  }

  const cover = category.slug
    ? categoryCoverPath(category.slug)
    : categoryDefaultCoverPath();
  return NextResponse.redirect(cover, 302);
}
