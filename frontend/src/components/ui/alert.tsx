import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Alerts carry no hue either.
 *
 * The old amber / emerald / blue trio is collapsed onto the ink system:
 * severity is a LEFT RULE and a type weight, not a coloured panel. Variant
 * keys are preserved so call sites keep compiling. `destructive` stays
 * chromatic because a genuine failure is the one place a warm hue earns its
 * place — and it is deliberately desaturated.
 */
const alertVariants = cva(
  "relative w-full rounded-lg border border-rule bg-paper-sheet p-4 text-xs text-ink [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-ink-muted",
  {
    variants: {
      variant: {
        default: "",
        destructive:
          "border-destructive text-destructive [&>svg]:text-destructive",
        // Needs attention: a heavy left rule, the way a margin mark works.
        warning:
          "border-l-[3px] border-l-ink-strong text-ink-strong [&>svg]:text-ink-strong",
        // Settled / on track: quiet. The seal lives on the document itself.
        success: "bg-paper-sunken text-ink [&>svg]:text-ink-muted",
        info: "text-ink-muted [&>svg]:text-ink-faint",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-bold leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs leading-relaxed [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
