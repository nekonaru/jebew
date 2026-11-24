import type { Config } from "tailwindcss";

const konfigurasi: Config = {
  content: ["./app/**/*.{ts,tsx}", "./komponen/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        utama: { DEFAULT: "#C2412C", gelap: "#9E3322", terang: "#E15A42" },
        aksen: { DEFAULT: "#E08A2E", terang: "#F3AE5C" },
        latar: "#FBF7F2",
        permukaan: "#FFFFFF",
        tinta: { DEFAULT: "#2B1C16", lemah: "#6E5A4D" },
        garis: "#E8DED3",
        sukses: { DEFAULT: "#24613F", terang: "#E6F4EC" },
        bahaya: "#B42318",
        info: "#2563EB",
      },
      fontFamily: {
        judul: ["var(--font-judul)", "Georgia", "serif"],
        isi: ["var(--font-isi)", "Segoe UI", "system-ui", "sans-serif"],
      },
      boxShadow: {
        kartu: "0 1px 2px rgba(43,28,22,.04), 0 8px 24px rgba(43,28,22,.06)",
        angkat: "0 12px 32px rgba(43,28,22,.12)",
      },
      borderRadius: {
        kartu: "16px",
      },
      keyframes: {
        masuk: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        geser: {
          from: { opacity: "0", transform: "translateX(10px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        masuk: "masuk .35s ease-out both",
        geser: "geser .25s ease-out both",
      },
    },
  },
  plugins: [],
};

export default konfigurasi;
