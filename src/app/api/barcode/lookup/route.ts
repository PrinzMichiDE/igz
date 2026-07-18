import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { lookupBarcode } from "@/lib/barcode/lookup";
import { formatDatabaseError } from "@/lib/db/with-db-retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const schema = z.object({
  code: z.string().trim().min(8).max(32),
  locale: z.enum(["de", "en"]).default("de"),
  country: z.enum(["DE", "US"]).default("DE"),
});

export async function GET(req: NextRequest) {
  const parsed = schema.safeParse({
    code: req.nextUrl.searchParams.get("code") || "",
    locale: req.nextUrl.searchParams.get("locale") || "de",
    country: req.nextUrl.searchParams.get("country") || "DE",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid barcode", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await lookupBarcode({
      code: parsed.data.code,
      locale: parsed.data.locale,
      country: parsed.data.country,
      allowLiveLookup: true,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: formatDatabaseError(error) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid barcode", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await lookupBarcode({
      code: parsed.data.code,
      locale: parsed.data.locale,
      country: parsed.data.country,
      allowLiveLookup: true,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: formatDatabaseError(error) },
      { status: 500 },
    );
  }
}
