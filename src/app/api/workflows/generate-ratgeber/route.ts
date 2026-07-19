import { serve } from "@upstash/workflow/nextjs";
import {
  failJob,
  persistAdviceGuide,
  prepareAdviceGuide,
} from "@/lib/ai/generate";
import {
  OPENROUTER_CHAT_URL,
  buildOpenRouterJsonBody,
  getOpenRouterAuthHeaders,
  parseOpenRouterJsonContent,
  type OpenRouterChatCompletionResponse,
} from "@/lib/ai/openrouter-request";
import type { AdviceGuideContent } from "@/lib/content-types";
import {
  DAILY_NEW_ADVICE_GUIDE_TARGET,
  remainingDailyAdviceGuideSlots,
} from "@/lib/ratgeber/daily-quota";
import { pickNextAdviceGuideTopic } from "@/lib/ratgeber/select-topic";
import { getAdviceGuideTopic } from "@/lib/ratgeber/topics";
import { releaseLock } from "@/lib/upstash/redis";
import type { Locale } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Payload = {
  locales?: Locale[];
  topicKey?: string | null;
  lockKey?: string;
  force?: boolean;
  respectDailyQuota?: boolean;
};

export const { POST } = serve<Payload>(async (context) => {
  const payload = await context.run("get-payload", () => {
    return context.requestPayload || {};
  });

  const lockKey = payload.lockKey || "cron:generate-ratgeber";
  const locales = (
    payload.locales?.length ? payload.locales : (["de"] as Locale[])
  ).filter((v): v is Locale => v === "de" || v === "en");
  const primaryLocale = locales[0] ?? "de";
  const respectDailyQuota =
    payload.respectDailyQuota === true && payload.force !== true;

  try {
    const quota = await context.run("daily-advice-quota", async () => {
      if (!respectDailyQuota) {
        return { remaining: DAILY_NEW_ADVICE_GUIDE_TARGET, bypassed: true };
      }
      const remaining = await remainingDailyAdviceGuideSlots();
      return { remaining, bypassed: false };
    });

    if (quota.remaining <= 0) {
      await context.run("release-lock-quota", async () => {
        await releaseLock(lockKey);
        return { released: true };
      });
      return {
        ok: true,
        skipped: true,
        reason: "daily_advice_guide_quota_reached",
      };
    }

    const topic = await context.run("pick-topic", async () => {
      if (payload.topicKey) {
        const explicit = getAdviceGuideTopic(payload.topicKey);
        if (!explicit) throw new Error(`Unknown topic: ${payload.topicKey}`);
        return explicit;
      }
      const next = await pickNextAdviceGuideTopic(primaryLocale);
      if (!next) throw new Error("No unused advice guide topics remaining");
      return next;
    });

    const created: Array<{
      id: string;
      slug: string;
      locale: Locale;
      title: string;
    }> = [];

    for (const locale of locales) {
      const prepared = await context.run(
        `prep-advice-${locale}-${topic.topicKey}`,
        async () => prepareAdviceGuide(topic, locale),
      );

      const body = await context.run(
        `cfg-advice-${locale}-${topic.topicKey}`,
        async () =>
          buildOpenRouterJsonBody({
            messages: prepared.messages,
            temperature: prepared.temperature,
            maxTokens: prepared.maxTokens,
          }),
      );

      const ai = await context.call<OpenRouterChatCompletionResponse>(
        `ai-advice-${locale}-${topic.topicKey}`,
        {
          url: OPENROUTER_CHAT_URL,
          method: "POST",
          headers: getOpenRouterAuthHeaders(),
          body: JSON.stringify(body),
          retries: 1,
          timeout: "180s",
        },
      );

      if (ai.status < 200 || ai.status >= 300) {
        await context.run(`fail-advice-${locale}`, async () => {
          await failJob(
            prepared.jobId,
            new Error(`OpenRouter HTTP ${ai.status}`),
          );
        });
        throw new Error(`OpenRouter HTTP ${ai.status} for advice guide`);
      }

      const content = await context.run(
        `parse-advice-${locale}`,
        async () =>
          parseOpenRouterJsonContent<AdviceGuideContent>(ai.body),
      );

      const article = await context.run(
        `persist-advice-${locale}`,
        async () =>
          persistAdviceGuide({
            topic: prepared.topic,
            locale: prepared.locale,
            jobId: prepared.jobId,
            categoryId: prepared.categoryId,
            content,
          }),
      );

      created.push({
        id: article.id,
        slug: article.slug,
        locale: article.locale,
        title: article.title,
      });
    }

    await context.run("release-lock", async () => {
      await releaseLock(lockKey);
      return { released: true };
    });

    return {
      ok: true,
      topicKey: topic.topicKey,
      created,
    };
  } catch (error) {
    await context.run("release-lock-error", async () => {
      await releaseLock(lockKey);
      return {
        released: true,
        error: error instanceof Error ? error.message : "unknown",
      };
    });
    throw error;
  }
});
