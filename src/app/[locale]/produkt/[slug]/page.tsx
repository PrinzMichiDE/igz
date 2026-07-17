import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { BuyBox } from "@/components/product/buy-box";
import { CtaButton } from "@/components/affiliate/cta-button";
import { FaqAccordion } from "@/components/content/faq-accordion";
import { ProductCard } from "@/components/product/product-card";
import { ProsCons } from "@/components/content/pros-cons";
import { ScoreBadge } from "@/components/product/score-badge";
import { UserExperienceComments } from "@/components/content/user-experience-comments";
import { prisma } from "@/lib/db/prisma";
import { asReviewContent } from "@/lib/content-types";
import { formatPrice } from "@/lib/utils";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();

  const product = await prisma.product
    .findUnique({
      where: { slug },
      include: {
        category: true,
        articles: {
          where: { type: "review", locale, status: "published" },
          take: 1,
        },
        experienceComments: {
          where: { locale },
          orderBy: { createdAt: "desc" },
        },
      },
    })
    .catch(() => null);

  if (!product) notFound();

  const article = product.articles[0];
  const content = asReviewContent(article?.contentJson);
  const ctaHref = product.affiliateUrl || product.productUrl || "#";
  const numberLocale = locale === "en" ? "en-US" : "de-DE";

  const related = await prisma.product
    .findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
      },
      take: 3,
      orderBy: [{ editorialScore: "desc" }, { rating: "desc" }],
    })
    .catch(() => []);

  const features = Array.isArray(product.features)
    ? (product.features as string[])
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-6 flex flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm md:flex-row">
            <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-xl bg-zinc-50 md:mx-0">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  className="object-contain p-3"
                  sizes="192px"
                  unoptimized
                />
              ) : null}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-700">
                {locale === "en"
                  ? product.category.nameEn
                  : product.category.nameDe}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
                {article?.title || product.title}
              </h1>
              {content.testingPeriod ? (
                <p className="mt-2 text-sm text-zinc-500">
                  {t("product.testingPeriod")}: {content.testingPeriod}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <ScoreBadge
                  score={content.score ?? product.editorialScore ?? product.rating}
                  size="lg"
                  label={t("product.score")}
                />
                <div>
                  <p className="text-xl font-bold">
                    {formatPrice(
                      product.price?.toString(),
                      product.currency,
                      numberLocale,
                    )}
                  </p>
                  <p className="text-sm text-zinc-500">
                    ★ {product.rating ?? "—"} ({product.reviewCount})
                  </p>
                </div>
              </div>
              <div className="mt-4 lg:hidden">
                <CtaButton
                  href={ctaHref}
                  label={t("cta.amazon")}
                  className="w-full"
                  size="lg"
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <AffiliateDisclosure text={t("disclosure.short")} />
          </div>

          <nav className="mb-8 flex flex-wrap gap-3 text-sm font-medium text-blue-700">
            <a href="#fazit">{t("product.verdict")}</a>
            <a href="#pros-cons">
              {t("product.pros")} / {t("product.cons")}
            </a>
            <a href="#details">{t("product.details")}</a>
            <a href="#nutzererfahrungen">{t("product.experiences")}</a>
          </nav>

          <section id="fazit" className="prose-article mb-8 font-serif">
            <h2>{t("product.verdict")}</h2>
            <p>{content.verdict || article?.excerpt || product.title}</p>
            {content.sections?.map((section) => (
              <div key={section.heading} className="mt-6">
                <h2>{section.heading}</h2>
                {section.body.split("\n\n").map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
            ))}
          </section>

          <div className="mb-8 flex justify-center">
            <CtaButton href={ctaHref} label={t("cta.amazon")} size="lg" />
          </div>

          <section id="pros-cons" className="mb-8">
            <ProsCons
              prosTitle={t("product.pros")}
              consTitle={t("product.cons")}
              pros={content.pros || []}
              cons={content.cons || []}
            />
          </section>

          <section className="mb-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold">
                {t("product.bestFor")}
              </h2>
              <ul className="space-y-2 text-sm text-zinc-700">
                {(content.bestFor || []).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold">
                {t("product.notFor")}
              </h2>
              <ul className="space-y-2 text-sm text-zinc-700">
                {(content.notFor || []).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section id="details" className="mb-8">
            <h2 className="mb-3 text-xl font-bold">{t("product.details")}</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
                >
                  {feature}
                </div>
              ))}
            </div>
          </section>

          <UserExperienceComments
            title={t("product.experiences")}
            disclaimer={t("product.experiencesDisclaimer")}
            weeksLabel={t("product.usageWeeks")}
            emptyLabel={t("product.experiencesEmpty")}
            comments={product.experienceComments}
          />

          <FaqAccordion items={content.faq || []} />

          <div className="mt-10">
            <CtaButton href={ctaHref} label={t("cta.amazon")} size="lg" />
          </div>
        </div>

        <div className="hidden lg:block">
          <BuyBox
            score={content.score ?? product.editorialScore ?? product.rating}
            scoreLabel={t("product.score")}
            price={product.price?.toString()}
            currency={product.currency}
            locale={locale}
            priceNote={t("product.priceNote")}
            lastSyncedAt={product.lastSyncedAt}
            ctaHref={ctaHref}
            ctaLabel={t("cta.amazon")}
            disclosureInline={t("disclosure.inline")}
          />
          <p className="mt-3 text-xs text-zinc-500">{t("product.scoreHint")}</p>
        </div>
      </div>

      <section className="mt-14">
        <h2 className="mb-6 text-2xl font-bold">{t("product.related")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {related.map((item) => (
            <ProductCard
              key={item.id}
              href={`/${locale}/produkt/${item.slug}`}
              title={item.title}
              imageUrl={item.imageUrl}
              score={item.editorialScore ?? item.rating}
              price={item.price?.toString()}
              currency={item.currency}
              locale={locale}
              ctaLabel={t("cta.amazon")}
              ctaHref={item.affiliateUrl || item.productUrl || "#"}
              readLabel={t("category.readReview")}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
