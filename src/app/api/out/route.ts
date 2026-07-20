import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isAllowedAmazonRedirectTarget } from "@/lib/security/safe-amazon-redirect";
import type { Locale } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isLocale(value: string | null): value is Locale {
  return value === "de" || value === "en";
}

export async function GET(req: NextRequest) {
  const asin = req.nextUrl.searchParams.get("asin");
  const localeParam = req.nextUrl.searchParams.get("locale");
  const target = req.nextUrl.searchParams.get("to");
  const path = req.nextUrl.searchParams.get("path");

  if (!asin || !target) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  if (!isAllowedAmazonRedirectTarget(target, asin)) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  if (isLocale(localeParam)) {
    await prisma.affiliateClick
      .create({
        data: {
          asin,
          locale: localeParam,
          path,
          referrer: req.headers.get("referer"),
        },
      })
      .catch(() => null);
  }

  return NextResponse.redirect(target, { status: 302 });
}
