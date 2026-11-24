"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { formatRupiah } from "@/lib/format.ts";
import { Dialog, Pesan, Tombol } from "./ui.tsx";

type MenuPublik = {
  id: number;
  nama: string;
  harga: number;
  deskripsi: string;
  kategori: string;
  foto: string | null;
  porsi: number;
  tersedia: boolean;
};

type BarisPesanan = { menu_id: string; jumlah: string };

type HasilPreorder = {
  kode: string;
  total: number;
  pesan: string;
  tautan: string;
};

const URUTAN_KATEGORI = [
  "Mie Jebew",
  "Wonton Ayam Chili Oil",
  "Mie Chili Oil",
  "Extra Topping",
  "Minuman",
];

const barisAwal = (): BarisPesanan => ({ menu_id: "", jumlah: "1" });

export default function HalamanUtama() {
  const [daftarMenu, setDaftarMenu] = useState<MenuPublik[]>([]);
  const [namaUsaha, setNamaUsaha] = useState("Warung Kak Ikaa");
  const [kategoriAktif, setKategoriAktif] = useState("Semua");
  const [cari, setCari] = useState("");
  const [pesan, setPesan] = useState("");
  const [jenisPesan, setJenisPesan] = useState<"info" | "sukses" | "galat">("info");
  const [dialogPesan, setDialogPesan] = useState(false);
  const [dialogHasil, setDialogHasil] = useState(false);
  const [hasil, setHasil] = useState<HasilPreorder | null>(null);
  const [sedangMuat, setSedangMuat] = useState(true);
  const [sedangKirim, setSedangKirim] = useState(false);
  const [baris, setBaris] = useState<BarisPesanan[]>([barisAwal()]);
  const [nama, setNama] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [waktuAmbil, setWaktuAmbil] = useState("");
  const [catatan, setCatatan] = useState("");

  const muatStatus = useCallback(async () => {
    try {
      const jawaban = await fetch("/api/status", { cache: "no-store" });
      if (!jawaban.ok) throw new Error("Gagal memuat menu");
      const data = (await jawaban.json()) as { menu: MenuPublik[]; nama_usaha: string };
      setDaftarMenu(data.menu);
      setNamaUsaha(data.nama_usaha);
      setPesan("");
    } catch {
      setJenisPesan("galat");
      setPesan("Menu belum bisa dimuat. Halaman akan mencoba lagi.");
    } finally {
      setSedangMuat(false);
    }
  }, []);

  useEffect(() => {
    void muatStatus();
    const penghitung = setInterval(() => void muatStatus(), 15000);
    return () => clearInterval(penghitung);
  }, [muatStatus]);

  const menuTersedia = useMemo(() => daftarMenu.filter((menu) => menu.tersedia), [daftarMenu]);

  const tersaring = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    return daftarMenu.filter((menu) => {
      const cocokKategori = kategoriAktif === "Semua" || menu.kategori === kategoriAktif;
      const cocokCari = kata === "" || menu.nama.toLowerCase().includes(kata);
      return cocokKategori && cocokCari;
    });
  }, [daftarMenu, kategoriAktif, cari]);

  const kategoriTerpakai = useMemo(() => {
    const hadir = new Set(tersaring.map((menu) => menu.kategori));
    return URUTAN_KATEGORI.filter((kategori) => hadir.has(kategori));
  }, [tersaring]);

  const totalSementara = useMemo(() => {
    return baris.reduce((nilai, item) => {
      const menu = daftarMenu.find((pilihan) => pilihan.id === Number(item.menu_id));
      return nilai + (menu?.harga ?? 0) * (Number(item.jumlah) || 0);
    }, 0);
  }, [baris, daftarMenu]);

  function ubahBaris(indeks: number, bagian: Partial<BarisPesanan>) {
    setBaris((nilai) => nilai.map((item, posisi) => (posisi === indeks ? { ...item, ...bagian } : item)));
  }

  function ubahJumlah(indeks: number, selisih: number) {
    const sekarang = Number(baris[indeks].jumlah) || 1;
    ubahBaris(indeks, { jumlah: String(Math.max(1, Math.min(100, sekarang + selisih))) });
  }

  function bukaPemesanan() {
    setPesan("");
    setDialogPesan(true);
  }

  async function kirimPreorder(peristiwa: FormEvent<HTMLFormElement>) {
    peristiwa.preventDefault();
    setSedangKirim(true);
    setPesan("");

    try {
      const jawaban = await fetch("/api/preorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: baris.map((item) => ({
            menu_id: Number(item.menu_id),
            jumlah: Number(item.jumlah),
          })),
          nama_pelanggan: nama,
          whatsapp,
          waktu_ambil: waktuAmbil.replace("T", " "),
          catatan,
        }),
      });
      const data = (await jawaban.json()) as HasilPreorder & { pesan?: string };
      if (!jawaban.ok) throw new Error(data.pesan ?? "Pre-order gagal dikirim");

      setHasil(data as HasilPreorder);
      setDialogPesan(false);
      setDialogHasil(true);
      setBaris([barisAwal()]);
      setNama("");
      setWhatsapp("");
      setWaktuAmbil("");
      setCatatan("");
      void muatStatus();
    } catch (kesalahan) {
      setJenisPesan("galat");
      setPesan(kesalahan instanceof Error ? kesalahan.message : "Pre-order gagal dikirim");
    } finally {
      setSedangKirim(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-tepi bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/jebew-icon.svg" alt="" width={40} height={40} />
            <div>
              <p className="font-judul text-base font-semibold leading-tight">{namaUsaha}</p>
              <p className="text-[11px] leading-tight text-coklatMuda">Mie Jebew Chili Oil & Wonton Ayam</p>
            </div>
          </div>
          <a href="/admin" className="rounded-lg border border-tepi px-3 py-2 text-xs font-semibold text-coklatMuda hover:bg-krem">
            Admin
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24">
        <section className="animasi-muncul my-6 rounded-2xl bg-krem px-5 py-7 sm:px-8 sm:py-9">
          <span className="inline-block rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-bata">
            Pre-order dibuka
          </span>
          <h1 className="mt-3 text-2xl font-semibold leading-snug sm:text-3xl">
            Pilih menu, isi pesanan, kami siapkan.
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-coklatMuda">
            Status menu mengikuti sisa bahan di dapur. Pesanan langsung terkirim ke WhatsApp kami.
          </p>
          <Tombol onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })} kelas="mt-5">
            Lihat menu
          </Tombol>
        </section>

        <section id="menu" aria-labelledby="judul-menu" className="scroll-mt-4">
          <div className="sticky top-0 z-20 -mx-4 border-b border-tepi bg-kremMuda/95 px-4 py-3 backdrop-blur">
            <h2 id="judul-menu" className="sr-only">Daftar menu</h2>
            <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filter kategori menu">
              {["Semua", ...URUTAN_KATEGORI].map((kategori) => (
                <button
                  key={kategori}
                  type="button"
                  aria-pressed={kategoriAktif === kategori}
                  onClick={() => setKategoriAktif(kategori)}
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${
                    kategoriAktif === kategori
                      ? "bg-bata text-white"
                      : "border border-tepi bg-white text-coklatMuda hover:bg-krem"
                  }`}
                >
                  {kategori}
                </button>
              ))}
            </div>
            <label className="visually-hidden" htmlFor="cari-menu">Cari menu</label>
            <input
              id="cari-menu"
              type="search"
              name="cari_menu"
              placeholder="Cari nama menu..."
              value={cari}
              onChange={(peristiwa) => setCari(peristiwa.target.value)}
              className="min-h-[44px] text-sm"
            />
          </div>

          <p className="mt-4 text-xs text-coklatMuda">
            {sedangMuat ? "Memuat menu..." : `${menuTersedia.length} dari ${daftarMenu.length} menu tersedia`}
          </p>
          <Pesan teks={pesan} jenis={jenisPesan} />

          {sedangMuat ? (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Memuat menu">
              {Array.from({ length: 6 }, (_, indeks) => (
                <li key={indeks} className="animate-pulse rounded-2xl border border-tepi bg-white p-4">
                  <div className="h-4 w-2/3 rounded bg-krem" />
                  <div className="mt-3 h-3 w-full rounded bg-krem" />
                  <div className="mt-5 h-5 w-1/3 rounded bg-krem" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 space-y-8">
              {kategoriTerpakai.map((namaKategori) => (
                <div key={namaKategori}>
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-lg font-semibold">{namaKategori}</h3>
                    <span className="text-xs text-coklatMuda">
                      {tersaring.filter((menu) => menu.kategori === namaKategori).length} menu
                    </span>
                  </div>
                  {namaKategori === "Mie Jebew" && (
                    <p className="mb-3 rounded-lg bg-krem px-3 py-2 text-xs text-coklatMuda">
                      Level pedas 0 sampai 3, tuliskan di kolom catatan saat memesan.
                    </p>
                  )}
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {tersaring
                      .filter((menu) => menu.kategori === namaKategori)
                      .map((menu, indeks) => (
                        <li
                          key={menu.id}
                          className="animasi-muncul flex flex-col rounded-2xl border border-tepi bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-oranye/50 hover:shadow-kartu"
                          style={{ animationDelay: `${Math.min(indeks, 12) * 30}ms` }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="text-sm font-semibold leading-snug">{menu.nama}</h4>
                            <span
                              className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                                menu.tersedia ? "bg-green-100 text-green-800" : "bg-stone-200 text-stone-600"
                              }`}
                            >
                              {menu.tersedia ? "Tersedia" : "Habis"}
                            </span>
                          </div>
                          <p className="mt-2 flex-1 text-xs leading-relaxed text-coklatMuda">{menu.deskripsi}</p>
                          <div className="mt-3 flex items-end justify-between gap-2 border-t border-tepi/70 pt-3">
                            <span className="font-judul text-base font-semibold text-bata">
                              {formatRupiah(menu.harga)}
                            </span>
                            {menu.tersedia && menu.porsi <= 5 && (
                              <span className="rounded-md bg-oranye/15 px-2 py-1 text-[10px] font-semibold text-oranye">
                                Sisa {menu.porsi}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
              {kategoriTerpakai.length === 0 && (
                <p className="rounded-xl border border-tepi bg-white px-4 py-8 text-center text-sm text-coklatMuda">
                  Menu tidak ditemukan. Coba kata kunci lain.
                </p>
              )}
            </div>
          )}
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-tepi bg-white/95 p-3 backdrop-blur sm:hidden">
        <Tombol onClick={bukaPemesanan} nonaktif={menuTersedia.length === 0} kelas="w-full">
          Buat pre-order
        </Tombol>
      </div>

      <div className="hidden sm:block">
        <Tombol onClick={bukaPemesanan} nonaktif={menuTersedia.length === 0} kelas="fixed bottom-6 right-6 z-10 shadow-kartu">
          Buat pre-order
        </Tombol>
      </div>

      <footer className="border-t border-tepi bg-white py-5 text-center text-xs text-coklatMuda">
        {namaUsaha} - Prototipe Tahap 1
      </footer>

      <Dialog terbuka={dialogPesan} judul="Buat pre-order" padaTutup={() => setDialogPesan(false)}>
        <form onSubmit={kirimPreorder} className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Pilih menu</legend>
            <div className="space-y-3">
              {baris.map((item, indeks) => (
                <div key={indeks} className="rounded-xl border border-tepi p-3">
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <label className="visually-hidden" htmlFor={`menu-${indeks}`}>Menu ke-{indeks + 1}</label>
                    <select
                      id={`menu-${indeks}`}
                      name={`menu-${indeks}`}
                      required
                      value={item.menu_id}
                      onChange={(peristiwa) => ubahBaris(indeks, { menu_id: peristiwa.target.value })}
                    >
                      <option value="">Pilih menu</option>
                      {menuTersedia.map((menu) => (
                        <option key={menu.id} value={menu.id}>
                          {menu.nama} - {formatRupiah(menu.harga)}
                        </option>
                      ))}
                    </select>
                    <Tombol
                      onClick={() => setBaris((nilai) => (nilai.length === 1 ? nilai : nilai.filter((_, posisi) => posisi !== indeks)))}
                      jenis="bahaya"
                      kelas="min-h-[48px] px-3"
                    >
                      Hapus
                    </Tombol>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs text-coklatMuda">Jumlah</span>
                    <div className="flex items-center rounded-lg border border-tepi">
                      <button type="button" onClick={() => ubahJumlah(indeks, -1)} aria-label="Kurangi jumlah" className="min-h-[40px] w-10 text-lg text-bata">-</button>
                      <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{item.jumlah}</span>
                      <button type="button" onClick={() => ubahJumlah(indeks, 1)} aria-label="Tambah jumlah" className="min-h-[40px] w-10 text-lg text-bata">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setBaris((nilai) => [...nilai, barisAwal()])} className="mt-3 text-xs font-semibold text-bata underline underline-offset-2">
              Tambah menu lain
            </button>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nama-pelanggan">Nama kamu</label>
              <input id="nama-pelanggan" name="nama_pelanggan" autoComplete="name" required maxLength={100} value={nama} onChange={(e) => setNama(e.target.value)} />
            </div>
            <div>
              <label htmlFor="whatsapp-pelanggan">Nomor WhatsApp</label>
              <input id="whatsapp-pelanggan" name="whatsapp" autoComplete="tel" inputMode="tel" required maxLength={20} placeholder="081234567890" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            </div>
          </div>

          <div>
            <label htmlFor="waktu-ambil">Waktu ambil</label>
            <input id="waktu-ambil" name="waktu_ambil" type="datetime-local" required value={waktuAmbil} onChange={(e) => setWaktuAmbil(e.target.value)} />
          </div>

          <div>
            <label htmlFor="catatan-pelanggan">Catatan, misalnya level pedas 2</label>
            <textarea id="catatan-pelanggan" name="catatan" maxLength={300} value={catatan} onChange={(e) => setCatatan(e.target.value)} />
          </div>

          <Pesan teks={pesan} jenis={jenisPesan} />

          <div className="flex items-center justify-between rounded-xl bg-krem px-4 py-3">
            <span className="text-sm text-coklatMuda">Total</span>
            <span className="font-judul text-lg font-semibold text-bata">{formatRupiah(totalSementara)}</span>
          </div>

          <Tombol tipe="submit" nonaktif={sedangKirim} kelas="w-full">
            {sedangKirim ? "Mengirim..." : `Kirim pre-order - ${formatRupiah(totalSementara)}`}
          </Tombol>
        </form>
      </Dialog>

      <Dialog terbuka={dialogHasil} judul="Pre-order tercatat" padaTutup={() => setDialogHasil(false)}>
        {hasil && (
          <div className="space-y-4">
            <Pesan
              teks={`Pesanan ${hasil.kode} sudah tersimpan. Total ${formatRupiah(hasil.total)}. Lanjutkan dengan mengirim pesan ke WhatsApp kami.`}
              jenis="sukses"
            />
            <pre className="overflow-x-auto rounded-xl bg-krem p-4 text-xs leading-relaxed text-coklat">
              {hasil.pesan}
            </pre>
            <a href={hasil.tautan} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-sukses px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
              Buka WhatsApp
            </a>
          </div>
        )}
      </Dialog>
    </div>
  );
}
