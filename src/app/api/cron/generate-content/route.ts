import { NextRequest, NextResponse } from "next/server";
import { resolveCronCategory } from "@/lib/cron";
import { prisma } from "@/lib/db/prisma";
import {
  generateCategoryComparison,
  generateBuyingGuide,
  generateProductExperienceComments,
  generateProductReview,
} from "@/lib/ai/generate";
import { enrichCategoryManuals } from "@/lib/product-manuals";
import type { Locale } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("category");
  const locales = (req.nextUrl.searchParams.get("locales") || "de,en")
    .split(",")
    .map((v) => v.trim())
    .filter((v): v is Locale => v === "de" || v === "en");
  const commentCount = Number(req.nextUrl.searchParams.get("comments") || 6);

  try {
    const category = await resolveCronCategory(slug);

    if (!category) {
      return NextResponse.json(
        { error: "No category found. Run seed first." },
        { status: 404 },
      );
    }

    const publishedBacklog = await prisma.article.updateMany({
      where: {
        status: "needs_review",
        type: "review",
        product: { categoryId: category.id },
      },
      data: {
        status: "published",
        publishedAt: new Date(),
      },
    });

    const products = await prisma.product.findMany({
      where: { categoryId: category.id },
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
      take: 5,
    });

    const reviews: Array<{ productId: string; locale: Locale; id: string }> =
      [];
    const comments: Array<{
      productId: string;
      locale: Locale;
      count: number;
    }> = [];

    for (const product of products) {
      for (const locale of locales) {
        const article = await generateProductReview(product.id, locale);
        reviews.push({
          productId: product.id,
          locale,
          id: article.id,
        });

        const savedComments = await generateProductExperienceComments(
          product.id,
          locale,
          commentCount,
        );
        comments.push({
          productId: product.id,
          locale,
          count: savedComments.length,
        });
      }
    }

    const comparisons = [];
    const buyingGuides = [];
    for (const locale of locales) {
      const article = await generateCategoryComparison(category.id, locale);
      comparisons.push({ locale, id: article.id });
      const guide = await generateBuyingGuide(category.id, locale);
      buyingGuides.push({ locale, id: guide.id });
    }

    const manualResults = await enrichCategoryManuals(category.id, locales[0] ?? "de");

    return NextResponse.json({
      ok: true,
      category: category.slug,
      reviewsPublishedFromBacklog: publishedBacklog.count,
      reviewsCreated: reviews.length,
      commentsCreated: comments.reduce((sum, c) => sum + c.count, 0),
      comparisonsCreated: comparisons.length,
      buyingGuidesCreated: buyingGuides.length,
      manualsEnriched: manualResults.length,
      reviews,
      comments,
      comparisons,
      buyingGuides,
      manuals: manualResults,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
