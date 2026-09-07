// Reads each brand shade from a CSS custom property (set in src/index.css,
// overridden at runtime by src/utils/theme.ts) instead of a fixed hex, so
// the whole portal can be recolored from a single picked color with no
// rebuild. The `<alpha-value>` placeholder keeps Tailwind's opacity
// modifiers (e.g. `bg-brand-600/50`) working.
function brandShade(variableName) {
  return `rgb(var(${variableName}) / <alpha-value>)`;
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: brandShade("--brand-50"),
          100: brandShade("--brand-100"),
          200: brandShade("--brand-200"),
          300: brandShade("--brand-300"),
          400: brandShade("--brand-400"),
          500: brandShade("--brand-500"),
          600: brandShade("--brand-600"),
          700: brandShade("--brand-700"),
          800: brandShade("--brand-800"),
          900: brandShade("--brand-900"),
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, rgb(var(--brand-500)) 0%, rgb(var(--brand-700)) 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, rgb(var(--brand-400) / 0.16) 0%, rgb(var(--brand-600) / 0.06) 100%)",
        "mesh-light":
          "radial-gradient(at 15% 0%, rgb(var(--brand-200) / 0.35) 0px, transparent 45%), radial-gradient(at 85% 15%, rgb(var(--brand-300) / 0.25) 0px, transparent 40%), radial-gradient(at 50% 100%, rgb(var(--brand-100) / 0.4) 0px, transparent 50%)",
        "sidebar-gradient": "linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)",
        shimmer: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -8px rgba(15, 23, 42, 0.08)",
        elevated: "0 4px 10px rgba(15, 23, 42, 0.06), 0 16px 40px -12px rgba(15, 23, 42, 0.14)",
        glow: "0 8px 24px -6px rgb(var(--brand-600) / 0.45)",
        "glow-lg": "0 12px 32px -8px rgb(var(--brand-600) / 0.5)",
        "inner-top": "inset 0 1px 0 0 rgba(255,255,255,0.6)",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0, transform: "translateY(4px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        scaleIn: { from: { opacity: 0, transform: "scale(0.96)" }, to: { opacity: 1, transform: "scale(1)" } },
        shimmer: { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
      },
      animation: {
        "fade-in": "fadeIn 0.35s ease-out",
        "scale-in": "scaleIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 1.8s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
