import type { Config } from "tailwindcss";

const konfigurasi: Config = {
  content: ["./app/**/*.{ts,tsx}", "./komponen/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warna identitas dari lembar merek Jebew.
        bata: "#D8432B",
        oranye: "#F29A2E",
        krem: "#FFF1D6",
        coklat: "#3A2218",
        hijau: "#2E9E5B",
        // Turunan identitas yang memenuhi kontras untuk teks di atas warna.
        utama: { DEFAULT: "#C2412C", gelap: "#9E3322", terang: "#E15A42" },
        aksen: { DEFAULT: "#F29A2E", terang: "#F5B05C" },
        latar: "#FFF1D6",
        permukaan: "#FFFFFF",
        tinta: { DEFAULT: "#3A2218", lemah: "#6E5A4D" },
        garis: "#EADCC3",
        sukses: { DEFAULT: "#24613F", terang: "#E6F4EC" },
        bahaya: "#B42318",
        info: "#2563EB",
      },
      fontFamily: {
        judul: ["Poppins", "Segoe UI", "system-ui", "sans-serif"],
        isi: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
      },
      boxShadow: {
        kartu: "0 1px 2px rgba(58,34,24,.04), 0 8px 24px rgba(58,34,24,.06)",
        angkat: "0 12px 32px rgba(58,34,24,.12)",
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
