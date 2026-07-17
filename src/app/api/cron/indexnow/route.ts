import { NextRequest, NextResponse } from "next/server";
import { assertCronAuthorized } from "@/lib/cron";
import { prisma } from "@/lib/db/prisma";
import { submitIndexNow } from "@/lib/seo/indexnow";
import { BLUETOOTH_HEADPHONES_PAGES } from "@/lib/seo/niche/bluetooth-headphones";
import { absoluteUrl, localizedPath } from "@/lib/seo/site";
import { routing } from "@/i18n/routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!assertCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const urls: string[] = [];

    for (const locale of routing.locales) {
      urls.push(absoluteUrl(localizedPath(locale)));
      urls.push(absoluteUrl(localizedPath(locale, "/bestenlisten")));
      urls.push(absoluteUrl(localizedPath(locale, "/methodik")));
      urls.push(absoluteUrl(localizedPath(locale, "/ueber-uns")));
      for (const page of BLUETOOTH_HEADPHONES_PAGES) {
        urls.push(absoluteUrl(localizedPath(locale, page.path)));
      }
    }

    const [categories, products] = await Promise.all([
      prisma.category.findMany({ select: { slug: true } }),
      prisma.product.findMany({
        select: { slug: true },
        orderBy: { updatedAt: "desc" },
        take: 200,
      }),
    ]);

    for (const locale of routing.locales) {
      for (const category of categories) {
        urls.push(
          absoluteUrl(localizedPath(locale, `/kategorie/${category.slug}`)),
        );
      }
      for (const product of products) {
        urls.push(
          absoluteUrl(localizedPath(locale, `/produkt/${product.slug}`)),
        );
      }
    }

    const result = await submitIndexNow(urls);
    return NextResponse.json({ ...result, urlCount: urls.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
