"use client";

import { useCallback, useEffect, useState } from "react";
import { formatRupiah, tanggalHariIni, tanggalValid } from "@/lib/format.ts";
import { ambilJson } from "@/komponen/api-klien.ts";
import { Badge, Judul, Kartu, Pesan, Statistik, Tabel, KepalaTabel, SelKepala, BarisKosong, Tombol } from "./ui.tsx";

type Laporan = {
  daftar: { id: number; nomor: string; total: number; diskon: number; metode: string; sumber: string; dibuat_pada: string; items: { nama: string; jumlah: number }[]; hpp: number }[];
  ringkasan: { omzet: number; hpp: number; diskon: number; labaKotor: number; pengeluaran: number; labaBersih: number; perMetode: Record<string, number> };
  menuTerlaris: { nama: string; jumlah: number; omzet: number; hpp: number; laba: number }[];
  harian: { tanggal: string; omzet: number }[];
  pengeluaranList: { id: number; nama: string; jumlah: number; tanggal: string; kategori: string }[];
  pengeluaranPerKategori: { kategori: string; jumlah: number }[];
};

export default function HalamanLaporan() {
  const [dari, setDari] = useState(tanggalHariIni());
  const [sampai, setSampai] = useState(tanggalHariIni());
  const [data, setData] = useState<Laporan | null>(null);
  const [rentangAktif, setRentangAktif] = useState({ dari: tanggalHariIni(), sampai: tanggalHariIni() });
  const [pesan, setPesan] = useState("");
  const [namaUsaha, setNamaUsaha] = useState("Warung Kak Ikaa");

  const muat = useCallback(async (a: string, b: string) => {
    try {
      const hasil = await fetch(`/api/laporan?dari=${a}&sampai=${b}`).then(ambilJson<Laporan>);
      setData(hasil); setRentangAktif({ dari: a, sampai: b }); setPesan("");
    } catch (e) { setPesan(e instanceof Error ? e.message : "Gagal memuat laporan"); }
  }, []);
  useEffect(() => { const h = tanggalHariIni(); void muat(h, h); }, [muat]);

  useEffect(() => {
    void fetch("/api/pengaturan").then(ambilJson<Record<string, string>>)
      .then((d) => setNamaUsaha(d.nama_usaha ?? "Warung Kak Ikaa"))
      .catch(() => {});
  }, []);

  const maks = Math.max(1, ...(data?.harian.map((h) => h.omzet) ?? [1]));

  return (
    <div>
      <Judul anak="Laporan Keuangan" sub="Omzet, HPP, laba, dan performa menu dalam rentang tanggal tertentu." />

      <Kartu kelas="mb-5">
        <form onSubmit={(e) => { e.preventDefault(); void muat(dari, sampai); }} className="grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto_auto]">
          <div><label htmlFor="dari">Dari</label><input id="dari" type="date" max={tanggalHariIni()} value={dari} onChange={(e) => setDari(e.target.value)} /></div>
          <div><label htmlFor="sampai">Sampai</label><input id="sampai" type="date" max={tanggalHariIni()} value={sampai} onChange={(e) => setSampai(e.target.value)} /></div>
          <Tombol tipe="submit">Terapkan</Tombol>
          {(() => {
            const hariIni = tanggalHariIni();
            const valid = tanggalValid(dari) && tanggalValid(sampai) && dari <= sampai && sampai <= hariIni &&
              (Date.parse(sampai) - Date.parse(dari)) <= 365 * 86400000;
            return valid ? (
              <a href={`/api/laporan?dari=${rentangAktif.dari}&sampai=${rentangAktif.sampai}&format=csv`}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-garis px-4 text-sm font-semibold hover:bg-latar">
                Unduh CSV ({rentangAktif.dari} s/d {rentangAktif.sampai})
              </a>
            ) : (
              <span role="status" className="inline-flex min-h-[44px] items-center rounded-xl bg-latar px-4 text-xs text-tinta-lemah">
                Perbaiki rentang untuk mengunduh
              </span>
            );
          })()}
        </form>
      </Kartu>
      <Pesan teks={pesan} jenis="galat" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Statistik label="Omzet" nilai={formatRupiah(data?.ringkasan.omzet ?? 0)} aksen />
        <Statistik label="HPP" nilai={formatRupiah(data?.ringkasan.hpp ?? 0)} />
        <Statistik label="Laba kotor" nilai={formatRupiah(data?.ringkasan.labaKotor ?? 0)} />
        <Statistik label="Laba bersih" nilai={formatRupiah(data?.ringkasan.labaBersih ?? 0)} keterangan={`Pengeluaran ${formatRupiah(data?.ringkasan.pengeluaran ?? 0)}`} />
      </div>

      <Kartu kelas="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Ringkasan untuk dicetak</h2>
          <Tombol jenis="sekunder" kelas="min-h-[38px] px-3 text-xs tidak-cetak" nonaktif={!data} onClick={() => window.print()}>Cetak ringkasan</Tombol>
        </div>
        <div id="laporan-cetak" className="mt-4 rounded-xl border border-garis p-4 text-sm">
          <p className="font-judul text-lg font-semibold">{namaUsaha}</p>
          <p className="text-xs text-tinta-lemah">{rentangAktif.dari} sampai {rentangAktif.sampai} · WIB</p>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="flex justify-between gap-3"><dt>Omzet</dt><dd className="font-semibold">{formatRupiah(data?.ringkasan.omzet ?? 0)}</dd></div>
            <div className="flex justify-between gap-3"><dt>HPP</dt><dd className="font-semibold">{formatRupiah(data?.ringkasan.hpp ?? 0)}</dd></div>
            <div className="flex justify-between gap-3"><dt>Laba kotor</dt><dd className="font-semibold">{formatRupiah(data?.ringkasan.labaKotor ?? 0)}</dd></div>
            <div className="flex justify-between gap-3"><dt>Pengeluaran</dt><dd className="font-semibold">{formatRupiah(data?.ringkasan.pengeluaran ?? 0)}</dd></div>
            <div className="flex justify-between gap-3"><dt>Laba bersih</dt><dd className="font-semibold">{formatRupiah(data?.ringkasan.labaBersih ?? 0)}</dd></div>
          </dl>
          <p className="mt-4 border-t border-garis pt-3 text-xs text-tinta-lemah">
            Metode bayar: {Object.entries(data?.ringkasan.perMetode ?? {}).map(([m, n]) => `${m} ${formatRupiah(n)}`).join(" · ") || "Belum ada transaksi"}
          </p>
        </div>
      </Kartu>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Kartu>
          <h2 className="text-lg font-semibold">Tren omzet harian</h2>
          {data?.harian.length ? (
            <div className="mt-5 flex h-40 items-end gap-2" role="img" aria-label="Grafik omzet harian pada rentang yang dipilih">
              {data.harian.map((h) => (
                <div key={h.tanggal} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end" role="img" aria-label={`${h.tanggal}, omzet ${formatRupiah(h.omzet)}`}>
                    <div className="w-full rounded-t-lg bg-utama transition-all duration-500" style={{ height: `${Math.max(6, (h.omzet / maks) * 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-tinta-lemah">{h.tanggal.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : <p className="mt-4 text-sm text-tinta-lemah">Belum ada transaksi pada rentang ini.</p>}
        </Kartu>

        <Kartu>
          <h2 className="text-lg font-semibold">Menu terlaris dan laba</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="border-b border-garis text-[11px] uppercase tracking-wide text-tinta-lemah">
                <tr><th className="py-2 font-semibold">Menu</th><th className="py-2 font-semibold">Porsi</th><th className="py-2 font-semibold">Omzet</th><th className="py-2 font-semibold">Laba</th></tr>
              </thead>
              <tbody className="divide-y divide-garis">
                {data?.menuTerlaris.map((m) => (
                  <tr key={m.nama}>
                    <td className="py-2 pr-3 font-medium">{m.nama}</td>
                    <td className="py-2"><Badge>{m.jumlah}</Badge></td>
                    <td className="py-2">{formatRupiah(m.omzet)}</td>
                    <td className="py-2 font-semibold text-sukses">{formatRupiah(m.laba)}</td>
                  </tr>
                ))}
                {!data?.menuTerlaris.length && <tr><td colSpan={4} className="py-8 text-center text-tinta-lemah">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
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

      <Kartu>
        <h2 className="text-lg font-semibold">Pengeluaran per kategori</h2>
        {(data?.pengeluaranPerKategori ?? []).length === 0 ? (
          <p className="mt-4 text-sm text-tinta-lemah">Tidak ada pengeluaran pada rentang ini.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data?.pengeluaranPerKategori.map((k) => {
              const total = data.ringkasan.pengeluaran || 1;
              const persen = Math.min(100, Math.round((k.jumlah / total) * 100));
              return (
                <li key={k.kategori}>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-medium">{k.kategori}</span>
                    <span className="font-semibold">{formatRupiah(k.jumlah)}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-latar">
                    <div role="progressbar" aria-valuenow={persen} aria-valuemin={0} aria-valuemax={100}
                      aria-label={`Proporsi pengeluaran kategori ${k.kategori}`}
                      className="h-full rounded-full bg-aksen" style={{ width: `${persen}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Kartu>
    </div>
  );
}
