"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { Peran } from "@/lib/auth.ts";

const NAV = [
  { href: "/admin", label: "Ringkasan", ikon: "M3 12l9-9 9 9M5 10v10h14V10" },
  { href: "/admin/stok", label: "Bahan & Stok", ikon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m-8-14l8 4m-8-4v10l8 4m0-10v10" },
  { href: "/admin/menu", label: "Menu & Resep", ikon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/admin/kasir", label: "Kasir", ikon: "M3 5h18v14H3zM7 9h10M7 13h6" },
  { href: "/admin/laporan", label: "Laporan", ikon: "M4 19V9m6 10V5m6 14v-7m4 7H2" },
  { href: "/admin/preorder", label: "Pre-order", ikon: "M6 2h9l5 5v15H6zM15 2v5h5" },
  { href: "/admin/keuangan", label: "Keuangan", ikon: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
  { href: "/admin/pengaturan", label: "Pengaturan", ikon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 00-1.7-1L14.5 3h-4l-.3 2.5a7 7 0 00-1.7 1l-2.4-1-2 3.5L6.1 11a7 7 0 000 2l-2 1.5 2 3.5 2.4-1a7 7 0 001.7 1l.3 2h4l.3-2a7 7 0 001.7-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1z" },
];

export default function Panel({
  children, nama, peran,
}: { children: ReactNode; nama: string; peran: Peran }) {
  const jalur = usePathname();
  const router = useRouter();

  async function keluar() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  const item = NAV.filter((n) => n.href !== "/admin/pengaturan" || peran === "pemilik");

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-b border-garis bg-permukaan lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-5 py-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/jebew-icon.svg" alt="" width={42} height={42} />
          <div className="min-w-0">
            <p className="truncate font-judul text-base font-semibold">Warung Kak Ikaa</p>
            <p className="text-[11px] text-tinta-lemah">Panel pengelolaan</p>
          </div>
        </div>
        <nav aria-label="Navigasi utama" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0">
          {item.map((n) => {
            const aktif = jalur === n.href;
            return (
              <Link key={n.href} href={n.href}
                aria-current={aktif ? "page" : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  aktif ? "bg-utama text-white" : "text-tinta-lemah hover:bg-latar hover:text-tinta"
                }`}>
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0 fill-none stroke-current stroke-2">
                  <path d={n.ikon} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden px-4 py-5 lg:block">
          <div className="mb-3 rounded-xl bg-latar px-3 py-2.5">
            <p className="text-xs font-semibold">{nama}</p>
            <p className="text-[11px] capitalize text-tinta-lemah">{peran === "pemilik" ? "Pemilik" : "Kasir"}</p>
          </div>
          <button onClick={() => void keluar()}
            className="w-full rounded-xl border border-garis px-3 py-2 text-sm font-semibold text-tinta-lemah transition hover:bg-latar">
            Keluar
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex items-center justify-between gap-4 border-b border-garis bg-permukaan px-5 py-3">
          <div className="lg:hidden">
            <p className="font-judul font-semibold">Warung Kak Ikaa</p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <a href="/" className="text-sm font-semibold text-utama hover:underline">Lihat website</a>
            <button onClick={() => void keluar()} className="text-sm text-tinta-lemah lg:hidden">Keluar</button>
            <span className="hidden text-sm text-tinta-lemah sm:inline">{nama}</span>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
