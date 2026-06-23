/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,vue,md,mdx}"],
  theme: {
    extend: {
      colors: {
        sol: {
          50: "#e6f7ed",
          100: "#b3e8c8",
          200: "#80d9a3",
          300: "#4dca7e",
          400: "#26bf64",
          500: "#00b34a",
          600: "#008f3b",
          700: "#006b2c",
          800: "#00471d",
          900: "#021a0b",
          950: "#010d06",
        },
        gold: {
          300: "#ffe082",
          400: "#ffd54f",
          500: "#ffb300",
          600: "#ff8f00",
        },
      },
      fontFamily: {
        display: ["Outfit", "sans-serif"],
        body: ["Space Grotesk", "sans-serif"],
      },
    },
  },
  // Classes générées dynamiquement (états couleur du toast, etc.) → on les protège
  // pour qu'elles ne soient pas purgées par Tailwind.
  safelist: [
    "bg-red-900/90",
    "border-red-500/30",
    "text-red-400",
    "page-fade",
  ],
  plugins: [],
};
