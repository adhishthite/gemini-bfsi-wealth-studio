import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Buttons do not glow, gradient or lift. The feedback is a tone change.
 *
 * All previous variant keys are kept so call sites keep compiling, but the
 * gradients are gone: `wealth` is now solid ink, `success` is neutral, and
 * `gold` has become THE accent — the banker's stamp. `gold` is the primary
 * action on a screen and there should be at most one of it in view.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover",
        outline:
          "border border-rule bg-transparent text-ink hover:border-rule-strong hover:bg-paper-sunken",
        secondary:
          "bg-paper-sunken text-ink-strong hover:bg-paper-edge",
        ghost: "text-ink hover:bg-paper-sunken hover:text-ink-strong",
        link: "text-ink-strong underline-offset-4 hover:underline",

        // Solid ink. The old navy gradient is gone.
        wealth: "bg-ink-strong text-paper-sheet hover:bg-ink",

        // THE accent. The one action that matters on a screen.
        gold: "bg-stamp text-stamp-foreground hover:bg-stamp-strong",

        // Neutralised — an authorised outcome is expressed as a sealed
        // document, not as a green button.
        success:
          "border border-rule bg-paper-sunken text-ink-strong hover:bg-paper-edge",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 px-6 text-sm",
        icon: "h-9 w-9",
        iconSm: "h-7 w-7 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
