"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { formatAngka, formatRupiah } from "@/lib/format.ts";
import { kategoriValid } from "@/lib/validasi.ts";
import { Dialog, Kartu, Penanda, Pesan, Tombol } from "./ui.tsx";
import { ambilJson } from "./api-klien.ts";

type ResepTampil = {
  bahan_id: number;
  nama_bahan: string;
  satuan: string;
  jumlah_per_porsi: number;
  stok: number;
};

type MenuTampil = {
  id: number;
  nama: string;
  harga: number;
  deskripsi: string;
  kategori: string;
  foto: string | null;
  aktif: boolean;
  porsi: number;
  penghambatNama: string | null;
  penghambatStok: number | null;
  penghambatKebutuhan: number | null;
  tersedia: boolean;
  resep: ResepTampil[];
};

type BahanPilihan = { id: number; nama: string; satuan: string };
type BarisResep = { bahan_id: string; jumlah_per_porsi: string };
type BentukMenu = {
  nama: string;
  harga: string;
  deskripsi: string;
  kategori: string;
  foto: string;
  aktif: boolean;
  resep: BarisResep[];
};

const bentukAwal = (): BentukMenu => ({
  nama: "",
  harga: "",
  deskripsi: "",
  kategori: "Makanan",
  foto: "",
  aktif: true,
  resep: [{ bahan_id: "", jumlah_per_porsi: "" }],
});

export default function HalamanMenu() {
  const [daftar, setDaftar] = useState<MenuTampil[]>([]);
  const [bahan, setBahan] = useState<BahanPilihan[]>([]);
  const [dialog, setDialog] = useState(false);
  const [idSunting, setIdSunting] = useState<number | null>(null);
  const [bentuk, setBentuk] = useState<BentukMenu>(bentukAwal());
  const [pesan, setPesan] = useState("");
  const [jenisPesan, setJenisPesan] = useState<"info" | "sukses" | "galat">("info");

  const muat = useCallback(async () => {
    try {
      const [jawabanMenu, jawabanBahan] = await Promise.all([
        fetch("/api/menu"),
        fetch("/api/bahan"),
      ]);
      const dataMenu = await ambilJson<{ menu: MenuTampil[] }>(jawabanMenu);
      const dataBahan = await ambilJson<{ bahan: BahanPilihan[] }>(jawabanBahan);
      setDaftar(dataMenu.menu ?? []);
      setBahan(dataBahan.bahan ?? []);
      setPesan("");
    } catch {
      setJenisPesan("galat");
      setPesan("Data menu gagal dimuat.");
    }
  }, []);

  useEffect(() => { void muat(); }, [muat]);

  function bukaTambah() {
    setIdSunting(null);
    setBentuk(bentukAwal());
    setPesan("");
    setDialog(true);
  }

  function bukaUbah(menu: MenuTampil) {
    setIdSunting(menu.id);
    setBentuk({
      nama: menu.nama,
      harga: String(menu.harga),
      deskripsi: menu.deskripsi,
      kategori: menu.kategori,
      foto: menu.foto ?? "",
      aktif: menu.aktif,
      resep: menu.resep.map((item) => ({
        bahan_id: String(item.bahan_id),
        jumlah_per_porsi: String(item.jumlah_per_porsi),
      })),
    });
    setPesan("");
    setDialog(true);
  }

  function ubahBaris(indeks: number, bagian: Partial<BarisResep>) {
    setBentuk((nilai) => ({
      ...nilai,
      resep: nilai.resep.map((item, posisi) => (posisi === indeks ? { ...item, ...bagian } : item)),
    }));
  }

  async function simpan(peristiwa: FormEvent<HTMLFormElement>) {
    peristiwa.preventDefault();
    const data = {
      nama: bentuk.nama,
      harga: Number(bentuk.harga),
      deskripsi: bentuk.deskripsi,
      kategori: bentuk.kategori,
      foto: bentuk.foto.trim() === "" ? null : bentuk.foto.trim(),
      aktif: bentuk.aktif,
      resep: bentuk.resep.map((item) => ({
        bahan_id: Number(item.bahan_id),
        jumlah_per_porsi: Number(item.jumlah_per_porsi),
      })),
    };
    try {
      const jawaban = await fetch("/api/menu", {
        method: idSunting === null ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(idSunting === null ? data : { id: idSunting, data }),
      });
      const hasil = (await jawaban.json()) as { pesan?: string };
      if (!jawaban.ok) throw new Error(hasil.pesan ?? "Gagal menyimpan menu");
      setDialog(false);
      setJenisPesan("sukses");
      setPesan("Menu dan resep berhasil disimpan.");
      await muat();
    } catch (kesalahan) {
      setJenisPesan("galat");
      setPesan(kesalahan instanceof Error ? kesalahan.message : "Gagal menyimpan menu");
    }
  }

  async function hapus(id: number, nama: string) {
    if (!window.confirm(`Hapus menu ${nama}? Riwayat penjualan tetap tersimpan.`)) return;
    try {
      const jawaban = await fetch("/api/menu", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const hasil = (await jawaban.json()) as { pesan?: string };
      if (!jawaban.ok) throw new Error(hasil.pesan ?? "Gagal menghapus menu");
      setJenisPesan("sukses");
      setPesan("Menu berhasil dihapus.");
      await muat();
    } catch (kesalahan) {
      setJenisPesan("galat");
      setPesan(kesalahan instanceof Error ? kesalahan.message : "Gagal menghapus menu");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Menu dan resep</h2>
          <p className="text-sm text-coklatMuda">Jumlah porsi dihitung otomatis dari resep dan stok bahan.</p>
        </div>
        <Tombol onClick={bukaTambah}>Tambah menu</Tombol>
      </div>

      <Pesan teks={pesan} jenis={jenisPesan} />

      <ul className="grid gap-4 md:grid-cols-2">
        {daftar.map((menu) => (
          <li key={menu.id}>
            <Kartu>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{menu.nama}</h3>
                  <p className="text-xs text-coklatMuda">{menu.kategori}</p>
                </div>
                <Penanda warna={menu.tersedia ? "hijau" : "merah"}>
                  {menu.tersedia ? `${menu.porsi} porsi` : "Habis"}
                </Penanda>
              </div>
              <p className="mt-2 text-sm text-coklatMuda">{menu.deskripsi}</p>
              <p className="mt-3 font-judul text-xl font-semibold text-bata">{formatRupiah(menu.harga)}</p>
              <div className="mt-3 rounded-xl bg-krem px-4 py-3 text-xs">
                <p><strong>Resep per porsi:</strong></p>
                <ul className="mt-1 space-y-1">
                  {menu.resep.map((item) => (
                    <li key={item.bahan_id}>
                      {item.nama_bahan}: {formatAngka(item.jumlah_per_porsi)} {item.satuan} (stok {formatAngka(item.stok)})
                    </li>
                  ))}
                </ul>
                {menu.penghambatNama && (
                  <p className="mt-2 font-semibold text-bata">
                    Bahan penghambat: {menu.penghambatNama}
                  </p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Tombol onClick={() => bukaUbah(menu)} jenis="sekunder" kelas="min-h-[40px] px-3">Ubah</Tombol>
                <Tombol onClick={() => void hapus(menu.id, menu.nama)} jenis="bahaya" kelas="min-h-[40px] px-3">Hapus</Tombol>
              </div>
            </Kartu>
          </li>
        ))}
      </ul>

      <Dialog terbuka={dialog} judul={idSunting === null ? "Tambah menu" : "Ubah menu"} padaTutup={() => setDialog(false)}>
        <form onSubmit={simpan} className="space-y-4">
          <div>
            <label htmlFor="nama-menu">Nama menu</label>
            <input id="nama-menu" required maxLength={100} value={bentuk.nama}
              onChange={(e) => setBentuk({ ...bentuk, nama: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="harga-menu">Harga jual (Rp)</label>
              <input id="harga-menu" type="number" min={0} step={1} required value={bentuk.harga}
                onChange={(e) => setBentuk({ ...bentuk, harga: e.target.value })} />
            </div>
            <div>
              <label htmlFor="kategori-menu">Kategori</label>
              <select id="kategori-menu" value={bentuk.kategori}
                onChange={(e) => setBentuk({ ...bentuk, kategori: e.target.value })}>
                {kategoriValid.map((kategori) => <option key={kategori} value={kategori}>{kategori}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="deskripsi-menu">Deskripsi</label>
            <textarea id="deskripsi-menu" maxLength={500} value={bentuk.deskripsi}
              onChange={(e) => setBentuk({ ...bentuk, deskripsi: e.target.value })} />
          </div>
          <div>
            <label htmlFor="foto-menu">Foto (opsional)</label>
            <input id="foto-menu" maxLength={500} value={bentuk.foto}
              onChange={(e) => setBentuk({ ...bentuk, foto: e.target.value })} />
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" className="h-5 w-5 min-h-0" checked={bentuk.aktif}
              onChange={(e) => setBentuk({ ...bentuk, aktif: e.target.checked })} />
            Menu aktif ditampilkan di website konsumen
          </label>

          <fieldset>
            <legend className="mb-2 font-semibold">Resep per 1 porsi</legend>
            <div className="space-y-3">
              {bentuk.resep.map((baris, indeks) => (
                <div key={indeks} className="grid grid-cols-[1fr_110px_auto] gap-2">
                  <label className="visually-hidden" htmlFor={`bahan-resep-${indeks}`}>Bahan ke-{indeks + 1}</label>
                  <select id={`bahan-resep-${indeks}`} required value={baris.bahan_id}
                    onChange={(e) => ubahBaris(indeks, { bahan_id: e.target.value })}>
                    <option value="">Pilih bahan</option>
                    {bahan.map((item) => <option key={item.id} value={item.id}>{item.nama} ({item.satuan})</option>)}
                  </select>
                  <label className="visually-hidden" htmlFor={`jumlah-resep-${indeks}`}>Jumlah ke-{indeks + 1}</label>
                  <input id={`jumlah-resep-${indeks}`} type="number" min="0.01" step="any" required
                    placeholder="Jumlah" value={baris.jumlah_per_porsi}
                    onChange={(e) => ubahBaris(indeks, { jumlah_per_porsi: e.target.value })} />
                  <Tombol onClick={() => setBentuk((nilai) => ({
                    ...nilai,
                    resep: nilai.resep.length === 1 ? nilai.resep : nilai.resep.filter((_, posisi) => posisi !== indeks),
                  }))} jenis="bahaya" kelas="px-3">Hapus</Tombol>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setBentuk((nilai) => ({
              ...nilai,
              resep: [...nilai.resep, { bahan_id: "", jumlah_per_porsi: "" }],
            }))} className="mt-3 text-sm font-semibold text-bata underline underline-offset-2">
              Tambah bahan
            </button>
          </fieldset>

          <Pesan teks={pesan} jenis={jenisPesan} />
          <Tombol tipe="submit" kelas="w-full">Simpan menu</Tombol>
        </form>
      </Dialog>
    </div>
  );
}
