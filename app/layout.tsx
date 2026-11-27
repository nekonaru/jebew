import type { Metadata } from "next";
import PendaftarSW from "@/komponen/PendaftarSW.tsx";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mie Jebew | Warung Kak Ikaa",
  description: "Pesan mie hangat dan chili oil dari Warung Kak Ikaa. Stok, kasir, dan pre-order keluarga.",
  applicationName: "Jebew",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/assets/jebew-icon.svg" },
  appleWebApp: { capable: true, title: "Jebew", statusBarStyle: "default" },
  openGraph: {
    title: "Mie Jebew | Warung Kak Ikaa",
    description: "Pesan mie hangat dan chili oil dengan mudah.",
    type: "website",
    locale: "id_ID",
  },
  other: { "theme-color": "#D8432B" },
};

export default function LayoutUtama({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <a href="#konten-utama" className="lewati">Lompat ke konten utama</a>
        <PendaftarSW />
        {children}
      </body>
    </html>
  );
}
