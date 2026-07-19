import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSiteUrl } from "@/lib/seo/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim();
  const site = getSiteUrl();

  if (!token) {
    return NextResponse.redirect(`${site}/de`);
  }

  const alert = await prisma.priceAlert
    .findUnique({ where: { unsubscribeToken: token } })
    .catch(() => null);

  if (alert && alert.status !== "unsubscribed") {
    await prisma.priceAlert.update({
      where: { id: alert.id },
      data: { status: "unsubscribed" },
    });
  }

  const locale = alert?.locale || "de";
  return NextResponse.redirect(
    `${site}/${locale}/produkt/${alert ? "unsubscribed" : ""}`.replace(
      /\/produkt\/unsubscribed$/,
      `/?priceAlert=unsubscribed`,
    ),
  );
}
