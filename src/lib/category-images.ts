import { existsSync } from "node:fs";
import path from "node:path";
import {
  categoryCoverPath,
  categoryDefaultCoverPath,
} from "@/lib/category-image-src";
import { prisma } from "@/lib/db/prisma";

export {
  categoryCoverPath,
  categoryDefaultCoverPath,
  resolveCategoryImageSrc,
} from "@/lib/category-image-src";

function coverForSlug(slug: string): string {
  const localPath = path.join(process.cwd(), "public", "categories", `${slug}.svg`);
  return existsSync(localPath)
    ? categoryCoverPath(slug)
    : categoryDefaultCoverPath();
}

/**
 * Ensure every category has an imageUrl.
 * Preference:
 * 1) Best product image from that category (local API or remote URL)
 * 2) Generated SVG cover /categories/{slug}.svg (or default)
 */
export async function ensureCategoryImages(): Promise<{
  updated: number;
  total: number;
}> {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      slug: true,
      imageUrl: true,
      products: {
        where: {
          OR: [{ imageData: { not: null } }, { imageUrl: { not: null } }],
        },
        orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
        take: 1,
        select: {
          id: true,
          imageData: true,
          imageUrl: true,
        },
      },
    },
  });

  let updated = 0;

  for (const category of categories) {
    const fallback = coverForSlug(category.slug);
    const topProduct = category.products[0];
    const nextUrl = topProduct?.imageData
      ? `/api/product-image/${topProduct.id}`
      : topProduct?.imageUrl || fallback;

    if (category.imageUrl === nextUrl) continue;

    await prisma.category.update({
      where: { id: category.id },
      data: {
        imageUrl: nextUrl,
        imageFetchedAt: new Date(),
      },
    });
    updated += 1;
  }

  return { updated, total: categories.length };
}
