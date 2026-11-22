"use client";

import { useCallback, useEffect, useState } from "react";
import { formatRupiah, formatWaktu } from "@/lib/format.ts";
import { Kartu, Penanda, Pesan, Tombol } from "./ui.tsx";

type Barang = { nama_menu: string; harga_satuan: number; jumlah: number; subtotal: number };
type Preorder = {
  id: number;
  kode: string;
  nama_pelanggan: string;
  whatsapp: string;
  waktu_ambil: string;
  catatan: string;
  status: string;
  penjualan_id: number | null;
  dibuat_pada: string;
  total: number;
  items: Barang[];
};

const statusWarna = {
  baru: "krem",
  diproses: "krem",
  selesai: "hijau",
  batal: "merah",
} as const;

export default function HalamanPreorder() {
  const [daftar, setDaftar] = useState<Preorder[]>([]);
  const [filter, setFilter] = useState("semua");
  const [pesan, setPesan] = useState("");
  const [jenisPesan, setJenisPesan] = useState<"info" | "sukses" | "galat">("info");

  const muat = useCallback(async () => {
    try {
      const jawaban = await fetch("/api/preorder");
      const data = (await jawaban.json()) as { preorder: Preorder[] };
      setDaftar(data.preorder);
      setPesan("");
    } catch {
      setJenisPesan("galat");
      setPesan("Data pre-order gagal dimuat.");
    }
  }, []);

  useEffect(() => { void muat(); }, [muat]);

  async function ubahStatus(id: number, status: "diproses" | "selesai" | "batal") {
    if (status === "batal" && !window.confirm("Batalkan pre-order ini?")) return;
    if (status === "selesai" && !window.confirm("Tandai selesai? Penjualan akan dicatat dan stok dikurangi.")) return;
    try {
      const jawaban = await fetch("/api/preorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const hasil = (await jawaban.json()) as { pesan?: string };
      if (!jawaban.ok) throw new Error(hasil.pesan ?? "Gagal mengubah status");
      setJenisPesan("sukses");
      setPesan(status === "selesai" ? "Pre-order selesai dan penjualan tercatat." : "Status berhasil diubah.");
      await muat();
    } catch (kesalahan) {
      setJenisPesan("galat");
      setPesan(kesalahan instanceof Error ? kesalahan.message : "Gagal mengubah status");
    }
  }

  const tampil = filter === "semua" ? daftar : daftar.filter((item) => item.status === filter);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Pre-order</h2>
        <p className="text-sm text-coklatMuda">Pesanan dari website konsumen. Stok dipotong saat ditandai selesai.</p>
      </div>

      <Pesan teks={pesan} jenis={jenisPesan} />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter status pre-order">
        {["semua", "baru", "diproses", "selesai", "batal"].map((opsi) => (
          <Tombol key={opsi} onClick={() => setFilter(opsi)} jenis={filter === opsi ? "utama" : "sekunder"}
            kelas="min-h-[40px] px-3">
            {opsi[0].toUpperCase() + opsi.slice(1)}
          </Tombol>
        ))}
      </div>

      <ul className="grid gap-4 lg:grid-cols-2">
        {tampil.map((pesanan) => (
          <li key={pesanan.id}>
            <Kartu>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{pesanan.kode}</h3>
                  <p className="text-xs text-coklatMuda">Diterima {formatWaktu(pesanan.dibuat_pada)}</p>
                </div>
                <Penanda warna={statusWarna[pesanan.status as keyof typeof statusWarna] ?? "krem"}>
                  {pesanan.status}
                </Penanda>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-coklatMuda">Pelanggan</dt><dd className="font-medium">{pesanan.nama_pelanggan}</dd></div>
                <div><dt className="text-coklatMuda">WhatsApp</dt><dd className="font-medium">{pesanan.whatsapp}</dd></div>
                <div className="col-span-2"><dt className="text-coklatMuda">Waktu ambil</dt><dd className="font-medium">{pesanan.waktu_ambil}</dd></div>
              </dl>

              <ul className="mt-4 space-y-1 rounded-xl bg-krem px-4 py-3 text-sm">
                {pesanan.items.map((item, indeks) => (
                  <li key={indeks} className="flex justify-between gap-3">
                    <span>{item.nama_menu} x{item.jumlah}</span>
                    <span>{formatRupiah(item.subtotal)}</span>
                  </li>
                ))}
                <li className="flex justify-between border-t border-tepi pt-2 font-semibold">
                  <span>Total</span><span>{formatRupiah(pesanan.total)}</span>
                </li>
              </ul>

              {pesanan.catatan && (
                <p className="mt-3 text-sm text-coklatMuda">Catatan: {pesanan.catatan}</p>
              )}

              {(pesanan.status === "baru" || pesanan.status === "diproses") && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {pesanan.status === "baru" && (
                    <Tombol onClick={() => void ubahStatus(pesanan.id, "diproses")} jenis="sekunder" kelas="min-h-[40px] px-3">
                      Proses
                    </Tombol>
                  )}
                  <Tombol onClick={() => void ubahStatus(pesanan.id, "selesai")} jenis="sukses" kelas="min-h-[40px] px-3">
                    Selesaikan
                  </Tombol>
                  <Tombol onClick={() => void ubahStatus(pesanan.id, "batal")} jenis="bahaya" kelas="min-h-[40px] px-3">
                    Batalkan
                  </Tombol>
                </div>
              )}
              {pesanan.penjualan_id && (
                <p className="mt-3 text-xs text-sukses">Tercatat sebagai penjualan #{pesanan.penjualan_id}</p>
              )}
            </Kartu>
          </li>
        ))}
        {tampil.length === 0 && (
          <li className="text-sm text-coklatMuda">Tidak ada pre-order dengan status tersebut.</li>
        )}
      </ul>
    </div>
  );
}
