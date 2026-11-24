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
  const tersediaCount = data.menu.filter((m) => m.tersedia).length;

  return (
    <div className="min-h-screen">
      <header className="border-b border-garis bg-permukaan/95 backdrop-blur">
        <div className="h-0.5 bg-gradient-to-r from-utama via-aksen to-utama" aria-hidden="true" />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/jebew-icon.svg" alt="" width={40} height={40} />
            <div>
              <p className="font-judul text-base font-semibold tracking-tight">{data.pengaturan.nama_usaha ?? "Warung Kak Ikaa"}</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-tinta-lemah">{data.pengaturan.tagline ?? "Mie Jebew Chili Oil"}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge warna={tokoBuka ? "sukses" : "bahaya"}>{tokoBuka ? "Buka" : "Tutup"}</Badge>
            <Link href="/admin" className="text-xs font-semibold text-tinta-lemah transition-colors duration-[var(--gerak-cepat)] hover:text-utama">Admin</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28">
        <section className="animasi-muncul relative my-7 overflow-hidden rounded-kartu border border-garis bg-permukaan px-6 py-9 sm:px-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-utama/5" aria-hidden="true" />
          <div className="relative grid gap-8 md:grid-cols-[1.5fr_0.7fr] md:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-utama">Warung Kak Ikaa · Pre-order</p>
              <h1 className="mt-4 font-judul text-3xl font-semibold leading-[1.15] tracking-tight text-tinta sm:text-[2.6rem]">
                Mie hangat,<br />pesan lebih mudah.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-tinta-lemah">
                Pilih menu, tentukan waktu ambil, lalu kami siapkan. Status menu mengikuti sisa bahan di dapur.
              </p>
              <Tombol onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}
                kelas="mt-6 gap-3 px-5">
                Lihat menu
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><path d="M5 12h14m-6-6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Tombol>
            </div>
            <div className="hidden rounded-kartu border border-garis bg-latar/70 p-5 md:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-tinta-lemah">Hari ini</p>
              <p className="mt-2 font-judul text-4xl font-semibold text-utama">{tersediaCount}</p>
              <p className="text-xs text-tinta-lemah">menu siap dipesan</p>
              <div className="mt-4 border-t border-garis pt-3">
                <Badge warna={tokoBuka ? "sukses" : "bahaya"}>{tokoBuka ? "Toko buka" : "Toko tutup"}</Badge>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-9 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-kartu border border-garis bg-permukaan px-5 py-4 shadow-kartu sm:px-7">
          <InfoRingkas judul="Jam buka" isi={`${data.pengaturan.jam_buka ?? "10:00"} - ${data.pengaturan.jam_tutup ?? "21:00"}`}
            ikon="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
          <InfoRingkas judul="Lacak pesanan" isi="Pakai kode dari website" aksi="/lacak"
            ikon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          <InfoRingkas judul="Pesan cepat" isi="Lanjut lewat WhatsApp"
            ikon="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </section>

        <section id="menu" className="scroll-mt-4">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-utama">Pilih dan pesan</p>
              <h2 id="judul-menu" className="mt-1 font-judul text-2xl font-semibold tracking-tight">Menu hari ini</h2>
            </div>
            <span className="rounded-full border border-garis bg-permukaan px-3 py-1.5 text-xs font-semibold text-tinta-lemah">
              {tersaring.length} menu
            </span>
          </div>

          <div className="sticky top-0 z-20 -mx-4 border-y border-garis bg-latar/95 px-4 py-3 backdrop-blur">
            <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filter kategori">
              {["Semua", ...daftarKategori].map((k) => (
                <button key={k} type="button" aria-pressed={kategori === k} onClick={() => setKategori(k)}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition-[background-color,color,box-shadow] duration-[var(--gerak-cepat)] ${
                    kategori === k ? "bg-utama text-white shadow-sm" : "border border-garis bg-white text-tinta-lemah hover:border-utama/40 hover:text-tinta"
                  }`}>{k}</button>
              ))}
            </div>
            <div className="relative">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-lemah">
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <label htmlFor="cari" className="visually-hidden">Cari menu</label>
              <input id="cari" type="search" placeholder="Cari nama menu..." value={cari} onChange={(e) => setCari(e.target.value)}
                className="min-h-[44px] pl-10 text-sm" />
            </div>
          </div>

          <div className="daftar-panjang mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tersaring.map((m, indeks) => (
              <article key={m.id} className="animasi-muncul group flex flex-col overflow-hidden rounded-kartu border border-garis bg-permukaan shadow-kartu transition-[transform,box-shadow,border-color] duration-[var(--gerak-standar)] ease-[var(--ease-halus)] hover:-translate-y-1 hover:border-utama/30 hover:shadow-angkat"
                style={{ animationDelay: `${Math.min(indeks, 12) * 35}ms` }}>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-tinta-lemah">{m.kategori}</p>
                    <span className={`mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      m.tersedia ? "bg-sukses-terang text-sukses" : "bg-stone-100 text-stone-500"
                    }`}>
                      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${m.tersedia ? "bg-sukses" : "bg-stone-400"}`} />
                      {m.tersedia ? "Tersedia" : "Habis"}
                    </span>
                  </div>
                  <h3 className="mt-2 font-judul text-[17px] font-semibold leading-snug text-tinta">{m.nama}</h3>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-tinta-lemah">{m.deskripsi}</p>
                  {m.varian.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-tinta-lemah">
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5"><path d="M4 6h16M4 12h16M4 18h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                      {m.varian.length} varian: {m.varian.map((v) => v.nama).join(", ")}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-garis bg-latar/60 px-5 py-3.5">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-tinta-lemah">Harga</p>
                    <p className="mt-0.5 font-judul text-xl font-semibold tracking-tight text-utama">{formatRupiah(m.harga)}</p>
                  </div>
                  {m.tersedia && m.porsi <= 5 ? (
                    <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">Sisa {m.porsi}</span>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 text-garis transition-transform duration-[var(--gerak-standar)] group-hover:translate-x-1">
                      <path d="M5 12h14m-6-6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </article>
            ))}
          </div>
          {tersaring.length === 0 && (
            <div className="rounded-kartu border border-dashed border-garis py-14 text-center">
              <p className="font-judul text-lg font-semibold">Menu tidak ditemukan</p>
              <p className="mt-1 text-sm text-tinta-lemah">Coba kata kunci atau kategori lain.</p>
            </div>
          )}
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

      <div className="border-t border-garis bg-permukaan">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-utama">Sudah pesan?</p>
              <p className="mt-1 font-judul text-lg font-semibold">Cek status pesananmu</p>
            </div>
            <div className="flex w-full flex-wrap items-end gap-3 sm:w-auto">
              <div className="min-w-[220px] flex-1">
                <label htmlFor="lacak">Kode lacak</label>
                <input id="lacak" value={kodeLacak} onChange={(e) => setKodeLacak(e.target.value)} placeholder="Contoh: A1B2C3D4" />
              </div>
              <Link href={`/lacak?kode=${encodeURIComponent(kodeLacak)}`}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-tinta px-4 text-sm font-semibold text-white transition-colors duration-[var(--gerak-cepat)] hover:bg-utama">
                Cek status
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><path d="M5 12h14m-6-6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-garis pt-5">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/jebew-icon.svg" alt="" width={24} height={24} />
              <span className="font-judul text-sm font-semibold">{data.pengaturan.nama_usaha ?? "Warung Kak Ikaa"}</span>
            </div>
            <p className="text-[11px] text-tinta-lemah">Mie Jebew Chili Oil & Wonton Ayam</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRingkas({
  judul, isi, ikon, aksi,
}: { judul: string; isi: string; ikon: string; aksi?: string }) {
  const isiTeks = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-latar text-utama">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
          <path d={ikon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-tinta-lemah">{judul}</span>
        <span className="mt-0.5 block truncate text-sm font-semibold text-tinta">{isi}</span>
      </span>
      {aksi && (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="ml-auto h-4 w-4 shrink-0 text-tinta-lemah">
          <path d="M5 12h14m-6-6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </>
  );
  const kelas = "flex flex-1 items-center gap-3 rounded-lg px-2 py-1 transition-colors duration-[var(--gerak-cepat)]";
  return aksi
    ? <Link href={aksi} className={`${kelas} hover:text-utama`}>{isiTeks}</Link>
    : <div className={kelas}>{isiTeks}</div>;
}
