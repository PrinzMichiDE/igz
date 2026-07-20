import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { numericPrice } from "@/lib/product-links";
import { getClientIp, hashClientIp } from "@/lib/security/client-ip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  productId: z.string().min(1),
  locale: z.enum(["de", "en"]),
  email: z.string().trim().email().max(160),
  targetPrice: z.number().positive().max(100000),
  currency: z.string().trim().min(3).max(3).default("EUR"),
  privacyAccepted: z.literal(true),
  website: z.string().max(0).optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  if (data.website) {
    return NextResponse.json({ ok: true });
  }

  const product = await prisma.product.findUnique({
    where: { id: data.productId },
    select: { id: true, price: true, currency: true, title: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const current = numericPrice(product.price);
  if (current != null && data.targetPrice >= current) {
    return NextResponse.json(
      {
        error:
          data.locale === "en"
            ? "Wish price must be below the current price."
            : "Wunschpreis muss unter dem aktuellen Preis liegen.",
      },
      { status: 400 },
    );
  }

  const ipHash = hashClientIp(getClientIp(req));
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await prisma.priceAlert.count({
    where: {
      OR: [
        { ipHash, createdAt: { gte: dayAgo } },
        { email: data.email.toLowerCase(), createdAt: { gte: dayAgo } },
      ],
    },
  });
  if (recent >= 8) {
    return NextResponse.json(
      {
        error:
          data.locale === "en"
            ? "Too many alerts today. Please try again tomorrow."
            : "Zu viele Alarme heute. Bitte morgen erneut versuchen.",
      },
      { status: 429 },
    );
  }

  const email = data.email.toLowerCase();
  const existing = await prisma.priceAlert.findFirst({
    where: {
      email,
      productId: product.id,
      status: "active",
    },
  });

  if (existing) {
    await prisma.priceAlert.update({
      where: { id: existing.id },
      data: {
        targetPrice: data.targetPrice,
        currency: data.currency || product.currency || "EUR",
        locale: data.locale,
        privacyAccepted: true,
      },
    });
    return NextResponse.json({ ok: true, updated: true });
  }

  await prisma.priceAlert.create({
    data: {
      email,
      locale: data.locale,
      targetPrice: data.targetPrice,
      currency: data.currency || product.currency || "EUR",
      status: "active",
      privacyAccepted: true,
      ipHash,
      unsubscribeToken: randomBytes(24).toString("hex"),
      productId: product.id,
    },
  });

  return NextResponse.json({ ok: true, created: true });
}
