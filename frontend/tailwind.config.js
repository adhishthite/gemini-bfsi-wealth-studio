/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          purple: "#7C3AED",
          pink: "#EC4899",
          ink: "#1B1320",
          plum: "#3B1D52",
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(115deg, #7C3AED 0%, #9333EA 45%, #EC4899 100%)",
      },
      boxShadow: {
        soft: "0 2px 8px -2px rgba(27,19,32,0.08), 0 8px 28px -8px rgba(27,19,32,0.12)",
        glass: "0 8px 32px -8px rgba(124,58,237,0.22)",
        lift: "0 12px 40px -12px rgba(27,19,32,0.22)",
      },
      borderRadius: { xl2: "1.25rem" },
      keyframes: {
        "fade-up": { "0%": { opacity: 0, transform: "translateY(8px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        "scale-in": { "0%": { opacity: 0, transform: "scale(.96)" }, "100%": { opacity: 1, transform: "scale(1)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "pulse-ring": { "0%": { transform: "scale(.95)", opacity: .7 }, "70%,100%": { transform: "scale(1.25)", opacity: 0 } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-5px)" } },
      },
      animation: {
        "fade-up": "fade-up .35s ease-out both",
        "scale-in": "scale-in .25s ease-out both",
        shimmer: "shimmer 1.6s infinite",
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
