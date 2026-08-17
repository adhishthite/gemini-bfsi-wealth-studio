/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // Institutional grotesque. Engineered, neutral, excellent tabular
        // figures — and it has a Devanagari sibling, which matters for an
        // Indian bank.
        sans: ['"IBM Plex Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        // Caslon is the voice of the prospectus, the certificate, the legal
        // instrument. Used only for document moments and section titles.
        display: ['"Libre Caslon Text"', "ui-serif", "Georgia", "serif"],
        serif: ['"Libre Caslon Text"', "ui-serif", "Georgia", "serif"],
        // Reference codes: ISIN, folio, mandate ref, transaction id.
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        // 12px is the ABSOLUTE floor and is reserved for tracked labels.
        label: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.09em" }],
        // 14px is the body floor. `xs` is deliberately raised to the floor so
        // that any surviving `text-xs` still meets the minimum.
        xs: ["0.875rem", { lineHeight: "1.4" }],
        sm: ["0.9375rem", { lineHeight: "1.45" }],
        base: ["1rem", { lineHeight: "1.55" }],
        lg: ["1.125rem", { lineHeight: "1.5" }],
        xl: ["1.375rem", { lineHeight: "1.35" }],
        "2xl": ["1.75rem", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        "3xl": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
        "4xl": ["3rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "5xl": ["4rem", { lineHeight: "1", letterSpacing: "-0.025em" }],
      },
      boxShadow: {
        // Paper does not glow. Panels sit on the page; only true overlays lift.
        none: "none",
        sheet: "0 1px 2px -1px rgba(30, 26, 54, 0.07)",
        raise:
          "0 10px 34px -18px rgba(30, 26, 54, 0.35), 0 1px 0 0 var(--rule)",
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        // NOTE: these are bare `var()` colours, so Tailwind v3 cannot apply
        // an opacity modifier to them — `bg-primary/90` emits nothing at all.
        // Hover tones and scrims are therefore real tokens, not modifiers.
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          hover: "var(--primary-hover)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
          hover: "var(--destructive-hover)",
        },
        // The modal/sheet backdrop. Carries its own alpha internally.
        scrim: "var(--scrim)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },

        // ---- The mandate palette -------------------------------------
        // Paper: the ground and the sheets that sit on it.
        paper: {
          DEFAULT: "var(--paper)",
          sheet: "var(--paper-sheet)",
          sunken: "var(--paper-sunken)",
          edge: "var(--paper-edge)",
        },
        // Ink: the ONLY way ordinary state is expressed. Weight and position,
        // not hue.
        ink: {
          DEFAULT: "var(--ink)",
          strong: "var(--ink-strong)",
          muted: "var(--ink-muted)",
          faint: "var(--ink-faint)",
        },
        rule: {
          DEFAULT: "var(--rule)",
          strong: "var(--rule-strong)",
        },
        // Stamp: the single accent. Banker's attestation ink. Appears roughly
        // ONCE per screen, on the one action or fact that matters.
        stamp: {
          DEFAULT: "var(--stamp)",
          strong: "var(--stamp-strong)",
          rule: "var(--stamp-rule)",
          wash: "var(--stamp-wash)",
          foreground: "var(--stamp-foreground)",
        },
        // Legacy retail/multi-hue keys, deliberately collapsed onto the new
        // system so stale references degrade into the palette instead of
        // reintroducing amber/emerald/rose.
        wealth: {
          navy: "var(--ink-strong)",
          gold: "var(--stamp)",
          emerald: "var(--ink-muted)",
          surface: "var(--paper-sheet)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 1px)",
        sm: "calc(var(--radius) - 2px)",
      },
      spacing: {
        gutter: "var(--gutter)",
        rhythm: "var(--rhythm)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        rise: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        rise: "rise 0.55s cubic-bezier(0.2, 0.7, 0.3, 1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
