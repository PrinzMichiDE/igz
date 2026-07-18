import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  locale: z.enum(["de", "en"]),
  authorName: z.string().trim().min(2).max(80),
  authorContext: z.string().trim().max(120).optional().or(z.literal("")),
  authorEmail: z
    .string()
    .trim()
    .email()
    .max(160)
    .optional()
    .or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(140).optional().or(z.literal("")),
  body: z.string().trim().min(40).max(2500),
  usageWeeks: z.coerce.number().int().min(1).max(104).optional().nullable(),
  website: z.string().max(0).optional().or(z.literal("")),
});

type Props = {
  params: Promise<{ slug: string }>;
};

function clientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.headers.get("x-real-ip") || "unknown";
}

function hashIp(ip: string) {
  return createHash("sha256").update(ip).digest("hex").slice(0, 64);
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function POST(req: NextRequest, { params }: Props) {
  const { slug } = await params;

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

  // Honeypot: bots fill hidden "website" field
  if (data.website) {
    return NextResponse.json({ ok: true, pending: true });
  }

  if (wordCount(data.body) < 12) {
    return NextResponse.json(
      { error: "Experience report is too short" },
      { status: 400 },
    );
  }

  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const ipHash = hashIp(clientIp(req));
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentFromIp = await prisma.productExperienceComment.count({
    where: {
      ipHash,
      source: "user_submitted",
      createdAt: { gte: hourAgo },
    },
  });

  if (recentFromIp >= 5) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 },
    );
  }

  const recentDuplicate = await prisma.productExperienceComment.findFirst({
    where: {
      productId: product.id,
      locale: data.locale,
      source: "user_submitted",
      authorName: data.authorName,
      body: data.body,
      createdAt: { gte: hourAgo },
    },
    select: { id: true },
  });

  if (recentDuplicate) {
    return NextResponse.json({ ok: true, pending: true });
  }

  await prisma.productExperienceComment.create({
    data: {
      productId: product.id,
      locale: data.locale,
      authorName: data.authorName,
      authorContext: data.authorContext || null,
      authorEmail: data.authorEmail || null,
      rating: data.rating,
      title: data.title || null,
      body: data.body,
      usageWeeks: data.usageWeeks ?? null,
      source: "user_submitted",
      status: "pending",
      verifiedStyle: false,
      ipHash,
    },
  });

  return NextResponse.json({ ok: true, pending: true });
}
