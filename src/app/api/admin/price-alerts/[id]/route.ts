import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/admin/audit-log";
import { maskEmail } from "@/lib/admin/mask-email";
import { requireAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/db/prisma";
import { isAdminPriceAlertStatus } from "@/lib/price-alerts/admin-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["active", "unsubscribed"]),
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

  if (!isAdminPriceAlertStatus(parsed.data.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await prisma.priceAlert.findUnique({
    where: { id },
    select: { id: true, status: true, email: true, productId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.priceAlert.update({
    where: { id },
    data: { status: parsed.data.status },
    select: {
      id: true,
      status: true,
      locale: true,
      targetPrice: true,
      currency: true,
      createdAt: true,
      product: {
        select: { title: true, slug: true, asin: true },
      },
    },
  });

  await logAdminAction({
    action: "price_alert.status_update",
    entityType: "price_alert",
    entityId: id,
    actorEmail: session.user.email ?? "admin",
    details: {
      previousStatus: existing.status,
      newStatus: parsed.data.status,
      productId: existing.productId,
    },
  });

  return NextResponse.json({
    alert: {
      id: updated.id,
      status: updated.status,
      locale: updated.locale,
      targetPrice: Number(updated.targetPrice),
      currency: updated.currency,
      createdAt: updated.createdAt.toISOString(),
      emailMasked: maskEmail(existing.email),
      product: updated.product,
    },
  });
}
