"use client";

import { useCallback, useEffect, useState } from "react";
import { formatAngka, formatRupiah } from "@/lib/format.ts";
import { ambilJson } from "@/komponen/api-klien.ts";
import { Badge, Dialog, Judul, Kartu, Pesan, Tombol } from "./ui.tsx";
import { usePeran } from "./Panel.tsx";

type Menu = {
  id: number; nama: string; harga: number; deskripsi: string; kategori: string; foto: string | null;
  aktif: boolean; porsi: number; penghambat: string | null; hpp?: number; tersedia: boolean;
  resep?: { bahan_id: number; nama_bahan: string; satuan: string; jumlah_per_porsi: number; stok: number }[];
  varian: { id: number; nama: string; harga_tambahan: number; aktif: boolean; resep?: { bahan_id: number; jumlah_per_porsi: number; nama_bahan: string; satuan: string }[] }[];
};
type Bahan = { id: number; nama: string; satuan: string };

type Form = {
  nama: string; harga: string; deskripsi: string; kategori: string; foto: string; aktif: boolean;
  resep: { bahan_id: string; jumlah_per_porsi: string }[];
  varian: { id?: number; nama: string; harga_tambahan: string; aktif: boolean; resep: { bahan_id: string; jumlah_per_porsi: string }[] }[];
};

const kosong = (): Form => ({
  nama: "", harga: "", deskripsi: "", kategori: "Mie Jebew", foto: "", aktif: true,
  resep: [{ bahan_id: "", jumlah_per_porsi: "" }], varian: [],
});

export default function HalamanMenu() {
  const pemilik = usePeran() === "pemilik";
  const [menu, setMenu] = useState<Menu[]>([]);
  const [bahan, setBahan] = useState<Bahan[]>([]);
  const [dialog, setDialog] = useState(false);
  const [hapusTarget, setHapusTarget] = useState<{ id: number; nama: string } | null>(null);
  const [edit, setEdit] = useState<number | null>(null);
  const [form, setForm] = useState<Form>(kosong());
  const [pesan, setPesan] = useState("");
  const [jenis, setJenis] = useState<"info" | "sukses" | "galat">("info");
  const [cari, setCari] = useState("");

  const muat = useCallback(async () => {
    try {
      const [m, b] = await Promise.all([
        fetch("/api/menu").then(ambilJson<{ menu: Menu[] }>),
        fetch("/api/bahan").then(ambilJson<{ bahan: Bahan[] }>),
      ]);
      setMenu(m.menu ?? []); setBahan(b.bahan ?? []);
    } catch { /* abaikan */ }
  }, []);
  useEffect(() => { void muat(); }, [muat]);

  function buka(m?: Menu) {
    setEdit(m?.id ?? null);
    setForm(m ? {
      nama: m.nama, harga: String(m.harga), deskripsi: m.deskripsi, kategori: m.kategori,
      foto: m.foto ?? "", aktif: m.aktif,
      resep: (m.resep ?? []).map((r) => ({ bahan_id: String(r.bahan_id), jumlah_per_porsi: String(r.jumlah_per_porsi) })),
      varian: m.varian.map((v) => ({
        id: v.id, nama: v.nama, harga_tambahan: String(v.harga_tambahan), aktif: v.aktif,
        resep: (v.resep ?? []).map((r) => ({ bahan_id: String(r.bahan_id), jumlah_per_porsi: String(r.jumlah_per_porsi) })),
      })),
    } : kosong());
    setPesan(""); setDialog(true);
  }

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    try {
      const data = {
        nama: form.nama, harga: Number(form.harga), deskripsi: form.deskripsi, kategori: form.kategori,
        foto: form.foto.trim() || null, aktif: form.aktif,
        resep: form.resep.map((r) => ({ bahan_id: Number(r.bahan_id), jumlah_per_porsi: Number(r.jumlah_per_porsi) })),
        varian: form.varian.map((v) => ({
          id: v.id, nama: v.nama, harga_tambahan: Number(v.harga_tambahan), aktif: v.aktif,
          resep: v.resep.map((r) => ({ bahan_id: Number(r.bahan_id), jumlah_per_porsi: Number(r.jumlah_per_porsi) })),
        })),
      };
      const respons = await fetch("/api/menu", {
        method: edit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit ? { id: edit, data } : data),
      });
      await ambilJson(respons);
      setDialog(false); setJenis("sukses"); setPesan("Menu berhasil disimpan."); void muat();
    } catch (err) { setJenis("galat"); setPesan(err instanceof Error ? err.message : "Gagal menyimpan"); }
  }

  function hapus(id: number, nama: string) {
    setHapusTarget({ id, nama });
  }

  async function konfirmasiHapus() {
    if (!hapusTarget) return;
    const id = hapusTarget.id;
    try {
      const respons = await fetch("/api/menu", {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
      });
      await ambilJson(respons);
      setJenis("sukses"); setPesan("Menu dihapus."); setHapusTarget(null); void muat();
    } catch (err) { setJenis("galat"); setPesan(err instanceof Error ? err.message : "Gagal menghapus"); }
  }

  const tampil = menu.filter((m) => m.nama.toLowerCase().includes(cari.toLowerCase()));

  return (
    <div>
      <Judul anak="Menu & Resep" sub="Atur harga, resep per porsi, dan varian. HPP dihitung otomatis dari harga bahan."
        aksi={pemilik ? <Tombol onClick={() => buka()}>Tambah menu</Tombol> : undefined} />
      <Pesan teks={pesan} jenis={jenis} />

      <div className="mb-5 max-w-sm">
        <label htmlFor="cari-menu" className="visually-hidden">Cari menu</label>
        <input id="cari-menu" type="search" placeholder="Cari menu..." value={cari} onChange={(e) => setCari(e.target.value)} />
      </div>

      <ul className="daftar-panjang grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tampil.map((m) => (
          <li key={m.id}>
            <Kartu>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-judul text-lg font-semibold">{m.nama}</h3>
                  <p className="text-xs text-tinta-lemah">{m.kategori}</p>
                </div>
                <Badge warna={m.tersedia ? "sukses" : "bahaya"}>{m.tersedia ? `${m.porsi} porsi` : "Habis"}</Badge>
              </div>
              <p className="mt-2 min-h-[40px] text-sm text-tinta-lemah">{m.deskripsi}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-latar p-3 text-sm">
                <div><p className="text-[11px] text-tinta-lemah">Harga</p><p className="font-semibold">{formatRupiah(m.harga)}</p></div>
                {pemilik && <div><p className="text-[11px] text-tinta-lemah">HPP / porsi</p><p className="font-semibold">{formatRupiah(m.hpp ?? 0)}</p></div>}
              </div>
              {pemilik && <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-xs font-semibold text-utama">Resep ({(m.resep ?? []).length})</summary>
                <ul className="mt-2 space-y-1 text-xs text-tinta-lemah">
                  {(m.resep ?? []).map((r) => (
                    <li key={r.bahan_id} className="flex justify-between gap-2">
                      <span>{r.nama_bahan}</span><span>{formatAngka(r.jumlah_per_porsi)} {r.satuan}</span>
                    </li>
                  ))}
                </ul>
                {m.penghambat && <p className="mt-2 text-xs font-semibold text-bahaya">Penghambat: {m.penghambat}</p>}
              </details>}
              {m.varian.length > 0 && (
                <p className="mt-2 text-xs text-tinta-lemah">Varian: {m.varian.map((v) => v.nama).join(", ")}</p>
              )}
              {pemilik && <div className="mt-4 flex gap-2">
                <Tombol onClick={() => buka(m)} jenis="sekunder" kelas="min-h-[38px] px-3 text-xs">Ubah</Tombol>
                <Tombol onClick={() => void hapus(m.id, m.nama)} jenis="hapus" kelas="min-h-[38px] px-3 text-xs">Hapus</Tombol>
              </div>}
            </Kartu>
          </li>
        ))}
      </ul>

      <Dialog terbuka={dialog} judul={edit ? "Ubah menu" : "Tambah menu"} padaTutup={() => setDialog(false)} lebar="44rem">
        <form onSubmit={simpan} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="m-nama">Nama</label><input id="m-nama" required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></div>
            <div><label htmlFor="m-harga">Harga</label><input id="m-harga" type="number" min={0} required value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value })} /></div>
            <div><label htmlFor="m-kategori">Kategori</label><input id="m-kategori" required value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} /></div>
            <div><label htmlFor="m-foto">Foto (opsional)</label><input id="m-foto" value={form.foto} onChange={(e) => setForm({ ...form, foto: e.target.value })} placeholder="/assets/..." /></div>
          </div>
          <div><label htmlFor="m-deskripsi">Deskripsi</label><textarea id="m-deskripsi" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} /></div>
          <label className="flex items-center gap-2 normal-case tracking-normal text-tinta"><input type="checkbox" className="h-5 w-5 min-h-0" checked={form.aktif} onChange={(e) => setForm({ ...form, aktif: e.target.checked })} /> Aktif ditampilkan</label>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-tinta-lemah">Resep per porsi</legend>
            {form.resep.map((r, i) => (
              <div key={i} className="mb-2 grid grid-cols-[1.4fr_1fr_auto] gap-2 items-end">
                <div><label htmlFor={`r-bahan-${i}`}>Bahan</label><select id={`r-bahan-${i}`} required value={r.bahan_id} onChange={(e) => setForm({ ...form, resep: form.resep.map((x, j) => j === i ? { ...x, bahan_id: e.target.value } : x) })}><option value="">Pilih</option>{bahan.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}</select></div>
                <div><label htmlFor={`r-jumlah-${i}`}>Jumlah</label><input id={`r-jumlah-${i}`} type="number" min="0.01" step="any" required value={r.jumlah_per_porsi} onChange={(e) => setForm({ ...form, resep: form.resep.map((x, j) => j === i ? { ...x, jumlah_per_porsi: e.target.value } : x) })} /></div>
                <Tombol jenis="hapus" onClick={() => setForm({ ...form, resep: form.resep.filter((_, j) => j !== i) })} kelas="px-2">-</Tombol>
              </div>
            ))}
            <Tombol jenis="sekunder" onClick={() => setForm({ ...form, resep: [...form.resep, { bahan_id: "", jumlah_per_porsi: "" }] })}>Tambah bahan</Tombol>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-tinta-lemah">Varian (opsional)</legend>
            {form.varian.map((v, i) => (
              <div key={i} className="mb-3 rounded-xl border border-garis p-3">
                <div className="grid grid-cols-[1.4fr_1fr_auto_auto] gap-2 items-end">
                  <div><label htmlFor={`v-nama-${i}`}>Nama</label><input id={`v-nama-${i}`} required value={v.nama} onChange={(e) => setForm({ ...form, varian: form.varian.map((x, j) => j === i ? { ...x, nama: e.target.value } : x) })} /></div>
                  <div><label htmlFor={`v-harga-${i}`}>Tambah harga</label><input id={`v-harga-${i}`} type="number" min={0} value={v.harga_tambahan} onChange={(e) => setForm({ ...form, varian: form.varian.map((x, j) => j === i ? { ...x, harga_tambahan: e.target.value } : x) })} /></div>
                  <label className="flex items-center gap-1 normal-case tracking-normal text-tinta"><input type="checkbox" className="h-5 w-5 min-h-0" checked={v.aktif} onChange={(e) => setForm({ ...form, varian: form.varian.map((x, j) => j === i ? { ...x, aktif: e.target.checked } : x) })} /> Aktif</label>
                  <Tombol jenis="hapus" onClick={() => setForm({ ...form, varian: form.varian.filter((_, j) => j !== i) })} kelas="px-2">-</Tombol>
                </div>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-tinta-lemah">Bahan tambahan varian</p>
                {v.resep.map((r, j) => (
                  <div key={j} className="mt-2 grid grid-cols-[1.4fr_1fr_auto] gap-2 items-end">
                    <div><label htmlFor={`vr-bahan-${i}-${j}`}>Bahan</label><select id={`vr-bahan-${i}-${j}`} value={r.bahan_id} onChange={(e) => setForm({ ...form, varian: form.varian.map((x, k) => k === i ? { ...x, resep: x.resep.map((y, l) => l === j ? { ...y, bahan_id: e.target.value } : y) } : x) })}><option value="">Pilih</option>{bahan.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}</select></div>
                    <div><label htmlFor={`vr-jumlah-${i}-${j}`}>Jumlah</label><input id={`vr-jumlah-${i}-${j}`} type="number" min="0.01" step="any" value={r.jumlah_per_porsi} onChange={(e) => setForm({ ...form, varian: form.varian.map((x, k) => k === i ? { ...x, resep: x.resep.map((y, l) => l === j ? { ...y, jumlah_per_porsi: e.target.value } : y) } : x) })} /></div>
                    <Tombol jenis="hapus" onClick={() => setForm({ ...form, varian: form.varian.map((x, k) => k === i ? { ...x, resep: x.resep.filter((_, l) => l !== j) } : x) })} kelas="px-2">-</Tombol>
                  </div>
                ))}
                <Tombol jenis="kosong" kelas="mt-2 min-h-[36px] px-0 text-xs" onClick={() => setForm({ ...form, varian: form.varian.map((x, k) => k === i ? { ...x, resep: [...x.resep, { bahan_id: "", jumlah_per_porsi: "" }] } : x) })}>+ Tambah bahan varian</Tombol>
              </div>
            ))}
            <Tombol jenis="sekunder" onClick={() => setForm({ ...form, varian: [...form.varian, { nama: "", harga_tambahan: "0", aktif: true, resep: [] }] })}>Tambah varian</Tombol>
          </fieldset>

          <Tombol tipe="submit" kelas="w-full">Simpan menu</Tombol>
        </form>
      </Dialog>

      <Dialog terbuka={hapusTarget !== null} judul="Hapus menu" padaTutup={() => setHapusTarget(null)}>
        <p className="text-sm text-tinta-lemah">Menu {hapusTarget?.nama} akan dihapus. Menu yang masih dipakai preorder aktif tidak bisa dihapus.</p>
        <div className="mt-5 flex gap-3">
          <Tombol onClick={() => setHapusTarget(null)} jenis="sekunder" kelas="flex-1">Batal</Tombol>
          <Tombol onClick={() => void konfirmasiHapus()} jenis="hapus" kelas="flex-1">Hapus menu</Tombol>
        </div>
      </Dialog>
    </div>
  );
}
