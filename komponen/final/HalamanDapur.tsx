"use client";

import { useCallback, useEffect, useState } from "react";
import { formatRupiah } from "@/lib/format.ts";
import { ambilJson } from "@/komponen/api-klien.ts";
import { tautanWhatsApp } from "@/lib/wa.ts";
import { Badge, Dialog, Judul, Kartu, Pesan, RangkaDaftar, Tombol } from "./ui.tsx";

type Preorder = {
  id: number; kode: string; kode_lacak: string; nama_pelanggan: string;
  whatsapp: string; waktu_ambil: string; catatan: string; status: string;
  dibuat_pada: string; total: number;
  items: { nama_menu: string; nama_varian: string; jumlah: number }[];
};
type Notifikasi = { id: number; status: string; pesan: string; tujuan: string; kode_pesanan: string | null };

const KOLOM = [
  { status: "baru", judul: "Pesanan baru", warna: "text-peringatan" },
  { status: "diproses", judul: "Sedang disiapkan", warna: "text-info" },
  { status: "siap", judul: "Siap diambil", warna: "text-sukses" },
] as const;

function waktuAmbil(teks: string): number {
  return new Date(teks.replace(" ", "T") + "+07:00").getTime();
}

function durasi(teks: string): string {
  const waktu = waktuAmbil(teks);
  if (!Number.isFinite(waktu)) return "-";
  const menit = Math.max(0, Math.floor((Date.now() - waktu) / 60000));
  if (menit < 60) return `${menit} menit`;
  return `${Math.floor(menit / 60)} jam ${menit % 60} menit`;
}

function segeraDiambil(teks: string): boolean {
  const selisih = waktuAmbil(teks) - Date.now();
  return selisih > 0 && selisih <= 30 * 60 * 1000;
}

/** Papan dapur: pesanan masuk diproses hingga siap diambil. */
export default function HalamanDapur() {
  const [daftar, setDaftar] = useState<Preorder[]>([]);
  const [notifikasi, setNotifikasi] = useState<Notifikasi[]>([]);
  const [pesan, setPesan] = useState("");
  const [jenis, setJenis] = useState<"info" | "sukses" | "galat">("info");
  const [selesaiId, setSelesaiId] = useState<number | null>(null);
  const [metode, setMetode] = useState<"tunai" | "qris" | "transfer">("tunai");
  const [sibuk, setSibuk] = useState(false);
  const [memuat, setMuat] = useState(true);

  const muat = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const [po, notif] = await Promise.all([
        fetch("/api/preorder?status=semua").then(ambilJson<{ preorder: Preorder[] }>),
        fetch("/api/notifikasi?batas=30").then(ambilJson<{ notifikasi: Notifikasi[] }>),
      ]);
      setDaftar((po.preorder ?? []).filter((p) => ["baru", "diproses", "siap"].includes(p.status)));
      setNotifikasi(notif.notifikasi ?? []);
    } catch { /* biarkan data terakhir */ }
    finally { setMuat(false); }
  }, []);
  useEffect(() => {
    void muat();
    const t = setInterval(() => void muat(), 15000);
    return () => clearInterval(t);
  }, [muat]);

  async function ubah(id: number, status: "diproses" | "siap" | "selesai" | "batal") {
    if (sibuk) return;
    setSibuk(true);
    try {
      const respons = await fetch("/api/preorder", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(status === "selesai" ? { id, status, metode } : { id, status }),
      });
      await ambilJson(respons);
      setJenis("sukses"); setPesan(`Status berhasil diubah menjadi ${status}.`);
      setSelesaiId(null);
      void muat();
    } catch (e) {
      setJenis("galat"); setPesan(e instanceof Error ? e.message : "Gagal mengubah status");
    } finally { setSibuk(false); }
  }

  return (
    <div>
      <Judul anak="Papan dapur" sub="Pesanan berjalan dari masuk hingga siap diambil. Data menyegarkan tiap 15 detik." />
      <Pesan teks={pesan} jenis={jenis} />

      <Kartu kelas="mb-5">
        <h2 className="text-lg font-semibold">Notifikasi pelanggan</h2>
        <p className="mt-1 text-xs text-tinta-lemah">Pesan otomatis tersimpan di sini. Tekan tautan untuk mengirim bila WhatsApp Business API belum terpasang.</p>
        <ul className="mt-3 space-y-2">
          {notifikasi.slice(0, 10).map((n) => {
            const tautan = tautanWhatsApp(n.tujuan, n.pesan);
            return (
              <li key={n.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-garis px-3 py-2 text-xs">
                <Badge warna={n.status === "terkirim" ? "sukses" : "peringatan"}>{n.status}</Badge>
                <span className="font-medium">{n.kode_pesanan ?? "Pesanan"}</span>
                <span className="text-tinta-lemah">{n.pesan.slice(0, 70)}</span>
                {tautan && <a href={tautan} target="_blank" rel="noopener noreferrer" className="ml-auto font-semibold text-utama hover:underline">Kirim WA</a>}
              </li>
            );
          })}
          {notifikasi.length === 0 && <li className="text-sm text-tinta-lemah">Belum ada notifikasi.</li>}
        </ul>
      </Kartu>

      <div className="grid gap-4 lg:grid-cols-3">
        {KOLOM.map((kolom) => {
          const items = daftar.filter((p) => p.status === kolom.status)
            .sort((a, b) => waktuAmbil(a.waktu_ambil) - waktuAmbil(b.waktu_ambil));
          return (
            <section key={kolom.status} className="rounded-kartu border border-garis bg-latar/60 p-4">
              <div className="flex items-center justify-between">
                <h2 className={`text-sm font-bold uppercase tracking-wide ${kolom.warna}`}>{kolom.judul}</h2>
                <Badge>{items.length}</Badge>
              </div>
              <div className="mt-3 space-y-3">
                {items.map((p) => (
                  <article key={p.id} className={`animasi-pindah rounded-xl border bg-permukaan p-3 shadow-sm ${
                    segeraDiambil(p.waktu_ambil) ? "border-amber-400 ring-2 ring-amber-100" : "border-garis"
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{p.kode}</p>
                        <p className="text-xs text-tinta-lemah">{p.nama_pelanggan}</p>
                      </div>
                      <span className="rounded-full bg-latar px-2 py-1 text-[10px] font-semibold text-tinta-lemah">{durasi(p.dibuat_pada)}</span>
                    </div>
                    <p className="mt-2 text-xs font-semibold">Ambil {p.waktu_ambil} WIB</p>
                    <ul className="mt-1 text-xs text-tinta-lemah">
                      {p.items.map((i, n) => <li key={n}>{i.nama_menu}{i.nama_varian ? ` (${i.nama_varian})` : ""} x{i.jumlah}</li>)}
                    </ul>
                    {p.catatan && <p className="mt-2 rounded-lg bg-latar p-2 text-xs">{p.catatan}</p>}
                    <p className="mt-2 text-sm font-semibold text-utama">{formatRupiah(p.total)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.status === "baru" && (
                        <Tombol nonaktif={sibuk} kelas="min-h-[38px] px-3 text-xs" onClick={() => void ubah(p.id, "diproses")}>Proses</Tombol>
                      )}
                      {p.status === "diproses" && (
                        <Tombol jenis="sukses" nonaktif={sibuk} kelas="min-h-[38px] px-3 text-xs" onClick={() => void ubah(p.id, "siap")}>Tandai siap</Tombol>
                      )}
                      {p.status === "siap" && (
                        <Tombol nonaktif={sibuk} kelas="min-h-[38px] px-3 text-xs" onClick={() => { setMetode("tunai"); setSelesaiId(p.id); }}>Selesai</Tombol>
                      )}
                      <Tombol jenis="hapus" nonaktif={sibuk} kelas="min-h-[38px] px-3 text-xs" onClick={() => void ubah(p.id, "batal")}>Batal</Tombol>
                    </div>
                  </article>
                ))}
                {memuat ? <RangkaDaftar jumlah={2} /> : items.length === 0 && (
                  <p className="py-6 text-center text-xs text-tinta-lemah">Tidak ada pesanan.</p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <Dialog terbuka={selesaiId !== null} judul="Selesaikan pesanan" padaTutup={() => setSelesaiId(null)}>
        <p className="text-sm text-tinta-lemah">Pesanan akan dicatat sebagai penjualan dan stok dipotong. Pilih metode bayar.</p>
        <label htmlFor="dapur-metode" className="mt-4 block">Metode bayar</label>
        <select id="dapur-metode" value={metode} onChange={(e) => setMetode(e.target.value as typeof metode)}>
          <option value="tunai">Tunai</option>
          <option value="qris">QRIS</option>
          <option value="transfer">Transfer</option>
        </select>
        <div className="mt-5 flex gap-3">
          <Tombol jenis="sekunder" kelas="flex-1" onClick={() => setSelesaiId(null)}>Batal</Tombol>
          <Tombol jenis="sukses" kelas="flex-1" nonaktif={sibuk} onClick={() => selesaiId !== null && void ubah(selesaiId, "selesai")}>Selesaikan</Tombol>
        </div>
      </Dialog>
    </div>
  );
}
