"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatRupiah } from "@/lib/format.ts";
import { ambilJson } from "@/komponen/api-klien.ts";
import { Badge, Dialog, Judul, Kartu, Pesan, Tombol } from "./ui.tsx";

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
  const [cari, setCari] = useState("");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [pesan, setPesan] = useState("");
  const [jenis, setJenis] = useState<"info" | "sukses" | "galat">("info");
  const [aksi, setAksi] = useState<{ id: number; status: "diproses" | "selesai" | "batal" } | null>(null);
  const [metode, setMetode] = useState<"tunai" | "qris" | "transfer">("tunai");

  const urutMuat = useRef(0);
  const muat = useCallback(async () => {
    const urut = ++urutMuat.current;
    try {
      const p = new URLSearchParams({ cari, status: filter });
      if (dari) p.set("dari", dari);
      if (sampai) p.set("sampai", sampai);
      const data = await fetch(`/api/preorder?${p}`).then(ambilJson<{ preorder: Preorder[] }>);
      if (urut === urutMuat.current) setDaftar(data.preorder ?? []);
    } catch { /* abaikan */ }
  }, [cari, dari, sampai, filter]);
  useEffect(() => { void muat(); }, [muat]);

  function ubah(id: number, status: "diproses" | "selesai" | "batal") {
    setMetode("tunai");
    setAksi({ id, status });
  }

  async function kirimAksi() {
    if (!aksi) return;
    try {
      const badan = aksi.status === "selesai" ? { id: aksi.id, status: aksi.status, metode } : { ...aksi };
      const respons = await fetch("/api/preorder", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(badan),
      });
      await ambilJson(respons);
      setJenis("sukses"); setPesan(`Status berhasil diubah menjadi ${aksi.status}.`);
      setAksi(null);
      void muat();
    } catch (e) { setJenis("galat"); setPesan(e instanceof Error ? e.message : "Gagal mengubah status"); }
  }

  const tampil = daftar;
  const warna = { baru: "peringatan", diproses: "info", selesai: "sukses", batal: "bahaya" } as const;

  return (
    <div>
      <Judul anak="Pre-order" sub="Pesanan masuk dari website. Stok dipotong saat pesanan ditandai selesai." />
      <Pesan teks={pesan} jenis={jenis} />

      <Kartu kelas="mb-5">
        <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <label htmlFor="po-cari">Cari kode atau pelanggan</label>
            <input id="po-cari" type="search" value={cari} placeholder="Contoh: JBW-ABC atau Siti"
              onChange={(e) => setCari(e.target.value)} />
          </div>
          <div>
            <label htmlFor="po-dari">Dari</label>
            <input id="po-dari" type="date" value={dari} max={sampai}
              onChange={(e) => { setDari(e.target.value); }} />
          </div>
          <div>
            <label htmlFor="po-sampai">Sampai</label>
            <input id="po-sampai" type="date" value={sampai} min={dari}
              onChange={(e) => { setSampai(e.target.value); }} />
          </div>
        </div>
        <a
          href={`/api/preorder?${new URLSearchParams({
            cari, status: filter, ...(dari ? { dari } : {}), ...(sampai ? { sampai } : {}), format: "csv",
          })}`}
          className="mt-3 inline-flex min-h-[40px] items-center justify-center rounded-xl border border-garis px-4 text-xs font-semibold hover:bg-latar"
        >
          Unduh CSV pre-order
        </a>
      </Kartu>

      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter status">
        {STATUS.map((s) => (
          <Tombol key={s} onClick={() => setFilter(s)} ditekan={filter === s}
            jenis={filter === s ? "utama" : "sekunder"} kelas="min-h-[38px] px-3 capitalize">{s}</Tombol>
        ))}
      </div>

      <p className="mb-3 text-xs text-tinta-lemah">Menampilkan maksimal 500 pesanan terbaru sesuai filter.</p>
      <ul className="grid gap-4 lg:grid-cols-2">
        {tampil.map((p) => (
          <li key={p.id}>
            <Kartu>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-judul text-lg font-semibold">{p.kode}</h2>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="text-xs text-tinta-lemah">Lacak: {p.kode_lacak}</p>
                    <button type="button" aria-label={`Salin kode lacak ${p.kode_lacak}`}
                      onClick={() => {
                        if (!navigator.clipboard?.writeText) {
                          setJenis("galat"); setPesan("Browser tidak mendukung penyalinan otomatis. Salin kode secara manual.");
                          return;
                        }
                        void navigator.clipboard.writeText(p.kode_lacak)
                          .then(() => { setJenis("sukses"); setPesan(`Kode lacak ${p.kode_lacak} disalin.`); })
                          .catch(() => { setJenis("galat"); setPesan("Kode lacak tidak berhasil disalin."); });
                      }}
                      className="text-[11px] font-semibold text-utama hover:underline">Salin</button>
                  </div>
                </div>
                <Badge warna={warna[p.status as keyof typeof warna] ?? "netral"}>{p.status}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-tinta-lemah">Pelanggan</p><p className="font-medium">{p.nama_pelanggan}</p></div>
                <div>
                  <p className="text-xs text-tinta-lemah">WhatsApp</p>
                  <a href={`https://wa.me/${p.whatsapp.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer"
                    className="font-medium text-utama hover:underline">{p.whatsapp}</a>
                </div>
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

      <Dialog terbuka={aksi !== null} judul="Konfirmasi pre-order" padaTutup={() => setAksi(null)}>
        {aksi && (
          <div className="space-y-4">
            <p className="text-sm text-tinta-lemah">
              {aksi.status === "selesai"
                ? "Penjualan akan dicatat dan stok dipotong sesuai resep."
                : aksi.status === "batal"
                  ? "Kuota slot akan dikembalikan dan pesanan tidak bisa diaktifkan lagi."
                  : "Pesanan akan ditandai sedang diproses."}
            </p>
            {aksi.status === "selesai" && (
              <div>
                <label htmlFor="po-metode">Metode pembayaran</label>
                <select id="po-metode" value={metode} onChange={(e) => setMetode(e.target.value as typeof metode)}>
                  <option value="tunai">Tunai</option>
                  <option value="qris">QRIS</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
            )}
            <div className="flex gap-2">
              <Tombol jenis="sekunder" kelas="flex-1" onClick={() => setAksi(null)}>Batal</Tombol>
              <Tombol kelas="flex-1" onClick={() => void kirimAksi()}>Ya, lanjutkan</Tombol>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
