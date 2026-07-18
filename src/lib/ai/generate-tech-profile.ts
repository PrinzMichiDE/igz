import { prisma } from "@/lib/db/prisma";
import { openRouterChatJson } from "@/lib/ai/openrouter";
import {
  buildTechProfileUserPrompt,
  techProfileSystemPrompt,
} from "@/lib/ai/prompts/tech-profile";
import { detectProductBrand } from "@/lib/product-manuals/extract";
import {
  datasheetToFeatureList,
  normalizeTechProfileResponse,
} from "@/lib/product-tech/parse";
import type { ProductTechProfileAiResponse } from "@/lib/product-tech/types";

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function extractProductInformation(rawDetailsJson: unknown): Record<string, string> {
  const root = asRecord(rawDetailsJson);
  const data = asRecord(root.data);
  const info = asRecord(
    root.product_information ??
      root.product_details ??
      data.product_information ??
      data.product_details,
  );
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(info)) {
    if (typeof value === "string" && value.trim()) {
      result[key] = value.trim().slice(0, 240);
    } else if (typeof value === "number" || typeof value === "boolean") {
      result[key] = String(value);
    }
  }
  return result;
}

function extractAboutProduct(rawDetailsJson: unknown): string[] {
  const root = asRecord(rawDetailsJson);
  const data = asRecord(root.data);
  const about = root.about_product ?? data.about_product;
  if (!Array.isArray(about)) return [];
  return about
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim().slice(0, 300))
    .slice(0, 40);
}

export async function prepareProductTechProfile(productId: string) {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    include: { category: true },
  });

  const job = await prisma.jobRun.create({
    data: {
      type: "generate_tech_profile",
      status: "running",
      startedAt: new Date(),
      message: `Tech profile for ${product.asin}`,
    },
  });

  const features = Array.isArray(product.features)
    ? (product.features as string[])
    : [];
  const productInformation = extractProductInformation(product.rawDetailsJson);
  const aboutProduct = extractAboutProduct(product.rawDetailsJson);
  const brand = detectProductBrand({
    title: product.title,
    rawSearchJson: product.rawSearchJson,
    rawDetailsJson: product.rawDetailsJson,
  });

  const user = buildTechProfileUserPrompt({
    title: product.title,
    asin: product.asin,
    brand,
    categoryNameDe: product.category.nameDe,
    categoryNameEn: product.category.nameEn,
    categorySlug: product.category.slug,
    price: product.price?.toString(),
    rating: product.rating,
    reviewCount: product.reviewCount,
    features,
    productInformation,
    aboutProduct,
  });

  return {
    jobId: job.id,
    productId: product.id,
    asin: product.asin,
    temperature: 0.2,
    /** Enable OpenRouter web plugin for known-issue research when available. */
    plugins: [{ id: "web", max_results: 6 }],
    messages: [
      { role: "system" as const, content: techProfileSystemPrompt },
      { role: "user" as const, content: user },
    ],
  };
}

export async function persistProductTechProfile(input: {
  productId: string;
  jobId: string;
  payload: ProductTechProfileAiResponse | Record<string, unknown>;
}) {
  try {
    const normalized = normalizeTechProfileResponse(input.payload);

    if (normalized.datasheet.rows.length < 4) {
      throw new Error("Tech profile datasheet too thin (< 4 rows)");
    }

    const features = datasheetToFeatureList(normalized.datasheet, "de");

    await prisma.product.update({
      where: { id: input.productId },
      data: {
        specsJson: normalized.datasheet,
        knownIssuesJson: normalized.knownIssues,
        errorCodesJson: normalized.errorCodes,
        features,
        techProfileAt: new Date(),
      },
    });

    await prisma.jobRun.update({
      where: { id: input.jobId },
      data: {
        status: "succeeded",
        finishedAt: new Date(),
        message: `Stored tech profile (${normalized.datasheet.rows.length} specs, ${normalized.knownIssues.issues.length} issues, ${normalized.errorCodes.codes.length} codes)`,
        metricsJson: {
          specs: normalized.datasheet.rows.length,
          issues: normalized.knownIssues.issues.length,
          codes: normalized.errorCodes.codes.length,
        },
      },
    });

    return normalized;
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

export async function generateProductTechProfile(productId: string) {
  const prepared = await prepareProductTechProfile(productId);
  try {
    const content = await openRouterChatJson<ProductTechProfileAiResponse>({
      messages: prepared.messages,
      temperature: prepared.temperature,
      plugins: prepared.plugins,
    });
    return persistProductTechProfile({
      productId: prepared.productId,
      jobId: prepared.jobId,
      payload: content,
    });
  } catch {
    // Retry once without web plugin if the plugin path fails.
    try {
      const content = await openRouterChatJson<ProductTechProfileAiResponse>({
        messages: prepared.messages,
        temperature: prepared.temperature,
      });
      return persistProductTechProfile({
        productId: prepared.productId,
        jobId: prepared.jobId,
        payload: content,
      });
    } catch (retryError) {
      const message =
        retryError instanceof Error ? retryError.message : "Unknown error";
      await prisma.jobRun.update({
        where: { id: prepared.jobId },
        data: {
          status: "failed",
          finishedAt: new Date(),
          error: message,
        },
      });
      throw retryError;
    }
  }
}
