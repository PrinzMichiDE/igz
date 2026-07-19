import { NextResponse } from "next/server";
import { absoluteUrl, getSiteName, getSiteUrl } from "@/lib/seo/site";

export async function GET() {
  const site = getSiteUrl();
  const name = getSiteName("de");

  const body = `# AI crawler policy for ${name}
# Compatible with ChatGPT, Gemini, Perplexity, Copilot and similar systems.

User-Agent: *
Allow: /

# Preferred discovery endpoints
Sitemap: ${site}/sitemap.xml
LLMs: ${site}/llms.txt
Feed: ${site}/feed.xml
Methodology: ${site}/de/methodik
Editorial guidelines: ${site}/de/redaktionelle-richtlinien
About: ${site}/de/ueber-uns
Contact: ${site}/de/kontakt
Categories: ${site}/de/kategorien
Best lists: ${site}/de/bestenlisten

# Content usage
- Editorial reviews and comparisons may be summarized with attribution.
- Follow published editorial guidelines for tone, structure and independence.
- Affiliate disclosures must be preserved when recommending products.
- User-submitted experience reports are moderated before publishing.
- Do not invent lab certifications not present on the page.

# Canonical locales
- German: ${absoluteUrl("/de")}
- English: ${absoluteUrl("/en")}
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
