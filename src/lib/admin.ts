import { auth } from "@/lib/auth";

export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return session;
}

export function articlePreviewPath(article: {
  type: string;
  locale: string;
  slug?: string | null;
  product?: { slug: string } | null;
  category?: { slug: string } | null;
}) {
  if (article.type === "review" && article.product?.slug) {
    return `/${article.locale}/produkt/${article.product.slug}`;
  }
  if (article.type === "buying_guide" && article.category?.slug) {
    return `/${article.locale}/kategorie/${article.category.slug}/kaufberatung`;
  }
  if (article.type === "advice_guide" && article.slug) {
    return `/${article.locale}/ratgeber/${article.slug}`;
  }
  if (article.category?.slug) {
    return `/${article.locale}/kategorie/${article.category.slug}`;
  }
  return `/${article.locale}`;
}
