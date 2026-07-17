import { ArrowRight, ExternalLink, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  label: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline" | "amazon";
  showCart?: boolean;
  sublabel?: string;
};

export function CtaButton({
  href,
  label,
  className,
  size = "md",
  variant = "primary",
  showCart,
  sublabel,
}: Props) {
  const isAmazon = variant === "amazon";
  const displayCart = showCart ?? isAmazon;

  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow sponsored noopener noreferrer"
      className={cn(
        "inline-flex flex-col items-center justify-center gap-0.5 rounded-lg font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        variant === "primary" &&
          "bg-primary text-white hover:bg-primary-container focus-visible:outline-primary",
        variant === "secondary" &&
          "bg-secondary text-white hover:bg-secondary-strong focus-visible:outline-secondary",
        variant === "outline" &&
          "border border-secondary bg-transparent text-secondary hover:bg-secondary/5 focus-visible:outline-secondary",
        isAmazon &&
          "bg-amazon text-amazon-dark shadow-sm hover:bg-amazon-hover focus-visible:outline-amazon",
        size === "sm" && "px-3 py-2 text-sm",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-5 py-3 text-base",
        sublabel && size === "lg" && "py-2.5",
        className,
      )}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {displayCart ? (
          <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden />
        ) : null}
        {label}
        {isAmazon ? (
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        ) : !displayCart ? (
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
        ) : null}
      </span>
      {sublabel ? (
        <span
          className={cn(
            "text-[10px] font-medium leading-tight",
            isAmazon ? "text-amazon-dark/75" : "text-white/80",
          )}
        >
          {sublabel}
        </span>
      ) : null}
    </a>
  );
}
