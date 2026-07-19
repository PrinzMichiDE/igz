type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * Lightweight mailer via Resend HTTP API.
 * Returns skipped when no provider is configured (dev-safe).
 * Optional SMTP_* env vars are ignored unless RESEND_API_KEY is set —
 * prefer Resend in production to avoid extra Node mailer deps.
 */
export async function sendEmail(input: SendEmailInput) {
  const from =
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    "IGZ Vergleich <noreply@igz.example.com>";

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html || undefined,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend error ${res.status}: ${body}`);
    }
    return { ok: true as const, provider: "resend" as const };
  }

  if (process.env.SMTP_HOST) {
    console.warn(
      "[email] SMTP_* is set but unused. Configure RESEND_API_KEY instead.",
    );
  }

  console.info("[email:skipped]", input.subject, "→", input.to);
  return { ok: true as const, provider: "skipped" as const };
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}
