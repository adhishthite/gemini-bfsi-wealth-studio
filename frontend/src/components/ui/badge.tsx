import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badges carry no hue.
 *
 * Every variant key from the old retail palette is kept so existing call
 * sites keep compiling, but the amber / emerald / rose / indigo / purple /
 * blue system is gone. Asset classes are told apart by their words; risk
 * bands are told apart by WEIGHT and RULE STRENGTH — a heavier badge is a
 * riskier one. Only `gold` carries the single accent, and it is meant to
 * appear once on a screen.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-label transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground font-semibold",
        secondary:
          "border-transparent bg-paper-sunken text-ink font-medium",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground font-semibold",
        outline: "border-rule text-ink-muted font-medium",

        // Asset classes — the label does the work, not a colour chip.
        equity: "border-rule text-ink-muted font-medium",
        debt: "border-rule text-ink-muted font-medium",
        commodities: "border-rule text-ink-muted font-medium",
        hybrid: "border-rule text-ink-muted font-medium",

        // The one accented badge. Spend it once.
        gold: "border-stamp-rule text-stamp font-semibold",

        // Risk ramp: monochrome, encoded in weight and rule strength.
        riskLow: "border-rule text-ink-faint font-medium",
        riskModerate: "border-rule-strong text-ink-muted font-semibold",
        riskHigh: "border-ink-strong text-ink-strong font-semibold",

        tag: "border-transparent bg-paper-sunken text-ink-muted font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
