import { getTranslations } from "next-intl/server";

type Props = {
  locale: string;
};

export async function CategoryFilterSidebar({ locale }: Props) {
  const t = await getTranslations("category");

  const brands = ["Apple", "Dell", "Lenovo", "ASUS"];
  const useCases =
    locale === "en"
      ? ["Professional", "Creator", "Gaming"]
      : ["Professionell", "Creator", "Gaming"];

  return (
    <aside className="igz-card p-5">
      <h2 className="font-display text-lg font-semibold text-primary">
        {t("filters")}
      </h2>

      <div className="mt-6">
        <h3 className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
          {t("filterBrand")}
        </h3>
        <div className="mt-3 space-y-2">
          {brands.map((brand) => (
            <label
              key={brand}
              className="flex items-center gap-3 text-sm text-muted-foreground"
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-secondary"
                disabled
              />
              {brand}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
          {t("filterPrice")}
        </h3>
        <div className="mt-4 h-2 rounded-full bg-surface-muted">
          <div className="h-2 w-2/3 rounded-full bg-secondary" />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>€800</span>
          <span>€4000+</span>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
          {t("filterUseCase")}
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {useCases.map((item, index) => (
            <span
              key={item}
              className={
                index === 0
                  ? "rounded-full border border-secondary bg-secondary/10 px-3 py-1.5 text-xs font-semibold text-secondary"
                  : "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground"
              }
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
