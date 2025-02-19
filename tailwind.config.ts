import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        beforest: {
          // Primary Colors
          'earth': '#342e29',
          'red': '#86312b',
          'green': '#344736',
          'blue': '#002140',
          
          // Secondary & Accent Colors
          'brown': '#4b3c35',
          'burnt': '#9e3430',
          'olive': '#415c43',
          'navy': '#00385e',
          'yellow': '#ffc083',
          'coral': '#ff774a',
          'soft-green': '#b8dc99',
          'light-blue': '#b0ddf1',
          
          // Neutral Colors
          'charcoal': '#51514d',
          'gray': '#e7e4df',
          'offwhite': '#fdfbf7',
        },
      },
      fontFamily: {
        'arizona': ['ABC Arizona Flare', 'serif'],
        'arizona-sans': ['ABC Arizona Flare Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
