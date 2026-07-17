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

export async function downloadProductImage(
  imageUrl: string,
): Promise<DownloadedProductImage | null> {
  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        Accept: "image/*",
        "User-Agent": "igz-affiliate-platform/1.0",
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
