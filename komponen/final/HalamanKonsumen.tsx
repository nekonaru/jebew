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
type DataAwal = { menu: Menu[]; pengaturan: Record<string, string> };
type KeranjangItem = { menuId: number; varianId: number | null; jumlah: number };
type Hasil = { kode: string; kode_lacak: string; total: number; pesan: string; tautan: string };

const AKSESEN_KATEGORI: Record<string, { teks: string; garis: string }> = {
  "Mie Jebew": { teks: "text-utama", garis: "bg-utama" },
  "Mie Chili Oil": { teks: "text-[#9A5608]", garis: "bg-aksen" },
  "Wonton Ayam Chili Oil": { teks: "text-orange-700", garis: "bg-orange-500" },
  "Extra Topping": { teks: "text-amber-700", garis: "bg-amber-500" },
  Minuman: { teks: "text-info", garis: "bg-blue-500" },
};

export default function HalamanKonsumen({ awal }: { awal: DataAwal }) {
  const [data, setData] = useState<DataAwal>(awal);
  const [slot, setSlot] = useState<Slot[]>([]);
  const [kategori, setKategori] = useState("Semua");
  const [cari, setCari] = useState("");
  const [keranjang, setKeranjang] = useState<KeranjangItem[]>([]);
  const [pilihVarian, setPilihVarian] = useState<Menu | null>(null);
  const [dialogKeranjang, setDialogKeranjang] = useState(false);
  const [dialogCheckout, setDialogCheckout] = useState(false);
  const [hasilDialog, setHasilDialog] = useState(false);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [nama, setNama] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [slotId, setSlotId] = useState("");
  const [waktu, setWaktu] = useState("");
  const [catatan, setCatatan] = useState("");
  const [pesan, setPesan] = useState("");
  const [jenis, setJenis] = useState<"galat">("galat");
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

  const detailKeranjang = useMemo(() => keranjang.map((item) => {
    const menu = data.menu.find((m) => m.id === item.menuId);
    const varian = menu?.varian.find((v) => v.id === item.varianId);
    const harga = (menu?.harga ?? 0) + (varian?.harga_tambahan ?? 0);
    return { ...item, menu, varian, harga, subtotal: harga * item.jumlah };
  }), [keranjang, data.menu]);
  const totalKeranjang = detailKeranjang.reduce((n, i) => n + i.subtotal, 0);
  const jumlahItem = keranjang.reduce((n, i) => n + i.jumlah, 0);

  function tambah(menu: Menu, varianId: number | null = null) {
    if (!menu.tersedia) return;
    setKeranjang((lama) => {
      const ada = lama.find((i) => i.menuId === menu.id && i.varianId === varianId);
      if (ada) return lama.map((i) => i === ada ? { ...i, jumlah: Math.min(100, i.jumlah + 1) } : i);
      return [...lama, { menuId: menu.id, varianId, jumlah: 1 }];
    });
    setPilihVarian(null);
    setPesan("");
  }

  function klikMenu(menu: Menu) {
    if (!menu.tersedia) return;
    if (menu.varian.length > 0) setPilihVarian(menu);
    else tambah(menu);
  }

  function ubahJumlah(indeks: number, selisih: number) {
    setKeranjang((lama) => lama.map((item, i) => i === indeks
      ? { ...item, jumlah: Math.min(100, Math.max(1, item.jumlah + selisih)) } : item));
  }

  function bukaCheckout() {
    if (keranjang.length === 0) return;
    setPesan(""); setDialogKeranjang(false); setDialogCheckout(true);
  }

  async function kirim(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setPesan("");
    try {
      const slotDipilih = slot.find((s) => s.id === Number(slotId));
      const respons = await fetch("/api/preorder", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: keranjang.map((i) => ({ menu_id: i.menuId, varian_id: i.varianId, jumlah: i.jumlah })),
          nama_pelanggan: nama, whatsapp,
          waktu_ambil: slotDipilih ? `${slotDipilih.tanggal} ${slotDipilih.jam}` : waktu,
          slot_id: slotId ? Number(slotId) : null,
          catatan,
        }),
      });
      const dataHasil = await ambilJson<Hasil>(respons);
      setHasil(dataHasil); setDialogCheckout(false); setHasilDialog(true);
      setKeranjang([]); setNama(""); setWhatsapp(""); setSlotId(""); setWaktu(""); setCatatan("");
      void muat();
    } catch (err) { setPesan(err instanceof Error ? err.message : "Gagal mengirim pre-order"); }
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
            <img src="/assets/jebew-icon.svg" alt="" width={42} height={42} />
            <div className="h-8 w-px bg-garis" aria-hidden="true" />
            <div>
              <p className="font-judul text-[17px] font-bold uppercase leading-none tracking-[0.12em] text-tinta">Mie Jebew</p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-utama">Chili Oil & Wonton</p>
              <p className="mt-0.5 text-[10px] text-tinta-lemah">{data.pengaturan.nama_usaha ?? "Warung Kak Ikaa"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="group relative flex items-center">
              <button type="button" aria-describedby="info-jam-buka"
                className="flex items-center gap-1.5 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aksen">
                <span className={`h-2 w-2 rounded-full ${tokoBuka ? "bg-sukses" : "bg-bahaya"}`} aria-hidden="true" />
                <span className="text-xs font-semibold text-tinta">{tokoBuka ? "Buka" : "Tutup"}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 text-tinta-lemah">
                  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 11v5m0-8h.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <div id="info-jam-buka" role="tooltip"
                className="pointer-events-none absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-garis bg-permukaan p-3 text-left shadow-angkat opacity-0 translate-y-1 transition-[opacity,transform] duration-[var(--gerak-cepat)] group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-utama">Jam operasional</p>
                <p className="mt-1 text-sm font-semibold text-tinta">{data.pengaturan.hari_buka ?? "Senin - Minggu"}</p>
                <p className="text-sm text-tinta-lemah">{data.pengaturan.jam_buka ?? "10:00"} - {data.pengaturan.jam_tutup ?? "21:00"} WIB</p>
              </div>
            </div>
            <button type="button" onClick={() => setDialogKeranjang(true)}
              aria-label={`Lihat keranjang, ${jumlahItem} item`}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-garis bg-white text-tinta transition-colors duration-[var(--gerak-cepat)] hover:border-utama/40">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path d="M3 4h2l2.4 11.2a2 2 0 002 1.6h7.7a2 2 0 002-1.6L21 8H6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="10" cy="20" r="1" fill="currentColor" /><circle cx="18" cy="20" r="1" fill="currentColor" /></svg>
              {jumlahItem > 0 && (
                <span key={jumlahItem} className="animasi-pop absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-utama px-1 text-[10px] font-bold text-white">{jumlahItem}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16">
        <section className="animasi-muncul relative my-7 overflow-hidden rounded-kartu border border-garis bg-permukaan px-6 py-9 sm:px-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/jebew-mark.svg" alt="" aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-20 hidden h-80 w-80 opacity-[0.06] md:block" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-aksen/5" aria-hidden="true" />
          <div className="relative grid gap-8 md:grid-cols-[1.5fr_0.7fr] md:items-end">
            <div>
              <p className="animasi-geser text-[10px] font-bold uppercase tracking-[0.24em] text-utama">Mie Jebew Chili Oil · Pre-order</p>
              <h1 className="animasi-muncul mt-4 font-judul text-3xl font-semibold leading-[1.12] tracking-tight text-tinta sm:text-[2.7rem]" style={{ animationDelay: "60ms" }}>
                Mie hangat,<br /><span className="text-utama">pesan lebih mudah.</span>
              </h1>
              <p className="animasi-muncul mt-4 max-w-lg text-sm leading-relaxed text-tinta-lemah" style={{ animationDelay: "120ms" }}>
                Klik menu yang kamu mau, lalu isi data di akhir. Status menu mengikuti sisa bahan di dapur.
              </p>
              <div className="animasi-muncul mt-6" style={{ animationDelay: "180ms" }}>
                <Tombol onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })} kelas="gap-3 px-5">
                  Mulai pesan
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><path d="M5 12h14m-6-6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Tombol>
              </div>
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

        <section className="reveal mb-9 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-kartu border border-garis bg-permukaan px-5 py-4 shadow-kartu sm:px-7">
          <InfoRingkas judul="Jam buka" isi={`${data.pengaturan.jam_buka ?? "10:00"} - ${data.pengaturan.jam_tutup ?? "21:00"}`}
            ikon="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
          <InfoRingkas judul="Lacak pesanan" isi="Pakai kode dari website" aksi="/lacak"
            ikon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          <InfoRingkas judul="Pesan cepat" isi="Klik menu, isi data di akhir"
            ikon="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </section>

        <section id="menu" className="scroll-mt-4">
          <div className="reveal mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-utama">Klik untuk menambah</p>
              <h2 id="judul-menu" className="mt-1 font-judul text-2xl font-semibold tracking-tight">Menu hari ini</h2>
            </div>
            <span className="rounded-full border border-garis bg-permukaan px-3 py-1.5 text-xs font-semibold text-tinta-lemah">{tersaring.length} menu</span>
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
              <input id="cari" type="search" placeholder="Cari nama menu..." value={cari} onChange={(e) => setCari(e.target.value)} className="min-h-[44px] pl-10 text-sm" />
            </div>
          </div>

          <div className="daftar-panjang mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tersaring.map((m, indeks) => (
              <article key={m.id} className="animasi-muncul group flex flex-col overflow-hidden rounded-kartu border border-garis bg-permukaan shadow-kartu transition-[transform,box-shadow,border-color] duration-[var(--gerak-standar)] ease-[var(--ease-halus)] hover:-translate-y-1 hover:border-utama/30 hover:shadow-angkat"
                style={{ animationDelay: `${Math.min(indeks, 12) * 35}ms` }}>
                <div className="flex flex-1 flex-col p-5">
                  <span className={`mb-2 block h-0.5 w-8 rounded-full ${AKSESEN_KATEGORI[m.kategori]?.garis ?? "bg-tinta-lemah"}`} aria-hidden="true" />
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${AKSESEN_KATEGORI[m.kategori]?.teks ?? "text-tinta-lemah"}`}>{m.kategori}</p>
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
                    <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg bg-latar px-2.5 py-1 text-[11px] font-semibold text-tinta-lemah">
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5"><path d="M4 6h16M4 12h16M4 18h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                      {m.varian.length} varian
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-garis bg-latar/60 px-5 py-3.5">
                  <p className="font-judul text-xl font-semibold tracking-tight text-utama">{formatRupiah(m.harga)}</p>
                  <button type="button" onClick={() => klikMenu(m)} disabled={!m.tersedia || !tokoBuka}
                    aria-label={`Tambah ${m.nama} ke keranjang`}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-utama px-3 text-xs font-semibold text-white transition-colors duration-[var(--gerak-cepat)] hover:bg-utama-gelap disabled:bg-stone-300">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    Tambah
                  </button>
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

      {jumlahItem > 0 && (
        <div className="animasi-muncul fixed inset-x-0 bottom-0 z-30 border-t border-garis bg-permukaan/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <button type="button" onClick={() => setDialogKeranjang(true)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-garis px-3 py-2 text-left">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-utama text-xs font-bold text-white">{jumlahItem}</span>
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-tinta-lemah">Keranjang kamu</span>
                <span className="block truncate text-sm font-semibold text-tinta">{formatRupiah(totalKeranjang)}</span>
              </span>
            </button>
            <Tombol onClick={bukaCheckout} kelas="shrink-0 px-5">Isi data pesanan</Tombol>
          </div>
        </div>
      )}

      <Dialog terbuka={Boolean(pilihVarian)} judul={`Pilih varian ${pilihVarian?.nama ?? ""}`} padaTutup={() => setPilihVarian(null)}>
        {pilihVarian && (
          <div className="space-y-2">
            <p className="text-sm text-tinta-lemah">Pilih satu varian untuk ditambahkan ke keranjang.</p>
            {pilihVarian.varian.map((v) => (
              <button key={v.id} type="button" onClick={() => tambah(pilihVarian, v.id)}
                className="flex w-full items-center justify-between rounded-xl border border-garis px-4 py-3 text-left transition-colors duration-[var(--gerak-cepat)] hover:border-utama hover:bg-latar">
                <span className="text-sm font-semibold">{v.nama}</span>
                <span className="text-sm font-semibold text-utama">{v.harga_tambahan ? `+${formatRupiah(v.harga_tambahan)}` : "Gratis"}</span>
              </button>
            ))}
          </div>
        )}
      </Dialog>

      <Dialog terbuka={dialogKeranjang} judul="Keranjang pesanan" padaTutup={() => setDialogKeranjang(false)}>
        {detailKeranjang.length === 0 ? (
          <p className="py-8 text-center text-sm text-tinta-lemah">Keranjang masih kosong. Klik menu untuk menambah.</p>
        ) : (
          <div className="space-y-4">
            <ul className="space-y-3">
              {detailKeranjang.map((item, i) => (
                <li key={`${item.menuId}-${item.varianId}`} className="rounded-xl border border-garis p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{item.menu?.nama}</p>
                      {item.varian && <p className="text-xs text-tinta-lemah">{item.varian.nama}</p>}
                    </div>
                    <button type="button" onClick={() => setKeranjang((l) => l.filter((_, j) => j !== i))}
                      className="text-xs font-semibold text-bahaya hover:underline">Hapus</button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button type="button" aria-label="Kurangi jumlah" onClick={() => ubahJumlah(i, -1)} className="h-11 w-11 rounded-lg border border-garis">-</button>
                      <span className="w-6 text-center text-sm font-semibold">{item.jumlah}</span>
                      <button type="button" aria-label="Tambah jumlah" onClick={() => ubahJumlah(i, 1)} className="h-11 w-11 rounded-lg border border-garis">+</button>
                    </div>
                    <span className="text-sm font-semibold">{formatRupiah(item.subtotal)}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-garis pt-3">
              <span className="font-semibold">Total</span>
              <span className="font-judul text-xl font-semibold text-utama">{formatRupiah(totalKeranjang)}</span>
            </div>
            <Tombol onClick={bukaCheckout} kelas="w-full">Isi data pesanan</Tombol>
          </div>
        )}
      </Dialog>

      <Dialog terbuka={dialogCheckout} judul="Data pemesanan" padaTutup={() => setDialogCheckout(false)} lebar="42rem">
        <form onSubmit={kirim} className="space-y-5">
          <div className="rounded-xl bg-latar px-4 py-3 text-sm">
            <div className="flex justify-between"><span>{jumlahItem} item pesanan</span><span className="font-semibold">{formatRupiah(totalKeranjang)}</span></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="p-nama">Nama kamu</label><input id="p-nama" required value={nama} onChange={(e) => setNama(e.target.value)} /></div>
            <div><label htmlFor="p-wa">Nomor WhatsApp</label><input id="p-wa" inputMode="tel" required value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="08..." /></div>
          </div>
          <div>
            <label htmlFor="p-slot">Waktu ambil</label>
            <select id="p-slot" value={slotId} onChange={(e) => setSlotId(e.target.value)}>
              <option value="">Pilih slot yang tersedia</option>
              {slot.filter((s) => s.dipakai < s.kuota).map((s) => <option key={s.id} value={s.id}>{s.tanggal} - {s.jam} (sisa {s.kuota - s.dipakai})</option>)}
            </select>
            {!slotId && <div className="mt-2"><label htmlFor="p-waktu">Atau isi waktu manual</label><input id="p-waktu" value={waktu} onChange={(e) => setWaktu(e.target.value)} placeholder="2026-11-25 18:00" /></div>}
          </div>
          <div><label htmlFor="p-catatan">Catatan, misalnya level pedas 2</label><textarea id="p-catatan" value={catatan} onChange={(e) => setCatatan(e.target.value)} /></div>
          <Pesan teks={pesan} jenis={jenis} />
          <Tombol tipe="submit" nonaktif={loading} kelas="w-full">{loading ? "Mengirim..." : `Kirim pre-order - ${formatRupiah(totalKeranjang)}`}</Tombol>
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
              <Link href={`/lacak?kode=${encodeURIComponent(kodeLacak)}`} className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-tinta px-4 text-sm font-semibold text-white transition-colors duration-[var(--gerak-cepat)] hover:bg-utama">
                Cek status
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><path d="M5 12h14m-6-6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-garis pt-5">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/jebew-icon.svg" alt="" width={30} height={30} />
              <div>
                <p className="font-judul text-sm font-bold uppercase tracking-[0.16em] text-tinta">Mie Jebew</p>
                <p className="text-[10px] text-tinta-lemah">{data.pengaturan.nama_usaha ?? "Warung Kak Ikaa"}</p>
              </div>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-tinta-lemah">Chili Oil & Wonton Ayam</p>
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
