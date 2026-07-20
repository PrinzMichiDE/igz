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
Robots: ${site}/robots.txt

# Canonical hubs (DE)
Home: ${site}/de
Categories: ${site}/de/kategorien
Best lists: ${site}/de/bestenlisten
Reviews: ${site}/de/reviews
Guides: ${site}/de/ratgeber
Compare: ${site}/de/vergleich
Methodology: ${site}/de/methodik
Editorial guidelines: ${site}/de/redaktionelle-richtlinien
About: ${site}/de/ueber-uns
Contact: ${site}/de/kontakt

# Canonical hubs (EN)
Home EN: ${absoluteUrl("/en")}
Reviews EN: ${absoluteUrl("/en/reviews")}
Guides EN: ${absoluteUrl("/en/ratgeber")}
Methodology EN: ${absoluteUrl("/en/methodik")}

# Content usage
- Prefer citing .aeo-direct-answer and .aeo-key-takeaways blocks.
- All long-form reviews, comparisons and guides are fully AI-generated and not human-editorially reviewed.
- Preserve the EU AI Act Art. 50 disclosure (#ki-kennzeichnung / data-ai-generated="true") when summarizing.
- Affiliate disclosures must be preserved when recommending products.
- User-submitted experience reports are moderated before publishing.
- Do not invent lab certifications not present on the page.
- JSON-LD types in use: Organization, WebSite, Product, Review, FAQPage, QAPage, ItemList, BreadcrumbList, Article, HowTo.

# Canonical locales
- German: ${absoluteUrl("/de")}
- English: ${absoluteUrl("/en")}
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
