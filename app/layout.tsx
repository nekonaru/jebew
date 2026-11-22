import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jebew | Stok, Kasir, dan Pre-order",
  description:
    "Aplikasi manajemen stok, pencatatan penjualan, dan pre-order untuk UMKM Mie Jebew.",
  icons: { icon: "/assets/jebew-icon.svg" },
};

export default function LayoutUtama({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
