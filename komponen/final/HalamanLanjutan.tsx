"use client";

import { useCallback, useEffect, useState } from "react";
import { formatRupiah, tanggalHariIni } from "@/lib/format.ts";
import { ambilJson } from "@/komponen/api-klien.ts";
import { Badge, Dialog, Judul, Kartu, Pesan, Tombol } from "./ui.tsx";

const TAB = ["Promo", "Ulasan", "Jadwal harian", "Target", "Stok lanjutan", "Kalkulator", "Piutang", "Operasional", "Zona kirim", "Keuangan"] as const;
type Tab = typeof TAB[number];
const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

type Baris = Record<string, unknown>;

/** Halaman pengelolaan fitur lanjutan milik pemilik. */
export default function HalamanLanjutan() {
  const [tab, setTab] = useState<Tab>("Promo");
  const [data, setData] = useState<Baris[]>([]);
  const [jadwal, setJadwal] = useState<Baris[]>([]);
  const [libur, setLibur] = useState<Baris[]>([]);
  const [pesan, setPesan] = useState("");
  const [jenis, setJenis] = useState<"info" | "sukses" | "galat">("info");
  const [dialog, setDialog] = useState(false);
  const [formPromo, setFormPromo] = useState({
    kode: "", jenis: "nominal", nilai: "5000", minimum_belanja: "0", kuota: "100",
    berlaku_dari: tanggalHariIni(), berlaku_sampai: tanggalHariIni(), aktif: true,
    jam_mulai: "00:00", jam_selesai: "23:59",
  });
  const [formTarget, setFormTarget] = useState({ tanggal: tanggalHariIni(), target_omzet: "500000", target_transaksi: "20" });
  const [formLibur, setFormLibur] = useState({ tanggal: "", keterangan: "" });
  const [stokLanjutan, setStokLanjutan] = useState<{
    prediksi: Baris[]; harga: Baris[]; purchaseOrder: Baris[];
  } & { batch?: Baris[] }>({ prediksi: [], harga: [], purchaseOrder: [], batch: [] });
  const [masterBahan, setMasterBahan] = useState<{ id: number; nama: string }[]>([]);
  const [masterSupplier, setMasterSupplier] = useState<{ id: number; nama: string }[]>([]);
  const [formStok, setFormStok] = useState({
    bahan_id: "", jumlah: "1", harga_satuan: "0", supplier_id: "", tanggal: tanggalHariIni(),
  });
  const [formBatch, setFormBatch] = useState({
    nomor_batch: "", tanggal_masuk: tanggalHariIni(), tanggal_kedaluwarsa: "", jumlah: "1", harga_satuan: "0",
  });
  const [kalkulator, setKalkulator] = useState({ hpp: "0", margin: "30" });
  const [operasional, setOperasional] = useState<{ piutang: Baris[]; shift: Baris[] }>({ piutang: [], shift: [] });
  const [formPiutang, setFormPiutang] = useState({
    kode_lacak: "", nama: "", jumlah: "0", jatuh_tempo: tanggalHariIni(), catatan: "",
  });
  const [formShift, setFormShift] = useState({ nama: "", kas_awal: "0" });
  const [formLimbah, setFormLimbah] = useState({ jumlah: "1", alasan: "" });
  const [zona, setZona] = useState<Baris[]>([]);
  const [formZona, setFormZona] = useState({ nama: "", tarif: "0", keterangan: "" });
  const [keuangan, setKeuangan] = useState<{
    kas: Baris[]; anggaran: Baris[]; hutang: Baris[]; rfm: Baris[];
    retensi: { total: number; kembali: number; persen: number };
  }>({ kas: [], anggaran: [], hutang: [], rfm: [], retensi: { total: 0, kembali: 0, persen: 0 } });
  const [formAnggaran, setFormAnggaran] = useState({
    kategori: "", bulan: tanggalHariIni().slice(0, 7), jumlah: "0",
  });

  const muat = useCallback(async () => {
    try {
      if (tab === "Promo") {
        const d = await fetch("/api/promo").then(ambilJson<{ promo: Baris[] }>);
        setData(d.promo ?? []);
      } else if (tab === "Ulasan") {
        const d = await fetch("/api/ulasan?status=menunggu").then(ambilJson<{ ulasan: Baris[] }>);
        setData(d.ulasan ?? []);
      } else if (tab === "Jadwal harian") {
        const d = await fetch("/api/jadwal-harian").then(ambilJson<{ jadwal: Baris[]; libur: Baris[] }>);
        setJadwal(d.jadwal ?? []); setLibur(d.libur ?? []);
        if ((d.jadwal ?? []).length === 0) {
          setJadwal(["toko", "preorder"].flatMap((jenis) => HARI.map((_, hari) => ({
            jenis, hari, jam_buka: "10:00", jam_tutup: "21:00", aktif: true,
          }))));
        }
      } else if (tab === "Target") {
        const d = await fetch(`/api/target?dari=${tanggalHariIni()}&sampai=${tanggalHariIni()}`)
          .then(ambilJson<{ target: Baris[] }>);
        setData(d.target ?? []);
      } else if (tab === "Keuangan") {
        const d = await fetch("/api/keuangan-lanjutan").then(ambilJson<{
          kas: Baris[]; anggaran: Baris[]; hutang: Baris[]; rfm: Baris[];
          retensi: { total: number; kembali: number; persen: number };
        }>);
        setKeuangan({ kas: d.kas ?? [], anggaran: d.anggaran ?? [], hutang: d.hutang ?? [],
          rfm: d.rfm ?? [], retensi: d.retensi ?? { total: 0, kembali: 0, persen: 0 } });
      } else if (tab === "Zona kirim") {
        const d = await fetch("/api/zona-kirim").then(ambilJson<{ zona: Baris[] }>);
        setZona(d.zona ?? []);
      } else if (tab === "Piutang" || tab === "Operasional") {
        const d = await fetch("/api/operasional").then(ambilJson<{
          piutang: Baris[]; shift: Baris[];
        }>);
        setOperasional({ piutang: d.piutang ?? [], shift: d.shift ?? [] });
      } else {
        const [d, bahan, supplier] = await Promise.all([
          fetch("/api/stok-lanjutan").then(ambilJson<{
            prediksi: Baris[]; harga: Baris[]; purchaseOrder: Baris[]; batch?: Baris[];
          }>),
          fetch("/api/bahan").then(ambilJson<{ bahan: { id: number; nama: string }[] }>),
          fetch("/api/supplier").then(ambilJson<{ supplier: { id: number; nama: string }[] }>),
        ]);
        setStokLanjutan({
          prediksi: d.prediksi ?? [], harga: d.harga ?? [],
          purchaseOrder: d.purchaseOrder ?? [], batch: d.batch ?? [],
        });
        setMasterBahan(bahan.bahan ?? []); setMasterSupplier(supplier.supplier ?? []);
      }
    } catch (e) { setJenis("galat"); setPesan(e instanceof Error ? e.message : "Gagal memuat data"); }
  }, [tab]);
  useEffect(() => { void muat(); }, [muat]);

  async function simpanPromo(e: React.FormEvent) {
    e.preventDefault();
    try {
      const respons = await fetch("/api/promo", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formPromo, nilai: Number(formPromo.nilai),
          minimum_belanja: Number(formPromo.minimum_belanja), kuota: Number(formPromo.kuota) }),
      });
      await ambilJson(respons);
      setJenis("sukses"); setPesan("Promo tersimpan."); setDialog(false); void muat();
    } catch (err) { setJenis("galat"); setPesan(err instanceof Error ? err.message : "Gagal menyimpan promo"); }
  }

  async function tinjau(id: number, status: "diterima" | "ditolak") {
    try {
      const respons = await fetch("/api/ulasan", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      await ambilJson(respons);
      setJenis("sukses"); setPesan("Ulasan ditinjau."); void muat();
    } catch (e) { setJenis("galat"); setPesan(e instanceof Error ? e.message : "Gagal meninjau ulasan"); }
  }

  async function simpanJadwal() {
    try {
      const respons = await fetch("/api/jadwal-harian", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jadwal, libur: [], hapusLibur: [] }),
      });
      await ambilJson(respons);
      setJenis("sukses"); setPesan("Jadwal harian tersimpan."); void muat();
    } catch (e) { setJenis("galat"); setPesan(e instanceof Error ? e.message : "Gagal menyimpan jadwal"); }
  }

  async function tambahLibur(e: React.FormEvent) {
    e.preventDefault();
    try {
      const respons = await fetch("/api/jadwal-harian", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jadwal, libur: [formLibur], hapusLibur: [] }),
      });
      await ambilJson(respons);
      setJenis("sukses"); setPesan("Hari libur ditambahkan."); setFormLibur({ tanggal: "", keterangan: "" }); void muat();
    } catch (err) { setJenis("galat"); setPesan(err instanceof Error ? err.message : "Gagal menambah libur"); }
  }

  async function aksiStok(aksi: "harga" | "purchase_order") {
    if (!formStok.bahan_id) { setJenis("galat"); setPesan("Pilih bahan terlebih dahulu."); return; }
    try {
      const badan = aksi === "harga"
        ? { aksi, supplier_id: Number(formStok.supplier_id), bahan_id: Number(formStok.bahan_id),
            harga_satuan: Number(formStok.harga_satuan), tanggal: formStok.tanggal }
        : { aksi, supplier_id: formStok.supplier_id ? Number(formStok.supplier_id) : null,
            tanggal: formStok.tanggal, catatan: "",
            items: [{ bahan_id: Number(formStok.bahan_id), jumlah: Number(formStok.jumlah),
              harga_satuan: Number(formStok.harga_satuan) }] };
      const respons = await fetch("/api/stok-lanjutan", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(badan),
      });
      const hasil = await ambilJson<{ nomor?: string }>(respons);
      setJenis("sukses"); setPesan(hasil.nomor ? `Purchase order ${hasil.nomor} dibuat.` : "Harga supplier tercatat.");
      void muat();
    } catch (e) { setJenis("galat"); setPesan(e instanceof Error ? e.message : "Gagal menyimpan data stok"); }
  }

  async function kirimOperasional(badan: Record<string, unknown>, pesanSukses: string) {
    try {
      const respons = await fetch("/api/operasional", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(badan),
      });
      await ambilJson(respons);
      setJenis("sukses"); setPesan(pesanSukses); void muat();
    } catch (err) { setJenis("galat"); setPesan(err instanceof Error ? err.message : "Gagal menyimpan"); }
  }

  async function simpanBatchData(e: React.FormEvent) {
    e.preventDefault();
    if (!formStok.bahan_id) { setJenis("galat"); setPesan("Pilih bahan terlebih dahulu."); return; }
    try {
      const respons = await fetch("/api/stok-lanjutan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aksi: "batch", bahan_id: Number(formStok.bahan_id),
          nomor_batch: formBatch.nomor_batch,
          tanggal_masuk: formBatch.tanggal_masuk,
          tanggal_kedaluwarsa: formBatch.tanggal_kedaluwarsa,
          jumlah: Number(formBatch.jumlah), harga_satuan: Number(formBatch.harga_satuan),
        }),
      });
      await ambilJson(respons);
      setJenis("sukses"); setPesan("Batch ditambahkan dan stok bertambah.");
      setFormBatch({ nomor_batch: "", tanggal_masuk: tanggalHariIni(), tanggal_kedaluwarsa: "", jumlah: "1", harga_satuan: "0" });
      void muat();
    } catch (err) { setJenis("galat"); setPesan(err instanceof Error ? err.message : "Gagal menambah batch"); }
  }

  async function terimaPO(id: number) {
    try {
      const respons = await fetch("/api/stok-lanjutan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aksi: "terima", id }),
      });
      await ambilJson(respons);
      setJenis("sukses"); setPesan("Purchase order diterima. Stok dan riwayat harga diperbarui."); void muat();
    } catch (e) { setJenis("galat"); setPesan(e instanceof Error ? e.message : "Gagal menerima purchase order"); }
  }

  async function simpanTarget(e: React.FormEvent) {
    e.preventDefault();
    try {
      const respons = await fetch("/api/target", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formTarget, target_omzet: Number(formTarget.target_omzet),
          target_transaksi: Number(formTarget.target_transaksi) }),
      });
      await ambilJson(respons);
      setJenis("sukses"); setPesan("Target tersimpan."); void muat();
    } catch (err) { setJenis("galat"); setPesan(err instanceof Error ? err.message : "Gagal menyimpan target"); }
  }

  return (
    <div>
      <Judul anak="Fitur lanjutan" sub="Promo, ulasan, jadwal per hari, dan target usaha." />
      <Pesan teks={pesan} jenis={jenis} />
      <div className="mb-5 flex flex-wrap gap-2">
        {TAB.map((nama) => (
          <Tombol key={nama} onClick={() => setTab(nama)} jenis={tab === nama ? "utama" : "sekunder"}
            kelas="min-h-[38px] px-3 text-xs">{nama}</Tombol>
        ))}
      </div>

      {tab === "Promo" && (
        <Kartu>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Promo</h2>
            <Tombol onClick={() => setDialog(true)} kelas="min-h-[38px] px-3 text-xs">Tambah promo</Tombol>
          </div>
          <ul className="mt-4 space-y-2">
            {data.map((p) => (
              <li key={String(p.id)} className="flex flex-wrap items-center gap-2 rounded-xl border border-garis px-3 py-2 text-sm">
                <Badge warna={p.aktif ? "sukses" : "bahaya"}>{p.aktif ? "Aktif" : "Nonaktif"}</Badge>
                <span className="font-semibold">{String(p.kode)}</span>
                <span className="text-xs text-tinta-lemah">{String(p.jenis)} {formatRupiah(Number(p.nilai))}, minimum {formatRupiah(Number(p.minimum_belanja))}</span>
                <span className="ml-auto text-xs">{Number(p.terpakai)}/{Number(p.kuota)}</span>
              </li>
            ))}
            {data.length === 0 && <li className="text-sm text-tinta-lemah">Belum ada promo.</li>}
          </ul>
        </Kartu>
      )}

      {tab === "Ulasan" && (
        <Kartu>
          <h2 className="text-lg font-semibold">Ulasan menunggu tinjauan</h2>
          <ul className="mt-4 space-y-2">
            {data.map((u) => (
              <li key={String(u.id)} className="rounded-xl border border-garis p-3 text-sm">
                <div className="flex items-center gap-2"><Badge>{String(u.rating)} bintang</Badge><span className="text-xs text-tinta-lemah">{String(u.kode_lacak)}</span></div>
                <p className="mt-2">{String(u.komentar) || "(tanpa komentar)"}</p>
                <div className="mt-3 flex gap-2">
                  <Tombol jenis="sukses" kelas="min-h-[38px] px-3 text-xs" onClick={() => void tinjau(Number(u.id), "diterima")}>Terima</Tombol>
                  <Tombol jenis="hapus" kelas="min-h-[38px] px-3 text-xs" onClick={() => void tinjau(Number(u.id), "ditolak")}>Tolak</Tombol>
                </div>
              </li>
            ))}
            {data.length === 0 && <li className="text-sm text-tinta-lemah">Tidak ada ulasan baru.</li>}
          </ul>
        </Kartu>
      )}

      {tab === "Jadwal harian" && (
        <Kartu>
          <h2 className="text-lg font-semibold">Jam buka per hari</h2>
          <p className="mt-1 text-xs text-tinta-lemah">Jadwal ini menggantikan jam umum bila diisi. Simpan setelah mengubah.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="text-left text-xs uppercase text-tinta-lemah">
                <th className="px-2 py-2">Hari</th><th className="px-2 py-2">Toko buka</th><th className="px-2 py-2">Toko tutup</th>
                <th className="px-2 py-2">Pre-order buka</th><th className="px-2 py-2">Pre-order tutup</th><th className="px-2 py-2">Aktif</th>
              </tr></thead>
              <tbody>
                {HARI.map((nama, indeks) => {
                  const toko = jadwal.find((j) => j.jenis === "toko" && Number(j.hari) === indeks);
                  const po = jadwal.find((j) => j.jenis === "preorder" && Number(j.hari) === indeks);
                  const ubah = (jenis: string, kolom: string, nilai: string | boolean) => {
                    setJadwal((d) => d.map((j) => j.jenis === jenis && Number(j.hari) === indeks ? { ...j, [kolom]: nilai } : j));
                  };
                  return (
                    <tr key={nama} className="border-t border-garis">
                      <td className="px-2 py-2 font-semibold">{nama}</td>
                      <td className="px-2 py-2"><input type="time" value={String(toko?.jam_buka ?? "10:00")} onChange={(e) => ubah("toko", "jam_buka", e.target.value)} /></td>
                      <td className="px-2 py-2"><input type="time" value={String(toko?.jam_tutup ?? "21:00")} onChange={(e) => ubah("toko", "jam_tutup", e.target.value)} /></td>
                      <td className="px-2 py-2"><input type="time" value={String(po?.jam_buka ?? "10:00")} onChange={(e) => ubah("preorder", "jam_buka", e.target.value)} /></td>
                      <td className="px-2 py-2"><input type="time" value={String(po?.jam_tutup ?? "21:00")} onChange={(e) => ubah("preorder", "jam_tutup", e.target.value)} /></td>
                      <td className="px-2 py-2"><input type="checkbox" checked={Boolean(toko?.aktif ?? true)} onChange={(e) => { ubah("toko", "aktif", e.target.checked); ubah("preorder", "aktif", e.target.checked); }} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Tombol kelas="mt-4" onClick={() => void simpanJadwal()}>Simpan jadwal</Tombol>
          <form onSubmit={(e) => void tambahLibur(e)} className="mt-6 grid gap-3 border-t border-garis pt-4 sm:grid-cols-3">
            <div><label htmlFor="l-tanggal">Tanggal libur</label><input id="l-tanggal" type="date" required value={formLibur.tanggal} onChange={(e) => setFormLibur({ ...formLibur, tanggal: e.target.value })} /></div>
            <div><label htmlFor="l-keterangan">Keterangan</label><input id="l-keterangan" value={formLibur.keterangan} onChange={(e) => setFormLibur({ ...formLibur, keterangan: e.target.value })} /></div>
            <div className="flex items-end"><Tombol tipe="submit" kelas="w-full">Tambah libur</Tombol></div>
          </form>
          {libur.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-tinta-lemah">
              {libur.map((l) => <li key={String(l.id)}>{String(l.tanggal)} - {String(l.keterangan)}</li>)}
            </ul>
          )}
        </Kartu>
      )}

      {tab === "Target" && (
        <Kartu>
          <h2 className="text-lg font-semibold">Target hari ini</h2>
          <form onSubmit={(e) => void simpanTarget(e)} className="mt-4 grid gap-3 sm:grid-cols-3">
            <div><label htmlFor="t-tanggal">Tanggal</label><input id="t-tanggal" type="date" required value={formTarget.tanggal} onChange={(e) => setFormTarget({ ...formTarget, tanggal: e.target.value })} /></div>
            <div><label htmlFor="t-omzet">Target omzet</label><input id="t-omzet" type="number" min={0} required value={formTarget.target_omzet} onChange={(e) => setFormTarget({ ...formTarget, target_omzet: e.target.value })} /></div>
            <div><label htmlFor="t-transaksi">Target transaksi</label><input id="t-transaksi" type="number" min={0} required value={formTarget.target_transaksi} onChange={(e) => setFormTarget({ ...formTarget, target_transaksi: e.target.value })} /></div>
            <div className="sm:col-span-3"><Tombol tipe="submit">Simpan target</Tombol></div>
          </form>
          <ul className="mt-4 space-y-1 text-sm">
            {data.map((t) => <li key={String(t.tanggal)}>{String(t.tanggal)}: {formatRupiah(Number(t.target_omzet))} dan {Number(t.target_transaksi)} transaksi</li>)}
            {data.length === 0 && <li className="text-tinta-lemah">Belum ada target.</li>}
          </ul>
        </Kartu>
      )}

      {tab === "Stok lanjutan" && (
        <div className="space-y-5">
          <Kartu>
            <h2 className="text-lg font-semibold">Catat harga dan buat purchase order</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="sl-bahan">Bahan</label>
                <select id="sl-bahan" value={formStok.bahan_id} onChange={(e) => setFormStok({ ...formStok, bahan_id: e.target.value })}>
                  <option value="">Pilih bahan</option>
                  {masterBahan.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="sl-supplier">Supplier</label>
                <select id="sl-supplier" value={formStok.supplier_id} onChange={(e) => setFormStok({ ...formStok, supplier_id: e.target.value })}>
                  <option value="">Tanpa supplier</option>
                  {masterSupplier.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="sl-tanggal">Tanggal</label>
                <input id="sl-tanggal" type="date" value={formStok.tanggal} onChange={(e) => setFormStok({ ...formStok, tanggal: e.target.value })} />
              </div>
              <div><label htmlFor="sl-jumlah">Jumlah</label><input id="sl-jumlah" type="number" min={0.01} step="any" value={formStok.jumlah} onChange={(e) => setFormStok({ ...formStok, jumlah: e.target.value })} /></div>
              <div><label htmlFor="sl-harga">Harga satuan</label><input id="sl-harga" type="number" min={1} value={formStok.harga_satuan} onChange={(e) => setFormStok({ ...formStok, harga_satuan: e.target.value })} /></div>
              <div className="flex items-end gap-2">
                <Tombol jenis="sekunder" kelas="flex-1" onClick={() => void aksiStok("harga")}>Catat harga</Tombol>
                <Tombol kelas="flex-1" onClick={() => void aksiStok("purchase_order")}>Buat PO</Tombol>
              </div>
            </div>
          </Kartu>
          <Kartu>
            <h2 className="text-lg font-semibold">Perkiraan stok habis</h2>
            <p className="mt-1 text-xs text-tinta-lemah">Dihitung dari pemakaian tujuh hari terakhir dan stok saat ini.</p>
            <ul className="mt-4 space-y-2">
              {stokLanjutan.prediksi.slice(0, 30).map((b) => (
                <li key={String(b.id)} className="flex flex-wrap items-center gap-2 rounded-xl border border-garis px-3 py-2 text-sm">
                  <span className="font-semibold">{String(b.nama)}</span>
                  <span className="text-xs text-tinta-lemah">{Number(b.stok)} {String(b.satuan)}</span>
                  <Badge warna={b.status === "menipis" ? "bahaya" : b.status === "segera" ? "peringatan" : "sukses"}>
                    {b.status === "menipis" ? "Menipis" : b.status === "segera" ? "Segera habis" : "Aman"}
                  </Badge>
                  <span className="ml-auto text-xs">{b.sisa_hari === null ? "Belum ada pemakaian" : `${b.sisa_hari} hari`}</span>
                </li>
              ))}
            </ul>
          </Kartu>
          <Kartu>
            <h2 className="text-lg font-semibold">Batch bahan dan kedaluwarsa</h2>
            <p className="mt-1 text-xs text-tinta-lemah">Stok dipotong dari batch dengan tanggal kedaluwarsa terdekat lebih dulu.</p>
            <form onSubmit={(e) => void simpanBatchData(e)} className="mt-4 grid gap-3 sm:grid-cols-3">
              <div><label htmlFor="b-bahan">Bahan</label>
                <select id="b-bahan" value={formStok.bahan_id} onChange={(e) => setFormStok({ ...formStok, bahan_id: e.target.value })}>
                  <option value="">Pilih bahan</option>
                  {masterBahan.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}
                </select>
              </div>
              <div><label htmlFor="b-nomor">Nomor batch</label><input id="b-nomor" required maxLength={50} value={formBatch.nomor_batch} onChange={(e) => setFormBatch({ ...formBatch, nomor_batch: e.target.value })} /></div>
              <div><label htmlFor="b-masuk">Tanggal masuk</label><input id="b-masuk" type="date" required value={formBatch.tanggal_masuk} onChange={(e) => setFormBatch({ ...formBatch, tanggal_masuk: e.target.value })} /></div>
              <div><label htmlFor="b-kedaluwarsa">Kedaluwarsa</label><input id="b-kedaluwarsa" type="date" value={formBatch.tanggal_kedaluwarsa} onChange={(e) => setFormBatch({ ...formBatch, tanggal_kedaluwarsa: e.target.value })} /></div>
              <div><label htmlFor="b-jumlah">Jumlah</label><input id="b-jumlah" type="number" min={0.01} step="any" required value={formBatch.jumlah} onChange={(e) => setFormBatch({ ...formBatch, jumlah: e.target.value })} /></div>
              <div className="flex items-end"><Tombol tipe="submit" kelas="w-full">Tambah batch</Tombol></div>
            </form>
            <ul className="mt-4 space-y-2">
              {(stokLanjutan.batch ?? []).map((b) => (
                <li key={String(b.id)} className="flex flex-wrap items-center gap-2 rounded-xl border border-garis px-3 py-2 text-xs">
                  <span className="font-semibold">{String(b.bahan)}</span>
                  <span>{String(b.nomor_batch)}</span>
                  <span className="text-tinta-lemah">sisa {Number(b.sisa)}</span>
                  {Boolean(b.tanggal_kedaluwarsa) && <Badge warna="peringatan">EXP {String(b.tanggal_kedaluwarsa)}</Badge>}
                </li>
              ))}
              {(stokLanjutan.batch ?? []).length === 0 && <li className="text-sm text-tinta-lemah">Belum ada batch.</li>}
            </ul>
          </Kartu>
          <Kartu>
            <h2 className="text-lg font-semibold">Purchase order</h2>
            <ul className="mt-4 space-y-2">
              {stokLanjutan.purchaseOrder.map((p) => (
                <li key={String(p.id)} className="flex flex-wrap items-center gap-2 rounded-xl border border-garis px-3 py-2 text-sm">
                  <span className="font-semibold">{String(p.nomor)}</span>
                  <Badge warna={p.status === "diterima" ? "sukses" : "peringatan"}>{String(p.status)}</Badge>
                  <span className="text-xs text-tinta-lemah">{String(p.supplier ?? "Tanpa supplier")} - {Number(p.jumlah_item)} item - {formatRupiah(Number(p.total))}</span>
                  {p.status === "draft" && (
                    <Tombol jenis="sekunder" onClick={() => void kirimOperasional({ aksi: "kirim_po", id: Number(p.id) }, "Purchase order dikirim.")}
                      kelas="ml-auto min-h-[38px] px-3 text-xs">Kirim</Tombol>
                  )}
                  {p.status === "dikirim" && (
                    <Tombol onClick={() => void terimaPO(Number(p.id))} kelas="ml-auto min-h-[38px] px-3 text-xs">Terima</Tombol>
                  )}
                </li>
              ))}
              {stokLanjutan.purchaseOrder.length === 0 && <li className="text-sm text-tinta-lemah">Belum ada purchase order.</li>}
            </ul>
          </Kartu>
          <Kartu>
            <h2 className="text-lg font-semibold">Riwayat harga supplier</h2>
            <ul className="mt-4 space-y-1 text-sm">
              {stokLanjutan.harga.slice(0, 30).map((h) => (
                <li key={String(h.id)} className="flex justify-between border-b border-garis py-2 text-xs">
                  <span>{String(h.tanggal)} - {String(h.bahan)} - {String(h.supplier ?? "-")}</span>
                  <span className="font-semibold">{formatRupiah(Number(h.harga_satuan))}</span>
                </li>
              ))}
              {stokLanjutan.harga.length === 0 && <li className="text-tinta-lemah">Belum ada riwayat harga.</li>}
            </ul>
          </Kartu>
        </div>
      )}

      {tab === "Keuangan" && (
        <div className="space-y-5">
          <Kartu>
            <h2 className="text-lg font-semibold">Arus kas periode ini</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead><tr className="text-left text-xs uppercase text-tinta-lemah">
                  <th className="px-3 py-2">Tanggal</th><th className="px-3 py-2">Masuk</th>
                  <th className="px-3 py-2">Keluar</th><th className="px-3 py-2">Saldo</th>
                </tr></thead>
                <tbody>
                  {keuangan.kas.slice(-14).map((k) => (
                    <tr key={String(k.tanggal)} className="border-t border-garis">
                      <td className="px-3 py-2">{String(k.tanggal)}</td>
                      <td className="px-3 py-2 text-sukses">{formatRupiah(Number(k.pemasukan))}</td>
                      <td className="px-3 py-2 text-bahaya">{formatRupiah(Number(k.pengeluaran))}</td>
                      <td className="px-3 py-2 font-semibold">{formatRupiah(Number(k.saldo))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {keuangan.kas.length === 0 && <p className="mt-3 text-sm text-tinta-lemah">Belum ada transaksi pada periode ini.</p>}
          </Kartu>

          <div className="grid gap-5 lg:grid-cols-2">
            <Kartu>
              <h2 className="text-lg font-semibold">Anggaran bulan ini</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                void fetch("/api/keuangan-lanjutan", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ aksi: "anggaran", ...formAnggaran, jumlah: Number(formAnggaran.jumlah) }),
                }).then(ambilJson).then(() => {
                  setJenis("sukses"); setPesan("Anggaran tersimpan."); void muat();
                }).catch((err) => { setJenis("galat"); setPesan(err instanceof Error ? err.message : "Gagal menyimpan"); });
              }} className="mt-4 grid gap-3 sm:grid-cols-3">
                <div><label htmlFor="ag-kategori">Kategori</label><input id="ag-kategori" required maxLength={100} value={formAnggaran.kategori} onChange={(e) => setFormAnggaran({ ...formAnggaran, kategori: e.target.value })} /></div>
                <div><label htmlFor="ag-bulan">Bulan</label><input id="ag-bulan" type="month" required value={formAnggaran.bulan} onChange={(e) => setFormAnggaran({ ...formAnggaran, bulan: e.target.value })} /></div>
                <div><label htmlFor="ag-jumlah">Jumlah</label><input id="ag-jumlah" type="number" min={0} required value={formAnggaran.jumlah} onChange={(e) => setFormAnggaran({ ...formAnggaran, jumlah: e.target.value })} /></div>
                <div className="sm:col-span-3"><Tombol tipe="submit">Simpan anggaran</Tombol></div>
              </form>
              <ul className="mt-4 space-y-2">
                {keuangan.anggaran.map((a) => {
                  const persen = Number(a.jumlah) > 0 ? Math.min(100, Math.round(Number(a.realisasi) / Number(a.jumlah) * 100)) : 0;
                  return (
                    <li key={String(a.id)} className="rounded-xl border border-garis p-3 text-sm">
                      <div className="flex justify-between"><span className="font-semibold">{String(a.kategori)}</span><span className="text-xs text-tinta-lemah">{formatRupiah(Number(a.realisasi))} / {formatRupiah(Number(a.jumlah))}</span></div>
                      <div role="progressbar" aria-valuenow={persen} aria-valuemin={0} aria-valuemax={100}
                        aria-label={`Anggaran ${String(a.kategori)}`}
                        className="mt-2 h-1.5 overflow-hidden rounded-full bg-latar">
                        <div className={`h-full rounded-full ${persen >= 100 ? "bg-bahaya" : "bg-utama"}`} style={{ width: `${persen}%` }} />
                      </div>
                    </li>
                  );
                })}
                {keuangan.anggaran.length === 0 && <li className="text-sm text-tinta-lemah">Belum ada anggaran.</li>}
              </ul>
            </Kartu>

            <Kartu>
              <h2 className="text-lg font-semibold">Hutang supplier</h2>
              <ul className="mt-4 space-y-2">
                {keuangan.hutang.map((h) => (
                  <li key={String(h.id)} className="flex items-center gap-2 rounded-xl border border-garis px-3 py-2 text-sm">
                    <span className="font-semibold">{String(h.supplier ?? "-")}</span>
                    <span className="text-xs text-tinta-lemah">{String(h.nomor)}</span>
                    <span className="ml-auto font-semibold">{formatRupiah(Number(h.total))}</span>
                    <Tombol jenis="sekunder" kelas="min-h-[36px] px-2 text-xs"
                      onClick={() => void fetch("/api/keuangan-lanjutan", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ aksi: "lunas", id: Number(h.id) }),
                      }).then(ambilJson).then(() => { setJenis("sukses"); setPesan("Tagihan lunas."); void muat(); })
                        .catch((err) => { setJenis("galat"); setPesan(err instanceof Error ? err.message : "Gagal melunasi"); })}>Lunas</Tombol>
                  </li>
                ))}
                {keuangan.hutang.length === 0 && <li className="text-sm text-tinta-lemah">Tidak ada hutang supplier.</li>}
              </ul>
              <div className="mt-4 rounded-xl bg-latar p-3 text-xs">
                <p className="font-semibold">Retensi pelanggan</p>
                <p className="mt-1">{keuangan.retensi.kembali} dari {keuangan.retensi.total} pelanggan kembali, {keuangan.retensi.persen} persen.</p>
              </div>
            </Kartu>
          </div>

          <Kartu>
            <h2 className="text-lg font-semibold">Segmentasi pelanggan</h2>
            <ul className="mt-4 space-y-2">
              {keuangan.rfm.slice(0, 30).map((r, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-garis px-3 py-2 text-xs">
                  <span className="font-semibold">{String(r.whatsapp)}</span>
                  <Badge warna={r.segmen === "Loyal" ? "sukses" : r.segmen === "Berisiko pergi" ? "bahaya" : "info"}>{String(r.segmen)}</Badge>
                  <span className="text-tinta-lemah">{Number(r.frekuensi)} pesanan - {formatRupiah(Number(r.omzet))} - terakhir {Number(r.hari)} hari lalu</span>
                </li>
              ))}
              {keuangan.rfm.length === 0 && <li className="text-sm text-tinta-lemah">Belum ada data pelanggan.</li>}
            </ul>
          </Kartu>
        </div>
      )}

      {tab === "Zona kirim" && (
        <Kartu>
          <h2 className="text-lg font-semibold">Zona kirim</h2>
          <p className="mt-1 text-xs text-tinta-lemah">Tarif per zona dipakai otomatis saat pelanggan memilih pesanan dikirim.</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            void fetch("/api/zona-kirim", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ nama: formZona.nama, tarif: Number(formZona.tarif),
                keterangan: formZona.keterangan, aktif: true }),
            }).then(ambilJson).then(() => {
              setJenis("sukses"); setPesan("Zona kirim disimpan.");
              setFormZona({ nama: "", tarif: "0", keterangan: "" }); void muat();
            }).catch((err) => { setJenis("galat"); setPesan(err instanceof Error ? err.message : "Gagal menyimpan zona"); });
          }} className="mt-4 grid gap-3 sm:grid-cols-3">
            <div><label htmlFor="z-nama">Nama zona</label><input id="z-nama" required maxLength={60} value={formZona.nama} onChange={(e) => setFormZona({ ...formZona, nama: e.target.value })} placeholder="Dekat" /></div>
            <div><label htmlFor="z-tarif">Tarif</label><input id="z-tarif" type="number" min={0} required value={formZona.tarif} onChange={(e) => setFormZona({ ...formZona, tarif: e.target.value })} /></div>
            <div><label htmlFor="z-keterangan">Keterangan</label><input id="z-keterangan" maxLength={200} value={formZona.keterangan} onChange={(e) => setFormZona({ ...formZona, keterangan: e.target.value })} /></div>
            <div className="sm:col-span-3"><Tombol tipe="submit">Tambah zona</Tombol></div>
          </form>
          <ul className="mt-4 space-y-2">
            {zona.map((z) => (
              <li key={String(z.id)} className="flex justify-between rounded-xl border border-garis px-3 py-2 text-sm">
                <span className="font-semibold">{String(z.nama)}</span>
                <span>{formatRupiah(Number(z.tarif))}</span>
              </li>
            ))}
            {zona.length === 0 && <li className="text-sm text-tinta-lemah">Belum ada zona kirim.</li>}
          </ul>
        </Kartu>
      )}

      {tab === "Piutang" && (
        <div className="space-y-5">
          <Kartu>
            <h2 className="text-lg font-semibold">Tambah tagihan piutang</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              void kirimOperasional({ aksi: "piutang", ...formPiutang, jumlah: Number(formPiutang.jumlah) }, "Piutang ditambahkan.");
              setFormPiutang({ kode_lacak: "", nama: "", jumlah: "0", jatuh_tempo: tanggalHariIni(), catatan: "" });
            }} className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="pi-kode">Kode lacak</label><input id="pi-kode" required minLength={4} value={formPiutang.kode_lacak} onChange={(e) => setFormPiutang({ ...formPiutang, kode_lacak: e.target.value })} /></div>
              <div><label htmlFor="pi-nama">Nama pelanggan</label><input id="pi-nama" required value={formPiutang.nama} onChange={(e) => setFormPiutang({ ...formPiutang, nama: e.target.value })} /></div>
              <div><label htmlFor="pi-jumlah">Jumlah</label><input id="pi-jumlah" type="number" min={1} required value={formPiutang.jumlah} onChange={(e) => setFormPiutang({ ...formPiutang, jumlah: e.target.value })} /></div>
              <div><label htmlFor="pi-tempo">Jatuh tempo</label><input id="pi-tempo" type="date" required value={formPiutang.jatuh_tempo} onChange={(e) => setFormPiutang({ ...formPiutang, jatuh_tempo: e.target.value })} /></div>
              <div className="sm:col-span-2"><label htmlFor="pi-catatan">Catatan</label><input id="pi-catatan" maxLength={300} value={formPiutang.catatan} onChange={(e) => setFormPiutang({ ...formPiutang, catatan: e.target.value })} /></div>
              <div className="sm:col-span-2"><Tombol tipe="submit">Simpan piutang</Tombol></div>
            </form>
          </Kartu>
          <Kartu>
            <h2 className="text-lg font-semibold">Daftar piutang</h2>
            <ul className="mt-4 space-y-2">
              {operasional.piutang.map((p) => (
                <li key={String(p.id)} className="flex flex-wrap items-center gap-2 rounded-xl border border-garis px-3 py-2 text-sm">
                  <span className="font-semibold">{String(p.nama)}</span>
                  <span className="text-xs text-tinta-lemah">{String(p.kode_lacak)} - tempo {String(p.jatuh_tempo)}</span>
                  <Badge warna={p.status === "lunas" ? "sukses" : "peringatan"}>{String(p.status)}</Badge>
                  <span className="ml-auto text-xs">{formatRupiah(Number(p.dibayar))} / {formatRupiah(Number(p.jumlah))}</span>
                  {p.status !== "lunas" && (
                    <Tombol jenis="sekunder" kelas="min-h-[36px] px-2 text-xs"
                      onClick={() => void kirimOperasional({ aksi: "bayar_piutang", id: Number(p.id),
                        jumlah: Number(p.jumlah) - Number(p.dibayar) }, "Piutang dilunasi.")}>Lunasi</Tombol>
                  )}
                </li>
              ))}
              {operasional.piutang.length === 0 && <li className="text-sm text-tinta-lemah">Belum ada piutang.</li>}
            </ul>
          </Kartu>
        </div>
      )}

      {tab === "Operasional" && (
        <div className="space-y-5">
          <Kartu>
            <h2 className="text-lg font-semibold">Shift staf</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              void kirimOperasional({ aksi: "mulai_shift", ...formShift, kas_awal: Number(formShift.kas_awal) }, "Shift dimulai.");
              setFormShift({ nama: "", kas_awal: "0" });
            }} className="mt-4 grid gap-3 sm:grid-cols-3">
              <div><label htmlFor="sh-nama">Nama shift</label><input id="sh-nama" required value={formShift.nama} onChange={(e) => setFormShift({ ...formShift, nama: e.target.value })} placeholder="Pagi" /></div>
              <div><label htmlFor="sh-kas">Kas awal</label><input id="sh-kas" type="number" min={0} value={formShift.kas_awal} onChange={(e) => setFormShift({ ...formShift, kas_awal: e.target.value })} /></div>
              <div className="flex items-end"><Tombol tipe="submit" kelas="w-full">Mulai shift</Tombol></div>
            </form>
            <ul className="mt-4 space-y-2">
              {operasional.shift.map((s) => (
                <li key={String(s.id)} className="flex flex-wrap items-center gap-2 rounded-xl border border-garis px-3 py-2 text-xs">
                  <span className="font-semibold">{String(s.nama)}</span>
                  <span className="text-tinta-lemah">{String(s.mulai)}</span>
                  {s.selesai ? <Badge warna="sukses">Selesai</Badge> : <Badge warna="peringatan">Berjalan</Badge>}
                  {!s.selesai && (
                    <Tombol jenis="sekunder" kelas="ml-auto min-h-[36px] px-2 text-xs"
                      onClick={() => void kirimOperasional({ aksi: "selesai_shift", id: Number(s.id),
                        kas_akhir: Number(s.kas_awal), catatan: "" }, "Shift selesai.")}>Selesaikan</Tombol>
                  )}
                </li>
              ))}
            </ul>
          </Kartu>
          <Kartu>
            <h2 className="text-lg font-semibold">Catat bahan rusak</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!formStok.bahan_id) { setJenis("galat"); setPesan("Pilih bahan di tab Stok lanjutan."); return; }
              void kirimOperasional({ aksi: "limbah", bahan_id: Number(formStok.bahan_id),
                jumlah: Number(formLimbah.jumlah), alasan: formLimbah.alasan }, "Limbah tercatat.");
              setFormLimbah({ jumlah: "1", alasan: "" });
            }} className="mt-4 grid gap-3 sm:grid-cols-3">
              <div><label htmlFor="lm-jumlah">Jumlah</label><input id="lm-jumlah" type="number" min={0.01} step="any" required value={formLimbah.jumlah} onChange={(e) => setFormLimbah({ ...formLimbah, jumlah: e.target.value })} /></div>
              <div className="sm:col-span-2"><label htmlFor="lm-alasan">Alasan</label><input id="lm-alasan" required maxLength={300} value={formLimbah.alasan} onChange={(e) => setFormLimbah({ ...formLimbah, alasan: e.target.value })} placeholder="Contoh: terbuang saat persiapan" /></div>
              <div className="sm:col-span-3"><Tombol tipe="submit">Catat limbah</Tombol></div>
            </form>
          </Kartu>
        </div>
      )}

      {tab === "Kalkulator" && (
        <Kartu>
          <h2 className="text-lg font-semibold">Kalkulator harga jual</h2>
          <p className="mt-1 text-xs text-tinta-lemah">
            Hitung harga jual dari HPP dan margin yang diinginkan. HPP bisa dilihat di halaman Menu & Resep.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="k-hpp">HPP per porsi</label>
              <input id="k-hpp" type="number" min={0} value={kalkulator.hpp}
                onChange={(e) => setKalkulator({ ...kalkulator, hpp: e.target.value })} />
            </div>
            <div>
              <label htmlFor="k-margin">Margin target persen</label>
              <input id="k-margin" type="number" min={0} max={90} value={kalkulator.margin}
                onChange={(e) => setKalkulator({ ...kalkulator, margin: e.target.value })} />
            </div>
          </div>
          {(() => {
            const hpp = Math.max(0, Number(kalkulator.hpp) || 0);
            const margin = Math.min(90, Math.max(0, Number(kalkulator.margin) || 0));
            const harga = Math.ceil(hpp / (1 - margin / 100));
            return (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-latar p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-tinta-lemah">HPP</p>
                  <p className="mt-1 font-judul text-xl font-semibold">{formatRupiah(hpp)}</p>
                </div>
                <div className="rounded-xl bg-sukses-terang p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-sukses">Laba per porsi</p>
                  <p className="mt-1 font-judul text-xl font-semibold text-sukses">{formatRupiah(harga - hpp)}</p>
                </div>
                <div className="rounded-xl border border-utama/30 bg-utama/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-utama">Harga disarankan</p>
                  <p className="mt-1 font-judul text-xl font-semibold text-utama">{formatRupiah(harga)}</p>
                </div>
              </div>
            );
          })()}
        </Kartu>
      )}

      <Dialog terbuka={dialog} judul="Tambah promo" padaTutup={() => setDialog(false)}>
        <form onSubmit={(e) => void simpanPromo(e)} className="space-y-4">
          <div><label htmlFor="pr-kode">Kode</label><input id="pr-kode" required maxLength={20} value={formPromo.kode} onChange={(e) => setFormPromo({ ...formPromo, kode: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label htmlFor="pr-jenis">Jenis</label><select id="pr-jenis" value={formPromo.jenis} onChange={(e) => setFormPromo({ ...formPromo, jenis: e.target.value })}><option value="nominal">Nominal</option><option value="persen">Persen</option></select></div>
            <div><label htmlFor="pr-nilai">Nilai</label><input id="pr-nilai" type="number" min={1} required value={formPromo.nilai} onChange={(e) => setFormPromo({ ...formPromo, nilai: e.target.value })} /></div>
            <div><label htmlFor="pr-min">Minimum belanja</label><input id="pr-min" type="number" min={0} required value={formPromo.minimum_belanja} onChange={(e) => setFormPromo({ ...formPromo, minimum_belanja: e.target.value })} /></div>
            <div><label htmlFor="pr-kuota">Kuota</label><input id="pr-kuota" type="number" min={1} required value={formPromo.kuota} onChange={(e) => setFormPromo({ ...formPromo, kuota: e.target.value })} /></div>
            <div><label htmlFor="pr-dari">Berlaku dari</label><input id="pr-dari" type="date" required value={formPromo.berlaku_dari} onChange={(e) => setFormPromo({ ...formPromo, berlaku_dari: e.target.value })} /></div>
            <div><label htmlFor="pr-sampai">Berlaku sampai</label><input id="pr-sampai" type="date" required min={formPromo.berlaku_dari} value={formPromo.berlaku_sampai} onChange={(e) => setFormPromo({ ...formPromo, berlaku_sampai: e.target.value })} /></div>
            <div><label htmlFor="pr-jam-mulai">Jam mulai</label><input id="pr-jam-mulai" type="time" value={formPromo.jam_mulai} onChange={(e) => setFormPromo({ ...formPromo, jam_mulai: e.target.value })} /></div>
            <div><label htmlFor="pr-jam-selesai">Jam selesai</label><input id="pr-jam-selesai" type="time" value={formPromo.jam_selesai} onChange={(e) => setFormPromo({ ...formPromo, jam_selesai: e.target.value })} /></div>
          </div>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={formPromo.aktif} onChange={(e) => setFormPromo({ ...formPromo, aktif: e.target.checked })} /> Aktif</label>
          <Tombol tipe="submit" kelas="w-full">Simpan promo</Tombol>
        </form>
      </Dialog>
    </div>
  );
}
