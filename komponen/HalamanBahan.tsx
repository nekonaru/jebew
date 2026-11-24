"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { formatAngka } from "@/lib/format.ts";
import { satuanValid } from "@/lib/validasi.ts";
import { Dialog, Kartu, Penanda, Pesan, Tombol } from "./ui.tsx";
import { ambilJson } from "./api-klien.ts";

type Bahan = {
  id: number;
  nama: string;
  satuan: string;
  stok: number;
  stok_minimum: number;
  menipis: boolean;
};

type BentukBahan = {
  nama: string;
  satuan: string;
  stok: string;
  stok_minimum: string;
};

const bentukAwal: BentukBahan = { nama: "", satuan: "gram", stok: "0", stok_minimum: "0" };

export default function HalamanBahan() {
  const [daftar, setDaftar] = useState<Bahan[]>([]);
  const [dialogForm, setDialogForm] = useState(false);
  const [dialogRestock, setDialogRestock] = useState(false);
  const [idSunting, setIdSunting] = useState<number | null>(null);
  const [idRestock, setIdRestock] = useState<number | null>(null);
  const [bentuk, setBentuk] = useState<BentukBahan>(bentukAwal);
  const [tambahan, setTambahan] = useState("");
  const [pesan, setPesan] = useState("");
  const [jenisPesan, setJenisPesan] = useState<"info" | "sukses" | "galat">("info");
  const [sedangMuat, setSedangMuat] = useState(true);

  const muat = useCallback(async () => {
    try {
      const data = await ambilJson<{ bahan: Bahan[] }>(await fetch("/api/bahan"));
      setDaftar(data.bahan ?? []);
      setPesan("");
    } catch {
      setJenisPesan("galat");
      setPesan("Data bahan gagal dimuat.");
    } finally {
      setSedangMuat(false);
    }
  }, []);

  useEffect(() => { void muat(); }, [muat]);

  function bukaTambah() {
    setIdSunting(null);
    setBentuk(bentukAwal);
    setPesan("");
    setDialogForm(true);
  }

  function bukaUbah(bahan: Bahan) {
    setIdSunting(bahan.id);
    setBentuk({
      nama: bahan.nama,
      satuan: bahan.satuan,
      stok: String(bahan.stok),
      stok_minimum: String(bahan.stok_minimum),
    });
    setPesan("");
    setDialogForm(true);
  }

  function bukaRestock(id: number) {
    setIdRestock(id);
    setTambahan("");
    setPesan("");
    setDialogRestock(true);
  }

  async function simpan(peristiwa: FormEvent<HTMLFormElement>) {
    peristiwa.preventDefault();
    const data = {
      nama: bentuk.nama,
      satuan: bentuk.satuan,
      stok: Number(bentuk.stok),
      stok_minimum: Number(bentuk.stok_minimum),
    };
    try {
      const jawaban = await fetch("/api/bahan", {
        method: idSunting === null ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(idSunting === null ? data : { id: idSunting, data }),
      });
      const hasil = (await jawaban.json()) as { pesan?: string };
      if (!jawaban.ok) throw new Error(hasil.pesan ?? "Gagal menyimpan bahan");
      setDialogForm(false);
      setJenisPesan("sukses");
      setPesan("Bahan berhasil disimpan.");
      await muat();
    } catch (kesalahan) {
      setJenisPesan("galat");
      setPesan(kesalahan instanceof Error ? kesalahan.message : "Gagal menyimpan bahan");
    }
  }

  async function kirimRestock(peristiwa: FormEvent<HTMLFormElement>) {
    peristiwa.preventDefault();
    try {
      const jawaban = await fetch("/api/bahan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: idRestock, tambahan: Number(tambahan) }),
      });
      const hasil = (await jawaban.json()) as { pesan?: string };
      if (!jawaban.ok) throw new Error(hasil.pesan ?? "Gagal menambah stok");
      setDialogRestock(false);
      setJenisPesan("sukses");
      setPesan("Stok bahan berhasil ditambah.");
      await muat();
    } catch (kesalahan) {
      setJenisPesan("galat");
      setPesan(kesalahan instanceof Error ? kesalahan.message : "Gagal menambah stok");
    }
  }

  async function hapus(id: number, nama: string) {
    if (!window.confirm(`Hapus bahan ${nama}?`)) return;
    try {
      const jawaban = await fetch("/api/bahan", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const hasil = (await jawaban.json()) as { pesan?: string };
      if (!jawaban.ok) throw new Error(hasil.pesan ?? "Gagal menghapus bahan");
      setJenisPesan("sukses");
      setPesan("Bahan berhasil dihapus.");
      await muat();
    } catch (kesalahan) {
      setJenisPesan("galat");
      setPesan(kesalahan instanceof Error ? kesalahan.message : "Gagal menghapus bahan");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Bahan baku</h2>
          <p className="text-sm text-coklatMuda">Kelola stok dan batas minimum setiap bahan.</p>
        </div>
        <Tombol onClick={bukaTambah}>Tambah bahan</Tombol>
      </div>

      <Pesan teks={pesan} jenis={jenisPesan} />

      <Kartu>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="visually-hidden">Daftar bahan baku</caption>
            <thead>
              <tr className="border-b border-tepi text-coklatMuda">
                <th scope="col" className="py-3 font-semibold">Nama</th>
                <th scope="col" className="py-3 font-semibold">Satuan</th>
                <th scope="col" className="py-3 font-semibold">Stok</th>
                <th scope="col" className="py-3 font-semibold">Minimum</th>
                <th scope="col" className="py-3 font-semibold">Status</th>
                <th scope="col" className="py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {daftar.map((bahan) => (
                <tr key={bahan.id} className="border-b border-tepi/70">
                  <td className="py-3 font-medium">{bahan.nama}</td>
                  <td className="py-3">{bahan.satuan}</td>
                  <td className="py-3">{formatAngka(bahan.stok)}</td>
                  <td className="py-3">{formatAngka(bahan.stok_minimum)}</td>
                  <td className="py-3">
                    <Penanda warna={bahan.menipis ? "merah" : "hijau"}>
                      {bahan.menipis ? "Menipis" : "Aman"}
                    </Penanda>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <Tombol onClick={() => bukaRestock(bahan.id)} jenis="sukses" kelas="min-h-[40px] px-3">Tambah stok</Tombol>
                      <Tombol onClick={() => bukaUbah(bahan)} jenis="sekunder" kelas="min-h-[40px] px-3">Ubah</Tombol>
                      <Tombol onClick={() => void hapus(bahan.id, bahan.nama)} jenis="bahaya" kelas="min-h-[40px] px-3">Hapus</Tombol>
                    </div>
                  </td>
                </tr>
              ))}
              {!sedangMuat && daftar.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-coklatMuda">Belum ada bahan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Kartu>

      <Dialog terbuka={dialogForm} judul={idSunting === null ? "Tambah bahan" : "Ubah bahan"} padaTutup={() => setDialogForm(false)}>
        <form onSubmit={simpan} className="space-y-4">
          <div>
            <label htmlFor="nama-bahan">Nama bahan</label>
            <input id="nama-bahan" required maxLength={100} value={bentuk.nama}
              onChange={(e) => setBentuk({ ...bentuk, nama: e.target.value })} />
          </div>
          <div>
            <label htmlFor="satuan-bahan">Satuan</label>
            <select id="satuan-bahan" value={bentuk.satuan}
              onChange={(e) => setBentuk({ ...bentuk, satuan: e.target.value })}>
              {satuanValid.map((satuan) => <option key={satuan} value={satuan}>{satuan}</option>)}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="stok-bahan">Stok saat ini</label>
              <input id="stok-bahan" type="number" min={0} step="any" required value={bentuk.stok}
                onChange={(e) => setBentuk({ ...bentuk, stok: e.target.value })} />
            </div>
            <div>
              <label htmlFor="minimum-bahan">Batas minimum</label>
              <input id="minimum-bahan" type="number" min={0} step="any" required value={bentuk.stok_minimum}
                onChange={(e) => setBentuk({ ...bentuk, stok_minimum: e.target.value })} />
            </div>
          </div>
          <Pesan teks={pesan} jenis={jenisPesan} />
          <Tombol tipe="submit" kelas="w-full">Simpan bahan</Tombol>
        </form>
      </Dialog>

      <Dialog terbuka={dialogRestock} judul="Tambah stok" padaTutup={() => setDialogRestock(false)}>
        <form onSubmit={kirimRestock} className="space-y-4">
          <div>
            <label htmlFor="tambahan-stok">Jumlah tambahan</label>
            <input id="tambahan-stok" type="number" min="0.01" step="any" required value={tambahan}
              onChange={(e) => setTambahan(e.target.value)} />
            <p className="mt-1 text-xs text-coklatMuda">Stok baru adalah stok lama ditambah angka ini.</p>
          </div>
          <Pesan teks={pesan} jenis={jenisPesan} />
          <Tombol tipe="submit" kelas="w-full">Tambah stok</Tombol>
        </form>
      </Dialog>
    </div>
  );
}
