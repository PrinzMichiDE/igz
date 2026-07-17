import { getTranslations } from "next-intl/server";
import { BarChart3, ShieldCheck, Sparkles } from "lucide-react";

export async function WhyIgzSection() {
  const t = await getTranslations("home");

  const items = [
    {
      icon: Sparkles,
      title: t("why.items.comparisons.title"),
      body: t("why.items.comparisons.body"),
    },
    {
      icon: ShieldCheck,
      title: t("why.items.reviews.title"),
      body: t("why.items.reviews.body"),
    },
    {
      icon: BarChart3,
      title: t("why.items.prices.title"),
      body: t("why.items.prices.body"),
    },
  ];

  return (
    <section className="igz-container py-16 md:py-20">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-primary md:text-4xl">
            {t("why.title")}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            {t("why.subtitle")}
          </p>
          <div className="mt-8 space-y-6">
            {items.map((item) => (
              <div key={item.title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <item.icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="igz-card relative overflow-hidden p-2">
          <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-primary-container via-secondary/20 to-surface-muted" />
          <div className="absolute inset-8 flex flex-col justify-end rounded-lg border border-white/20 bg-primary/70 p-6 text-white backdrop-blur-sm">
            <p className="font-display text-sm font-medium uppercase tracking-[0.2em] text-white/70">
              {t("why.visual.label")}
            </p>
            <p className="mt-2 font-display text-2xl font-semibold">
              {t("why.visual.title")}
            </p>
            <p className="mt-2 text-sm text-white/80">{t("why.visual.body")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
