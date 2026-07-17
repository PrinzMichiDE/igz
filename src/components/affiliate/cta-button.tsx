import { ExternalLink, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  label: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline";
  showCart?: boolean;
};

export function CtaButton({
  href,
  label,
  className,
  size = "md",
  variant = "primary",
  showCart = false,
}: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow sponsored noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        variant === "primary" &&
          "bg-primary text-white hover:bg-primary-container focus-visible:outline-primary",
        variant === "secondary" &&
          "bg-secondary text-white hover:bg-secondary-strong focus-visible:outline-secondary",
        variant === "outline" &&
          "border border-secondary bg-transparent text-secondary hover:bg-secondary/5 focus-visible:outline-secondary",
        size === "sm" && "px-3 py-2 text-sm",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-5 py-3 text-base",
        className,
      )}
    >
      {showCart ? <ShoppingCart className="h-4 w-4" aria-hidden /> : null}
      {label}
      {!showCart ? <ExternalLink className="h-4 w-4" aria-hidden /> : null}
    </a>
  );
}
