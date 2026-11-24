"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatRupiah, tanggalHariIni } from "@/lib/format.ts";
import { Kartu, Penanda } from "./ui.tsx";
import { ambilJson } from "./api-klien.ts";

type Ringkasan = {
  omzet: number;
  jumlahTransaksi: number;
  menuTerlaris: { nama: string; jumlah: number } | null;
};

type Bahan = { id: number; nama: string; satuan: string; stok: number; stok_minimum: number; menipis: boolean };
type Menu = { id: number; nama: string; tersedia: boolean; porsi: number };
type Preorder = { id: number; kode: string; nama_pelanggan: string; status: string; total: number };

const tautanCepat = [
  { href: "/admin/kasir", label: "Catat penjualan" },
  { href: "/admin/bahan", label: "Tambah stok bahan" },
  { href: "/admin/menu", label: "Atur menu dan resep" },
  { href: "/admin/preorder", label: "Olah pre-order" },
];

export default function RingkasanAdmin() {
  const [ringkasan, setRingkasan] = useState<Ringkasan | null>(null);
  const [bahan, setBahan] = useState<Bahan[]>([]);
  const [menu, setMenu] = useState<Menu[]>([]);
  const [preorder, setPreorder] = useState<Preorder[]>([]);

  useEffect(() => {
    const hariIni = tanggalHariIni();
    void Promise.all([
      fetch(`/api/laporan?dari=${hariIni}&sampai=${hariIni}`).then(ambilJson<{ ringkasan: Ringkasan }>),
      fetch("/api/bahan").then(ambilJson<{ bahan: Bahan[] }>),
      fetch("/api/menu").then(ambilJson<{ menu: Menu[] }>),
      fetch("/api/preorder").then(ambilJson<{ preorder: Preorder[] }>),
    ]).then(([dataLaporan, dataBahan, dataMenu, dataPreorder]) => {
      setRingkasan(dataLaporan.ringkasan);
      setBahan(dataBahan.bahan ?? []);
      setMenu(dataMenu.menu ?? []);
      setPreorder(dataPreorder.preorder ?? []);
    }).catch(() => {
      // Galat sudah ditangani oleh ambilJson, termasuk alihkan ke halaman masuk.
    });
  }, []);

  const bahanMenipis = bahan.filter((item) => item.menipis);
  const menuTersedia = menu.filter((item) => item.tersedia);
  const preorderBaru = preorder.filter((item) => item.status === "baru" || item.status === "diproses");

  const kartu = [
    { label: "Omzet hari ini", nilai: formatRupiah(ringkasan?.omzet ?? 0), warna: "border-l-bata" },
    { label: "Transaksi hari ini", nilai: String(ringkasan?.jumlahTransaksi ?? 0), warna: "border-l-oranye" },
    { label: "Menu tersedia", nilai: `${menuTersedia.length} dari ${menu.length}`, warna: "border-l-sukses" },
    { label: "Bahan menipis", nilai: String(bahanMenipis.length), warna: "border-l-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kartu.map((item) => (
          <Kartu key={item.label} kelas={`border-l-4 ${item.warna}`}>
            <p className="text-sm text-coklatMuda">{item.label}</p>
            <p className="mt-1 font-judul text-2xl font-semibold">{item.nilai}</p>
          </Kartu>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Kartu>
          <h2 className="text-lg font-semibold">Aksi cepat</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {tautanCepat.map((tautan) => (
              <Link
                key={tautan.href}
                href={tautan.href}
                className="rounded-xl border border-tepi px-4 py-3 text-sm font-semibold hover:bg-krem"
              >
                {tautan.label}
              </Link>
            ))}
          </div>
          {ringkasan?.menuTerlaris && (
            <p className="mt-5 rounded-xl bg-krem px-4 py-3 text-sm">
              Menu terlaris hari ini: <strong>{ringkasan.menuTerlaris.nama}</strong> sebanyak {ringkasan.menuTerlaris.jumlah} porsi.
            </p>
          )}
        </Kartu>

        <Kartu>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Bahan perlu perhatian</h2>
            <Link href="/admin/bahan" className="text-sm font-semibold text-bata hover:underline">Lihat semua</Link>
          </div>
          <ul className="mt-4 space-y-2">
            {bahanMenipis.length === 0 && <li className="text-sm text-coklatMuda">Semua bahan masih aman.</li>}
            {bahanMenipis.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-xl bg-krem px-4 py-2 text-sm">
                <span>{item.nama}</span>
                <Penanda warna="merah">{item.stok} {item.satuan}</Penanda>
              </li>
            ))}
          </ul>
        </Kartu>
      </div>

      <Kartu>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pre-order masuk</h2>
          <Link href="/admin/preorder" className="text-sm font-semibold text-bata hover:underline">Kelola</Link>
        </div>
        {preorderBaru.length === 0 ? (
          <p className="mt-4 text-sm text-coklatMuda">Belum ada pre-order yang perlu diproses.</p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {preorderBaru.slice(0, 6).map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-xl border border-tepi px-4 py-3 text-sm">
                <span><strong>{item.kode}</strong><br /><span className="text-coklatMuda">{item.nama_pelanggan}</span></span>
                <Penanda warna="krem">{formatRupiah(item.total)}</Penanda>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-coklatMuda">Data di atas diambil dari database Supabase saat halaman dibuka.</p>
      </Kartu>
    </div>
  );
}
