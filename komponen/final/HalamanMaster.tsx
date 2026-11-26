"use client";

import { useCallback, useEffect, useState } from "react";
import { ambilApi } from "@/komponen/api-klien.ts";
import { formatAngka, formatRupiah } from "@/lib/format.ts";
import { Badge, BarisKosong, Dialog, Judul, Kartu, KepalaTabel, SelKepala, Tabel, Tombol } from "./ui.tsx";

type Supplier = { id: number; nama: string; kontak: string; aktif: boolean };
type Kategori = { id: number; nama: string };
type Konversi = { dari_satuan: string; ke_satuan: string; faktor: number };
type Tab = "Supplier" | "Kategori";

export default function HalamanMaster() {
  const [tab, setTab] = useState<Tab>("Supplier");
  const [supplier, setSupplier] = useState<Supplier[]>([]);
  const [ringkasanSupplier, setRingkasanSupplier] = useState<{ id: number; nama: string; jumlah_pembelian: number; total: number }[]>([]);
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [konversi, setKonversi] = useState<Konversi[]>([]);
  const [nilaiKonversi, setNilaiKonversi] = useState("1");
  const [pasangan, setPasangan] = useState("kg|gram");
  const [dialog, setDialog] = useState(false);
  const [hapusTarget, setHapusTarget] = useState<number | null>(null);
  const [edit, setEdit] = useState<number | null>(null);
  const [nama, setNama] = useState("");
  const [kontak, setKontak] = useState("");
  const [aktif, setAktif] = useState(true);
  const [pesan, setPesan] = useState("");
  const [galat, setGalat] = useState(false);

  const muat = useCallback(async () => {
    try {
      const [s, k, v] = await Promise.all([
        ambilApi<{ supplier: Supplier[]; ringkasan?: { id: number; nama: string; jumlah_pembelian: number; total: number }[] }>("/api/supplier"),
        ambilApi<{ kategori: Kategori[] }>("/api/kategori"),
        ambilApi<{ konversi: Konversi[] }>("/api/konversi"),
      ]);
      setSupplier(s.supplier ?? []); setRingkasanSupplier(s.ringkasan ?? []);
      setKategori(k.kategori ?? []);
      setKonversi(v.konversi ?? []);
    } catch (e) {
      setGalat(true);
      setPesan(e instanceof Error ? e.message : "Data tidak berhasil dimuat");
    }
  }, []);

  useEffect(() => { void muat(); }, [muat]);

  function buka(s?: Supplier | Kategori) {
    setEdit(s?.id ?? null);
    setNama(s?.nama ?? "");
    setKontak(s && "kontak" in s ? s.kontak : "");
    setAktif(s && "aktif" in s ? s.aktif : true);
    setDialog(true);
    setPesan("");
  }

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    try {
      const path = tab === "Supplier" ? "/api/supplier" : "/api/kategori";
      const badan = tab === "Supplier"
        ? { nama, kontak, aktif }
        : { nama };
      const respons = await fetch(path, {
        method: edit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit ? { id: edit, ...badan } : badan),
      });
      if (!respons.ok) {
        const isi = await respons.json().catch(() => ({}));
        throw new Error(isi.pesan ?? "Gagal menyimpan");
      }
      setDialog(false);
      setGalat(false);
      setPesan("Data tersimpan.");
      await muat();
    } catch (err) {
      setGalat(true);
      setPesan(err instanceof Error ? err.message : "Gagal menyimpan");
    }
  }

  function hapus(id: number) {
    setHapusTarget(id);
  }

  async function konfirmasiHapus() {
    if (hapusTarget === null) return;
    const id = hapusTarget;
    try {
      const path = tab === "Supplier" ? `/api/supplier?id=${id}` : `/api/kategori?id=${id}`;
      const respons = await fetch(path, { method: "DELETE" });
      if (!respons.ok) {
        const isi = await respons.json().catch(() => ({}));
        throw new Error(isi.pesan ?? "Gagal menghapus");
      }
      setGalat(false);
      setPesan("Data dihapus."); setHapusTarget(null);
      await muat();
    } catch (err) {
      setGalat(true);
      setPesan(err instanceof Error ? err.message : "Gagal menghapus");
    }
  }

  return (
    <div className="space-y-6">
      <Judul anak="Master data" sub="Kelola supplier dan kategori pengeluaran yang dipakai di pembelian serta keuangan." />
      {pesan && <p role={galat ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${galat ? "border-red-200 bg-red-50 text-bahaya" : "border-green-200 bg-sukses-terang text-sukses"}`}>{pesan}</p>}

      <div className="flex gap-2">
        {(["Supplier", "Kategori"] as Tab[]).map((t) => (
          <Tombol key={t} onClick={() => { setTab(t); setPesan(""); }} ditekan={tab === t}
            jenis={tab === t ? "utama" : "sekunder"}>{t}</Tombol>
        ))}
      </div>

      <Kartu>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Daftar {tab.toLowerCase()}</h2>
          <Tombol kelas="min-h-[38px] px-3 text-xs" onClick={() => buka()}>Tambah</Tombol>
        </div>

        {tab === "Supplier" && ringkasanSupplier.length > 0 && (
          <div className="mb-4 overflow-x-auto">
            <Tabel>
              <KepalaTabel>
                <tr><SelKepala>Supplier</SelKepala><SelKepala>Pembelian</SelKepala><SelKepala>Total</SelKepala></tr>
              </KepalaTabel>
              <tbody className="divide-y divide-garis">
                {ringkasanSupplier.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2.5 font-medium">{s.nama}</td>
                    <td className="px-4 py-2.5 text-xs">{s.jumlah_pembelian}</td>
                    <td className="px-4 py-2.5">{formatRupiah(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </Tabel>
          </div>
        )}

        {tab === "Supplier" ? (
          <Tabel>
            <KepalaTabel>
              <tr><SelKepala>Nama</SelKepala><SelKepala>Kontak</SelKepala><SelKepala>Status</SelKepala><SelKepala>Aksi</SelKepala></tr>
            </KepalaTabel>
            <tbody className="divide-y divide-garis">
              {supplier.length === 0 ? <BarisKosong kolom={4} teks="Belum ada supplier." /> : supplier.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium">{s.nama}</td>
                  <td className="px-4 py-3 text-sm text-tinta-lemah">{s.kontak || "-"}</td>
                  <td className="px-4 py-3"><Badge warna={s.aktif ? "sukses" : "netral"}>{s.aktif ? "Aktif" : "Nonaktif"}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Tombol jenis="kosong" kelas="min-h-[36px] px-2 text-xs" onClick={() => buka(s)}>Ubah</Tombol>
                      <Tombol jenis="hapus" kelas="min-h-[36px] px-2 text-xs" onClick={() => void hapus(s.id)}>Hapus</Tombol>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabel>
        ) : (
          <Tabel>
            <KepalaTabel>
              <tr><SelKepala>Nama</SelKepala><SelKepala>Aksi</SelKepala></tr>
            </KepalaTabel>
            <tbody className="divide-y divide-garis">
              {kategori.length === 0 ? <BarisKosong kolom={2} teks="Belum ada kategori." /> : kategori.map((k) => (
                <tr key={k.id}>
                  <td className="px-4 py-3 font-medium">{k.nama}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Tombol jenis="kosong" kelas="min-h-[36px] px-2 text-xs" onClick={() => buka(k)}>Ubah</Tombol>
                      <Tombol jenis="hapus" kelas="min-h-[36px] px-2 text-xs" onClick={() => void hapus(k.id)}>Hapus</Tombol>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabel>
        )}
      </Kartu>

      <Kartu>
        <h2 className="text-lg font-semibold">Konversi satuan</h2>
        <p className="mt-1 text-xs text-tinta-lemah">Bantu hitung jumlah bahan saat membeli atau menimbang.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="k-nilai">Jumlah</label>
            <input id="k-nilai" type="number" min="0" step="any" value={nilaiKonversi} onChange={(e) => setNilaiKonversi(e.target.value)} />
          </div>
          <div>
            <label htmlFor="k-pasangan">Satuan</label>
            <select id="k-pasangan" value={pasangan} onChange={(e) => setPasangan(e.target.value)}>
              {konversi.map((v) => (
                <option key={`${v.dari_satuan}-${v.ke_satuan}`} value={`${v.dari_satuan}|${v.ke_satuan}`}>
                  {v.dari_satuan} ke {v.ke_satuan}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="k-hasil">Hasil</label>
            <input id="k-hasil" readOnly aria-live="polite"
              value={(() => {
                const [dari, ke] = pasangan.split("|");
                const v = konversi.find((x) => x.dari_satuan === dari && x.ke_satuan === ke);
                return v ? `${formatAngka(Number(nilaiKonversi || 0) * Number(v.faktor))} ${ke}` : "-";
              })()} />
          </div>
        </div>
      </Kartu>

      <Dialog terbuka={dialog} judul={`${edit ? "Ubah" : "Tambah"} ${tab === "Supplier" ? "supplier" : "kategori"}`} padaTutup={() => setDialog(false)}>
        <form onSubmit={(e) => void simpan(e)} className="space-y-4">
          <div>
            <label htmlFor="m-nama">Nama</label>
            <input id="m-nama" required maxLength={100} value={nama} onChange={(e) => setNama(e.target.value)} />
          </div>
          {tab === "Supplier" && (
            <>
              <div>
                <label htmlFor="m-kontak">Kontak</label>
                <input id="m-kontak" maxLength={100} value={kontak} onChange={(e) => setKontak(e.target.value)} placeholder="Nomor telepon atau alamat" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-5 w-5 min-h-0" checked={aktif} onChange={(e) => setAktif(e.target.checked)} />
                Supplier aktif
              </label>
            </>
          )}
          <Tombol tipe="submit" kelas="w-full">Simpan</Tombol>
        </form>
      </Dialog>

      <Dialog terbuka={hapusTarget !== null} judul="Hapus data" padaTutup={() => setHapusTarget(null)}>
        <p className="text-sm text-tinta-lemah">Data yang masih dipakai transaksi tidak bisa dihapus.</p>
        <div className="mt-5 flex gap-3">
          <Tombol onClick={() => setHapusTarget(null)} jenis="sekunder" kelas="flex-1">Batal</Tombol>
          <Tombol onClick={() => void konfirmasiHapus()} jenis="hapus" kelas="flex-1">Hapus</Tombol>
        </div>
      </Dialog>
    </div>
  );
}
