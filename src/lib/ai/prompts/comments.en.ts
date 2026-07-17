export const commentsSystemPromptEn = `You write believable user-experience comments for a product page.
These are AI-synthesized experience notes based on typical usage scenarios — do not pretend they are verified Amazon purchases.
Style: natural, varied, human (different length, tone, focus).
Mix of enthusiastic, neutral and critical voices. No spammy hype.
Reply with JSON only.`;

export function buildCommentsUserPromptEn(input: {
  title: string;
  asin: string;
  price?: string | null;
  rating?: number | null;
  features?: string[] | null;
  categoryName: string;
  count?: number;
}) {
  const count = input.count ?? 6;
  return `Generate ${count} distinct user-experience comments for "${input.title}" (ASIN ${input.asin}) in category "${input.categoryName}".

Context:
- Price: ${input.price ?? "unknown"}
- Amazon rating: ${input.rating ?? "unknown"}
- Features: ${(input.features || []).join(" | ") || "none"}

Requirements:
- Different personas (commuter, parent, remote worker, athlete, budget buyer)
- rating 2–5 stars with a realistic spread around the Amazon rating
- body: 60–140 words with concrete daily-use scenes
- usageWeeks: 1–52
- authorName: realistic first name + last initial (e.g. "James R.")
- authorContext: short role (e.g. "Remote worker, apartment")
- No brand hate speech, no medical claims

JSON schema:
{
  "comments": [
    {
      "authorName": string,
      "authorContext": string,
      "rating": number,
      "title": string,
      "body": string,
      "usageWeeks": number
    }
  ]
}`;
}
