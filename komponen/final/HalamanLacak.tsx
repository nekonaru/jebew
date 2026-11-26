"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { formatRupiah } from "@/lib/format.ts";
import { ambilJson } from "@/komponen/api-klien.ts";
import { Badge, Kartu, Pesan, Tombol } from "./ui.tsx";

type Hasil = {
  kode: string; kode_lacak: string; nama_pelanggan: string; waktu_ambil: string;
  status: string; dibuat_pada: string; antrean?: number;
  items: { menu_id: number; varian_id: number | null; nama_menu: string; nama_varian: string; jumlah: number; subtotal: number }[];
  total: number;
};

const TAHAPAN = ["baru", "diproses", "selesai"];
const warna = { baru: "peringatan", diproses: "info", selesai: "sukses", batal: "bahaya" } as const;

export default function HalamanLacak({ kodeAwal }: { kodeAwal: string }) {
  const [kode, setKode] = useState(kodeAwal);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);
  const [namaUsaha, setNamaUsaha] = useState("Warung Kak Ikaa");
  const pengendali = useRef<AbortController | null>(null);

  async function cari(e?: FormEvent) {
    e?.preventDefault();
    if (!kode.trim()) return;
    pengendali.current?.abort();
    const kontrol = new AbortController();
    pengendali.current = kontrol;
    setLoading(true); setPesan(""); setHasil(null);
    try {
      const data = await fetch(`/api/lacak?kode=${encodeURIComponent(kode.trim())}`, {
        signal: kontrol.signal,
      }).then(ambilJson<Hasil>);
      setHasil(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setPesan(err instanceof Error ? err.message : "Pesanan tidak ditemukan");
    }
    finally {
      if (pengendali.current === kontrol) setLoading(false);
    }
  }

  useEffect(() => {
    if (!kodeAwal) return;
    pengendali.current?.abort();
    const kontrol = new AbortController();
    pengendali.current = kontrol;
    setKode(kodeAwal); setHasil(null); setPesan(""); setLoading(true);
    void fetch(`/api/lacak?kode=${encodeURIComponent(kodeAwal)}`, { signal: kontrol.signal })
      .then(ambilJson<Hasil>)
      .then(setHasil)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setPesan(err instanceof Error ? err.message : "Pesanan tidak ditemukan");
      })
      .finally(() => { if (pengendali.current === kontrol) setLoading(false); });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [kodeAwal]);

  useEffect(() => () => pengendali.current?.abort(), []);

  useEffect(() => {
    void fetch("/api/dashboard")
      .then(ambilJson<{ pengaturan: Record<string, string> }>)
      .then((d) => setNamaUsaha(d.pengaturan.nama_usaha ?? "Warung Kak Ikaa"))
      .catch(() => {});
  }, []);

  const indeks = hasil ? TAHAPAN.indexOf(hasil.status) : -1;

  return (
    <div className="min-h-screen">
      <header className="border-b border-garis bg-permukaan">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-judul text-lg font-semibold text-utama">{namaUsaha}</Link>
          <Link href="/" className="text-sm text-tinta-lemah">Kembali ke menu</Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-judul text-2xl font-semibold sm:text-3xl">Lacak pesanan</h1>
        <p className="mt-2 text-sm text-tinta-lemah">Masukkan kode lacak yang dikirim setelah Anda membuat pre-order.</p>

        <form onSubmit={(e) => void cari(e)} className="mt-6 flex gap-2">
          <label htmlFor="kode" className="visually-hidden">Kode lacak</label>
          <input id="kode" value={kode} onChange={(e) => setKode(e.target.value)} placeholder="Contoh: A1B2C3D4" className="flex-1" />
          <Tombol tipe="submit" nonaktif={loading || !kode.trim()}>{loading ? "Mencari..." : "Cari"}</Tombol>
        </form>

        <div className="mt-5"><Pesan teks={pesan} jenis="galat" /></div>

        {hasil && (
          <div className="mt-6 space-y-5">
            <Kartu>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-tinta-lemah">Kode pesanan</p>
                  <p className="font-judul text-lg font-semibold">{hasil.kode}</p>
                </div>
                <Badge warna={warna[hasil.status as keyof typeof warna] ?? "netral"}>{hasil.status}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-tinta-lemah">Pelanggan</p><p className="font-medium">{hasil.nama_pelanggan}</p></div>
                <div><p className="text-xs text-tinta-lemah">Waktu ambil</p><p className="font-medium">{hasil.waktu_ambil}</p></div>
              </div>
            </Kartu>

            {hasil.status !== "batal" && (
              <Kartu>
                <h2 className="text-lg font-semibold">Progres pesanan</h2>
                <ol className="mt-5 space-y-4">
                  {TAHAPAN.map((t, i) => (
                    <li key={t} className="flex items-center gap-3">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        i <= indeks ? "bg-utama text-white" : "bg-latar text-tinta-lemah"
                      }`}>{i + 1}</span>
                      <span className={`text-sm ${i <= indeks ? "font-semibold" : "text-tinta-lemah"}`}>{t}</span>
                    </li>
                  ))}
                </ol>
                {hasil.status !== "selesai" && (
                  <p className="mt-4 rounded-xl bg-latar px-4 py-3 text-xs text-tinta-lemah">
                    {hasil.antrean === 0
                      ? "Belum ada pesanan aktif sebelum kamu. Pesananmu berikutnya yang diproses."
                      : `Ada ${hasil.antrean} pesanan aktif sebelum kamu. Kode lacak ini dipakai untuk mengecek progres.`}
                  </p>
                )}
              </Kartu>
            )}

            <Kartu>
              <h2 className="text-lg font-semibold">Rincian</h2>
              <ul className="mt-4 space-y-2 text-sm">
                {hasil.items.map((it, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>{it.nama_menu}{it.nama_varian ? ` (${it.nama_varian})` : ""} x{it.jumlah}</span>
                    <span>{formatRupiah(it.subtotal)}</span>
                  </li>
                ))}
                <li className="flex justify-between border-t border-garis pt-2 font-semibold"><span>Total</span><span>{formatRupiah(hasil.total)}</span></li>
              </ul>
            </Kartu>

            <Tombol
              onClick={() => {
                try {
                  localStorage.setItem("jebew_pesan_lagi", JSON.stringify({
                    items: hasil.items.map((it) => ({ menu_id: it.menu_id, varian_id: it.varian_id, jumlah: it.jumlah })),
                    nama: hasil.nama_pelanggan,
                  }));
                  window.location.href = "/";
                } catch {
                  setPesan("Browser tidak menyimpan data. Catat menu pesanan lalu pilih ulang di beranda.");
                }
              }}
              kelas="w-full"
            >
              Pesan menu yang sama lagi
            </Tombol>
          </div>
        )}
      </main>
    </div>
  );
}
