"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/format.ts";
import { ambilJson } from "@/komponen/api-klien.ts";
import { Badge, Judul, Kartu, Statistik } from "./ui.tsx";

type Ringkasan = {
  omzet: number;
  transaksi: number;
  pengeluaran: number;
  preorderAktif: number;
  bahanTipis: number;
  menuTotal: number;
};
type Publik = { pengaturan: Record<string, string> };

const PINTASAN = [
  { href: "/admin/kasir", label: "Buka kasir", warna: "bg-utama" },
  { href: "/admin/stok", label: "Kelola stok", warna: "bg-aksen" },
  { href: "/admin/menu", label: "Atur menu", warna: "bg-sukses" },
  { href: "/admin/preorder", label: "Olah pre-order", warna: "bg-info" },
];

export default function HalamanRingkasan() {
  const [statistik, setStatistik] = useState<Ringkasan | null>(null);
  const [publik, setPublik] = useState<Publik | null>(null);

  useEffect(() => {
    void fetch("/api/statistik").then(ambilJson<Ringkasan>).then(setStatistik).catch(() => {});
    void fetch("/api/dashboard").then(ambilJson<Publik>).then(setPublik).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <Judul
        anak={`Selamat datang, ${publik?.pengaturan.nama_usaha ?? "Warung Kak Ikaa"}`}
        sub="Ringkasan aktivitas hari ini dan kondisi dapur Anda."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Statistik label="Omzet hari ini" nilai={formatRupiah(statistik?.omzet ?? 0)} aksen />
        <Statistik label="Transaksi" nilai={String(statistik?.transaksi ?? 0)} keterangan="Hari ini" />
        <Statistik label="Pre-order aktif" nilai={String(statistik?.preorderAktif ?? 0)} keterangan="Perlu ditangani" />
        <Statistik label="Bahan menipis" nilai={String(statistik?.bahanTipis ?? 0)} keterangan="Perlu restock" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Kartu>
          <h2 className="text-lg font-semibold">Aksi cepat</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {PINTASAN.map((p) => (
              <Link key={p.href} href={p.href}
                className="group flex items-center gap-3 rounded-xl border border-garis p-4 transition hover:-translate-y-0.5 hover:shadow-kartu">
                <span className={`h-9 w-1.5 rounded-full ${p.warna}`} />
                <span className="text-sm font-semibold">{p.label}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true" className="ml-auto h-4 w-4 text-tinta-lemah transition-transform duration-[var(--gerak-standar)] group-hover:translate-x-1">
                  <path d="M5 12h14m-6-6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-latar px-4 py-3 text-sm">
            Menu aktif: <strong>{statistik?.menuTotal ?? 0}</strong> menu. Kelola menu di halaman Menu dan Resep.
          </div>
        </Kartu>

        <Kartu>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Menu paling laku</h2>
            <Link href="/admin/laporan" className="text-xs font-semibold text-utama hover:underline">Laporan</Link>
          </div>
          <p className="mt-3 text-sm text-tinta-lemah">
            Buka halaman laporan untuk melihat menu terlaris, HPP, dan laba bersih.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge warna="sukses">Stok terkontrol</Badge>
            <Badge warna="info">WIB</Badge>
          </div>
        </Kartu>
      </div>
    </div>
  );
}
