import type { Config } from "tailwindcss";

const konfigurasi: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./komponen/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bata: "#D8432B",
        bataGelap: "#B93320",
        oranye: "#F29A2E",
        krem: "#FFF1D6",
        kremMuda: "#FFF9EE",
        coklat: "#3A2218",
        coklatMuda: "#7A5A44",
        sukses: "#2E9E5B",
        tepi: "#E8D5AE",
      },
      fontFamily: {
        judul: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
        isi: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        kartu: "0 8px 24px rgba(58, 34, 24, 0.07)",
      },
    },
  },
  plugins: [],
};

export default konfigurasi;
