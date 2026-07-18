const MAX_IMAGE_BYTES = 2_000_000;
const FETCH_TIMEOUT_MS = 15_000;

export type DownloadedProductImage = {
  data: Uint8Array;
  mimeType: string;
};

function normalizeMimeType(contentType: string | null, url: string): string {
  const raw = (contentType || "").split(";")[0]?.trim().toLowerCase();
  if (raw?.startsWith("image/")) return raw;

  const lower = url.toLowerCase();
  if (lower.includes(".png")) return "image/png";
  if (lower.includes(".webp")) return "image/webp";
  if (lower.includes(".gif")) return "image/gif";
  return "image/jpeg";
}

/**
 * Prefer a larger Amazon media variant when the CDN URL embeds a size token.
 * Falls back to the original URL when no known pattern matches.
 */
export function upgradeAmazonImageUrl(imageUrl: string): string {
  try {
    const url = new URL(imageUrl);
    const host = url.hostname.toLowerCase();
    if (
      !host.includes("media-amazon.com") &&
      !host.includes("ssl-images-amazon.com") &&
      !host.includes("images-amazon.com") &&
      !host.includes("m.media-amazon.com")
    ) {
      return imageUrl;
    }

    // Common patterns: ._AC_UL320_.jpg, ._SX300_.jpg, ._SY500_.jpg
    const upgradedPath = url.pathname
      .replace(/\._AC_[A-Z0-9_,]+_\./i, "._AC_SL1000_.")
      .replace(/\._SX\d+_\./i, "._SL1000_.")
      .replace(/\._SY\d+_\./i, "._SL1000_.")
      .replace(/\._UX\d+_\./i, "._SL1000_.")
      .replace(/\._UY\d+_\./i, "._SL1000_.")
      .replace(/\._UL\d+_\./i, "._SL1000_.");

    url.pathname = upgradedPath;
    return url.toString();
  } catch {
    return imageUrl;
  }
}

export async function downloadProductImage(
  imageUrl: string,
): Promise<DownloadedProductImage | null> {
  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
    return null;
  }

  const candidates = Array.from(
    new Set([upgradeAmazonImageUrl(imageUrl), imageUrl]),
  );

  for (const candidate of candidates) {
    const downloaded = await fetchImageBytes(candidate);
    if (downloaded) return downloaded;
  }

  return null;
}

async function fetchImageBytes(
  imageUrl: string,
): Promise<DownloadedProductImage | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (compatible; IGZBot/1.0; +https://igz.vercel.app)",
        Referer: "https://www.amazon.de/",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!response.ok) return null;

    const mimeType = normalizeMimeType(
      response.headers.get("content-type"),
      imageUrl,
    );
    if (!mimeType.startsWith("image/")) return null;

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > MAX_IMAGE_BYTES) return null;

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0 || arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
      return null;
    }

    return {
      data: new Uint8Array(arrayBuffer),
      mimeType,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function productImageApiPath(productId: string) {
  return `/api/product-image/${productId}`;
}

export function resolveProductImageSrc(product: {
  id?: string | null;
  productId?: string | null;
  imageUrl?: string | null;
  imageMimeType?: string | null;
}) {
  if (!product.imageUrl && !product.imageMimeType) return null;
  const id = product.id || product.productId;
  if (id) return productImageApiPath(id);
  return product.imageUrl || null;
}

export function pickBestProductImageUrl(input: {
  primary?: string | null;
  gallery?: Array<string | null | undefined> | null;
  fallback?: string | null;
}) {
  const gallery = (input.gallery || []).filter(
    (url): url is string => Boolean(url && url.startsWith("http")),
  );
  if (input.primary?.startsWith("http")) return input.primary;
  if (gallery[0]) return gallery[0];
  if (input.fallback?.startsWith("http")) return input.fallback;
  return null;
}
