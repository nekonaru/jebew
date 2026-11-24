"use client";

import { useCallback, useEffect, useState } from "react";
import { formatRupiah, tanggalHariIni } from "@/lib/format.ts";
import { ambilJson } from "@/komponen/api-klien.ts";
import { Badge, Judul, Kartu, Pesan, Statistik, Tabel, KepalaTabel, SelKepala, BarisKosong, Tombol } from "./ui.tsx";

type Laporan = {
  daftar: { id: number; nomor: string; total: number; diskon: number; metode: string; sumber: string; dibuat_pada: string; items: { nama: string; jumlah: number }[]; hpp: number }[];
  ringkasan: { omzet: number; hpp: number; diskon: number; labaKotor: number; pengeluaran: number; labaBersih: number; perMetode: Record<string, number> };
  menuTerlaris: { nama: string; jumlah: number }[];
  harian: { tanggal: string; omzet: number }[];
  pengeluaranList: { id: number; nama: string; jumlah: number; tanggal: string; kategori: string }[];
};

export default function HalamanLaporan() {
  const [dari, setDari] = useState(tanggalHariIni());
  const [sampai, setSampai] = useState(tanggalHariIni());
  const [data, setData] = useState<Laporan | null>(null);
  const [pesan, setPesan] = useState("");

  const muat = useCallback(async (a: string, b: string) => {
    try {
      const hasil = await fetch(`/api/laporan?dari=${a}&sampai=${b}`).then(ambilJson<Laporan>);
      setData(hasil); setPesan("");
    } catch (e) { setPesan(e instanceof Error ? e.message : "Gagal memuat laporan"); }
  }, []);
  useEffect(() => { const h = tanggalHariIni(); void muat(h, h); }, [muat]);

  const maks = Math.max(1, ...(data?.harian.map((h) => h.omzet) ?? [1]));

  return (
    <div>
      <Judul anak="Laporan Keuangan" sub="Omzet, HPP, laba, dan performa menu dalam rentang tanggal tertentu." />

      <Kartu kelas="mb-5">
        <form onSubmit={(e) => { e.preventDefault(); void muat(dari, sampai); }} className="grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto_auto]">
          <div><label htmlFor="dari">Dari</label><input id="dari" type="date" value={dari} onChange={(e) => setDari(e.target.value)} /></div>
          <div><label htmlFor="sampai">Sampai</label><input id="sampai" type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} /></div>
          <Tombol tipe="submit">Terapkan</Tombol>
          <a href={`/api/laporan?dari=${dari}&sampai=${sampai}&format=csv`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-garis px-4 text-sm font-semibold hover:bg-latar">
            Unduh CSV
          </a>
        </form>
      </Kartu>
      <Pesan teks={pesan} jenis="galat" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Statistik label="Omzet" nilai={formatRupiah(data?.ringkasan.omzet ?? 0)} aksen />
        <Statistik label="HPP" nilai={formatRupiah(data?.ringkasan.hpp ?? 0)} />
        <Statistik label="Laba kotor" nilai={formatRupiah(data?.ringkasan.labaKotor ?? 0)} />
        <Statistik label="Laba bersih" nilai={formatRupiah(data?.ringkasan.labaBersih ?? 0)} keterangan={`Pengeluaran ${formatRupiah(data?.ringkasan.pengeluaran ?? 0)}`} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Kartu>
          <h2 className="text-lg font-semibold">Tren omzet harian</h2>
          {data?.harian.length ? (
            <div className="mt-5 flex h-40 items-end gap-2">
              {data.harian.map((h) => (
                <div key={h.tanggal} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div className="w-full rounded-t-lg bg-utama transition-all duration-500" style={{ height: `${Math.max(6, (h.omzet / maks) * 100)}%` }} title={formatRupiah(h.omzet)} />
                  </div>
                  <span className="text-[10px] text-tinta-lemah">{h.tanggal.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : <p className="mt-4 text-sm text-tinta-lemah">Belum ada transaksi pada rentang ini.</p>}
        </Kartu>

        <Kartu>
          <h2 className="text-lg font-semibold">Menu terlaris</h2>
          <ul className="mt-4 space-y-3">
            {data?.menuTerlaris.map((m, i) => (
              <li key={m.nama} className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-latar text-xs font-semibold">{i + 1}</span>
                <span className="flex-1 text-sm">{m.nama}</span>
                <Badge>{m.jumlah} porsi</Badge>
              </li>
            ))}
            {!data?.menuTerlaris.length && <li className="text-sm text-tinta-lemah">Belum ada data.</li>}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-garis pt-4">
            {Object.entries(data?.ringkasan.perMetode ?? {}).map(([m, n]) => (
              <Badge key={m} warna="info">{m}: {formatRupiah(n)}</Badge>
            ))}
          </div>
        </Kartu>
      </div>

      <div className="mt-5">
        <h2 className="mb-3 text-lg font-semibold">Daftar transaksi</h2>
        <Tabel>
          <KepalaTabel><tr>
            <SelKepala>Nomor</SelKepala><SelKepala>Waktu</SelKepala><SelKepala>Menu</SelKepala>
            <SelKepala>Sumber</SelKepala><SelKepala>Metode</SelKepala><SelKepala>Total</SelKepala>
          </tr></KepalaTabel>
          <tbody>
            {data?.daftar.map((t) => (
              <tr key={t.id} className="border-t border-garis">
                <td className="px-4 py-3 font-medium">{t.nomor}</td>
                <td className="px-4 py-3 text-xs">{t.dibuat_pada.slice(0, 16).replace("T", " ")}</td>
                <td className="px-4 py-3 text-xs">{t.items.map((i) => `${i.nama} x${i.jumlah}`).join(", ")}</td>
                <td className="px-4 py-3"><Badge warna={t.sumber === "preorder" ? "info" : "netral"}>{t.sumber}</Badge></td>
                <td className="px-4 py-3 text-xs">{t.metode}</td>
                <td className="px-4 py-3 font-semibold">{formatRupiah(t.total)}</td>
              </tr>
            ))}
            {!data?.daftar.length && <BarisKosong kolom={6} teks="Belum ada transaksi." />}
          </tbody>
        </Tabel>
      </div>
    </div>
  );
}
