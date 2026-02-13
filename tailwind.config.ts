import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        border: "var(--border)",
        "border-accent": "var(--border-accent)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-muted": "var(--accent-muted)",
        "accent-subtle": "var(--accent-subtle)",
        destructive: "var(--destructive)",
        success: "var(--success)",
        warning: "var(--warning)",
        "surface-hover": "var(--surface-hover)",
      },
    },
  },
  plugins: [],
} satisfies Config;
