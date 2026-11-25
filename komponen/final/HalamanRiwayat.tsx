"use client";

import { useCallback, useEffect, useState } from "react";
import { ambilApi } from "@/komponen/api-klien.ts";
import { formatRupiah, formatWaktu, tanggalHariIni } from "@/lib/format.ts";
import { Badge, BarisKosong, Dialog, Judul, Kartu, KepalaTabel, SelKepala, Tabel, Tombol } from "./ui.tsx";

type Baris = {
  id: number; nomor: string; total: number; metode: string; sumber: string;
  dibuat_pada: string; jumlah_item: number; porsi: number;
};
type Detail = {
  id: number; nomor: string; total: number; diskon: number; metode: string;
  sumber: string; catatan: string; dibuat_pada: string;
  items: { nama_menu: string; nama_varian: string; harga_satuan: number; jumlah: number; subtotal: number }[];
};
type Hasil = { daftar: Baris[]; total: number; halaman: number; jumlahHalaman: number };

function mundur(hari: number): string {
  const t = new Date(`${tanggalHariIni()}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() - hari);
  return t.toISOString().slice(0, 10);
}

export default function HalamanRiwayat() {
  const [dari, setDari] = useState(mundur(29));
  const [sampai, setSampai] = useState(tanggalHariIni());
  const [cari, setCari] = useState("");
  const [halaman, setHalaman] = useState(1);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [pesan, setPesan] = useState("");
  const [namaUsaha, setNamaUsaha] = useState("Warung Kak Ikaa");

  const muat = useCallback(async () => {
    setPesan("");
    try {
      const p = new URLSearchParams({ dari, sampai, cari, halaman: String(halaman) });
      setHasil(await ambilApi<Hasil>(`/api/riwayat?${p}`));
    } catch {
      setPesan("Riwayat tidak berhasil dimuat.");
    }
  }, [dari, sampai, cari, halaman]);

  useEffect(() => { void muat(); }, [muat]);

  useEffect(() => {
    void ambilApi<{ pengaturan: Record<string, string> }>("/api/dashboard")
      .then((d) => setNamaUsaha(d.pengaturan.nama_usaha ?? "Warung Kak Ikaa"))
      .catch(() => {});
  }, []);

  async function bukaDetail(id: number) {
    setPesan("");
    try {
      const r = await ambilApi<{ detail: Detail }>(`/api/riwayat?id=${id}`);
      setDetail(r.detail);
    } catch {
      setPesan("Rincian transaksi tidak berhasil dimuat.");
    }
  }

  return (
    <div className="space-y-6">
      <Judul anak="Riwayat transaksi" sub="Telusuri penjualan kasir dan pre-order yang sudah selesai." />

      <Kartu>
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label htmlFor="ry-dari">Dari</label>
            <input id="ry-dari" type="date" value={dari} max={sampai}
              onChange={(e) => { setDari(e.target.value); setHalaman(1); }} />
          </div>
          <div>
            <label htmlFor="ry-sampai">Sampai</label>
            <input id="ry-sampai" type="date" value={sampai} min={dari}
              onChange={(e) => { setSampai(e.target.value); setHalaman(1); }} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ry-cari">Cari nomor atau menu</label>
            <input id="ry-cari" type="search" value={cari} placeholder="Contoh: JW-20261125-0001"
              onChange={(e) => { setCari(e.target.value); setHalaman(1); }} />
          </div>
          <div className="sm:col-span-3">
            <a href={`/api/riwayat?dari=${dari}&sampai=${sampai}&cari=${encodeURIComponent(cari)}&format=csv`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-garis px-4 text-sm font-semibold hover:bg-latar">
              Unduh CSV
            </a>
          </div>
        </div>
      </Kartu>

      {pesan && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-bahaya">{pesan}</p>}

      <Tabel>
        <KepalaTabel>
          <tr>
            <SelKepala>Nomor</SelKepala>
            <SelKepala>Waktu</SelKepala>
            <SelKepala>Sumber</SelKepala>
            <SelKepala>Item</SelKepala>
            <SelKepala>Metode</SelKepala>
            <SelKepala>Total</SelKepala>
            <SelKepala>Aksi</SelKepala>
          </tr>
        </KepalaTabel>
        <tbody className="divide-y divide-garis">
          {(hasil?.daftar ?? []).length === 0 ? (
            <BarisKosong kolom={7} teks="Tidak ada transaksi pada rentang ini." />
          ) : hasil?.daftar.map((b) => (
            <tr key={b.id} className="hover:bg-latar/60">
              <td className="whitespace-nowrap px-4 py-3 font-semibold">{b.nomor}</td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-tinta-lemah">{formatWaktu(b.dibuat_pada)}</td>
              <td className="px-4 py-3"><Badge warna={b.sumber === "preorder" ? "info" : "netral"}>{b.sumber}</Badge></td>
              <td className="px-4 py-3 text-xs">{b.jumlah_item} menu / {b.porsi} porsi</td>
              <td className="px-4 py-3 capitalize">{b.metode}</td>
              <td className="whitespace-nowrap px-4 py-3 font-semibold">{formatRupiah(b.total)}</td>
              <td className="px-4 py-3">
                <Tombol jenis="kosong" kelas="min-h-[36px] px-2 text-xs" onClick={() => void bukaDetail(b.id)}>Rincian</Tombol>
              </td>
            </tr>
          ))}
        </tbody>
      </Tabel>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-tinta-lemah">{hasil?.total ?? 0} transaksi ditemukan</span>
        <div className="flex items-center gap-2">
          <Tombol jenis="sekunder" kelas="min-h-[38px] px-3 text-xs" nonaktif={halaman <= 1}
            onClick={() => setHalaman((h) => Math.max(1, h - 1))}>Sebelumnya</Tombol>
          <span className="px-2 text-xs font-semibold">{halaman} / {hasil?.jumlahHalaman ?? 1}</span>
          <Tombol jenis="sekunder" kelas="min-h-[38px] px-3 text-xs"
            nonaktif={halaman >= (hasil?.jumlahHalaman ?? 1)}
            onClick={() => setHalaman((h) => h + 1)}>Berikutnya</Tombol>
        </div>
      </div>

      <Dialog terbuka={detail !== null} judul={`Rincian ${detail?.nomor ?? ""}`} padaTutup={() => setDetail(null)}>
        {detail && (
          <div id="struk" className="space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-garis pb-3">
              <div>
                <p className="font-judul text-lg font-semibold">Mie Jebew</p>
                <p className="text-xs text-tinta-lemah">{namaUsaha}</p>
              </div>
              <Badge warna={detail.sumber === "preorder" ? "info" : "sukses"}>{detail.sumber}</Badge>
            </div>
            <p className="text-xs text-tinta-lemah">{formatWaktu(detail.dibuat_pada)} · {detail.metode}</p>
            <ul className="divide-y divide-garis text-sm">
              {detail.items.map((i, n) => (
                <li key={n} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="font-medium">{i.nama_menu}{i.nama_varian ? ` (${i.nama_varian})` : ""}</p>
                    <p className="text-xs text-tinta-lemah">{i.jumlah} x {formatRupiah(i.harga_satuan)}</p>
                  </div>
                  <span className="shrink-0 font-semibold">{formatRupiah(i.subtotal)}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-1 border-t border-garis pt-3 text-sm">
              <div className="flex justify-between text-tinta-lemah"><span>Diskon</span><span>{formatRupiah(detail.diskon)}</span></div>
              <div className="flex justify-between font-judul text-lg font-semibold"><span>Total</span><span>{formatRupiah(detail.total)}</span></div>
            </div>
            {detail.catatan && <p className="rounded-xl bg-latar px-3 py-2 text-xs text-tinta-lemah">Catatan: {detail.catatan}</p>}
            <Tombol jenis="sekunder" kelas="w-full" onClick={() => window.print()}>Cetak rincian</Tombol>
          </div>
        )}
      </Dialog>
    </div>
  );
}
