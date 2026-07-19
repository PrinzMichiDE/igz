import { prisma } from "@/lib/db/prisma";
import { openRouterChatJson } from "@/lib/ai/openrouter";
import { getOpenRouterReviewModel } from "@/lib/ai/openrouter-request";
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
import {
  mediaReviewGuidanceDe,
  mediaReviewGuidanceEn,
} from "@/lib/ai/prompts/media-review";
import {
  isDetailedSectionedReview,
  normalizeReviewSections,
  wordCount,
} from "@/lib/ai/review-sections";
import { isEntertainmentCategorySlug } from "@/lib/entertainment";
import { slugify } from "@/lib/utils";
import type { Locale } from "@prisma/client";

/** Long structured reviews need enough room for 7 × ~160 words + meta JSON. */
const REVIEW_MAX_TOKENS = 10000;

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
  const takeaways = content.keyTakeaways || [];

  return (
    content.title?.length > 10 &&
    wordCount(content.verdict || "") >= 70 &&
    wordCount(content.directAnswer || "") >= 30 &&
    takeaways.length >= 5 &&
    Array.isArray(content.pros) &&
    content.pros.length >= 4 &&
    Array.isArray(content.cons) &&
    content.cons.length >= 3 &&
    isDetailedSectionedReview(sections) &&
    sections.every((section) => Boolean(section.heading?.trim())) &&
    typeof content.score === "number" &&
    content.score >= 0 &&
    content.score <= 10
  );
}

function withNormalizedSections(
  content: ReviewContent,
  locale: Locale,
  categorySlug?: string | null,
): ReviewContent {
  return {
    ...content,
    sections: normalizeReviewSections(content.sections, locale, categorySlug),
  };
}

export async function prepareProductReview(productId: string, locale: Locale) {
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

  const features = Array.isArray(product.features)
    ? (product.features as string[])
    : [];

  const mediaGuidance = isEntertainmentCategorySlug(product.category.slug)
    ? locale === "de"
      ? mediaReviewGuidanceDe(product.category.slug)
      : mediaReviewGuidanceEn(product.category.slug)
    : null;

  const system = locale === "de" ? reviewSystemPromptDe : reviewSystemPromptEn;
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
          mediaGuidance,
        })
      : buildReviewUserPromptEn({
          title: product.title,
          asin: product.asin,
          price: product.price?.toString(),
          rating: product.rating,
          reviewCount: product.reviewCount,
          features,
          categoryName: product.category.nameEn,
          mediaGuidance,
        });

  return {
    jobId: job.id,
    productId: product.id,
    asin: product.asin,
    productSlug: product.slug,
    categorySlug: product.category.slug,
    locale,
    model: getOpenRouterReviewModel(),
    // Slightly higher for natural editorial variation; still constrained by JSON schema.
    temperature: 0.55,
    maxTokens: REVIEW_MAX_TOKENS,
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: user },
    ],
  };
}

export async function persistProductReview(input: {
  productId: string;
  locale: Locale;
  jobId: string;
  content: ReviewContent;
  categorySlug?: string | null;
}) {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: input.productId },
    select: {
      id: true,
      slug: true,
      category: { select: { slug: true } },
    },
  });

  try {
    const categorySlug =
      input.categorySlug || product.category.slug || null;
    const content = withNormalizedSections(
      input.content,
      input.locale,
      categorySlug,
    );
    const qualityGatePassed = passesReviewQualityGate(content);
    if (!qualityGatePassed) {
      // Still publish — avoid empty pages; refresh cron upgrades short reviews.
      console.warn(
        `Review quality gate soft-fail for ${product.id}/${input.locale}`,
      );
    }

    const publishedAt = new Date();
    const slug = `${slugify(content.title) || product.slug}-${input.locale}`;
    const bodyMarkdown = buildFullMarkdown(content);

    const article = await prisma.article.upsert({
      where: {
        productId_type_locale: {
          productId: product.id,
          type: "review",
          locale: input.locale,
        },
      },
      create: {
        type: "review",
        locale: input.locale,
        status: "published",
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
        status: "published",
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
      where: { id: input.jobId },
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
      where: { id: input.jobId },
      data: {
        status: "failed",
        finishedAt: new Date(),
        error: message,
      },
    });
    throw error;
  }
}

export async function failJob(jobId: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  await prisma.jobRun.update({
    where: { id: jobId },
    data: {
      status: "failed",
      finishedAt: new Date(),
      error: message,
    },
  });
}

export async function generateProductReview(productId: string, locale: Locale) {
  const prepared = await prepareProductReview(productId, locale);
  try {
    let content = await openRouterChatJson<ReviewContent>({
      messages: prepared.messages,
      temperature: prepared.temperature,
      maxTokens: prepared.maxTokens,
      model: prepared.model,
    });
    content = withNormalizedSections(
      content,
      prepared.locale,
      prepared.categorySlug,
    );

    // One retry if the model returned a short/flat outline instead of 7 chapters.
    if (!passesReviewQualityGate(content)) {
      const retryReminder =
        prepared.locale === "de"
          ? "NACHBESSERUNG: Schreibe denselben Test NOCHMAL als gültiges JSON. Genau 7 Abschnitte mit den vorgegebenen Headings. Jeder section.body 130–190 Wörter, Absätze mit \\n\\n. Redaktionsstil wie ein echter Magazin-Tester (Ich-Form, konkrete Szenen, klare Meinung) – keine KI-Floskeln, keine Kurzfassung."
          : "REVISION: Rewrite the same review as valid JSON. Exactly 7 sections with the required headings. Each section.body 130–190 words, paragraphs separated by \\n\\n. Magazine-editor voice (first person, concrete scenes, clear opinions) — no AI fluff, no short version.";
      content = await openRouterChatJson<ReviewContent>({
        messages: [
          ...prepared.messages,
          {
            role: "assistant",
            content: JSON.stringify(content),
          },
          { role: "user", content: retryReminder },
        ],
        temperature: Math.max(0.3, prepared.temperature - 0.1),
        maxTokens: prepared.maxTokens,
        model: prepared.model,
      });
      content = withNormalizedSections(
        content,
        prepared.locale,
        prepared.categorySlug,
      );
    }

    return persistProductReview({
      productId: prepared.productId,
      locale: prepared.locale,
      categorySlug: prepared.categorySlug,
      jobId: prepared.jobId,
      content,
    });
  } catch (error) {
    await failJob(prepared.jobId, error);
    throw error;
  }
}

export async function prepareProductExperienceComments(
  productId: string,
  locale: Locale,
  count = 4,
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

  return {
    jobId: job.id,
    productId: product.id,
    asin: product.asin,
    locale,
    temperature: 0.75,
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: user },
    ],
  };
}

export async function persistProductExperienceComments(input: {
  productId: string;
  locale: Locale;
  jobId: string;
  payload: ExperienceCommentsResponse;
}) {
  try {
    const comments = (input.payload.comments || [])
      .filter((c) => c.authorName && c.body && wordCount(c.body) >= 30)
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

    if (comments.length < 2) {
      throw new Error("OpenRouter returned too few usable experience comments");
    }

    await prisma.$transaction([
      prisma.productExperienceComment.deleteMany({
        where: {
          productId: input.productId,
          locale: input.locale,
          source: "openrouter_synth",
        },
      }),
      prisma.productExperienceComment.createMany({
        data: comments.map((c) => ({
          productId: input.productId,
          locale: input.locale,
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
        productId: input.productId,
        locale: input.locale,
        source: "openrouter_synth",
        status: "published",
      },
      orderBy: { createdAt: "desc" },
    });

    await prisma.jobRun.update({
      where: { id: input.jobId },
      data: {
        status: "succeeded",
        finishedAt: new Date(),
        message: `Stored ${saved.length} experience comments`,
        metricsJson: { count: saved.length, locale: input.locale },
      },
    });

    return saved;
  } catch (error) {
    await failJob(input.jobId, error);
    throw error;
  }
}

export async function generateProductExperienceComments(
  productId: string,
  locale: Locale,
  count = 4,
) {
  const prepared = await prepareProductExperienceComments(
    productId,
    locale,
    count,
  );
  try {
    const payload = await openRouterChatJson<ExperienceCommentsResponse>({
      messages: prepared.messages,
      temperature: prepared.temperature,
    });
    return persistProductExperienceComments({
      productId: prepared.productId,
      locale: prepared.locale,
      jobId: prepared.jobId,
      payload,
    });
  } catch (error) {
    await failJob(prepared.jobId, error);
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
