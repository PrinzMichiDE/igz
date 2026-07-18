import { submitIndexNow } from "@/lib/seo/indexnow";
import { absoluteUrl, localizedPath } from "@/lib/seo/site";
import type { Locale } from "@prisma/client";

export async function pingProductUrls(input: {
  productSlug: string;
  categorySlug: string;
  locales: Locale[];
}) {
  const urls = input.locales.flatMap((locale) => [
    absoluteUrl(localizedPath(locale, `/produkt/${input.productSlug}`)),
    absoluteUrl(localizedPath(locale, `/kategorie/${input.categorySlug}`)),
    absoluteUrl(localizedPath(locale, "/kategorien")),
    absoluteUrl(localizedPath(locale, "/bestenlisten")),
  ]);

  try {
    return await submitIndexNow(urls);
  } catch (error) {
    return {
      ok: false as const,
      skipped: false as const,
      submitted: 0,
      error: error instanceof Error ? error.message : "IndexNow ping failed",
    };
  }
}
