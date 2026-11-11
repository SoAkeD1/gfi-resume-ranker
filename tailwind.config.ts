import type { Config } from "tailwindcss";

// Design tokens from the "Resume Ranker Redesign" canvas:
// paper + ink, forest green for LCA, plum (violet) for UI/UX, ochre for "needs a look", rust for errors.
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F6F4EE",
        soft: "#FBFAF7",
        stone: "#F1EFE9",
        line: { DEFAULT: "#E4E1D8", soft: "#EEECE6", strong: "#D6D2C7" },
        ink: { DEFAULT: "#17201B", 2: "#33403A", muted: "#4A524C", subtle: "#5A625C" },
        forest: { DEFAULT: "#1E5B44", dark: "#184C38", deep: "#123B2C", tint: "#E8F1EC", pale: "#F3F8F5", mid: "#8DB5A0", ring: "#CFE3D7" },
        plum: { DEFAULT: "#5A3EA6", text: "#4B3290", tint: "#EFEBFA" },
        ochre: { DEFAULT: "#8A5300", deep: "#6E4300", tint: "#FBF1DE", line: "#EED9AE", bar: "#D69A2D" },
        rust: { DEFAULT: "#A93A2E", text: "#8E2F25", tint: "#FBEDEA", line: "#F1CFC8" },
        note: { text: "#1F4766", tint: "#EAF2F8", line: "#CADBE8" },
        leaf: "#7FA338",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        lift: "0 8px 20px rgba(23,32,27,.14)",
        soft: "0 10px 30px rgba(23,32,27,.08)",
        inset: "inset 0 1px 0 rgba(255,255,255,.18)",
      },
    },
  },
  plugins: [],
};
export default config;
