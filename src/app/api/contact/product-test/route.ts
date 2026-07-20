import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getClientIp, hashClientIp } from "@/lib/security/client-ip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  locale: z.enum(["de", "en"]),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  productTitle: z.string().trim().min(3).max(200),
  amazonUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  asin: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal(""))
    .transform((value) => value?.toUpperCase() || ""),
  categoryHint: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().min(40).max(3000),
  canShipSample: z.boolean().optional().default(false),
  privacyAccepted: z.literal(true),
  website: z.string().max(0).optional().or(z.literal("")),
});

function extractAsin(input: {
  asin?: string;
  amazonUrl?: string;
}): string | null {
  const direct = input.asin?.trim().toUpperCase();
  if (direct && /^[A-Z0-9]{10}$/.test(direct)) return direct;

  const url = input.amazonUrl?.trim() || "";
  if (!url) return null;
  const match =
    url.match(/\/(?:dp|gp\/product|product)\/([A-Z0-9]{10})/i) ||
    url.match(/[?&]asin=([A-Z0-9]{10})/i);
  return match?.[1]?.toUpperCase() || null;
}

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

  // Honeypot
  if (data.website) {
    return NextResponse.json({ ok: true, pending: true });
  }

  const asin = extractAsin({
    asin: data.asin,
    amazonUrl: data.amazonUrl,
  });

  if (!asin && !data.amazonUrl) {
    return NextResponse.json(
      {
        error:
          data.locale === "en"
            ? "Please provide an Amazon URL or ASIN."
            : "Bitte Amazon-URL oder ASIN angeben.",
      },
      { status: 400 },
    );
  }

  const ipHash = hashClientIp(getClientIp(req));
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [recentFromIp, recentFromEmail] = await Promise.all([
    prisma.productTestRequest.count({
      where: { ipHash, createdAt: { gte: dayAgo } },
    }),
    prisma.productTestRequest.count({
      where: { email: data.email, createdAt: { gte: dayAgo } },
    }),
  ]);

  if (recentFromIp >= 5 || recentFromEmail >= 3) {
    return NextResponse.json(
      {
        error:
          data.locale === "en"
            ? "Too many submissions. Please try again later."
            : "Zu viele Einsendungen. Bitte später erneut versuchen.",
      },
      { status: 429 },
    );
  }

  const duplicate = await prisma.productTestRequest.findFirst({
    where: {
      email: data.email,
      OR: [
        ...(asin ? [{ asin }] : []),
        { productTitle: data.productTitle },
        ...(data.amazonUrl ? [{ amazonUrl: data.amazonUrl }] : []),
      ],
      createdAt: { gte: dayAgo },
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json({ ok: true, pending: true });
  }

  const created = await prisma.productTestRequest.create({
    data: {
      locale: data.locale,
      name: data.name,
      email: data.email,
      company: data.company || null,
      productTitle: data.productTitle,
      amazonUrl: data.amazonUrl || null,
      asin,
      categoryHint: data.categoryHint || null,
      message: data.message,
      canShipSample: Boolean(data.canShipSample),
      privacyAccepted: true,
      status: "pending",
      ipHash,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, pending: true, id: created.id });
}
