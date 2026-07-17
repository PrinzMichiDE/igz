import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      imageData: true,
      imageMimeType: true,
      imageUrl: true,
      updatedAt: true,
      imageFetchedAt: true,
    },
  });

  if (!product) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (product.imageData && product.imageData.length > 0) {
    const body = Buffer.from(product.imageData);
    const etag = `"${product.imageFetchedAt?.getTime() || product.updatedAt.getTime()}-${body.length}"`;

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": product.imageMimeType || "image/jpeg",
        "Content-Length": String(body.length),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        ETag: etag,
      },
    });
  }

  if (product.imageUrl) {
    return NextResponse.redirect(product.imageUrl, 302);
  }

  return new NextResponse("Not found", { status: 404 });
}
