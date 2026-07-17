import { assertQuota, incrementQuota, QuotaExceededError } from "@/lib/amazon/quota";

const DEFAULT_HOST = "real-time-amazon-data.p.rapidapi.com";

type RapidApiResponse<T> = {
  status: "OK" | "ERROR";
  request_id?: string;
  data?: T;
  error?: { message?: string; code?: number };
};

export type AmazonSearchProduct = {
  asin?: string;
  product_title?: string;
  product_price?: string;
  product_original_price?: string;
  currency?: string;
  product_star_rating?: string;
  product_num_ratings?: number;
  product_url?: string;
  product_photo?: string;
  product_minimum_offer_price?: string;
  is_best_seller?: boolean;
  is_amazon_choice?: boolean;
  sales_volume?: string;
  delivery?: string;
  product_byline?: string;
};

export type AmazonSearchData = {
  total_products?: number;
  country?: string;
  domain?: string;
  products?: AmazonSearchProduct[];
};

export type AmazonProductDetails = {
  asin?: string;
  product_title?: string;
  product_price?: string;
  product_original_price?: string;
  currency?: string;
  product_star_rating?: string;
  product_num_ratings?: number;
  product_url?: string;
  product_photo?: string;
  product_photos?: string[];
  about_product?: string[];
  product_description?: string;
  product_information?: Record<string, string>;
  product_details?: Record<string, string>;
  category_path?: Array<{ id?: string; name?: string; link?: string }>;
};

async function rapidGet<T>(
  path: string,
  params: Record<string, string | number | undefined>,
): Promise<T> {
  const key = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_HOST || DEFAULT_HOST;

  if (!key) {
    throw new Error("RAPIDAPI_KEY is not configured");
  }

  await assertQuota(1);

  const url = new URL(`https://${host}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": host,
      "x-rapidapi-key": key,
    },
    cache: "no-store",
  });

  // Count against quota for successful transport-level calls.
  await incrementQuota(1);

  const json = (await res.json()) as RapidApiResponse<T>;

  if (!res.ok || json.status === "ERROR") {
    const message =
      json.error?.message || `RapidAPI request failed with HTTP ${res.status}`;
    if (res.status === 429) {
      throw new QuotaExceededError(message);
    }
    throw new Error(message);
  }

  if (json.data === undefined) {
    throw new Error("RapidAPI response missing data");
  }

  return json.data;
}

export async function listProductCategories(country: string) {
  return rapidGet<Array<{ id?: string; name?: string }>>(
    "/product-category-list",
    { country },
  );
}

export async function searchProducts(options: {
  query: string;
  country: string;
  page?: number;
  categoryId?: string;
}) {
  return rapidGet<AmazonSearchData>("/search", {
    query: options.query,
    country: options.country,
    page: options.page ?? 1,
    category_id: options.categoryId,
  });
}

export async function getProductDetails(options: {
  asin: string;
  country: string;
}) {
  return rapidGet<AmazonProductDetails>("/product-details", {
    asin: options.asin,
    country: options.country,
  });
}

export function parsePrice(value?: string | null): number | null {
  if (!value) return null;
  const cleaned = value
    .replace(/[^\d.,-]/g, "")
    .replace(/\.(?=.*\.)/g, "")
    .replace(",", ".");
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

export function parseRating(value?: string | null): number | null {
  if (!value) return null;
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? num : null;
}
