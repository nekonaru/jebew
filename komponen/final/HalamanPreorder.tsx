"use client";

import { useCallback, useEffect, useState } from "react";
import { formatRupiah } from "@/lib/format.ts";
import { ambilJson } from "@/komponen/api-klien.ts";
import { Badge, Judul, Kartu, Pesan, Tombol } from "./ui.tsx";

type Preorder = {
  id: number; kode: string; kode_lacak: string; nama_pelanggan: string; whatsapp: string;
  waktu_ambil: string; catatan: string; status: string; penjualan_id: number | null;
  dibuat_pada: string; total: number;
  items: { menu_id: number; nama_menu: string; nama_varian: string; jumlah: number; subtotal: number }[];
};

const STATUS = ["semua", "baru", "diproses", "selesai", "batal"] as const;

export default function HalamanPreorder() {
  const [daftar, setDaftar] = useState<Preorder[]>([]);
  const [filter, setFilter] = useState<string>("semua");
  const [pesan, setPesan] = useState("");
  const [jenis, setJenis] = useState<"info" | "sukses" | "galat">("info");

  const muat = useCallback(async () => {
    try {
      const data = await fetch("/api/preorder").then(ambilJson<{ preorder: Preorder[] }>);
      setDaftar(data.preorder ?? []);
    } catch { /* abaikan */ }
  }, []);
  useEffect(() => { void muat(); }, [muat]);

  async function ubah(id: number, status: "diproses" | "selesai" | "batal") {
    const teks = status === "selesai" ? "Tandai selesai? Penjualan akan dicatat dan stok dipotong."
      : status === "batal" ? "Batalkan pesanan ini?" : "Lanjutkan ke diproses?";
    if (!window.confirm(teks)) return;
    try {
      const respons = await fetch("/api/preorder", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      await ambilJson(respons);
      setJenis("sukses"); setPesan(`Status berhasil diubah menjadi ${status}.`);
      void muat();
    } catch (e) { setJenis("galat"); setPesan(e instanceof Error ? e.message : "Gagal mengubah status"); }
  }

  const tampil = filter === "semua" ? daftar : daftar.filter((p) => p.status === filter);
  const warna = { baru: "peringatan", diproses: "info", selesai: "sukses", batal: "bahaya" } as const;

  return (
    <div>
      <Judul anak="Pre-order" sub="Pesanan masuk dari website. Stok dipotong saat pesanan ditandai selesai." />
      <Pesan teks={pesan} jenis={jenis} />

      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter status">
        {STATUS.map((s) => (
          <Tombol key={s} onClick={() => setFilter(s)} ditekan={filter === s}
            jenis={filter === s ? "utama" : "sekunder"} kelas="min-h-[38px] px-3 capitalize">{s}</Tombol>
        ))}
      </div>

      <ul className="grid gap-4 lg:grid-cols-2">
        {tampil.map((p) => (
          <li key={p.id}>
            <Kartu>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-judul text-lg font-semibold">{p.kode}</h3>
                  <p className="text-xs text-tinta-lemah">Lacak: {p.kode_lacak}</p>
                </div>
                <Badge warna={warna[p.status as keyof typeof warna] ?? "netral"}>{p.status}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-tinta-lemah">Pelanggan</p><p className="font-medium">{p.nama_pelanggan}</p></div>
                <div><p className="text-xs text-tinta-lemah">WhatsApp</p><p className="font-medium">{p.whatsapp}</p></div>
                <div className="col-span-2"><p className="text-xs text-tinta-lemah">Waktu ambil</p><p className="font-medium">{p.waktu_ambil}</p></div>
              </div>

              <ul className="mt-4 space-y-1 rounded-xl bg-latar p-3 text-sm">
                {p.items.map((it, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>{it.nama_menu}{it.nama_varian ? ` (${it.nama_varian})` : ""} x{it.jumlah}</span>
                    <span>{formatRupiah(it.subtotal)}</span>
                  </li>
                ))}
                <li className="flex justify-between border-t border-garis pt-2 font-semibold">
                  <span>Total</span><span>{formatRupiah(p.total)}</span>
                </li>
              </ul>

              {p.catatan && <p className="mt-3 text-xs text-tinta-lemah">Catatan: {p.catatan}</p>}

              {(p.status === "baru" || p.status === "diproses") && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.status === "baru" && <Tombol onClick={() => void ubah(p.id, "diproses")} jenis="sekunder" kelas="min-h-[38px] px-3 text-xs">Proses</Tombol>}
                  <Tombol onClick={() => void ubah(p.id, "selesai")} jenis="sukses" kelas="min-h-[38px] px-3 text-xs">Selesaikan</Tombol>
                  <Tombol onClick={() => void ubah(p.id, "batal")} jenis="hapus" kelas="min-h-[38px] px-3 text-xs">Batalkan</Tombol>
                </div>
              )}
              {p.penjualan_id && <p className="mt-3 text-xs text-sukses">Tercatat sebagai penjualan #{p.penjualan_id}</p>}
            </Kartu>
          </li>
        ))}
        {tampil.length === 0 && (
          <li className="text-sm text-tinta-lemah">Tidak ada pre-order dengan status tersebut.</li>
        )}
      </ul>
    </div>
  );
}
