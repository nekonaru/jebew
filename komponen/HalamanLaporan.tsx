"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { formatRupiah, formatWaktu, tanggalHariIni } from "@/lib/format.ts";
import { Kartu, Penanda, Pesan, Tombol } from "./ui.tsx";

type Transaksi = {
  id: number;
  total: number;
  dibuat_pada: string;
  sumber: string;
  items: { namaMenu: string; jumlah: number }[];
};

type Ringkasan = {
  omzet: number;
  jumlahTransaksi: number;
  menuTerlaris: { nama: string; jumlah: number } | null;
};

export default function HalamanLaporan() {
  const [dari, setDari] = useState(tanggalHariIni());
  const [sampai, setSampai] = useState(tanggalHariIni());
  const [daftar, setDaftar] = useState<Transaksi[]>([]);
  const [ringkasan, setRingkasan] = useState<Ringkasan | null>(null);
  const [pesan, setPesan] = useState("");

  const muat = useCallback(async (tanggalAwal: string, tanggalAkhir: string) => {
    try {
      const jawaban = await fetch(`/api/laporan?dari=${tanggalAwal}&sampai=${tanggalAkhir}`);
      const data = (await jawaban.json()) as { daftar: Transaksi[]; ringkasan: Ringkasan };
      setDaftar(data.daftar);
      setRingkasan(data.ringkasan);
      setPesan("");
    } catch {
      setPesan("Laporan gagal dimuat.");
    }
  }, []);

  useEffect(() => { void muat(dari, sampai); }, [muat, dari, sampai]);

  function terapkan(peristiwa: FormEvent<HTMLFormElement>) {
    peristiwa.preventDefault();
    void muat(dari, sampai);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Laporan harian</h2>
        <p className="text-sm text-coklatMuda">Omzet, jumlah transaksi, dan menu terlaris berdasarkan tanggal WIB.</p>
      </div>

      <Kartu>
        <form onSubmit={terapkan} className="grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label htmlFor="dari-tanggal">Dari tanggal</label>
            <input id="dari-tanggal" type="date" value={dari} onChange={(e) => setDari(e.target.value)} />
          </div>
          <div>
            <label htmlFor="sampai-tanggal">Sampai tanggal</label>
            <input id="sampai-tanggal" type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} />
          </div>
          <Tombol tipe="submit">Terapkan</Tombol>
        </form>
      </Kartu>

      <Pesan teks={pesan} jenis="galat" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Kartu kelas="border-l-4 border-l-bata">
          <p className="text-sm text-coklatMuda">Total omzet</p>
          <p className="mt-1 font-judul text-2xl font-semibold">{formatRupiah(ringkasan?.omzet ?? 0)}</p>
        </Kartu>
        <Kartu kelas="border-l-4 border-l-oranye">
          <p className="text-sm text-coklatMuda">Jumlah transaksi</p>
          <p className="mt-1 font-judul text-2xl font-semibold">{ringkasan?.jumlahTransaksi ?? 0}</p>
        </Kartu>
        <Kartu kelas="border-l-4 border-l-sukses">
          <p className="text-sm text-coklatMuda">Menu terlaris</p>
          <p className="mt-1 font-judul text-lg font-semibold">
            {ringkasan?.menuTerlaris?.nama ?? "Belum ada"}
          </p>
          {ringkasan?.menuTerlaris && (
            <p className="text-xs text-coklatMuda">{ringkasan.menuTerlaris.jumlah} porsi</p>
          )}
        </Kartu>
      </div>

      <Kartu>
        <h3 className="mb-4 text-lg font-semibold">Daftar transaksi</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="visually-hidden">Daftar transaksi pada rentang tanggal terpilih</caption>
            <thead>
              <tr className="border-b border-tepi text-coklatMuda">
                <th scope="col" className="py-3 font-semibold">Waktu</th>
                <th scope="col" className="py-3 font-semibold">Menu</th>
                <th scope="col" className="py-3 font-semibold">Sumber</th>
                <th scope="col" className="py-3 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {daftar.map((transaksi) => (
                <tr key={transaksi.id} className="border-b border-tepi/70">
                  <td className="py-3">{formatWaktu(transaksi.dibuat_pada)}</td>
                  <td className="py-3">
                    {transaksi.items.map((item) => `${item.namaMenu} x${item.jumlah}`).join(", ") || "-"}
                  </td>
                  <td className="py-3">
                    <Penanda warna={transaksi.sumber === "preorder" ? "hijau" : "krem"}>
                      {transaksi.sumber === "preorder" ? "Pre-order" : "Kasir"}
                    </Penanda>
                  </td>
                  <td className="py-3 font-semibold">{formatRupiah(transaksi.total)}</td>
                </tr>
              ))}
              {daftar.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-coklatMuda">Tidak ada transaksi pada rentang ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Kartu>
    </div>
  );
}
