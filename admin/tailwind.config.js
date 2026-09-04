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
    },
  },
  plugins: [],
};
