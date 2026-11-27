"use client";

import { useCallback, useEffect, useState } from "react";
import { ambilJson } from "@/komponen/api-klien.ts";
import { Tombol } from "./ui.tsx";

type Preorder = {
  id: number; kode: string; nama_pelanggan: string; waktu_ambil: string;
  status: string; catatan: string;
  items: { nama_menu: string; jumlah: number }[];
};

const KOLOM = [
  { status: "baru", judul: "MASUK", aksi: "Proses", berikut: "diproses" },
  { status: "diproses", judul: "DIPROSES", aksi: "Siap", berikut: "siap" },
  { status: "siap", judul: "SIAP", aksi: "Selesai", berikut: "selesai" },
] as const;

function detikAmbil(teks: string): number {
  return new Date(teks.replace(" ", "T") + "+07:00").getTime();
}

/** Tampilan dapur layar penuh untuk dipasang di dekat area masak. */
export default function LayarDapur() {
  const [daftar, setDaftar] = useState<Preorder[]>([]);
  const [sekarang, setSekarang] = useState(Date.now());
  const [dipanggil, setDipanggil] = useState<number | null>(null);

  const muat = useCallback(async () => {
    try {
      const d = await fetch("/api/preorder?status=semua").then(ambilJson<{ preorder: Preorder[] }>);
      setDaftar((d.preorder ?? []).filter((p) => ["baru", "diproses", "siap"].includes(p.status)));
    } catch { /* biarkan data terakhir */ }
  }, []);
  useEffect(() => {
    void muat();
    const t = setInterval(() => void muat(), 10000);
    const j = setInterval(() => setSekarang(Date.now()), 15000);
    return () => { clearInterval(t); clearInterval(j); };
  }, [muat]);

  async function lanjut(id: number, status: string) {
    try {
      await fetch("/api/preorder", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(status === "selesai" ? { id, status, metode: "tunai" } : { id, status }),
      });
      void muat();
    } catch { /* abaikan */ }
  }

  return (
    <div className="min-h-screen bg-tinta p-6 text-white">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-judul text-3xl font-bold">PAPAN DAPUR</h1>
          <p className="text-sm text-white/70">Warung Kak Ikaa - data menyegarkan tiap 10 detik</p>
        </div>
        <a href="/admin/dapur" className="rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold">
          Kembali ke panel
        </a>
      </header>
      <div className="grid gap-5 lg:grid-cols-3">
        {KOLOM.map((k) => {
          const items = daftar.filter((p) => p.status === k.status)
            .sort((a, b) => detikAmbil(a.waktu_ambil) - detikAmbil(b.waktu_ambil));
          return (
            <section key={k.status} className="rounded-3xl bg-white/10 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-judul text-xl font-bold tracking-widest">{k.judul}</h2>
                <span className="rounded-full bg-white/20 px-3 py-1 text-sm">{items.length}</span>
              </div>
              <div className="mt-4 space-y-4">
                {items.map((p) => {
                  const sisa = Math.round((detikAmbil(p.waktu_ambil) - sekarang) / 60000);
                  return (
                    <article key={p.id} className="rounded-2xl bg-white p-5 text-tinta shadow-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-judul text-2xl font-bold">{p.kode}</p>
                          <p className="text-sm text-tinta-lemah">{p.nama_pelanggan}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                          sisa <= 30 ? "bg-red-100 text-red-700" : "bg-latar text-tinta-lemah"
                        }`}>{sisa <= 0 ? `Lewat ${Math.abs(sisa)} mnt` : `${sisa} mnt lagi`}</span>
                      </div>
                      <p className="mt-3 text-sm font-semibold">Ambil {p.waktu_ambil} WIB</p>
                      <ul className="mt-2 space-y-1 text-sm">
                        {p.items.map((i, n) => <li key={n}>{i.nama_menu} x{i.jumlah}</li>)}
                      </ul>
                      {p.catatan && <p className="mt-2 rounded-lg bg-latar p-2 text-xs">{p.catatan}</p>}
                      {k.status === "siap" && (
                        <Tombol jenis="sekunder" kelas="mt-3 w-full"
                          onClick={() => setDipanggil(p.id)}>
                          {dipanggil === p.id ? "Sedang dipanggil" : "Panggil pelanggan"}
                        </Tombol>
                      )}
                      <Tombol kelas={`mt-3 w-full ${dipanggil === p.id ? "ring-4 ring-aksen" : ""}`}
                        onClick={() => void lanjut(p.id, k.berikut)}>{k.aksi}</Tombol>
                    </article>
                  );
                })}
                {items.length === 0 && <p className="py-10 text-center text-sm text-white/60">Kosong</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
