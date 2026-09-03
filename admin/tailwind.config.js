/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Configurable brand colors (§26 of the brief) — swap these to
        // rebrand the whole portal without touching component code.
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          400: "#60a5fa",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
          900: "#1e3a8a",
        },
      },
    },
  },
  plugins: [],
};
