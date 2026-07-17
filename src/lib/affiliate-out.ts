type BuildOutUrlOptions = {
  targetUrl: string;
  asin?: string | null;
  locale: string;
  path?: string;
};

export function buildAffiliateOutUrl({
  targetUrl,
  asin,
  locale,
  path,
}: BuildOutUrlOptions) {
  if (!asin || !targetUrl || targetUrl === "#") {
    return targetUrl;
  }

  const params = new URLSearchParams({
    asin,
    locale,
    to: targetUrl,
  });

  if (path) {
    params.set("path", path);
  }

  return `/api/out?${params.toString()}`;
}
