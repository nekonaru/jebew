"use client";

import { useCallback, useEffect, useState } from "react";
import { formatAngka, formatRupiah, formatWaktu, tanggalHariIni } from "@/lib/format.ts";
import { ambilApi, ambilJson } from "@/komponen/api-klien.ts";
import { usePeran } from "./Panel.tsx";
import { Badge, Dialog, Judul, Kartu, Pesan, Tabel, Tombol, KepalaTabel, SelKepala, BarisKosong } from "./ui.tsx";

type Bahan = { id: number; nama: string; satuan: string; stok: number; stok_minimum: number; harga_rata_rata: number; aktif: boolean; menipis: boolean };
type Pergerakan = { id: number; nama_bahan: string; jenis: string; jumlah: number; stok_sebelum: number; stok_sesudah: number; referensi: string; catatan: string; dibuat_pada: string };
type Pembelian = { id: number; nomor: string; total: number; tanggal: string; catatan: string; supplier: string | null; jumlah_item: number };
type Opname = { id: number; nomor: string; tanggal: string; catatan: string; jumlah_item: number };
type Supplier = { id: number; nama: string; kontak: string };

const TAB = ["Bahan", "Pergerakan", "Pembelian", "Opname"] as const;
type Tab = typeof TAB[number];

export default function HalamanStok() {
  const pemilik = usePeran() === "pemilik";
  const [tab, setTab] = useState<Tab>("Bahan");
  const [bahan, setBahan] = useState<Bahan[]>([]);
  const [ringkasan, setRingkasan] = useState<{ jumlah: number; menipis: number; nilai: number; terbesar: { id: number; nama: string; nilai: number }[] } | null>(null);
  const [filterBahan, setFilterBahan] = useState("");
  const [pergerakan, setPergerakan] = useState<Pergerakan[]>([]);
  const [pembelian, setPembelian] = useState<Pembelian[]>([]);
  const [supplier, setSupplier] = useState<Supplier[]>([]);
  const [opname, setOpname] = useState<Opname[]>([]);
  const [pesan, setPesan] = useState("");
  const [jenis, setJenis] = useState<"info" | "sukses" | "galat">("info");

  const [dialogBahan, setDialogBahan] = useState(false);
  const [editBahan, setEditBahan] = useState<number | null>(null);
  const [formBahan, setFormBahan] = useState({ nama: "", satuan: "gram", stok: "0", stok_minimum: "0", harga_rata_rata: "0", aktif: true });
  const [dialogRestock, setDialogRestock] = useState<number | null>(null);
  const [restock, setRestock] = useState({ tambahan: "", catatan: "" });
  const [dialogBeli, setDialogBeli] = useState(false);
  const [formBeli, setFormBeli] = useState({ supplier_id: "", tanggal: tanggalHariIni(), catatan: "", items: [{ bahan_id: "", jumlah: "1", harga_satuan: "0" }] });
  const [dialogOpname, setDialogOpname] = useState(false);
  const [detailBeli, setDetailBeli] = useState<{ nomor: string; items: { nama_bahan: string; jumlah: number; harga_satuan: number; subtotal: number }[] } | null>(null);
  const [detailOpname, setDetailOpname] = useState<{ nomor: string; items: { nama_bahan: string; stok_fisik: number; stok_sistem: number; selisih: number; alasan: string }[] } | null>(null);
  const [formOpname, setFormOpname] = useState({ tanggal: tanggalHariIni(), catatan: "", items: [{ bahan_id: "", stok_fisik: "0", alasan: "" }] });

  const muat = useCallback(async () => {
    try {
      const [b, pb, op] = await Promise.all([
        fetch("/api/bahan").then(ambilJson<{
          bahan: Bahan[];
          ringkasan: { jumlah: number; menipis: number; nilai: number; terbesar: { id: number; nama: string; nilai: number }[] };
        }>),
        fetch("/api/pembelian").then(ambilJson<{ pembelian: Pembelian[]; supplier: Supplier[] }>),
        fetch("/api/opname").then(ambilJson<{ opname: Opname[] }>),
      ]);
      setBahan(b.bahan ?? []); setRingkasan(b.ringkasan ?? null);
      setPembelian(pb.pembelian ?? []); setSupplier(pb.supplier ?? []); setOpname(op.opname ?? []);
    } catch { /* abaikan */ }
  }, []);

  const muatPergerakan = useCallback(async () => {
    try {
      const p = await ambilApi<{ pergerakan: Pergerakan[] }>(`/api/stok${filterBahan ? `?bahan=${filterBahan}` : ""}`);
      setPergerakan(p.pergerakan ?? []);
    } catch { /* abaikan */ }
  }, [filterBahan]);
  useEffect(() => { void muat(); }, [muat]);
  useEffect(() => { void muatPergerakan(); }, [muatPergerakan]);

  function gagal(e: unknown) {
    setJenis("galat"); setPesan(e instanceof Error ? e.message : "Permintaan gagal");
  }

  async function lihatBeli(p: Pembelian) {
    try {
      const d = await ambilApi<{ items: { nama_bahan: string; jumlah: number; harga_satuan: number; subtotal: number }[] }>(`/api/pembelian?id=${p.id}`);
      setDetailBeli({ nomor: p.nomor, items: d.items ?? [] });
    } catch (e) { gagal(e); }
  }

  async function lihatOpname(o: Opname) {
    try {
      const d = await ambilApi<{ items: { nama_bahan: string; stok_fisik: number; stok_sistem: number; selisih: number; alasan: string }[] }>(`/api/opname?id=${o.id}`);
      setDetailOpname({ nomor: o.nomor, items: d.items ?? [] });
    } catch (e) { gagal(e); }
  }

  function bukaBahan(b?: Bahan) {
    setEditBahan(b?.id ?? null);
    setFormBahan(b ? {
      nama: b.nama, satuan: b.satuan, stok: String(b.stok), stok_minimum: String(b.stok_minimum),
      harga_rata_rata: String(b.harga_rata_rata), aktif: b.aktif,
    } : { nama: "", satuan: "gram", stok: "0", stok_minimum: "0", harga_rata_rata: "0", aktif: true });
    setDialogBahan(true);
  }

  async function simpanBahan(e: React.FormEvent) {
    e.preventDefault();
    try {
      const data = {
        nama: formBahan.nama, satuan: formBahan.satuan, stok: Number(formBahan.stok),
        stok_minimum: Number(formBahan.stok_minimum), harga_rata_rata: Number(formBahan.harga_rata_rata), aktif: formBahan.aktif,
      };
      const respons = await fetch("/api/bahan", {
        method: editBahan ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editBahan ? { id: editBahan, data } : data),
      });
      await ambilJson(respons);
      setDialogBahan(false); setJenis("sukses"); setPesan("Bahan berhasil disimpan."); void muat(); void muatPergerakan();
    } catch (e) { gagal(e); }
  }

  async function kirimRestock(e: React.FormEvent) {
    e.preventDefault();
    try {
      const respons = await fetch("/api/stok", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: dialogRestock, tambahan: Number(restock.tambahan), catatan: restock.catatan }),
      });
      await ambilJson(respons);
      setDialogRestock(null); setJenis("sukses"); setPesan("Stok berhasil ditambah."); void muat(); void muatPergerakan();
    } catch (e) { gagal(e); }
  }

  async function kirimPembelian(e: React.FormEvent) {
    e.preventDefault();
    try {
      const respons = await fetch("/api/pembelian", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: formBeli.supplier_id ? Number(formBeli.supplier_id) : null,
          tanggal: formBeli.tanggal, catatan: formBeli.catatan,
          items: formBeli.items.map((i) => ({ bahan_id: Number(i.bahan_id), jumlah: Number(i.jumlah), harga_satuan: Number(i.harga_satuan) })),
        }),
      });
      await ambilJson(respons);
      setDialogBeli(false); setJenis("sukses"); setPesan("Pembelian tercatat dan stok bertambah."); void muat(); void muatPergerakan();
    } catch (e) { gagal(e); }
  }

  async function kirimOpname(e: React.FormEvent) {
    e.preventDefault();
    try {
      const respons = await fetch("/api/opname", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal: formOpname.tanggal, catatan: formOpname.catatan,
          items: formOpname.items.map((i) => ({ bahan_id: Number(i.bahan_id), stok_fisik: Number(i.stok_fisik), alasan: i.alasan })),
        }),
      });
      await ambilJson(respons);
      setDialogOpname(false); setJenis("sukses"); setPesan("Opname tersimpan. Stok disesuaikan."); void muat(); void muatPergerakan();
    } catch (e) { gagal(e); }
  }

  return (
    <div>
      <Judul anak="Bahan & Stok" sub="Kelola bahan, riwayat pergerakan, pembelian, dan stok opname."
        aksi={pemilik ? <Tombol onClick={() => bukaBahan()}>Tambah bahan</Tombol> : undefined} />
      <Pesan teks={pesan} jenis={jenis} />

      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Bagian stok">
        {TAB.map((t) => (
          <Tombol key={t} onClick={() => setTab(t)} ditekan={tab === t}
            jenis={tab === t ? "utama" : "sekunder"} kelas="min-h-[38px] px-3">{t}</Tombol>
        ))}
      </div>

      {tab === "Bahan" && (
        <div className="space-y-5">
          {pemilik && <Kartu>
            <h2 className="text-lg font-semibold">Nilai stok</h2>
            <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-tinta-lemah">Total nilai</p>
                <p className="font-judul text-2xl font-semibold">{formatRupiah(ringkasan?.nilai ?? 0)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-tinta-lemah">Bahan aktif</p>
                <p className="font-judul text-2xl font-semibold">{ringkasan?.jumlah ?? 0}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-tinta-lemah">Menipis</p>
                <p className="font-judul text-2xl font-semibold text-bahaya">{ringkasan?.menipis ?? 0}</p>
              </div>
            </div>
            {(ringkasan?.terbesar ?? []).length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2 border-t border-garis pt-4 text-xs">
                {ringkasan?.terbesar.map((b) => (
                  <li key={b.id} className="rounded-full bg-latar px-3 py-1.5">
                    {b.nama}: <strong>{formatRupiah(b.nilai)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </Kartu>}
          <Tabel>
          <KepalaTabel><tr>
            <SelKepala>Nama</SelKepala><SelKepala>Satuan</SelKepala><SelKepala>Stok</SelKepala>
            <SelKepala>Minimum</SelKepala>{pemilik && <SelKepala>Harga rata rata</SelKepala>}<SelKepala>Status</SelKepala><SelKepala>Aksi</SelKepala>
          </tr></KepalaTabel>
          <tbody>
            {bahan.map((b) => (
              <tr key={b.id} className="border-t border-garis">
                <td className="px-4 py-3 font-medium">{b.nama}</td>
                <td className="px-4 py-3">{b.satuan}</td>
                <td className="px-4 py-3">{formatAngka(b.stok)}</td>
                <td className="px-4 py-3">{formatAngka(b.stok_minimum)}</td>
                {pemilik && <td className="px-4 py-3">{formatRupiah(b.harga_rata_rata)}</td>}
                <td className="px-4 py-3"><Badge warna={b.menipis ? "peringatan" : "sukses"}>{b.menipis ? "Menipis" : "Aman"}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {pemilik && <>
                      <Tombol onClick={() => { setDialogRestock(b.id); setRestock({ tambahan: "", catatan: "" }); }} jenis="sukses" kelas="min-h-[36px] px-2 text-xs">Tambah</Tombol>
                      <Tombol onClick={() => bukaBahan(b)} jenis="sekunder" kelas="min-h-[36px] px-2 text-xs">Ubah</Tombol>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
            {bahan.length === 0 && <BarisKosong kolom={pemilik ? 7 : 6} teks="Belum ada bahan." />}
          </tbody>
        </Tabel>
        </div>
      )}

      {tab === "Pergerakan" && (
        <div className="space-y-4">
          <div className="max-w-sm">
            <label htmlFor="filter-pergerakan">Filter bahan</label>
            <select id="filter-pergerakan" value={filterBahan} onChange={(e) => setFilterBahan(e.target.value)}>
              <option value="">Semua bahan</option>
              {bahan.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}
            </select>
          </div>
          <Tabel>
          <KepalaTabel><tr>
            <SelKepala>Waktu</SelKepala><SelKepala>Bahan</SelKepala><SelKepala>Jenis</SelKepala>
            <SelKepala>Jumlah</SelKepala><SelKepala>Stok sebelum</SelKepala><SelKepala>Stok sesudah</SelKepala><SelKepala>Referensi</SelKepala>
          </tr></KepalaTabel>
          <tbody>
            {pergerakan.map((p) => (
              <tr key={p.id} className="border-t border-garis">
                <td className="px-4 py-3 text-xs">{formatWaktu(p.dibuat_pada)}</td>
                <td className="px-4 py-3">{p.nama_bahan}</td>
                <td className="px-4 py-3"><Badge warna={p.jenis === "masuk" ? "sukses" : p.jenis === "keluar" ? "bahaya" : "info"}>{p.jenis}</Badge></td>
                <td className="px-4 py-3">{formatAngka(p.jumlah)}</td>
                <td className="px-4 py-3">{formatAngka(p.stok_sebelum)}</td>
                <td className="px-4 py-3">{formatAngka(p.stok_sesudah)}</td>
                <td className="px-4 py-3 text-xs">{p.referensi}</td>
              </tr>
            ))}
            {pergerakan.length === 0 && <BarisKosong kolom={7} teks="Belum ada pergerakan stok." />}
          </tbody>
          </Tabel>
        </div>
      )}

      {tab === "Pembelian" && (
        <div>
          {pemilik && <div className="mb-4 flex justify-end"><Tombol onClick={() => setDialogBeli(true)}>Catat pembelian</Tombol></div>}
          <Tabel>
            <KepalaTabel><tr>
              <SelKepala>Nomor</SelKepala><SelKepala>Tanggal</SelKepala><SelKepala>Supplier</SelKepala>
              <SelKepala>Item</SelKepala><SelKepala>Total</SelKepala><SelKepala>Catatan</SelKepala><SelKepala>Aksi</SelKepala>
            </tr></KepalaTabel>
            <tbody>
              {pembelian.map((p) => (
                <tr key={p.id} className="border-t border-garis">
                  <td className="px-4 py-3 font-medium">{p.nomor}</td>
                  <td className="px-4 py-3 text-xs">{p.tanggal.slice(0, 10)}</td>
                  <td className="px-4 py-3">{p.supplier ?? "-"}</td>
                  <td className="px-4 py-3">{p.jumlah_item}</td>
                  <td className="px-4 py-3">{formatRupiah(p.total)}</td>
                  <td className="px-4 py-3 text-xs">{p.catatan}</td>
                  <td className="px-4 py-3"><Tombol jenis="kosong" kelas="min-h-[36px] px-2 text-xs" onClick={() => void lihatBeli(p)}>Rincian</Tombol></td>
                </tr>
              ))}
              {pembelian.length === 0 && <BarisKosong kolom={7} teks="Belum ada pembelian." />}
            </tbody>
          </Tabel>
        </div>
      )}

      {tab === "Opname" && (
        <div>
          {pemilik && <div className="mb-4 flex justify-end"><Tombol onClick={() => setDialogOpname(true)}>Buat opname</Tombol></div>}
          <Tabel>
            <KepalaTabel><tr>
              <SelKepala>Nomor</SelKepala><SelKepala>Tanggal</SelKepala><SelKepala>Item</SelKepala><SelKepala>Catatan</SelKepala><SelKepala>Aksi</SelKepala>
            </tr></KepalaTabel>
            <tbody>
              {opname.map((o) => (
                <tr key={o.id} className="border-t border-garis">
                  <td className="px-4 py-3 font-medium">{o.nomor}</td>
                  <td className="px-4 py-3 text-xs">{o.tanggal.slice(0, 10)}</td>
                  <td className="px-4 py-3">{o.jumlah_item}</td>
                  <td className="px-4 py-3 text-xs">{o.catatan}</td>
                  <td className="px-4 py-3"><Tombol jenis="kosong" kelas="min-h-[36px] px-2 text-xs" onClick={() => void lihatOpname(o)}>Rincian</Tombol></td>
                </tr>
              ))}
              {opname.length === 0 && <BarisKosong kolom={5} teks="Belum ada opname." />}
            </tbody>
          </Tabel>
        </div>
      )}

      <Dialog terbuka={dialogBahan} judul={editBahan ? "Ubah bahan" : "Tambah bahan"} padaTutup={() => setDialogBahan(false)}>
        <form onSubmit={simpanBahan} className="space-y-4">
          <div><label htmlFor="b-nama">Nama</label><input id="b-nama" required value={formBahan.nama} onChange={(e) => setFormBahan({ ...formBahan, nama: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label htmlFor="b-satuan">Satuan</label><input id="b-satuan" required value={formBahan.satuan} onChange={(e) => setFormBahan({ ...formBahan, satuan: e.target.value })} /></div>
            <div><label htmlFor="b-stok">Stok</label><input id="b-stok" type="number" min={0} step="any" required value={formBahan.stok} onChange={(e) => setFormBahan({ ...formBahan, stok: e.target.value })} /></div>
            <div><label htmlFor="b-min">Minimum</label><input id="b-min" type="number" min={0} step="any" required value={formBahan.stok_minimum} onChange={(e) => setFormBahan({ ...formBahan, stok_minimum: e.target.value })} /></div>
            <div><label htmlFor="b-harga">Harga rata rata</label><input id="b-harga" type="number" min={0} required value={formBahan.harga_rata_rata} onChange={(e) => setFormBahan({ ...formBahan, harga_rata_rata: e.target.value })} /></div>
          </div>
          <label className="flex items-center gap-2 normal-case tracking-normal text-tinta"><input type="checkbox" className="h-5 w-5 min-h-0" checked={formBahan.aktif} onChange={(e) => setFormBahan({ ...formBahan, aktif: e.target.checked })} /> Aktif</label>
          <Tombol tipe="submit" kelas="w-full">Simpan</Tombol>
        </form>
      </Dialog>

      <Dialog terbuka={dialogRestock !== null} judul="Tambah stok" padaTutup={() => setDialogRestock(null)}>
        <form onSubmit={kirimRestock} className="space-y-4">
          <div><label htmlFor="r-jumlah">Jumlah tambahan</label><input id="r-jumlah" type="number" min="0.01" step="any" required value={restock.tambahan} onChange={(e) => setRestock({ ...restock, tambahan: e.target.value })} /></div>
          <div><label htmlFor="r-catatan">Catatan</label><input id="r-catatan" value={restock.catatan} onChange={(e) => setRestock({ ...restock, catatan: e.target.value })} /></div>
          <Tombol tipe="submit" kelas="w-full">Tambah stok</Tombol>
        </form>
      </Dialog>

      <Dialog terbuka={dialogBeli} judul="Catat pembelian" padaTutup={() => setDialogBeli(false)} lebar="44rem">
        <form onSubmit={kirimPembelian} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label htmlFor="p-tanggal">Tanggal</label><input id="p-tanggal" type="date" required max={tanggalHariIni()} value={formBeli.tanggal} onChange={(e) => setFormBeli({ ...formBeli, tanggal: e.target.value })} /></div>
            <div><label htmlFor="p-supplier">Supplier</label><select id="p-supplier" value={formBeli.supplier_id} onChange={(e) => setFormBeli({ ...formBeli, supplier_id: e.target.value })}><option value="">Tanpa supplier</option>{supplier.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}</select></div>
          </div>
          {formBeli.items.map((it, i) => (
            <div key={i} className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-2 items-end">
              <div><label htmlFor={`p-bahan-${i}`}>Bahan</label><select id={`p-bahan-${i}`} required value={it.bahan_id} onChange={(e) => setFormBeli({ ...formBeli, items: formBeli.items.map((x, j) => j === i ? { ...x, bahan_id: e.target.value } : x) })}><option value="">Pilih</option>{bahan.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}</select></div>
              <div><label htmlFor={`p-jumlah-${i}`}>Jumlah</label><input id={`p-jumlah-${i}`} type="number" min="0.01" step="any" required value={it.jumlah} onChange={(e) => setFormBeli({ ...formBeli, items: formBeli.items.map((x, j) => j === i ? { ...x, jumlah: e.target.value } : x) })} /></div>
              <div><label htmlFor={`p-harga-${i}`}>Harga</label><input id={`p-harga-${i}`} type="number" min="0" required value={it.harga_satuan} onChange={(e) => setFormBeli({ ...formBeli, items: formBeli.items.map((x, j) => j === i ? { ...x, harga_satuan: e.target.value } : x) })} /></div>
              <Tombol jenis="hapus" onClick={() => setFormBeli({ ...formBeli, items: formBeli.items.filter((_, j) => j !== i) })} kelas="px-2">-</Tombol>
            </div>
          ))}
          <Tombol jenis="sekunder" onClick={() => setFormBeli({ ...formBeli, items: [...formBeli.items, { bahan_id: "", jumlah: "1", harga_satuan: "0" }] })}>Tambah baris</Tombol>
          <div><label htmlFor="p-catatan">Catatan</label><input id="p-catatan" value={formBeli.catatan} onChange={(e) => setFormBeli({ ...formBeli, catatan: e.target.value })} /></div>
          <Tombol tipe="submit" kelas="w-full">Simpan pembelian</Tombol>
        </form>
      </Dialog>

      <Dialog terbuka={dialogOpname} judul="Buat stok opname" padaTutup={() => setDialogOpname(false)} lebar="44rem">
        <form onSubmit={kirimOpname} className="space-y-4">
          <div><label htmlFor="o-tanggal">Tanggal</label><input id="o-tanggal" type="date" required max={tanggalHariIni()} value={formOpname.tanggal} onChange={(e) => setFormOpname({ ...formOpname, tanggal: e.target.value })} /></div>
          {formOpname.items.map((it, i) => (
            <div key={i} className="grid grid-cols-[1.2fr_1fr_1fr_auto] gap-2 items-end">
              <div><label htmlFor={`o-bahan-${i}`}>Bahan</label><select id={`o-bahan-${i}`} required value={it.bahan_id} onChange={(e) => setFormOpname({ ...formOpname, items: formOpname.items.map((x, j) => j === i ? { ...x, bahan_id: e.target.value } : x) })}><option value="">Pilih</option>{bahan.map((b) => <option key={b.id} value={b.id}>{b.nama} ({formatAngka(b.stok)})</option>)}</select></div>
              <div><label htmlFor={`o-stok-${i}`}>Stok fisik</label><input id={`o-stok-${i}`} type="number" min="0" step="any" required value={it.stok_fisik} onChange={(e) => setFormOpname({ ...formOpname, items: formOpname.items.map((x, j) => j === i ? { ...x, stok_fisik: e.target.value } : x) })} /></div>
              <div><label htmlFor={`o-alasan-${i}`}>Alasan</label><input id={`o-alasan-${i}`} value={it.alasan} onChange={(e) => setFormOpname({ ...formOpname, items: formOpname.items.map((x, j) => j === i ? { ...x, alasan: e.target.value } : x) })} /></div>
              <Tombol jenis="hapus" onClick={() => setFormOpname({ ...formOpname, items: formOpname.items.filter((_, j) => j !== i) })} kelas="px-2">-</Tombol>
            </div>
          ))}
          <Tombol jenis="sekunder" onClick={() => setFormOpname({ ...formOpname, items: [...formOpname.items, { bahan_id: "", stok_fisik: "0", alasan: "" }] })}>Tambah baris</Tombol>
          <div><label htmlFor="o-catatan">Catatan</label><input id="o-catatan" value={formOpname.catatan} onChange={(e) => setFormOpname({ ...formOpname, catatan: e.target.value })} /></div>
          <Tombol tipe="submit" kelas="w-full">Simpan opname</Tombol>
        </form>
      </Dialog>

      <Dialog terbuka={detailBeli !== null} judul={`Rincian ${detailBeli?.nomor ?? ""}`} padaTutup={() => setDetailBeli(null)}>
        {detailBeli && (
          <Tabel>
            <KepalaTabel><tr><SelKepala>Bahan</SelKepala><SelKepala>Jumlah</SelKepala><SelKepala>Harga satuan</SelKepala><SelKepala>Subtotal</SelKepala></tr></KepalaTabel>
            <tbody>
              {detailBeli.items.map((i, n) => (
                <tr key={n} className="border-t border-garis">
                  <td className="px-4 py-3">{i.nama_bahan}</td>
                  <td className="px-4 py-3">{i.jumlah}</td>
                  <td className="px-4 py-3">{formatRupiah(i.harga_satuan)}</td>
                  <td className="px-4 py-3 font-semibold">{formatRupiah(i.subtotal)}</td>
                </tr>
              ))}
              {detailBeli.items.length === 0 && <BarisKosong kolom={4} teks="Tidak ada item." />}
            </tbody>
          </Tabel>
        )}
      </Dialog>

      <Dialog terbuka={detailOpname !== null} judul={`Rincian ${detailOpname?.nomor ?? ""}`} padaTutup={() => setDetailOpname(null)}>
        {detailOpname && (
          <Tabel>
            <KepalaTabel><tr><SelKepala>Bahan</SelKepala><SelKepala>Sistem</SelKepala><SelKepala>Fisik</SelKepala><SelKepala>Selisih</SelKepala><SelKepala>Alasan</SelKepala></tr></KepalaTabel>
            <tbody>
              {detailOpname.items.map((i, n) => (
                <tr key={n} className="border-t border-garis">
                  <td className="px-4 py-3">{i.nama_bahan}</td>
                  <td className="px-4 py-3">{i.stok_sistem}</td>
                  <td className="px-4 py-3">{i.stok_fisik}</td>
                  <td className="px-4 py-3 font-semibold">{i.selisih}</td>
                  <td className="px-4 py-3 text-xs">{i.alasan || "-"}</td>
                </tr>
              ))}
              {detailOpname.items.length === 0 && <BarisKosong kolom={5} teks="Tidak ada item." />}
            </tbody>
          </Tabel>
        )}
      </Dialog>
    </div>
  );
}
