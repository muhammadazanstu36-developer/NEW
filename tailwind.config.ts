import type { Config } from "tailwindcss";

const color = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      screens: { nav: "1024px" },
      colors: {
        bg: color("bg"),
        panel: color("panel"),
        ink: color("ink"),
        mute: color("mute"),
        line: color("line"),
        soft: color("soft"),
        accent: color("accent"),
        "accent-ink": color("accent-ink"),
        hl: color("hl"),
        err: color("err")
      },
      fontFamily: {
        sans: ['"Manrope Variable"', "system-ui", "sans-serif"],
        serif: ['"Source Serif 4"', "Georgia", "serif"]
      },
      backgroundImage: { brand: "var(--grad)" },
      boxShadow: {
        glow: "0 8px 20px -8px var(--glow)",
        "glow-lg": "0 14px 26px -8px var(--glow)",
        card: "0 1px 2px var(--shadow), 0 8px 24px -12px var(--shadow)"
      },
      keyframes: { shimmer: { to: { backgroundPosition: "-200% 0" } } },
      animation: { shimmer: "shimmer 1.3s linear infinite" }
    }
  },
  plugins: []
};
export default config;
