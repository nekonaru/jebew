"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { formatRupiah } from "@/lib/format.ts";
import { Dialog, LabelStatus, Pesan, Tombol } from "./ui.tsx";

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

const barisAwal = (): BarisPesanan => ({ menu_id: "", jumlah: "1" });

export default function HalamanUtama() {
  const [daftarMenu, setDaftarMenu] = useState<MenuPublik[]>([]);
  const [namaUsaha, setNamaUsaha] = useState("Mie Jebew");
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
      setPesan("Status menu belum bisa dimuat. Halaman akan mencoba lagi.");
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
  const kategori = useMemo(
    () => [...new Set(daftarMenu.map((menu) => menu.kategori))],
    [daftarMenu],
  );

  function ubahBaris(indeks: number, bagian: Partial<BarisPesanan>) {
    setBaris((nilai) => nilai.map((item, posisi) => (posisi === indeks ? { ...item, ...bagian } : item)));
  }

  function tambahBaris() {
    setBaris((nilai) => [...nilai, barisAwal()]);
  }

  function kurangiBaris(indeks: number) {
    setBaris((nilai) => (nilai.length === 1 ? nilai : nilai.filter((_, posisi) => posisi !== indeks)));
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
      if (!jawaban.ok) throw new Error(data.pesan ?? "Preorder gagal dikirim");

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
      setPesan(kesalahan instanceof Error ? kesalahan.message : "Preorder gagal dikirim");
    } finally {
      setSedangKirim(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-tepi bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/jebew-icon.svg" alt="" width={44} height={44} />
            <div>
              <p className="font-judul text-lg font-semibold">{namaUsaha}</p>
              <p className="text-xs text-coklatMuda">Stok, kasir, dan pre-order</p>
            </div>
          </div>
          <a
            href="/admin"
            className="rounded-xl border border-tepi px-4 py-2 text-sm font-semibold text-coklat hover:bg-krem"
          >
            Dashboard admin
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20">
        <section className="my-8 overflow-hidden rounded-3xl bg-krem p-6 sm:p-10">
          <div className="grid items-center gap-6 md:grid-cols-[1.4fr_1fr]">
            <div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-bata">
                Diperbarui otomatis dari stok dapur
              </span>
              <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
                Mie hangat, statusnya selalu jelas.
              </h1>
              <p className="mt-3 max-w-xl text-coklatMuda">
                Lihat menu yang masih bisa dibuat hari ini. Pesan lewat website, lalu kami konfirmasi
                lewat WhatsApp.
              </p>
              <Tombol onClick={() => setDialogPesan(true)} nonaktif={menuTersedia.length === 0} kelas="mt-6">
                Buat pre-order
              </Tombol>
            </div>
            <div className="hidden justify-center md:flex">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/jebew-mark.svg" alt="" width={210} height={210} />
            </div>
          </div>
        </section>

        <Pesan teks={pesan} jenis={jenisPesan} />

        <section aria-labelledby="judul-menu">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="judul-menu" className="text-2xl font-semibold">Daftar menu</h2>
              <p className="text-sm text-coklatMuda">
                {sedangMuat ? "Memuat status stok..." : `${menuTersedia.length} menu siap dipesan`}
              </p>
            </div>
            <Tombol onClick={() => void muatStatus()} jenis="sekunder">
              Segarkan status
            </Tombol>
          </div>

          {kategori.map((namaKategori) => (
            <div key={namaKategori} className="mb-8">
              <h3 className="mb-3 text-lg font-semibold text-coklatMuda">{namaKategori}</h3>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {daftarMenu
                  .filter((menu) => menu.kategori === namaKategori)
                  .map((menu) => (
                    <li
                      key={menu.id}
                      className="flex flex-col rounded-2xl border border-tepi bg-white p-5 shadow-kartu"
                    >
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-krem">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/assets/jebew-mark.svg" alt="" width={30} height={30} />
                      </div>
                      <h4 className="text-lg font-semibold">{menu.nama}</h4>
                      <p className="mt-1 flex-1 text-sm text-coklatMuda">{menu.deskripsi}</p>
                      <p className="mt-3 font-judul text-xl font-semibold text-bata">
                        {formatRupiah(menu.harga)}
                      </p>
                      <div className="mt-4">
                        <LabelStatus tersedia={menu.tersedia} porsi={menu.porsi} />
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-tepi bg-white py-6 text-center text-sm text-coklatMuda">
        {namaUsaha} - Prototipe Tahap 1
      </footer>

      <Dialog terbuka={dialogPesan} judul="Buat pre-order" padaTutup={() => setDialogPesan(false)}>
        <form onSubmit={kirimPreorder} className="space-y-5">
          <fieldset>
            <legend className="mb-2 font-semibold">Pesanan</legend>
            <div className="space-y-3">
              {baris.map((item, indeks) => (
                <div key={indeks} className="grid grid-cols-[1fr_88px_auto] gap-2">
                  <label className="visually-hidden" htmlFor={`menu-${indeks}`}>
                    Menu ke-{indeks + 1}
                  </label>
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
                  <label className="visually-hidden" htmlFor={`jumlah-${indeks}`}>
                    Jumlah menu ke-{indeks + 1}
                  </label>
                  <input
                    id={`jumlah-${indeks}`}
                    name={`jumlah-${indeks}`}
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={item.jumlah}
                    onChange={(peristiwa) => ubahBaris(indeks, { jumlah: peristiwa.target.value })}
                  />
                  <Tombol
                    onClick={() => kurangiBaris(indeks)}
                    jenis="bahaya"
                    kelas="px-3"
                  >
                    Hapus
                  </Tombol>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={tambahBaris}
              className="mt-3 text-sm font-semibold text-bata underline underline-offset-2"
            >
              Tambah menu lain
            </button>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nama-pelanggan">Nama kamu</label>
              <input
                id="nama-pelanggan"
                name="nama_pelanggan"
                autoComplete="name"
                required
                maxLength={100}
                value={nama}
                onChange={(peristiwa) => setNama(peristiwa.target.value)}
              />
            </div>
            <div>
              <label htmlFor="whatsapp-pelanggan">Nomor WhatsApp</label>
              <input
                id="whatsapp-pelanggan"
                name="whatsapp"
                autoComplete="tel"
                inputMode="tel"
                required
                maxLength={20}
                placeholder="081234567890"
                value={whatsapp}
                onChange={(peristiwa) => setWhatsapp(peristiwa.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="waktu-ambil">Waktu ambil</label>
            <input
              id="waktu-ambil"
              name="waktu_ambil"
              type="datetime-local"
              required
              value={waktuAmbil}
              onChange={(peristiwa) => setWaktuAmbil(peristiwa.target.value)}
            />
          </div>

          <div>
            <label htmlFor="catatan-pelanggan">Catatan (opsional)</label>
            <textarea
              id="catatan-pelanggan"
              name="catatan"
              maxLength={300}
              value={catatan}
              onChange={(peristiwa) => setCatatan(peristiwa.target.value)}
            />
          </div>

          <Pesan teks={pesan} jenis={jenisPesan} />
          <Tombol tipe="submit" nonaktif={sedangKirim} kelas="w-full">
            {sedangKirim ? "Mengirim..." : "Kirim pre-order"}
          </Tombol>
        </form>
      </Dialog>

      <Dialog terbuka={dialogHasil} judul="Pre-order tercatat" padaTutup={() => setDialogHasil(false)}>
        {hasil && (
          <div className="space-y-4">
            <Pesan
              teks={`Pesanan ${hasil.kode} sudah tersimpan. Total ${formatRupiah(hasil.total)}. Lanjutkan dengan mengirim pesan ke WhatsApp admin.`}
              jenis="sukses"
            />
            <pre className="overflow-x-auto rounded-xl bg-krem p-4 text-xs leading-relaxed text-coklat">
              {hasil.pesan}
            </pre>
            <a
              href={hasil.tautan}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-sukses px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Buka WhatsApp admin
            </a>
          </div>
        )}
      </Dialog>
    </div>
  );
}
