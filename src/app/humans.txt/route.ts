import { NextResponse } from "next/server";
import { getSiteName, getSiteUrl } from "@/lib/seo/site";

export async function GET() {
  const body = `/* TEAM */
Site: ${getSiteName("de")}
URL: ${getSiteUrl()}
Editorial: Independent product comparison desk (AI-assisted)
Contact: contact@example.com

/* THANKS */
Amazon Product Data via RapidAPI
Language models via OpenRouter

/* SITE */
Standards: HTML5, JSON-LD, llms.txt, IndexNow
Locales: de, en
Doctype: HTML5
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
