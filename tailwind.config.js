/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "studio-bg": "#020617", // koyu arka plan
      },
      boxShadow: {
        neon: "0 0 40px rgba(56,189,248,0.45)",
      },
    },
  },
  plugins: [],
};
