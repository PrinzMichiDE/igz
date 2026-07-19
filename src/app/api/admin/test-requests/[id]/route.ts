import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["pending", "reviewed", "accepted", "declined"]).optional(),
  adminNote: z.string().trim().max(2000).optional(),
});

type Props = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, { params }: Props) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const updated = await prisma.productTestRequest.update({
    where: { id },
    data: {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(typeof parsed.data.adminNote === "string"
        ? { adminNote: parsed.data.adminNote || null }
        : {}),
    },
    select: {
      id: true,
      locale: true,
      status: true,
      name: true,
      email: true,
      company: true,
      productTitle: true,
      amazonUrl: true,
      asin: true,
      categoryHint: true,
      message: true,
      canShipSample: true,
      adminNote: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    request: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}
