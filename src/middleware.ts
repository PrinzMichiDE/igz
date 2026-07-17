import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const indexNowKey = process.env.INDEXNOW_KEY;
  if (indexNowKey && req.nextUrl.pathname === `/${indexNowKey}.txt`) {
    return new NextResponse(indexNowKey, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/",
    "/(de|en)/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)",
    "/:key.txt",
  ],
};
