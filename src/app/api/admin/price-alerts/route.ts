import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { maskEmail } from "@/lib/admin/mask-email";
import { requireAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/db/prisma";
import { aggregatePriceAlertCounts } from "@/lib/price-alerts/admin-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  status: z
    .enum(["active", "triggered", "unsubscribed", "failed", "all"])
    .default("all"),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export async function GET(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { status, limit } = parsed.data;
  const where =
    status === "all"
      ? {}
      : { status: status as "active" | "triggered" | "unsubscribed" | "failed" };

  const [alerts, statusRows] = await Promise.all([
    prisma.priceAlert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        email: true,
        locale: true,
        targetPrice: true,
        currency: true,
        status: true,
        createdAt: true,
        triggeredAt: true,
        lastNotifiedAt: true,
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            asin: true,
            price: true,
            currency: true,
          },
        },
      },
    }),
    prisma.priceAlert.findMany({
      select: { status: true },
    }),
  ]);

  const counts = aggregatePriceAlertCounts(statusRows);

  return NextResponse.json({
    counts,
    alerts: alerts.map((row) => ({
      id: row.id,
      emailMasked: maskEmail(row.email),
      locale: row.locale,
      targetPrice: Number(row.targetPrice),
      currency: row.currency,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      triggeredAt: row.triggeredAt?.toISOString() ?? null,
      lastNotifiedAt: row.lastNotifiedAt?.toISOString() ?? null,
      product: {
        id: row.product.id,
        title: row.product.title,
        slug: row.product.slug,
        asin: row.product.asin,
        currentPrice:
          row.product.price != null ? Number(row.product.price) : null,
        currency: row.product.currency,
      },
    })),
  });
}
