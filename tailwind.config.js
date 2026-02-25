/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          base: "#0f172a",
          raised: "#1e293b",
          overlay: "#334155",
        },
        accent: {
          primary: "#6366f1",
          hover: "#818cf8",
          muted: "#312e81",
        },
        text: {
          primary: "#f1f5f9",
          secondary: "#94a3b8",
          muted: "#475569",
        },
      },
    },
  },
  plugins: [],
};
