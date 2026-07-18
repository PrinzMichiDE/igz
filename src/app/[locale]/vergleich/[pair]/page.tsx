import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { AiCompareVerdict } from "@/components/comparison/ai-compare-verdict";
import { HeadToHeadTable } from "@/components/comparison/head-to-head-table";
import { AeoAnswerBlock } from "@/components/content/aeo-answer-block";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import {
  buildHeadToHeadRows,
  decideOverallWinner,
  featureList,
} from "@/lib/compare/head-to-head";
import { parseComparePairSlug } from "@/lib/compare/pair";
import { prisma } from "@/lib/db/prisma";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  aeoAnswerJsonLd,
  breadcrumbJsonLd,
  organizationJsonLd,
} from "@/lib/seo/jsonld";
import { absoluteUrl, localizedPath } from "@/lib/seo/site";
import { formatPrice } from "@/lib/utils";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; pair: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, pair } = await params;
  const locale = localeParam as AppLocale;
  const parsed = parseComparePairSlug(pair);
  if (!parsed) return { title: "Not found" };

  const products = await prisma.product
    .findMany({ where: { slug: { in: [parsed.slugA, parsed.slugB] } } })
    .catch(() => []);

  if (products.length !== 2) return { title: "Not found" };

  const a = products.find((p) => p.slug === parsed.slugA)!;
  const b = products.find((p) => p.slug === parsed.slugB)!;
  const title =
    locale === "en"
      ? `${a.title} vs ${b.title} – Head-to-head`
      : `${a.title} vs ${b.title} – Direktvergleich`;
  const description =
    locale === "en"
      ? `Compare ${a.title} and ${b.title}: score, price, ratings and buying advice.`
      : `Vergleich ${a.title} und ${b.title}: Score, Preis, Bewertungen und Kaufhilfe.`;

  return buildPageMetadata({
    locale,
    title,
    description,
    pathWithoutLocale: `/vergleich/${parsed.canonical}`,
    type: "article",
  });
}

export default async function ComparePairPage({ params }: Props) {
  const { locale: localeParam, pair } = await params;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();
  const isDe = locale === "de";

  const parsed = parseComparePairSlug(pair);
  if (!parsed) notFound();
  if (parsed.canonical !== pair) {
    redirect(`/${locale}/vergleich/${parsed.canonical}`);
  }

  const products = await prisma.product
    .findMany({
      where: { slug: { in: [parsed.slugA, parsed.slugB] } },
    })
    .catch(() => []);

  if (products.length !== 2) notFound();

  const productA = products.find((p) => p.slug === parsed.slugA)!;
  const productB = products.find((p) => p.slug === parsed.slugB)!;
  const numberLocale = locale === "en" ? "en-US" : "de-DE";

  const tableRows = buildHeadToHeadRows(productA, productB, {
    score: t("product.score"),
    price: isDe ? "Preis" : "Price",
    rating: isDe ? "Amazon-Rating" : "Amazon rating",
    reviews: isDe ? "Anzahl Bewertungen" : "Review count",
  });

  const winner = decideOverallWinner(productA, productB);
  const winnerProduct =
    winner === "a" ? productA : winner === "b" ? productB : null;

  const directAnswer = winnerProduct
    ? isDe
      ? `Im Direktvergleich führt aktuell ${winnerProduct.title} nach redaktionellem Score.`
      : `In this head-to-head, ${winnerProduct.title} currently leads on editorial score.`
    : isDe
      ? `${productA.title} und ${productB.title} liegen beim Score sehr nah beieinander.`
      : `${productA.title} and ${productB.title} are very close on score.`;

  const pageUrl = absoluteUrl(localizedPath(locale, `/vergleich/${parsed.canonical}`));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd
        data={[
          organizationJsonLd(locale),
          breadcrumbJsonLd([
            { name: t("nav.home"), url: absoluteUrl(localizedPath(locale)) },
            {
              name: t("nav.compare"),
              url: absoluteUrl(localizedPath(locale, "/vergleich")),
            },
            {
              name: `${productA.title} vs ${productB.title}`,
              url: pageUrl,
            },
          ]),
          aeoAnswerJsonLd({
            question: isDe
              ? `${productA.title} oder ${productB.title}?`
              : `${productA.title} or ${productB.title}?`,
            answer: directAnswer,
            url: pageUrl,
            locale,
          }),
        ]}
      />

      <Breadcrumbs
        items={[
          { label: t("nav.home"), href: `/${locale}` },
          { label: t("nav.compare"), href: `/${locale}/vergleich` },
          { label: `${productA.title} vs ${productB.title}` },
        ]}
      />

      <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
        {productA.title} vs {productB.title}
      </h1>
      <p className="mb-6 max-w-3xl text-zinc-600">
        {isDe
          ? "Side-by-Side Vergleich mit Score, Preis, Rating und KI-Unterstützung."
          : "Side-by-side comparison with score, price, rating and AI support."}
      </p>

      <AffiliateDisclosure text={t("disclosure.short")} />

      <div className="mt-6">
        <AeoAnswerBlock
          eyebrow={t("product.directAnswer")}
          answer={directAnswer}
          takeawaysTitle={t("product.keyTakeaways")}
          takeaways={[
            isDe
              ? `Score A: ${(productA.editorialScore ?? productA.rating ?? 0).toFixed?.(1) ?? productA.editorialScore}`
              : `Score A: ${(productA.editorialScore ?? productA.rating ?? 0).toFixed?.(1) ?? productA.editorialScore}`,
            isDe
              ? `Score B: ${(productB.editorialScore ?? productB.rating ?? 0).toFixed?.(1) ?? productB.editorialScore}`
              : `Score B: ${(productB.editorialScore ?? productB.rating ?? 0).toFixed?.(1) ?? productB.editorialScore}`,
            isDe
              ? `Preis A: ${formatPrice(productA.price?.toString(), productA.currency, numberLocale)}`
              : `Price A: ${formatPrice(productA.price?.toString(), productA.currency, numberLocale)}`,
            isDe
              ? `Preis B: ${formatPrice(productB.price?.toString(), productB.currency, numberLocale)}`
              : `Price B: ${formatPrice(productB.price?.toString(), productB.currency, numberLocale)}`,
          ]}
        />
      </div>

      <div className="mt-8">
        <HeadToHeadTable
          locale={locale}
          productA={productA}
          productB={productB}
          rows={tableRows}
          labels={{
            winner: t("compare.winner"),
            tie: t("compare.tie"),
            cta: t("cta.amazon"),
          }}
        />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold">{productA.title}</h2>
          <ul className="space-y-1 text-sm text-zinc-700">
            {featureList(productA).map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold">{productB.title}</h2>
          <ul className="space-y-1 text-sm text-zinc-700">
            {featureList(productB).map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8">
        <AiCompareVerdict
          locale={locale}
          slugA={productA.slug}
          slugB={productB.slug}
          labels={{
            title: t("compare.aiTitle"),
            button: t("compare.aiButton"),
            loading: t("compare.aiLoading"),
            error: t("compare.aiError"),
            forA: `${t("compare.forProduct")} A`,
            forB: `${t("compare.forProduct")} B`,
            bottomLine: t("compare.bottomLine"),
          }}
        />
      </div>
    </div>
  );
}
