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
import {
  buildCommentsUserPromptDe,
  commentsSystemPromptDe,
} from "@/lib/ai/prompts/comments.de";
import {
  buildCommentsUserPromptEn,
  commentsSystemPromptEn,
} from "@/lib/ai/prompts/comments.en";
import {
  buildBuyingGuideUserPromptDe,
  buyingGuideSystemPromptDe,
} from "@/lib/ai/prompts/buying-guide.de";
import {
  buildBuyingGuideUserPromptEn,
  buyingGuideSystemPromptEn,
} from "@/lib/ai/prompts/buying-guide.en";
import { slugify } from "@/lib/utils";
import type { Locale } from "@prisma/client";

type ReviewContent = {
  title: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  score: number;
  testingPeriod?: string;
  directAnswer?: string;
  keyTakeaways?: string[];
  scoreBreakdown?: {
    overall?: number;
    value?: number;
    quality?: number;
    usability?: number;
    longevity?: number;
  };
  decisionGuide?: {
    buyIf?: string[];
    skipIf?: string[];
  };
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
  directAnswer?: string;
  keyTakeaways?: string[];
  rankingNotes: string[];
  faq: Array<{ question: string; answer: string }>;
};

type BuyingGuideContent = {
  title: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  intro: string;
  keyCriteria: string[];
  budgetTiers: Array<{
    label: string;
    range: string;
    recommendation: string;
    asin: string;
  }>;
  mistakesToAvoid: string[];
  checklist: string[];
  sections: Array<{ heading: string; body: string }>;
  faq: Array<{ question: string; answer: string }>;
};

type ExperienceCommentsResponse = {
  comments: Array<{
    authorName: string;
    authorContext?: string;
    rating: number;
    title?: string;
    body: string;
    usageWeeks?: number;
  }>;
};

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function buildFullMarkdown(content: ReviewContent) {
  const parts = [
    `# ${content.title}`,
    "",
    content.verdict,
    "",
    ...(content.sections || []).flatMap((section) => [
      `## ${section.heading}`,
      "",
      section.body,
      "",
    ]),
  ];
  return parts.join("\n");
}

function passesReviewQualityGate(content: ReviewContent) {
  const sections = content.sections || [];
  const longSections = sections.filter((s) => wordCount(s.body || "") >= 80);
  const takeaways = content.keyTakeaways || [];

  return (
    content.title?.length > 10 &&
    wordCount(content.verdict || "") >= 60 &&
    wordCount(content.directAnswer || "") >= 20 &&
    takeaways.length >= 3 &&
    Array.isArray(content.pros) &&
    content.pros.length >= 4 &&
    Array.isArray(content.cons) &&
    content.cons.length >= 2 &&
    sections.length >= 5 &&
    longSections.length >= 4 &&
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
      message: `Detailed review ${locale} for ${product.asin}`,
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
      temperature: 0.55,
    });

    const qualityGatePassed = passesReviewQualityGate(content);
    const status = "published";
    const publishedAt = new Date();
    const slug = `${slugify(content.title) || product.slug}-${locale}`;
    const bodyMarkdown = buildFullMarkdown(content);

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
        bodyMarkdown,
        publishedAt,
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
        bodyMarkdown,
        publishedAt,
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
        message: `Review published (qualityGate: ${qualityGatePassed})`,
        metricsJson: {
          articleId: article.id,
          score: content.score,
          sections: content.sections?.length ?? 0,
          words: wordCount(bodyMarkdown),
          qualityGatePassed,
        },
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

export async function generateProductExperienceComments(
  productId: string,
  locale: Locale,
  count = 6,
) {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    include: { category: true },
  });

  const job = await prisma.jobRun.create({
    data: {
      type: "generate_comments",
      status: "running",
      startedAt: new Date(),
      message: `Experience comments ${locale} for ${product.asin}`,
    },
  });

  try {
    const features = Array.isArray(product.features)
      ? (product.features as string[])
      : [];

    const system =
      locale === "de" ? commentsSystemPromptDe : commentsSystemPromptEn;
    const user =
      locale === "de"
        ? buildCommentsUserPromptDe({
            title: product.title,
            asin: product.asin,
            price: product.price?.toString(),
            rating: product.rating,
            features,
            categoryName: product.category.nameDe,
            count,
          })
        : buildCommentsUserPromptEn({
            title: product.title,
            asin: product.asin,
            price: product.price?.toString(),
            rating: product.rating,
            features,
            categoryName: product.category.nameEn,
            count,
          });

    const payload = await openRouterChatJson<ExperienceCommentsResponse>({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.75,
    });

    const comments = (payload.comments || [])
      .filter((c) => c.authorName && c.body && wordCount(c.body) >= 40)
      .map((c) => ({
        authorName: c.authorName.slice(0, 80),
        authorContext: c.authorContext?.slice(0, 120),
        rating: Math.min(5, Math.max(1, Math.round(c.rating || 4))),
        title: c.title?.slice(0, 140),
        body: c.body.trim(),
        usageWeeks:
          typeof c.usageWeeks === "number"
            ? Math.min(104, Math.max(1, Math.round(c.usageWeeks)))
            : null,
      }));

    if (comments.length < 3) {
      throw new Error("OpenRouter returned too few usable experience comments");
    }

    await prisma.$transaction([
      prisma.productExperienceComment.deleteMany({
        where: {
          productId: product.id,
          locale,
          source: "openrouter_synth",
        },
      }),
      prisma.productExperienceComment.createMany({
        data: comments.map((c) => ({
          productId: product.id,
          locale,
          authorName: c.authorName,
          authorContext: c.authorContext,
          rating: c.rating,
          title: c.title,
          body: c.body,
          usageWeeks: c.usageWeeks ?? undefined,
          source: "openrouter_synth",
          status: "published",
          verifiedStyle: true,
        })),
      }),
    ]);

    const saved = await prisma.productExperienceComment.findMany({
      where: {
        productId: product.id,
        locale,
        source: "openrouter_synth",
        status: "published",
      },
      orderBy: { createdAt: "desc" },
    });

    await prisma.jobRun.update({
      where: { id: job.id },
      data: {
        status: "succeeded",
        finishedAt: new Date(),
        message: `Stored ${saved.length} experience comments`,
        metricsJson: { count: saved.length, locale },
      },
    });

    return saved;
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

export async function generateBuyingGuide(categoryId: string, locale: Locale) {
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
      type: "generate_buying_guide",
      status: "running",
      startedAt: new Date(),
      message: `Buying guide ${locale} for ${category.slug}`,
    },
  });

  try {
    const system =
      locale === "de" ? buyingGuideSystemPromptDe : buyingGuideSystemPromptEn;
    const user =
      locale === "de"
        ? buildBuyingGuideUserPromptDe({
            categoryName: category.nameDe,
            products: category.products.map((p) => ({
              title: p.title,
              asin: p.asin,
              price: p.price?.toString(),
              rating: p.rating,
              score: p.editorialScore,
            })),
          })
        : buildBuyingGuideUserPromptEn({
            categoryName: category.nameEn,
            products: category.products.map((p) => ({
              title: p.title,
              asin: p.asin,
              price: p.price?.toString(),
              rating: p.rating,
              score: p.editorialScore,
            })),
          });

    const content = await openRouterChatJson<BuyingGuideContent>({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.5,
    });

    const slug = `${category.slug}-kaufberatung-${locale}`;
    const article = await prisma.article.upsert({
      where: {
        categoryId_type_locale: {
          categoryId: category.id,
          type: "buying_guide",
          locale,
        },
      },
      create: {
        type: "buying_guide",
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
        message: "Buying guide published",
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
