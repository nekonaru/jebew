"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Tombol } from "./ui.tsx";

const navigasi = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/bahan", label: "Bahan baku" },
  { href: "/admin/menu", label: "Menu & resep" },
  { href: "/admin/kasir", label: "Kasir" },
  { href: "/admin/laporan", label: "Laporan" },
  { href: "/admin/preorder", label: "Pre-order" },
];

export default function PanelAdmin({
  children,
  namaUsaha,
}: {
  children: ReactNode;
  namaUsaha: string;
}) {
  const jalur = usePathname();
  const router = useRouter();

  async function keluar() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-tepi bg-white lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-5 py-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/jebew-icon.svg" alt="" width={40} height={40} />
          <div>
            <p className="font-judul font-semibold">{namaUsaha}</p>
            <p className="text-xs text-coklatMuda">Dashboard admin</p>
          </div>
        </div>
        <nav aria-label="Navigasi admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {navigasi.map((item) => {
            const aktif = jalur === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={aktif ? "page" : undefined}
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium ${
                  aktif ? "bg-bata text-white" : "text-coklatMuda hover:bg-krem hover:text-coklat"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden px-5 pb-5 lg:block">
          <Tombol onClick={() => void keluar()} jenis="sekunder" kelas="w-full">
            Keluar
          </Tombol>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex items-center justify-between gap-4 border-b border-tepi bg-white px-5 py-4">
          <div>
            <h1 className="text-xl font-semibold">Panel pengelolaan</h1>
            <p className="text-xs text-coklatMuda">Prototipe Tahap 1, zona waktu WIB</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-semibold text-bata hover:underline">
              Lihat website
            </Link>
            <div className="lg:hidden">
              <Tombol onClick={() => void keluar()} jenis="sekunder" kelas="min-h-[40px] px-3">
                Keluar
              </Tombol>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
