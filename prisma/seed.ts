import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { buildAffiliateUrl } from "../src/lib/amazon/affiliate";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const headphones = await prisma.category.upsert({
    where: { slug: "bluetooth-kopfhoerer" },
    update: {
      nameDe: "Bluetooth-Kopfhörer",
      nameEn: "Bluetooth Headphones",
      descriptionDe:
        "Vergleich der besten Bluetooth-Kopfhörer nach Klang, Tragekomfort und Preis-Leistung.",
      descriptionEn:
        "Comparison of the best Bluetooth headphones by sound, comfort and value.",
      searchKeywords: ["bluetooth kopfhörer", "wireless headphones"],
      countryScope: "DE",
    },
    create: {
      slug: "bluetooth-kopfhoerer",
      nameDe: "Bluetooth-Kopfhörer",
      nameEn: "Bluetooth Headphones",
      descriptionDe:
        "Vergleich der besten Bluetooth-Kopfhörer nach Klang, Tragekomfort und Preis-Leistung.",
      descriptionEn:
        "Comparison of the best Bluetooth headphones by sound, comfort and value.",
      searchKeywords: ["bluetooth kopfhörer", "wireless headphones"],
      countryScope: "DE",
    },
  });

  const vacuums = await prisma.category.upsert({
    where: { slug: "akku-staubsauger" },
    update: {
      nameDe: "Akku-Staubsauger",
      nameEn: "Cordless Vacuums",
      descriptionDe:
        "Die besten Akku-Staubsauger im Vergleich – Saugkraft, Laufzeit und Handhabung.",
      descriptionEn:
        "Top cordless vacuums compared – suction, runtime and handling.",
      searchKeywords: ["akku staubsauger", "cordless vacuum"],
      countryScope: "DE",
    },
    create: {
      slug: "akku-staubsauger",
      nameDe: "Akku-Staubsauger",
      nameEn: "Cordless Vacuums",
      descriptionDe:
        "Die besten Akku-Staubsauger im Vergleich – Saugkraft, Laufzeit und Handhabung.",
      descriptionEn:
        "Top cordless vacuums compared – suction, runtime and handling.",
      searchKeywords: ["akku staubsauger", "cordless vacuum"],
      countryScope: "DE",
    },
  });

  const demoProducts = [
    {
      asin: "B0DEMO0001",
      slug: "demo-kopfhoerer-pro-b0demo0001",
      title: "Demo Kopfhörer Pro ANC",
      price: 129.99,
      rating: 4.6,
      reviewCount: 1842,
      editorialScore: 8.7,
      features: [
        "Aktive Geräuschunterdrückung",
        "30 Stunden Akku",
        "Multipoint Bluetooth",
      ],
      categoryId: headphones.id,
    },
    {
      asin: "B0DEMO0002",
      slug: "demo-kopfhoerer-lite-b0demo0002",
      title: "Demo Kopfhörer Lite",
      price: 59.99,
      rating: 4.3,
      reviewCount: 920,
      editorialScore: 7.8,
      features: ["Leichtbau", "USB-C Laden", "Gute Alltagsqualität"],
      categoryId: headphones.id,
    },
    {
      asin: "B0DEMO0003",
      slug: "demo-kopfhoerer-sport-b0demo0003",
      title: "Demo Sport Buds IPX7",
      price: 79.99,
      rating: 4.4,
      reviewCount: 640,
      editorialScore: 8.1,
      features: ["IPX7", "Secure Fit", "Transparenzmodus"],
      categoryId: headphones.id,
    },
    {
      asin: "B0DEMO0004",
      slug: "demo-staubsauger-x-b0demo0004",
      title: "Demo Akkusauger X SoftRoll",
      price: 249.0,
      rating: 4.5,
      reviewCount: 2103,
      editorialScore: 8.4,
      features: ["60 Min Laufzeit", "LED-Bodendüse", "Waschbarer Filter"],
      categoryId: vacuums.id,
    },
    {
      asin: "B0DEMO0005",
      slug: "demo-staubsauger-mini-b0demo0005",
      title: "Demo Akkusauger Mini",
      price: 119.0,
      rating: 4.1,
      reviewCount: 455,
      editorialScore: 7.4,
      features: ["Kompakt", "Wandhalterung", "2 Saugstufen"],
      categoryId: vacuums.id,
    },
  ];

  for (const item of demoProducts) {
    await prisma.product.upsert({
      where: {
        asin_country: {
          asin: item.asin,
          country: "DE",
        },
      },
      update: {
        title: item.title,
        slug: item.slug,
        price: item.price,
        rating: item.rating,
        reviewCount: item.reviewCount,
        editorialScore: item.editorialScore,
        features: item.features,
        affiliateUrl: buildAffiliateUrl(item.asin, "DE"),
        productUrl: `https://www.amazon.de/dp/${item.asin}`,
        lastSyncedAt: new Date(),
        categoryId: item.categoryId,
      },
      create: {
        asin: item.asin,
        country: "DE",
        slug: item.slug,
        title: item.title,
        price: item.price,
        currency: "EUR",
        rating: item.rating,
        reviewCount: item.reviewCount,
        editorialScore: item.editorialScore,
        features: item.features,
        affiliateUrl: buildAffiliateUrl(item.asin, "DE"),
        productUrl: `https://www.amazon.de/dp/${item.asin}`,
        lastSyncedAt: new Date(),
        categoryId: item.categoryId,
        imageUrl: null,
      },
    });
  }

  const headphoneProducts = await prisma.product.findMany({
    where: { categoryId: headphones.id },
    orderBy: { editorialScore: "desc" },
  });

  if (headphoneProducts.length >= 3) {
    await prisma.comparison.upsert({
      where: { categoryId: headphones.id },
      update: {
        winnerProductId: headphoneProducts[0].id,
        priceWinnerId: headphoneProducts[1].id,
        budgetWinnerId: headphoneProducts[2].id,
        criteriaJson: {
          intro:
            "Demo-Vergleich für UI-Preview. Ersetze die Daten später durch RapidAPI-Sync und OpenRouter-Content.",
          rankingNotes: [
            "Testsieger mit starker ANC-Leistung.",
            "Preis-Tipp für den Alltag.",
          ],
          faq: [
            {
              question: "Welcher Kopfhörer ist der Testsieger?",
              answer: headphoneProducts[0].title,
            },
          ],
        },
      },
      create: {
        categoryId: headphones.id,
        winnerProductId: headphoneProducts[0].id,
        priceWinnerId: headphoneProducts[1].id,
        budgetWinnerId: headphoneProducts[2].id,
        criteriaJson: {
          intro:
            "Demo-Vergleich für UI-Preview. Ersetze die Daten später durch RapidAPI-Sync und OpenRouter-Content.",
        },
      },
    });

    for (const locale of ["de", "en"] as const) {
      await prisma.article.upsert({
        where: {
          categoryId_type_locale: {
            categoryId: headphones.id,
            type: "comparison",
            locale,
          },
        },
        update: {
          status: "published",
          title:
            locale === "de"
              ? "Bluetooth-Kopfhörer Vergleich (Demo)"
              : "Bluetooth Headphones Comparison (Demo)",
          slug: `bluetooth-kopfhoerer-vergleich-${locale}`,
          excerpt:
            locale === "de"
              ? "Demo-Inhalt für die Vergleichsseite."
              : "Demo content for the comparison page.",
          contentJson: {
            intro:
              locale === "de"
                ? "Dieser Demo-Text zeigt das UI der Vergleichsseite."
                : "This demo text showcases the comparison page UI.",
            faq: [],
          },
          publishedAt: new Date(),
        },
        create: {
          type: "comparison",
          locale,
          status: "published",
          title:
            locale === "de"
              ? "Bluetooth-Kopfhörer Vergleich (Demo)"
              : "Bluetooth Headphones Comparison (Demo)",
          slug: `bluetooth-kopfhoerer-vergleich-${locale}`,
          excerpt:
            locale === "de"
              ? "Demo-Inhalt für die Vergleichsseite."
              : "Demo content for the comparison page.",
          contentJson: {
            intro:
              locale === "de"
                ? "Dieser Demo-Text zeigt das UI der Vergleichsseite."
                : "This demo text showcases the comparison page UI.",
            faq: [],
          },
          publishedAt: new Date(),
          categoryId: headphones.id,
        },
      });
    }

    for (const product of headphoneProducts) {
      for (const locale of ["de", "en"] as const) {
        await prisma.article.upsert({
          where: {
            productId_type_locale: {
              productId: product.id,
              type: "review",
              locale,
            },
          },
          update: {
            status: "published",
            title:
              locale === "de"
                ? `Testbericht: ${product.title}`
                : `Review: ${product.title}`,
            slug: `${product.slug}-review-${locale}`,
            excerpt:
              locale === "de"
                ? "Demo-Testbericht für UI und SEO-Preview."
                : "Demo review for UI and SEO preview.",
            contentJson: {
              score: product.editorialScore,
              pros:
                locale === "de"
                  ? ["Solider Klang", "Gutes Preis-Leistungs-Verhältnis"]
                  : ["Solid sound", "Good value"],
              cons:
                locale === "de"
                  ? ["Demo-Daten, keine echten Labormessungen"]
                  : ["Demo data, no real lab measurements"],
              bestFor:
                locale === "de" ? ["Alltag", "Pendeln"] : ["Daily use", "Commuting"],
              notFor:
                locale === "de" ? ["Studio-Produktion"] : ["Studio production"],
              verdict:
                locale === "de"
                  ? `${product.title} ist ein starker Demo-Kandidat für die UI-Vorschau.`
                  : `${product.title} is a strong demo candidate for the UI preview.`,
              sections: [
                {
                  heading: locale === "de" ? "Praxis" : "In practice",
                  body:
                    locale === "de"
                      ? "Dieser Abschnitt wird später durch OpenRouter ersetzt."
                      : "This section will later be replaced by OpenRouter output.",
                },
              ],
              faq: [],
            },
            publishedAt: new Date(),
          },
          create: {
            type: "review",
            locale,
            status: "published",
            title:
              locale === "de"
                ? `Testbericht: ${product.title}`
                : `Review: ${product.title}`,
            slug: `${product.slug}-review-${locale}`,
            excerpt:
              locale === "de"
                ? "Demo-Testbericht für UI und SEO-Preview."
                : "Demo review for UI and SEO preview.",
            contentJson: {
              score: product.editorialScore,
              pros:
                locale === "de"
                  ? ["Solider Klang", "Gutes Preis-Leistungs-Verhältnis"]
                  : ["Solid sound", "Good value"],
              cons:
                locale === "de"
                  ? ["Demo-Daten, keine echten Labormessungen"]
                  : ["Demo data, no real lab measurements"],
              bestFor:
                locale === "de" ? ["Alltag", "Pendeln"] : ["Daily use", "Commuting"],
              notFor:
                locale === "de" ? ["Studio-Produktion"] : ["Studio production"],
              verdict:
                locale === "de"
                  ? `${product.title} ist ein starker Demo-Kandidat für die UI-Vorschau.`
                  : `${product.title} is a strong demo candidate for the UI preview.`,
              sections: [],
              faq: [],
            },
            publishedAt: new Date(),
            productId: product.id,
          },
        });
      }
    }
  }

  await prisma.apiQuotaMonth.upsert({
    where: {
      provider_yearMonth: {
        provider: "rapidapi_amazon",
        yearMonth: new Date().toISOString().slice(0, 7),
      },
    },
    update: {},
    create: {
      provider: "rapidapi_amazon",
      yearMonth: new Date().toISOString().slice(0, 7),
      used: 0,
      softLimit: Number(process.env.RAPIDAPI_MONTHLY_LIMIT || 100),
      reserve: Number(process.env.RAPIDAPI_MONTHLY_RESERVE || 6),
    },
  });

  console.log("Seed completed:", {
    categories: [headphones.slug, vacuums.slug],
    products: demoProducts.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
