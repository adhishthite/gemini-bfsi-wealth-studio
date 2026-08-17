import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        equity: "bg-indigo-50 text-indigo-700 border-indigo-200",
        debt: "bg-emerald-50 text-emerald-700 border-emerald-200",
        commodities: "bg-amber-50 text-amber-800 border-amber-200",
        hybrid: "bg-purple-50 text-purple-700 border-purple-200",
        gold: "bg-amber-100/70 text-amber-900 border-amber-300",
        riskLow: "bg-emerald-50 text-emerald-700 border-emerald-200",
        riskModerate: "bg-amber-50 text-amber-700 border-amber-200",
        riskHigh: "bg-rose-50 text-rose-700 border-rose-200",
        tag: "bg-blue-50 text-blue-700 border-blue-100",
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
