import { Client } from "@upstash/workflow";

export function getWorkflowBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit && !explicit.includes("localhost")) return explicit;

  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(
    /\/$/,
    "",
  );
  if (vercelProd) {
    return vercelProd.startsWith("http") ? vercelProd : `https://${vercelProd}`;
  }

  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) {
    return vercel.startsWith("http") ? vercel : `https://${vercel}`;
  }

  return explicit || "http://localhost:3000";
}

export function getWorkflowClient() {
  const token = process.env.QSTASH_TOKEN;
  if (!token) {
    throw new Error("QSTASH_TOKEN is not configured");
  }
  return new Client({
    token,
    baseUrl: process.env.QSTASH_URL || undefined,
  });
}

export async function triggerWorkflow<T extends Record<string, unknown>>(
  path: string,
  body: T,
  options?: { delaySeconds?: number },
) {
  const client = getWorkflowClient();
  const url = `${getWorkflowBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const delaySeconds =
    options?.delaySeconds && options.delaySeconds > 0
      ? Math.round(options.delaySeconds)
      : undefined;

  const result = await client.trigger({
    url,
    body,
    retries: 2,
    ...(delaySeconds ? { delay: delaySeconds } : {}),
  });

  return {
    workflowRunId: result.workflowRunId,
    url,
  };
}

export function qstashConfigured() {
  return Boolean(process.env.QSTASH_TOKEN);
}
