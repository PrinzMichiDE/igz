import { prisma } from "@/lib/db/prisma";
import { openRouterChatJson } from "@/lib/ai/openrouter";
import {
  buildReviewUserPromptDe,
  reviewSystemPromptDe,
} from "@/lib/ai/prompts/review.de";
import {
  buildReviewUserPromptEn,
  reviewSystemPromptEn,
} from "@/lib/ai/prompts/review.en";
import {
  buildComparisonUserPromptDe,
  comparisonSystemPromptDe,
} from "@/lib/ai/prompts/comparison.de";
import {
  buildComparisonUserPromptEn,
  comparisonSystemPromptEn,
} from "@/lib/ai/prompts/comparison.en";
import { slugify } from "@/lib/utils";
import type { Locale } from "@prisma/client";

type ReviewContent = {
  title: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  score: number;
  pros: string[];
  cons: string[];
  bestFor: string[];
  notFor: string[];
  verdict: string;
  sections: Array<{ heading: string; body: string }>;
  faq: Array<{ question: string; answer: string }>;
};

type ComparisonContent = {
  title: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  winnerAsin: string;
  priceWinnerAsin: string;
  budgetWinnerAsin: string;
  intro: string;
  rankingNotes: string[];
  faq: Array<{ question: string; answer: string }>;
};

function passesReviewQualityGate(content: ReviewContent) {
  return (
    content.title?.length > 10 &&
    content.verdict?.length > 40 &&
    Array.isArray(content.pros) &&
    content.pros.length >= 2 &&
    Array.isArray(content.cons) &&
    content.cons.length >= 1 &&
    typeof content.score === "number" &&
    content.score >= 0 &&
    content.score <= 10
  );
}

export async function generateProductReview(productId: string, locale: Locale) {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    include: { category: true },
  });

  const job = await prisma.jobRun.create({
    data: {
      type: "generate_review",
      status: "running",
      startedAt: new Date(),
      message: `Review ${locale} for ${product.asin}`,
    },
  });

  try {
    const features = Array.isArray(product.features)
      ? (product.features as string[])
      : [];

    const system =
      locale === "de" ? reviewSystemPromptDe : reviewSystemPromptEn;
    const user =
      locale === "de"
        ? buildReviewUserPromptDe({
            title: product.title,
            asin: product.asin,
            price: product.price?.toString(),
            rating: product.rating,
            reviewCount: product.reviewCount,
            features,
            categoryName: product.category.nameDe,
          })
        : buildReviewUserPromptEn({
            title: product.title,
            asin: product.asin,
            price: product.price?.toString(),
            rating: product.rating,
            reviewCount: product.reviewCount,
            features,
            categoryName: product.category.nameEn,
          });

    const content = await openRouterChatJson<ReviewContent>({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const ok = passesReviewQualityGate(content);
    const status = ok ? "published" : "needs_review";
    const slug = `${slugify(content.title) || product.slug}-${locale}`;

    const article = await prisma.article.upsert({
      where: {
        productId_type_locale: {
          productId: product.id,
          type: "review",
          locale,
        },
      },
      create: {
        type: "review",
        locale,
        status,
        title: content.title,
        slug,
        excerpt: content.excerpt,
        seoTitle: content.seoTitle,
        seoDescription: content.seoDescription,
        contentJson: content,
        bodyMarkdown: content.verdict,
        publishedAt: ok ? new Date() : null,
        productId: product.id,
      },
      update: {
        status,
        title: content.title,
        slug,
        excerpt: content.excerpt,
        seoTitle: content.seoTitle,
        seoDescription: content.seoDescription,
        contentJson: content,
        bodyMarkdown: content.verdict,
        publishedAt: ok ? new Date() : null,
      },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: { editorialScore: content.score },
    });

    await prisma.jobRun.update({
      where: { id: job.id },
      data: {
        status: "succeeded",
        finishedAt: new Date(),
        message: `Review ${status}`,
        metricsJson: { articleId: article.id, score: content.score },
      },
    });

    return article;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await prisma.jobRun.update({
      where: { id: job.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        error: message,
      },
    });
    throw error;
  }
}

export async function generateCategoryComparison(
  categoryId: string,
  locale: Locale,
) {
  const category = await prisma.category.findUniqueOrThrow({
    where: { id: categoryId },
    include: {
      products: {
        orderBy: [{ editorialScore: "desc" }, { rating: "desc" }],
        take: 8,
      },
    },
  });

  const job = await prisma.jobRun.create({
    data: {
      type: "generate_comparison",
      status: "running",
      startedAt: new Date(),
      message: `Comparison ${locale} for ${category.slug}`,
    },
  });

  try {
    const system =
      locale === "de" ? comparisonSystemPromptDe : comparisonSystemPromptEn;
    const user =
      locale === "de"
        ? buildComparisonUserPromptDe({
            categoryName: category.nameDe,
            products: category.products.map((p) => ({
              title: p.title,
              asin: p.asin,
              price: p.price?.toString(),
              rating: p.rating,
              score: p.editorialScore,
            })),
          })
        : buildComparisonUserPromptEn({
            categoryName: category.nameEn,
            products: category.products.map((p) => ({
              title: p.title,
              asin: p.asin,
              price: p.price?.toString(),
              rating: p.rating,
              score: p.editorialScore,
            })),
          });

    const content = await openRouterChatJson<ComparisonContent>({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const byAsin = new Map(category.products.map((p) => [p.asin, p]));
    const winner = byAsin.get(content.winnerAsin) || category.products[0];
    const priceWinner =
      byAsin.get(content.priceWinnerAsin) || category.products[0];
    const budgetWinner =
      byAsin.get(content.budgetWinnerAsin) ||
      [...category.products].sort(
        (a, b) => Number(a.price ?? 999999) - Number(b.price ?? 999999),
      )[0];

    await prisma.comparison.upsert({
      where: { categoryId: category.id },
      create: {
        categoryId: category.id,
        winnerProductId: winner?.id,
        priceWinnerId: priceWinner?.id,
        budgetWinnerId: budgetWinner?.id,
        criteriaJson: content,
      },
      update: {
        winnerProductId: winner?.id,
        priceWinnerId: priceWinner?.id,
        budgetWinnerId: budgetWinner?.id,
        criteriaJson: content,
      },
    });

    const slug = `${category.slug}-vergleich-${locale}`;
    const article = await prisma.article.upsert({
      where: {
        categoryId_type_locale: {
          categoryId: category.id,
          type: "comparison",
          locale,
        },
      },
      create: {
        type: "comparison",
        locale,
        status: "published",
        title: content.title,
        slug,
        excerpt: content.excerpt,
        seoTitle: content.seoTitle,
        seoDescription: content.seoDescription,
        contentJson: content,
        bodyMarkdown: content.intro,
        publishedAt: new Date(),
        categoryId: category.id,
      },
      update: {
        status: "published",
        title: content.title,
        slug,
        excerpt: content.excerpt,
        seoTitle: content.seoTitle,
        seoDescription: content.seoDescription,
        contentJson: content,
        bodyMarkdown: content.intro,
        publishedAt: new Date(),
      },
    });

    await prisma.jobRun.update({
      where: { id: job.id },
      data: {
        status: "succeeded",
        finishedAt: new Date(),
        message: "Comparison published",
        metricsJson: { articleId: article.id },
      },
    });

    return article;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await prisma.jobRun.update({
      where: { id: job.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        error: message,
      },
    });
    throw error;
  }
}
