import type { AmazonProductDetails } from "@/lib/amazon/rapidapi";

export function extractProductGalleryUrls(
  imageUrl: string | null | undefined,
  rawDetailsJson: unknown,
): string[] {
  const details = rawDetailsJson as AmazonProductDetails | null;
  const urls = new Set<string>();

  if (imageUrl) urls.add(imageUrl);

  for (const photo of details?.product_photos ?? []) {
    if (typeof photo === "string" && photo.trim()) {
      urls.add(photo);
    }
  }

  if (details?.product_photo) {
    urls.add(details.product_photo);
  }

  return [...urls];
}
