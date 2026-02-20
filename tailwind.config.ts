import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--background)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--background)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "white",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--secondary)",
        },
        border: "var(--border)",
        card: {
          DEFAULT: "var(--background)",
          foreground: "var(--foreground)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        serif: ["var(--font-geist-mono)", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
