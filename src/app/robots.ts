import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  const aiAgents = [
    "GPTBot",
    "ChatGPT-User",
    "OAI-SearchBot",
    "PerplexityBot",
    "Google-Extended",
    "Googlebot",
    "Googlebot-Image",
    "ClaudeBot",
    "anthropic-ai",
    "Bingbot",
    "DuckDuckBot",
    "Applebot",
    "Applebot-Extended",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
      ...aiAgents.map((userAgent) => ({
        userAgent,
        allow: "/",
      })),
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
