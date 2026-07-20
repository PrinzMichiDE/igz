import { redirect } from "next/navigation";

type Props = { params: Promise<{ locale: string }> };

/** EN-friendly alias → /spiele */
export default async function GamesAliasPage({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/spiele`);
}
