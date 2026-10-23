import type { Config } from "tailwindcss";

// Soltani Intelligence brand tokens — see src/content/brand.md
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#060B18", // deepest background (space)
        midnight: "#101B2D", // brand Midnight Navy
        navy: "#16233A",
        slate: "#22324F",
        gold: {
          DEFAULT: "#CBAF7E", // brand Champagne Gold
          light: "#E3CFA6",
          dim: "#8C7650",
        },
        teal: {
          DEFAULT: "#4C9DAB", // brand Digital Teal
          light: "#7CC4CF",
          dim: "#2D6570",
        },
        mint: "#7FE3C9", // SI Labs accent
        paper: "#F7F8FA", // brand Soft White
        mist: "#9AA7BD", // muted body text on dark
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
        arabic: ["var(--font-arabic)", "serif"],
      },
      letterSpacing: {
        brand: "0.32em",
      },
    },
  },
  plugins: [],
};
export default config;
