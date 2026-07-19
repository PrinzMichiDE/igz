import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

/** German-friendly alias → canonical /reviews page. */
export default async function TestsAliasPage({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/reviews`);
}
