import { getSiteUrl } from "@/lib/seo/site";

export function getIndexNowKey() {
  return process.env.INDEXNOW_KEY || "";
}

export async function submitIndexNow(urls: string[]) {
  const key = getIndexNowKey();
  const host = new URL(getSiteUrl()).host;
  const uniqueUrls = [...new Set(urls.filter(Boolean))];

  if (!key || uniqueUrls.length === 0) {
    return {
      ok: false as const,
      skipped: true as const,
      reason: !key ? "INDEXNOW_KEY missing" : "No URLs",
      submitted: 0,
    };
  }

  const endpoint = "https://api.indexnow.org/indexnow";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key,
      keyLocation: `${getSiteUrl()}/${key}.txt`,
      urlList: uniqueUrls.slice(0, 10000),
    }),
  });

  if (!res.ok && res.status !== 200 && res.status !== 202) {
    const text = await res.text();
    throw new Error(`IndexNow failed (${res.status}): ${text}`);
  }

  return {
    ok: true as const,
    skipped: false as const,
    submitted: uniqueUrls.length,
    status: res.status,
  };
}
