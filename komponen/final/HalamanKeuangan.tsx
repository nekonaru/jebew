"use client";

import { useCallback, useEffect, useState } from "react";
import { formatRupiah, formatWaktu, tanggalHariIni } from "@/lib/format.ts";
import { ambilJson } from "@/komponen/api-klien.ts";
import { usePeran } from "./Panel.tsx";
import { Badge, Dialog, Judul, Kartu, Pesan, Tabel, Tombol, KepalaTabel, SelKepala, BarisKosong } from "./ui.tsx";

type Kategori = { id: number; nama: string };
type Tutup = { id: number; tanggal: string; total_tunai: number; total_qris: number; total_transfer: number; kas_fisik: number; selisih: number; catatan: string };
type Audit = { id: number; aksi: string; tabel: string; catatan: string; dibuat_pada: string; nama_pengguna: string | null };

export default function HalamanKeuangan() {
  const pemilik = usePeran() === "pemilik";
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [tutup, setTutup] = useState<Tutup[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [auditFilter, setAuditFilter] = useState({ aksi: "", tabel: "", cari: "" });
  const [cariAudit, setCariAudit] = useState("");
  const [dialog, setDialog] = useState<"pengeluaran" | "tutup" | null>(null);
  const [pesan, setPesan] = useState("");
  const [jenis, setJenis] = useState<"info" | "sukses" | "galat">("info");
  const [formPengeluaran, setFormPengeluaran] = useState({ kategori_id: "", nama: "", jumlah: "", tanggal: tanggalHariIni(), catatan: "" });
  const [formTutup, setFormTutup] = useState({ tanggal: tanggalHariIni(), kas_fisik: "", catatan: "" });

  const muat = useCallback(async () => {
    try {
      const [k, t] = await Promise.all([
        fetch("/api/pengeluaran").then(ambilJson<{ kategori: Kategori[] }>),
        fetch("/api/tutup-kasir").then(ambilJson<{ daftar: Tutup[] }>),
      ]);
      setKategori(k.kategori ?? []); setTutup(t.daftar ?? []);
    } catch { /* abaikan */ }
  }, []);
  useEffect(() => { void muat(); }, [muat]);

  const muatAudit = useCallback(async () => {
    if (!pemilik) return;
    try {
      const p = new URLSearchParams(auditFilter);
      const a = await fetch(`/api/audit?${p}`).then(ambilJson<{ audit: Audit[] }>);
      setAudit(a.audit ?? []);
    } catch { /* abaikan */ }
  }, [pemilik, auditFilter]);
  useEffect(() => { void muatAudit(); }, [muatAudit]);

  useEffect(() => {
    const t = setTimeout(() => setAuditFilter((f) => ({ ...f, cari: cariAudit })), 250);
    return () => clearTimeout(t);
  }, [cariAudit]);

  async function kirimPengeluaran(e: React.FormEvent) {
    e.preventDefault();
    try {
      const respons = await fetch("/api/pengeluaran", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formPengeluaran, kategori_id: Number(formPengeluaran.kategori_id), jumlah: Number(formPengeluaran.jumlah) }),
      });
      await ambilJson(respons);
      setDialog(null); setJenis("sukses"); setPesan("Pengeluaran tercatat."); void muat();
    } catch (err) { setJenis("galat"); setPesan(err instanceof Error ? err.message : "Gagal menyimpan"); }
  }

  async function kirimTutup(e: React.FormEvent) {
    e.preventDefault();
    try {
      const respons = await fetch("/api/tutup-kasir", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formTutup, kas_fisik: Number(formTutup.kas_fisik) }),
      });
      await ambilJson(respons);
      setDialog(null); setJenis("sukses"); setPesan("Tutup kasir tersimpan."); void muat();
    } catch (err) { setJenis("galat"); setPesan(err instanceof Error ? err.message : "Gagal menyimpan"); }
  }

  return (
    <div>
      <Judul anak="Keuangan" sub="Catat pengeluaran, tutup kasir harian, dan lihat jejak aktivitas."
        aksi={pemilik ? <div className="flex gap-2"><Tombol onClick={() => setDialog("pengeluaran")}>Tambah pengeluaran</Tombol><Tombol onClick={() => setDialog("tutup")} jenis="sekunder">Tutup kasir</Tombol></div> : undefined} />
      <Pesan teks={pesan} jenis={jenis} />

      <div className="mb-5">
        <h2 className="mb-3 text-lg font-semibold">Riwayat tutup kasir</h2>
        <Tabel>
          <KepalaTabel><tr>
            <SelKepala>Tanggal</SelKepala><SelKepala>Tunai</SelKepala><SelKepala>QRIS</SelKepala>
            <SelKepala>Transfer</SelKepala><SelKepala>Kas fisik</SelKepala><SelKepala>Selisih</SelKepala>
          </tr></KepalaTabel>
          <tbody>
            {tutup.map((t) => (
              <tr key={t.id} className="border-t border-garis">
                <td className="px-4 py-3 font-medium">{t.tanggal}</td>
                <td className="px-4 py-3">{formatRupiah(t.total_tunai)}</td>
                <td className="px-4 py-3">{formatRupiah(t.total_qris)}</td>
                <td className="px-4 py-3">{formatRupiah(t.total_transfer)}</td>
                <td className="px-4 py-3">{formatRupiah(t.kas_fisik)}</td>
                <td className="px-4 py-3"><Badge warna={t.selisih === 0 ? "sukses" : "bahaya"}>{formatRupiah(t.selisih)}</Badge></td>
              </tr>
            ))}
            {tutup.length === 0 && <BarisKosong kolom={6} teks="Belum ada tutup kasir." />}
          </tbody>
        </Tabel>
      </div>

      {pemilik && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Jejak aktivitas</h2>
          <Kartu kelas="mb-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="au-aksi">Aksi</label>
                <select id="au-aksi" value={auditFilter.aksi} onChange={(e) => setAuditFilter({ ...auditFilter, aksi: e.target.value })}>
                  <option value="">Semua aksi</option>
                  <option value="tambah">Tambah</option>
                  <option value="ubah">Ubah</option>
                  <option value="hapus">Hapus</option>
                </select>
              </div>
              <div>
                <label htmlFor="au-tabel">Data</label>
                <select id="au-tabel" value={auditFilter.tabel} onChange={(e) => setAuditFilter({ ...auditFilter, tabel: e.target.value })}>
                  <option value="">Semua data</option>
                  <option value="penjualan">Penjualan</option>
                  <option value="preorder">Pre-order</option>
                  <option value="stok">Stok</option>
                  <option value="pengeluaran">Pengeluaran</option>
                  <option value="menu">Menu</option>
                  <option value="supplier">Supplier</option>
                  <option value="bahan">Bahan</option>
                  <option value="pembelian">Pembelian</option>
                  <option value="stok_opname">Stok opname</option>
                  <option value="kategori_pengeluaran">Kategori pengeluaran</option>
                  <option value="tutup_kasir">Tutup kasir</option>
                  <option value="pulihkan">Pemulihan data</option>
                  <option value="pengguna">Pengguna</option>
                  <option value="pengaturan">Pengaturan</option>
                </select>
              </div>
              <div>
                <label htmlFor="au-cari">Cari catatan</label>
                <input id="au-cari" type="search" value={cariAudit} placeholder="Kata kunci atau nama pengguna"
                  onChange={(e) => setCariAudit(e.target.value)} />
              </div>
            </div>
            <a
              href={`/api/audit?${new URLSearchParams({ ...auditFilter, format: "csv" })}`}
              className="mt-3 inline-flex min-h-[40px] items-center justify-center rounded-xl border border-garis px-4 text-xs font-semibold hover:bg-latar"
            >
              Unduh CSV jejak aktivitas
            </a>
          </Kartu>
          <Kartu>
            {audit.length === 0 && <p className="py-4 text-center text-sm text-tinta-lemah">Tidak ada aktivitas yang cocok.</p>}
            {audit.length > 20 && <p className="mb-3 text-xs text-tinta-lemah">Menampilkan 20 aktivitas terbaru. Unduh CSV untuk melihat seluruhnya.</p>}
            <ul className="space-y-2 text-sm">
              {audit.slice(0, 20).map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-2 border-b border-garis py-2 last:border-0">
                  <Badge>{a.aksi}</Badge><span className="font-medium">{a.tabel}</span>
                  <span className="text-tinta-lemah">{a.catatan}</span>
                  <span className="ml-auto text-xs text-tinta-lemah">{a.nama_pengguna ?? "Sistem"} - {formatWaktu(a.dibuat_pada)}</span>
                </li>
              ))}
            </ul>
          </Kartu>
        </div>
      )}

      <Dialog terbuka={dialog === "pengeluaran"} judul="Tambah pengeluaran" padaTutup={() => setDialog(null)}>
        <form onSubmit={kirimPengeluaran} className="space-y-4">
          <div><label htmlFor="e-kategori">Kategori</label><select id="e-kategori" required value={formPengeluaran.kategori_id} onChange={(e) => setFormPengeluaran({ ...formPengeluaran, kategori_id: e.target.value })}><option value="">Pilih</option>{kategori.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}</select></div>
          <div><label htmlFor="e-nama">Nama</label><input id="e-nama" required value={formPengeluaran.nama} onChange={(e) => setFormPengeluaran({ ...formPengeluaran, nama: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label htmlFor="e-jumlah">Jumlah</label><input id="e-jumlah" type="number" min={0} required value={formPengeluaran.jumlah} onChange={(e) => setFormPengeluaran({ ...formPengeluaran, jumlah: e.target.value })} /></div>
            <div><label htmlFor="e-tanggal">Tanggal</label><input id="e-tanggal" type="date" required max={tanggalHariIni()} value={formPengeluaran.tanggal} onChange={(e) => setFormPengeluaran({ ...formPengeluaran, tanggal: e.target.value })} /></div>
          </div>
          <div><label htmlFor="e-catatan">Catatan</label><input id="e-catatan" value={formPengeluaran.catatan} onChange={(e) => setFormPengeluaran({ ...formPengeluaran, catatan: e.target.value })} /></div>
          <Tombol tipe="submit" kelas="w-full">Simpan</Tombol>
        </form>
      </Dialog>

      <Dialog terbuka={dialog === "tutup"} judul="Tutup kasir" padaTutup={() => setDialog(null)}>
        <form onSubmit={kirimTutup} className="space-y-4">
          <div><label htmlFor="t-tanggal">Tanggal</label><input id="t-tanggal" type="date" required max={tanggalHariIni()} value={formTutup.tanggal} onChange={(e) => setFormTutup({ ...formTutup, tanggal: e.target.value })} /></div>
          <div><label htmlFor="t-kas">Kas fisik (Rp)</label><input id="t-kas" type="number" min={0} required value={formTutup.kas_fisik} onChange={(e) => setFormTutup({ ...formTutup, kas_fisik: e.target.value })} /></div>
          <div><label htmlFor="t-catatan">Catatan</label><input id="t-catatan" value={formTutup.catatan} onChange={(e) => setFormTutup({ ...formTutup, catatan: e.target.value })} /></div>
          <Tombol tipe="submit" kelas="w-full">Simpan tutup kasir</Tombol>
        </form>
      </Dialog>
    </div>
  );
}
