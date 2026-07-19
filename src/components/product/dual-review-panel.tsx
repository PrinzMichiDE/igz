import { Star } from "lucide-react";
import { DecisionGuide } from "@/components/product/decision-guide";
import { ScoreBadge } from "@/components/product/score-badge";
import { ScoreBreakdown } from "@/components/product/score-breakdown";
import type { DecisionGuide as DecisionGuideData, ScoreBreakdown as ScoreBreakdownData } from "@/lib/content-types";

type Props = {
  locale: string;
  igzScore?: number | null;
  amazonRating?: number | null;
  amazonReviewCount?: number;
  scoreBreakdown?: ScoreBreakdownData | null;
  decisionGuide?: DecisionGuideData | null;
  labels: {
    editorialTitle: string;
    editorialSubtitle: string;
    buyerTitle: string;
    buyerSubtitle: string;
    igzScore: string;
    amazonRating: string;
    amazonReviews: string;
    noAmazon: string;
    breakdownTitle: string;
    breakdown: {
      value: string;
      quality: string;
      usability: string;
      longevity: string;
      overall: string;
    };
    decisionTitle: string;
    buyIf: string;
    skipIf: string;
  };
};

export function DualReviewPanel({
  locale,
  igzScore,
  amazonRating,
  amazonReviewCount = 0,
  scoreBreakdown,
  decisionGuide,
  labels,
}: Props) {
  const numberLocale = locale === "en" ? "en-US" : "de-DE";

  return (
    <section className="mt-8 grid gap-4 lg:grid-cols-2">
      <article className="igz-card border-secondary/20 bg-secondary/5 p-5">
        <p className="text-xs font-semibold tracking-[0.14em] text-secondary uppercase">
          {labels.editorialTitle}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {labels.editorialSubtitle}
        </p>
        <div className="mt-5 flex items-center gap-4">
          <ScoreBadge
            score={igzScore}
            size="lg"
            label={labels.igzScore}
            showBadge
          />
          <div>
            <p className="font-display text-2xl font-bold text-primary">
              {typeof igzScore === "number" ? `${igzScore.toFixed(1)}/10` : "—"}
            </p>
            <p className="text-xs text-muted">{labels.igzScore}</p>
          </div>
        </div>
        {scoreBreakdown ? (
          <div className="mt-5">
            <ScoreBreakdown
              title={labels.breakdownTitle}
              labels={labels.breakdown}
              breakdown={scoreBreakdown}
            />
          </div>
        ) : null}
        {decisionGuide ? (
          <div className="mt-2">
            <DecisionGuide
              title={labels.decisionTitle}
              buyTitle={labels.buyIf}
              skipTitle={labels.skipIf}
              buyIf={decisionGuide.buyIf}
              skipIf={decisionGuide.skipIf}
            />
          </div>
        ) : null}
      </article>

      <article className="igz-card border-amazon/20 bg-orange-50/40 p-5">
        <p className="text-xs font-semibold tracking-[0.14em] text-amazon uppercase">
          {labels.buyerTitle}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {labels.buyerSubtitle}
        </p>
        {typeof amazonRating === "number" ? (
          <div className="mt-5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-amazon">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={`h-5 w-5 ${
                      index < Math.round(amazonRating)
                        ? "fill-current"
                        : "opacity-30"
                    }`}
                  />
                ))}
              </div>
              <p className="font-display text-2xl font-bold text-primary">
                {amazonRating.toFixed(1)}/5
              </p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {labels.amazonRating}
              {amazonReviewCount > 0
                ? ` · ${amazonReviewCount.toLocaleString(numberLocale)} ${labels.amazonReviews}`
                : ""}
            </p>
            <div className="mt-4 h-2 rounded-full bg-white/80">
              <div
                className="h-2 rounded-full bg-amazon"
                style={{
                  width: `${Math.min((amazonRating / 5) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">{labels.noAmazon}</p>
        )}
      </article>
    </section>
  );
}
