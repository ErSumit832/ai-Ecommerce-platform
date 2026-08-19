/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12151A",       // primary dark background
        slate: {
          DEFAULT: "#1B2027", // card / surface on dark
          light: "#252B34",
        },
        fog: "#8B95A1",       // secondary text on dark
        paper: "#F0F2F5",     // light section background
        copper: {
          DEFAULT: "#E08D4B", // primary accent — circuit-trace copper
          light: "#F0AD70",
          dark: "#B96F35",
        },
        signal: {
          DEFAULT: "#4FD1C5", // secondary accent — data/AI teal
          dark: "#38A79D",
        },
        line: "#2C333D",      // hairline / divider on dark
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'IBM Plex Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      backgroundImage: {
        "circuit-fade": "linear-gradient(180deg, rgba(224,141,75,0.08) 0%, rgba(224,141,75,0) 100%)",
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};
