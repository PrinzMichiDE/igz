const ALLOWED_HOSTS = new Set([
  "amazon.de",
  "www.amazon.de",
  "amazon.com",
  "www.amazon.com",
  "amzn.to",
  "a.co",
  "smile.amazon.de",
  "smile.amazon.com",
]);

/**
 * Returns true when `target` is an http(s) URL pointing at an Amazon
 * affiliate-safe host. Optional ASIN must appear in path or query when provided.
 */
export function isAllowedAmazonRedirectTarget(
  target: string,
  asin?: string | null,
): boolean {
  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return false;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }

  const host = parsed.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) {
    return false;
  }

  // Block credentials / userinfo in redirects.
  if (parsed.username || parsed.password) {
    return false;
  }

  if (asin) {
    const normalized = asin.trim().toUpperCase();
    if (!/^[A-Z0-9]{8,12}$/.test(normalized)) {
      return false;
    }
    const haystack = `${parsed.pathname}${parsed.search}`.toUpperCase();
    if (!haystack.includes(normalized)) {
      return false;
    }
  }

  return true;
}
