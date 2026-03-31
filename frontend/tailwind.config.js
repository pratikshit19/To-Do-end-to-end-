export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        card: "var(--card-bg)",
        border: "var(--border)",
        primary: "var(--primary)",
        accent: "var(--accent)",
        textPrimary: "var(--text-primary)",
        textSecondary: "var(--text-secondary)",
      },
      borderRadius: {
        xl2: "18px",
      },
    },
  },
};