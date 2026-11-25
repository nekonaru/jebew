"use client";

import { useCallback, useEffect, useState } from "react";
import { formatAngka, formatRupiah, formatWaktu, tanggalHariIni } from "@/lib/format.ts";
import { ambilJson } from "@/komponen/api-klien.ts";
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
  const [formOpname, setFormOpname] = useState({ tanggal: tanggalHariIni(), catatan: "", items: [{ bahan_id: "", stok_fisik: "0", alasan: "" }] });

  const muat = useCallback(async () => {
    try {
      const [b, p, pb, op] = await Promise.all([
        fetch("/api/bahan").then(ambilJson<{ bahan: Bahan[] }>),
        fetch("/api/stok").then(ambilJson<{ pergerakan: Pergerakan[] }>),
        fetch("/api/pembelian").then(ambilJson<{ pembelian: Pembelian[]; supplier: Supplier[] }>),
        fetch("/api/opname").then(ambilJson<{ opname: Opname[] }>),
      ]);
      setBahan(b.bahan ?? []); setPergerakan(p.pergerakan ?? []);
      setPembelian(pb.pembelian ?? []); setSupplier(pb.supplier ?? []); setOpname(op.opname ?? []);
    } catch { /* abaikan */ }
  }, []);
  useEffect(() => { void muat(); }, [muat]);

  function gagal(e: unknown) {
    setJenis("galat"); setPesan(e instanceof Error ? e.message : "Permintaan gagal");
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
      setDialogBahan(false); setJenis("sukses"); setPesan("Bahan berhasil disimpan."); void muat();
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
      setDialogRestock(null); setJenis("sukses"); setPesan("Stok berhasil ditambah."); void muat();
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
      setDialogBeli(false); setJenis("sukses"); setPesan("Pembelian tercatat dan stok bertambah."); void muat();
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
      setDialogOpname(false); setJenis("sukses"); setPesan("Opname tersimpan. Stok disesuaikan."); void muat();
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
        <Tabel>
          <KepalaTabel><tr>
            <SelKepala>Nama</SelKepala><SelKepala>Satuan</SelKepala><SelKepala>Stok</SelKepala>
            <SelKepala>Minimum</SelKepala><SelKepala>Harga rata rata</SelKepala><SelKepala>Status</SelKepala><SelKepala>Aksi</SelKepala>
          </tr></KepalaTabel>
          <tbody>
            {bahan.map((b) => (
              <tr key={b.id} className="border-t border-garis">
                <td className="px-4 py-3 font-medium">{b.nama}</td>
                <td className="px-4 py-3">{b.satuan}</td>
                <td className="px-4 py-3">{formatAngka(b.stok)}</td>
                <td className="px-4 py-3">{formatAngka(b.stok_minimum)}</td>
                <td className="px-4 py-3">{formatRupiah(b.harga_rata_rata)}</td>
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
            {bahan.length === 0 && <BarisKosong kolom={7} teks="Belum ada bahan." />}
          </tbody>
        </Tabel>
      )}

      {tab === "Pergerakan" && (
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
      )}

      {tab === "Pembelian" && (
        <div>
          {pemilik && <div className="mb-4 flex justify-end"><Tombol onClick={() => setDialogBeli(true)}>Catat pembelian</Tombol></div>}
          <Tabel>
            <KepalaTabel><tr>
              <SelKepala>Nomor</SelKepala><SelKepala>Tanggal</SelKepala><SelKepala>Supplier</SelKepala>
              <SelKepala>Item</SelKepala><SelKepala>Total</SelKepala><SelKepala>Catatan</SelKepala>
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
                </tr>
              ))}
              {pembelian.length === 0 && <BarisKosong kolom={6} teks="Belum ada pembelian." />}
            </tbody>
          </Tabel>
        </div>
      )}

      {tab === "Opname" && (
        <div>
          {pemilik && <div className="mb-4 flex justify-end"><Tombol onClick={() => setDialogOpname(true)}>Buat opname</Tombol></div>}
          <Tabel>
            <KepalaTabel><tr>
              <SelKepala>Nomor</SelKepala><SelKepala>Tanggal</SelKepala><SelKepala>Item</SelKepala><SelKepala>Catatan</SelKepala>
            </tr></KepalaTabel>
            <tbody>
              {opname.map((o) => (
                <tr key={o.id} className="border-t border-garis">
                  <td className="px-4 py-3 font-medium">{o.nomor}</td>
                  <td className="px-4 py-3 text-xs">{o.tanggal.slice(0, 10)}</td>
                  <td className="px-4 py-3">{o.jumlah_item}</td>
                  <td className="px-4 py-3 text-xs">{o.catatan}</td>
                </tr>
              ))}
              {opname.length === 0 && <BarisKosong kolom={4} teks="Belum ada opname." />}
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
              <div><label>Bahan</label><select required aria-label={`Bahan baris ${i + 1}`} value={it.bahan_id} onChange={(e) => setFormBeli({ ...formBeli, items: formBeli.items.map((x, j) => j === i ? { ...x, bahan_id: e.target.value } : x) })}><option value="">Pilih</option>{bahan.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}</select></div>
              <div><label>Jumlah</label><input type="number" min="0.01" step="any" required aria-label={`Jumlah baris ${i + 1}`} value={it.jumlah} onChange={(e) => setFormBeli({ ...formBeli, items: formBeli.items.map((x, j) => j === i ? { ...x, jumlah: e.target.value } : x) })} /></div>
              <div><label>Harga</label><input type="number" min="0" required aria-label={`Harga baris ${i + 1}`} value={it.harga_satuan} onChange={(e) => setFormBeli({ ...formBeli, items: formBeli.items.map((x, j) => j === i ? { ...x, harga_satuan: e.target.value } : x) })} /></div>
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
              <div><label>Bahan</label><select required aria-label={`Bahan baris ${i + 1}`} value={it.bahan_id} onChange={(e) => setFormOpname({ ...formOpname, items: formOpname.items.map((x, j) => j === i ? { ...x, bahan_id: e.target.value } : x) })}><option value="">Pilih</option>{bahan.map((b) => <option key={b.id} value={b.id}>{b.nama} ({formatAngka(b.stok)})</option>)}</select></div>
              <div><label>Stok fisik</label><input type="number" min="0" step="any" required aria-label={`Stok fisik baris ${i + 1}`} value={it.stok_fisik} onChange={(e) => setFormOpname({ ...formOpname, items: formOpname.items.map((x, j) => j === i ? { ...x, stok_fisik: e.target.value } : x) })} /></div>
              <div><label>Alasan</label><input aria-label={`Alasan baris ${i + 1}`} value={it.alasan} onChange={(e) => setFormOpname({ ...formOpname, items: formOpname.items.map((x, j) => j === i ? { ...x, alasan: e.target.value } : x) })} /></div>
              <Tombol jenis="hapus" onClick={() => setFormOpname({ ...formOpname, items: formOpname.items.filter((_, j) => j !== i) })} kelas="px-2">-</Tombol>
            </div>
          ))}
          <Tombol jenis="sekunder" onClick={() => setFormOpname({ ...formOpname, items: [...formOpname.items, { bahan_id: "", stok_fisik: "0", alasan: "" }] })}>Tambah baris</Tombol>
          <div><label htmlFor="o-catatan">Catatan</label><input id="o-catatan" value={formOpname.catatan} onChange={(e) => setFormOpname({ ...formOpname, catatan: e.target.value })} /></div>
          <Tombol tipe="submit" kelas="w-full">Simpan opname</Tombol>
        </form>
      </Dialog>
    </div>
  );
}
