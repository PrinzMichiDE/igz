import { NextResponse } from "next/server";
import {
  qstashConfigured,
  triggerWorkflow,
} from "@/lib/upstash/qstash";
import { acquireLock, incrDailyCounter } from "@/lib/upstash/redis";

type TriggerOptions = {
  lockKey: string;
  workflowPath: string;
  body?: Record<string, unknown>;
  lockTtlSeconds?: number;
};

/**
 * Cron entrypoints should only enqueue a QStash workflow and return fast.
 * Falls back to `inlineFallback` when QStash is not configured (local/dev).
 */
export async function enqueueOrRunInline<T>(
  options: TriggerOptions,
  inlineFallback: () => Promise<T>,
) {
  const locked = await acquireLock(
    options.lockKey,
    options.lockTtlSeconds ?? 55 * 60,
  );
  if (!locked) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "lock_held",
      lockKey: options.lockKey,
    });
  }

  if (!qstashConfigured()) {
    const result = await inlineFallback();
    return NextResponse.json({
      ok: true,
      mode: "inline",
      result,
    });
  }

  const triggered = await triggerWorkflow(
    options.workflowPath,
    options.body ?? {},
  );
  await incrDailyCounter("qstash_workflow_triggers");

  return NextResponse.json({
    ok: true,
    mode: "qstash",
    workflowRunId: triggered.workflowRunId,
    url: triggered.url,
  });
}
