"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { formatRupiah } from "@/lib/format.ts";
import { ambilJson } from "@/komponen/api-klien.ts";
import { Badge, Dialog, Pesan, Tombol } from "./ui.tsx";

type Menu = {
  id: number; nama: string; harga: number; deskripsi: string; kategori: string; foto: string | null;
  porsi: number; tersedia: boolean; varian: { id: number; nama: string; harga_tambahan: number }[];
};
type Slot = { id: number; tanggal: string; jam: string; kuota: number; dipakai: number };
type DataAwal = {
  menu: Menu[];
  pengaturan: Record<string, string>;
};
type Baris = { menu_id: string; varian_id: string; jumlah: string };
type Hasil = { kode: string; kode_lacak: string; total: number; pesan: string; tautan: string };

const barisAwal = (): Baris => ({ menu_id: "", varian_id: "", jumlah: "1" });

export default function HalamanKonsumen({ awal }: { awal: DataAwal }) {
  const [data, setData] = useState<DataAwal>(awal);
  const [slot, setSlot] = useState<Slot[]>([]);
  const [kategori, setKategori] = useState("Semua");
  const [cari, setCari] = useState("");
  const [dialog, setDialog] = useState(false);
  const [hasilDialog, setHasilDialog] = useState(false);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [baris, setBaris] = useState<Baris[]>([barisAwal()]);
  const [nama, setNama] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [slotId, setSlotId] = useState("");
  const [waktu, setWaktu] = useState("");
  const [catatan, setCatatan] = useState("");
  const [pesan, setPesan] = useState("");
  const [jenis, setJenis] = useState<"info" | "sukses" | "galat">("galat");
  const [loading, setLoading] = useState(false);
  const [kodeLacak, setKodeLacak] = useState("");

  const muat = useCallback(async () => {
    try {
      const [d, s] = await Promise.all([
        fetch("/api/dashboard").then(ambilJson<DataAwal>),
        fetch("/api/slot").then(ambilJson<{ slot: Slot[] }>),
      ]);
      setData(d); setSlot(s.slot ?? []);
    } catch { /* biarkan data awal */ }
  }, []);
  useEffect(() => {
    void fetch("/api/slot").then(ambilJson<{ slot: Slot[] }>).then((s) => setSlot(s.slot ?? [])).catch(() => {});
    const t = setInterval(() => void muat(), 15000);
    return () => clearInterval(t);
  }, [muat]);

  const daftarKategori = useMemo(() => [...new Set(data.menu.map((m) => m.kategori))], [data.menu]);
  const tersaring = useMemo(() => data.menu.filter((m) => {
    const cocokKat = kategori === "Semua" || m.kategori === kategori;
    const cocokCari = cari.trim() === "" || m.nama.toLowerCase().includes(cari.toLowerCase());
    return cocokKat && cocokCari;
  }), [data.menu, kategori, cari]);

  const total = baris.reduce((nilai, b) => {
    const menu = data.menu.find((m) => m.id === Number(b.menu_id));
    const tambahan = menu?.varian.find((v) => v.id === Number(b.varian_id))?.harga_tambahan ?? 0;
    return nilai + ((menu?.harga ?? 0) + tambahan) * (Number(b.jumlah) || 0);
  }, 0);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setPesan("");
    try {
      const slotDipilih = slot.find((s) => s.id === Number(slotId));
      const respons = await fetch("/api/preorder", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: baris.map((b) => ({ menu_id: Number(b.menu_id), varian_id: b.varian_id ? Number(b.varian_id) : null, jumlah: Number(b.jumlah) })),
          nama_pelanggan: nama, whatsapp,
          waktu_ambil: slotDipilih ? `${slotDipilih.tanggal} ${slotDipilih.jam}` : waktu,
          slot_id: slotId ? Number(slotId) : null,
          catatan,
        }),
      });
      const dataHasil = await ambilJson<Hasil>(respons);
      setHasil(dataHasil); setDialog(false); setHasilDialog(true);
      setBaris([barisAwal()]); setNama(""); setWhatsapp(""); setSlotId(""); setWaktu(""); setCatatan("");
      void muat();
    } catch (err) { setJenis("galat"); setPesan(err instanceof Error ? err.message : "Gagal mengirim pre-order"); }
    finally { setLoading(false); }
  }

  const tokoBuka = data.pengaturan.toko_aktif === "true";

  return (
    <div className="min-h-screen">
      <header className="border-b border-garis bg-permukaan/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/jebew-icon.svg" alt="" width={42} height={42} />
            <div>
              <p className="font-judul text-base font-semibold">{data.pengaturan.nama_usaha ?? "Warung Kak Ikaa"}</p>
              <p className="text-[11px] text-tinta-lemah">{data.pengaturan.tagline ?? "Mie Jebew Chili Oil"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge warna={tokoBuka ? "sukses" : "bahaya"}>{tokoBuka ? "Buka" : "Tutup"}</Badge>
            <Link href="/admin" className="text-xs font-semibold text-tinta-lemah hover:text-utama">Admin</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28">
        <section className="animasi-muncul my-7 overflow-hidden rounded-kartu bg-utama px-6 py-9 text-white sm:px-10">
          <Badge warna="peringatan" >Pre-order dibuka</Badge>
          <h1 className="mt-4 font-judul text-3xl font-semibold leading-tight sm:text-4xl">
            Mie hangat, pesan lebih mudah.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/80">
            Pilih menu, tentukan waktu ambil, lalu kami siapkan. Status menu mengikuti sisa bahan di dapur.
          </p>
          <Tombol onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}
            jenis="sekunder" kelas="mt-6 bg-white text-utama hover:bg-krem">Lihat menu</Tombol>
        </section>

        <section className="mb-8 grid gap-3 sm:grid-cols-3">
          <KartuRingkas judul="Jam buka" isi={`${data.pengaturan.jam_buka ?? "10:00"} - ${data.pengaturan.jam_tutup ?? "21:00"}`} />
          <KartuRingkas judul="Lacak pesanan" isi="Gunakan kode di website" aksi="/lacak" />
          <KartuRingkas judul="Pesan cepat" isi="Lewat WhatsApp setelah isi form" />
        </section>

        <section id="menu" className="scroll-mt-4">
          <div className="sticky top-0 z-20 -mx-4 border-b border-garis bg-latar/95 px-4 py-3 backdrop-blur">
            <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filter kategori">
              {["Semua", ...daftarKategori].map((k) => (
                <button key={k} type="button" aria-pressed={kategori === k} onClick={() => setKategori(k)}
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${
                    kategori === k ? "bg-utama text-white" : "border border-garis bg-white text-tinta-lemah hover:bg-krem"
                  }`}>{k}</button>
              ))}
            </div>
            <label htmlFor="cari" className="visually-hidden">Cari menu</label>
            <input id="cari" type="search" placeholder="Cari menu..." value={cari} onChange={(e) => setCari(e.target.value)} className="min-h-[42px] text-sm" />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tersaring.map((m) => (
              <article key={m.id} className="animasi-muncul flex flex-col rounded-kartu border border-garis bg-permukaan p-5 shadow-kartu transition hover:-translate-y-0.5 hover:shadow-angkat">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-judul text-base font-semibold leading-snug">{m.nama}</h3>
                  <Badge warna={m.tersedia ? "sukses" : "bahaya"}>{m.tersedia ? "Tersedia" : "Habis"}</Badge>
                </div>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-tinta-lemah">{m.deskripsi}</p>
                {m.varian.length > 0 && (
                  <p className="mt-2 text-[11px] text-tinta-lemah">Varian: {m.varian.map((v) => v.nama).join(", ")}</p>
                )}
                <div className="mt-4 flex items-end justify-between border-t border-garis pt-3">
                  <div><p className="text-[10px] uppercase text-tinta-lemah">Harga</p><p className="font-judul text-lg font-semibold text-utama">{formatRupiah(m.harga)}</p></div>
                  {m.tersedia && m.porsi <= 5 && <Badge warna="peringatan">Sisa {m.porsi}</Badge>}
                </div>
              </article>
            ))}
          </div>
          {tersaring.length === 0 && <p className="py-10 text-center text-sm text-tinta-lemah">Menu tidak ditemukan.</p>}
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-garis bg-permukaan/95 p-3 backdrop-blur">
        <Tombol onClick={() => { setPesan(""); setDialog(true); }} nonaktif={!tokoBuka} kelas="mx-auto w-full max-w-2xl">Buat pre-order</Tombol>
      </div>

      <Dialog terbuka={dialog} judul="Buat pre-order" padaTutup={() => setDialog(false)} lebar="42rem">
        <form onSubmit={kirim} className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-tinta-lemah">Pesanan</legend>
            {baris.map((b, i) => {
              const menu = data.menu.find((m) => m.id === Number(b.menu_id));
              return (
                <div key={i} className="mb-3 rounded-xl border border-garis p-3">
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <div><label className="visually-hidden">Menu</label><select required value={b.menu_id} onChange={(e) => setBaris((l) => l.map((x, j) => j === i ? { ...x, menu_id: e.target.value, varian_id: "" } : x))}><option value="">Pilih menu</option>{data.menu.filter((m) => m.tersedia).map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}</select></div>
                    <div><label className="visually-hidden">Varian</label><select value={b.varian_id} onChange={(e) => setBaris((l) => l.map((x, j) => j === i ? { ...x, varian_id: e.target.value } : x))} disabled={!menu?.varian.length}><option value="">Tanpa varian</option>{menu?.varian.map((v) => <option key={v.id} value={v.id}>{v.nama}</option>)}</select></div>
                    <Tombol jenis="hapus" onClick={() => setBaris((l) => (l.length === 1 ? l : l.filter((_, j) => j !== i)))} kelas="px-2">-</Tombol>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs text-tinta-lemah">Jumlah</span>
                    <div className="flex items-center rounded-lg border border-garis">
                      <button type="button" onClick={() => setBaris((l) => l.map((x, j) => j === i ? { ...x, jumlah: String(Math.max(1, Number(x.jumlah) - 1)) } : x))} className="h-9 w-9">-</button>
                      <span className="w-7 text-center text-sm font-semibold">{b.jumlah}</span>
                      <button type="button" onClick={() => setBaris((l) => l.map((x, j) => j === i ? { ...x, jumlah: String(Math.min(100, Number(x.jumlah) + 1)) } : x))} className="h-9 w-9">+</button>
                    </div>
                  </div>
                </div>
              );
            })}
            <Tombol jenis="kosong" onClick={() => setBaris((l) => [...l, barisAwal()])}>+ Tambah menu lain</Tombol>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="p-nama">Nama kamu</label><input id="p-nama" required value={nama} onChange={(e) => setNama(e.target.value)} /></div>
            <div><label htmlFor="p-wa">WhatsApp</label><input id="p-wa" inputMode="tel" required value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="08..." /></div>
          </div>

          <div>
            <label htmlFor="p-slot">Waktu ambil</label>
            <select id="p-slot" value={slotId} onChange={(e) => setSlotId(e.target.value)}>
              <option value="">Pilih slot yang tersedia</option>
              {slot.filter((s) => s.dipakai < s.kuota).map((s) => <option key={s.id} value={s.id}>{s.tanggal} - {s.jam} (sisa {s.kuota - s.dipakai})</option>)}
            </select>
            {!slotId && <div className="mt-2"><label htmlFor="p-waktu">Atau isi waktu manual</label><input id="p-waktu" value={waktu} onChange={(e) => setWaktu(e.target.value)} placeholder="2026-11-25 18:00" /></div>}
          </div>

          <div><label htmlFor="p-catatan">Catatan (misal: level pedas 2)</label><textarea id="p-catatan" value={catatan} onChange={(e) => setCatatan(e.target.value)} /></div>
          <Pesan teks={pesan} jenis={jenis} />
          <div className="flex items-center justify-between rounded-xl bg-latar px-4 py-3"><span className="text-sm text-tinta-lemah">Total</span><span className="font-judul text-lg font-semibold text-utama">{formatRupiah(total)}</span></div>
          <Tombol tipe="submit" nonaktif={loading} kelas="w-full">{loading ? "Mengirim..." : `Kirim pre-order - ${formatRupiah(total)}`}</Tombol>
        </form>
      </Dialog>

      <Dialog terbuka={hasilDialog} judul="Pesanan tercatat" padaTutup={() => setHasilDialog(false)}>
        {hasil && (
          <div className="space-y-4">
            <Pesan teks={`Pesanan ${hasil.kode} berhasil. Simpan kode lacak ${hasil.kode_lacak} untuk mengecek status.`} jenis="sukses" />
            <pre className="overflow-x-auto rounded-xl bg-latar p-4 text-xs leading-relaxed">{hasil.pesan}</pre>
            <a href={hasil.tautan} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-sukses px-4 text-sm font-semibold text-white hover:brightness-95">Kirim ke WhatsApp</a>
          </div>
        )}
      </Dialog>

      <div className="border-t border-garis bg-permukaan py-6">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <label htmlFor="lacak">Lacak pesanan</label>
              <input id="lacak" value={kodeLacak} onChange={(e) => setKodeLacak(e.target.value)} placeholder="Masukkan kode lacak" />
            </div>
            <Link href={`/lacak?kode=${encodeURIComponent(kodeLacak)}`} className="inline-flex min-h-[44px] items-center rounded-xl border border-garis px-4 text-sm font-semibold hover:bg-latar">Cek status</Link>
          </div>
          <p className="mt-5 text-center text-xs text-tinta-lemah">{data.pengaturan.nama_usaha ?? "Warung Kak Ikaa"} - Mie Jebew Chili Oil & Wonton Ayam</p>
        </div>
      </div>
    </div>
  );
}

function KartuRingkas({ judul, isi, aksi }: { judul: string; isi: string; aksi?: string }) {
  const isiTeks = <><p className="text-[11px] uppercase tracking-wide text-tinta-lemah">{judul}</p><p className="mt-1 text-sm font-semibold">{isi}</p></>;
  return aksi ? <Link href={aksi} className="rounded-kartu border border-garis bg-permukaan p-4 shadow-kartu hover:border-utama">{isiTeks}</Link>
    : <div className="rounded-kartu border border-garis bg-permukaan p-4 shadow-kartu">{isiTeks}</div>;
}
