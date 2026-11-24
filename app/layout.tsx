import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Warung Kak Ikaa | Mie Jebew Chili Oil",
  description: "Sistem stok, kasir, laporan, dan pre-order Warung Kak Ikaa.",
  icons: { icon: "/assets/jebew-icon.svg" },
};

export default function LayoutUtama({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
