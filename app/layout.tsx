import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const judul = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-judul",
  display: "swap",
});

const isi = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-isi",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mie Jebew | Warung Kak Ikaa",
  description: "Sistem stok, kasir, laporan, dan pre-order Warung Kak Ikaa.",
  icons: { icon: "/assets/jebew-icon.svg" },
};

export default function LayoutUtama({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${judul.variable} ${isi.variable}`}>
      <body>{children}</body>
    </html>
  );
}
