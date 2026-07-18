/** Public cover fallback under /public/categories/{slug}.svg */
export function categoryCoverPath(slug: string): string {
  return `/categories/${slug}.svg`;
}

export function categoryDefaultCoverPath(): string {
  return "/categories/default.svg";
}

/**
 * Resolve the best public image URL for a category card.
 * Preference: binary API → explicit imageUrl → local SVG cover → default.
 */
export function resolveCategoryImageSrc(category: {
  id?: string | null;
  slug?: string | null;
  imageUrl?: string | null;
  imageMimeType?: string | null;
}): string {
  if (category.imageMimeType && category.id) {
    return `/api/category-image/${category.id}`;
  }
  if (category.imageUrl) return category.imageUrl;
  if (category.slug) return categoryCoverPath(category.slug);
  return categoryDefaultCoverPath();
}
