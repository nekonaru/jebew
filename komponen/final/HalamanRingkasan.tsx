"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/format.ts";
import { ambilJson } from "@/komponen/api-klien.ts";
import { tautanWhatsApp } from "@/lib/wa.ts";
import { usePeran } from "./Panel.tsx";
import { Badge, Judul, Kartu, Pesan, RangkaDaftar, Statistik, Tombol } from "./ui.tsx";
import GrafikOmzet, { type TitikOmzet } from "./GrafikOmzet.tsx";

type Ringkasan = {
  omzet: number;
  transaksi: number;
  pengeluaran: number;
  preorderAktif: number;
  bahanTipis: number;
  menuTotal: number;
  nilaiStok: number;
  omzetKemarin: number;
  transaksiKemarin: number;
  tren: TitikOmzet[];
  bahanMenipis: { id: number; nama: string; satuan: string; stok: number; stok_minimum: number }[];
  terlaris: { nama: string; varian: string; jumlah: number; omzet: number }[];
};
type InfoStatus = { buka: boolean; label: string; keterangan: string };
type Publik = {
  pengaturan: {
    nama_usaha?: string;
    whatsapp_admin?: string;
    toko_aktif?: string;
    preorder_aktif?: string;
    status_toko?: InfoStatus;
    status_preorder?: InfoStatus;
    jam_buka?: string; jam_tutup?: string;
    preorder_jam_buka?: string; preorder_jam_tutup?: string;
  };
};

const PINTASAN = [
  { href: "/admin/kasir", label: "Buka kasir", warna: "bg-utama" },
  { href: "/admin/stok", label: "Kelola stok", warna: "bg-aksen" },
  { href: "/admin/menu", label: "Atur menu", warna: "bg-sukses" },
  { href: "/admin/preorder", label: "Olah pre-order", warna: "bg-info" },
  { href: "/admin/riwayat", label: "Lihat riwayat", warna: "bg-hijau" },
];

export default function HalamanRingkasan() {
  const pemilik = usePeran() === "pemilik";
  const [statistik, setStatistik] = useState<Ringkasan | null>(null);
  const [publik, setPublik] = useState<Publik | null>(null);
  const [pesan, setPesan] = useState("");
  const [gagal, setGagal] = useState(false);
  const [statusSibuk, setStatusSibuk] = useState(false);

  const muatPublik = () => fetch("/api/dashboard").then(ambilJson<Publik>).then(setPublik);

  useEffect(() => {
    void fetch("/api/statistik").then(ambilJson<Ringkasan>).then(setStatistik)
      .catch(() => {
        setGagal(true);
        setPesan("Ringkasan tidak berhasil dimuat. Muat ulang halaman untuk mencoba lagi.");
      });
    void muatPublik().catch(() => {});
  }, []);

  async function ubahStatus(kunci: "toko_aktif" | "preorder_aktif", nilai: boolean) {
    if (statusSibuk) return;
    setStatusSibuk(true);
    try {
      const respons = await fetch("/api/pengaturan/status", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kunci, nilai: nilai ? "true" : "false" }),
      });
      await ambilJson(respons);
      setPesan("");
      void muatPublik().catch(() => {});
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Gagal mengubah status");
    } finally { setStatusSibuk(false); }
  }

  return (
    <div className="space-y-6">
      <Judul
        anak={`Selamat datang, ${publik?.pengaturan.nama_usaha ?? "Warung Kak Ikaa"}`}
        sub="Ringkasan aktivitas hari ini dan kondisi dapur Anda."
      />
      <Pesan teks={pesan} jenis="galat" />

      {pemilik && (
        <Kartu>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Status operasional</h2>
              <p className="mt-1 text-xs text-tinta-lemah">Toko dan pre-order memakai jam yang berbeda. Perubahan langsung terlihat di website.</p>
            </div>
            <Link href="/admin/pengaturan" className="text-xs font-semibold text-utama hover:underline">Atur jadwal</Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {([["toko_aktif", "Toko", publik?.pengaturan.toko_aktif, publik?.pengaturan.status_toko, publik?.pengaturan.jam_buka, publik?.pengaturan.jam_tutup],
              ["preorder_aktif", "Pre-order", publik?.pengaturan.preorder_aktif, publik?.pengaturan.status_preorder, publik?.pengaturan.preorder_jam_buka, publik?.pengaturan.preorder_jam_tutup]] as const
            ).map(([kunci, label, aktif, status, mulai, selesai]) => {
              const diaktifkan = aktif !== "false";
              return (
                <div key={kunci} className="rounded-xl border border-garis p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{label}</p>
                    <Badge warna={status?.buka ? "sukses" : "bahaya"}>{status?.label ?? "Memuat..."}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-tinta-lemah">{mulai ?? "-"} - {selesai ?? "-"} WIB</p>
                  <p className="mt-1 text-[11px] text-tinta-lemah">{status?.keterangan ?? ""}</p>
                  <Tombol kelas="mt-3 min-h-[38px] w-full text-xs" nonaktif={statusSibuk}
                    onClick={() => void ubahStatus(kunci, !diaktifkan)}>
                    {diaktifkan ? `Tutup ${label.toLowerCase()}` : `Buka ${label.toLowerCase()}`}
                  </Tombol>
                </div>
              );
            })}
          </div>
        </Kartu>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {pemilik && <Statistik label="Omzet hari ini" nilai={gagal ? "-" : formatRupiah(statistik?.omzet ?? 0)}
          keterangan={gagal ? undefined : `Kemarin ${formatRupiah(statistik?.omzetKemarin ?? 0)}`} aksen />}
        {pemilik && <Statistik label="Transaksi" nilai={gagal ? "-" : String(statistik?.transaksi ?? 0)}
          keterangan={gagal ? undefined : `Kemarin ${statistik?.transaksiKemarin ?? 0} transaksi`} />}
        <Statistik label="Pre-order aktif" nilai={gagal ? "-" : String(statistik?.preorderAktif ?? 0)} keterangan="Perlu ditangani" />
        <Statistik label="Bahan menipis" nilai={gagal ? "-" : String(statistik?.bahanTipis ?? 0)} keterangan="Perlu restock" />
        {pemilik && <Statistik label="Nilai stok" nilai={gagal ? "-" : formatRupiah(statistik?.nilaiStok ?? 0)} keterangan="Bahan aktif" />}
      </div>

      {pemilik && !gagal && <Kartu>
        <GrafikOmzet data={statistik?.tren ?? []} />
      </Kartu>}

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
            <h2 className="text-lg font-semibold">Bahan perlu diisi</h2>
            <Link href="/admin/stok" className="text-xs font-semibold text-utama hover:underline">Kelola stok</Link>
          </div>
          {!statistik ? (
            <div className="mt-5">
              <p className="mb-3 text-center text-xs text-tinta-lemah">Memeriksa stok...</p>
              <RangkaDaftar jumlah={3} />
            </div>
          ) : statistik.bahanMenipis.length === 0 ? (
            <div className="mt-5 rounded-xl bg-latar px-4 py-6 text-center">
              <Badge warna="sukses">Semua stok aman</Badge>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {statistik?.bahanMenipis.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-garis px-3 py-2.5">
                  <span className="truncate text-sm font-medium">{b.nama}</span>
                  <span className="shrink-0 text-xs font-semibold text-bahaya">
                    {b.stok} / {b.stok_minimum} {b.satuan}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge warna="info">Data WIB</Badge>
            {(statistik?.bahanMenipis ?? []).length > 0 && publik?.pengaturan.whatsapp_admin && (
              <a
                href={tautanWhatsApp(
                  publik?.pengaturan.whatsapp_admin ?? "",
                  `Halo, berikut bahan yang perlu segera diisi:\n${
                    (statistik?.bahanMenipis ?? []).map((b) => `- ${b.nama}: ${b.stok} / ${b.stok_minimum} ${b.satuan}`).join("\n")
                  }`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex min-h-[38px] items-center rounded-xl border border-garis px-3 text-xs font-semibold text-sukses transition hover:bg-sukses-terang"
              >
                Kirim daftar via WhatsApp
              </a>
            )}
          </div>
        </Kartu>
      </div>

      {pemilik && <Kartu>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Menu paling laku</h2>
            <p className="mt-1 text-xs text-tinta-lemah">Tujuh hari terakhir, berdasarkan jumlah porsi terjual.</p>
          </div>
          <Link href="/admin/riwayat" className="text-xs font-semibold text-utama hover:underline">Lihat riwayat</Link>
        </div>
        {(statistik?.terlaris ?? []).length === 0 ? (
          <p className="mt-5 rounded-xl bg-latar px-4 py-6 text-center text-sm text-tinta-lemah">Belum ada penjualan pada rentang ini.</p>
        ) : (
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {statistik?.terlaris.map((m, i) => (
              <li key={`${i}-${m.nama}-${m.varian}`} className="rounded-xl border border-garis p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-latar text-[11px] font-bold text-utama">{i + 1}</span>
                  <p className="truncate text-sm font-semibold">{m.nama}</p>
                </div>
                {m.varian && <p className="mt-1 truncate text-[11px] text-tinta-lemah">{m.varian}</p>}
                <p className="mt-3 font-judul text-lg font-semibold">{m.jumlah} porsi</p>
                <p className="text-[11px] text-tinta-lemah">{formatRupiah(m.omzet)}</p>
              </li>
            ))}
          </ol>
        )}
      </Kartu>}
    </div>
  );
}
