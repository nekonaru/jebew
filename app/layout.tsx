import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Warung Kak Ikaa | Pre-order Mie Jebew Chili Oil",
  description:
    "Pilih menu Mie Jebew Chili Oil dan Wonton Ayam, lalu kirim pre-order langsung ke WhatsApp Warung Kak Ikaa.",
  icons: { icon: "/assets/jebew-icon.svg" },
};

export default function LayoutUtama({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
