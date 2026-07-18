import { BookOpen, ExternalLink, FileText } from "lucide-react";
import type { ProductManualLink } from "@/lib/product-manuals/types";

type Labels = {
  title: string;
  subtitle: string;
  disclaimer: string;
  sourceManufacturer: string;
  sourceAmazon: string;
  sourcePortal: string;
};

type Props = {
  manuals: ProductManualLink[];
  labels: Labels;
};

function sourceLabel(link: ProductManualLink, labels: Labels) {
  switch (link.source) {
    case "manufacturer":
      return labels.sourceManufacturer;
    case "amazon":
      return labels.sourceAmazon;
    case "support_portal":
      return labels.sourcePortal;
    default: {
      const _exhaustive: never = link.source;
      return _exhaustive;
    }
  }
}

function LinkIcon({ url }: { url: string }) {
  if (/\.pdf($|\?)/i.test(url)) {
    return <FileText className="h-4 w-4 shrink-0" aria-hidden />;
  }
  return <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />;
}

export function ProductManuals({ manuals, labels }: Props) {
  if (manuals.length === 0) return null;

  return (
    <section id="anleitungen" className="mt-10">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
          <BookOpen className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-2xl font-semibold text-primary">
            {labels.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{labels.subtitle}</p>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {manuals.map((manual) => (
          <li key={manual.url}>
            <a
              href={manual.url}
              target="_blank"
              rel="noopener noreferrer"
              className="igz-card flex h-full items-start gap-3 p-4 transition hover:border-secondary/40 hover:shadow-sm"
            >
              <LinkIcon url={manual.url} />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-primary">{manual.title}</span>
                <span className="mt-1 block text-xs text-muted">
                  {sourceLabel(manual, labels)}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {labels.disclaimer}
      </p>
    </section>
  );
}
