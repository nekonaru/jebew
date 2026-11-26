"use client";

import { useCallback, useEffect, useState } from "react";
import { formatRupiah, tanggalHariIni } from "@/lib/format.ts";
import { ambilJson } from "@/komponen/api-klien.ts";
import { Badge, Dialog, Judul, Kartu, Pesan, Tombol } from "./ui.tsx";

const TAB = ["Promo", "Ulasan", "Jadwal harian", "Target", "Stok lanjutan"] as const;
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
  });
  const [formTarget, setFormTarget] = useState({ tanggal: tanggalHariIni(), target_omzet: "500000", target_transaksi: "20" });
  const [formLibur, setFormLibur] = useState({ tanggal: "", keterangan: "" });
  const [stokLanjutan, setStokLanjutan] = useState<{
    prediksi: Baris[]; harga: Baris[]; purchaseOrder: Baris[];
  }>({ prediksi: [], harga: [], purchaseOrder: [] });
  const [masterBahan, setMasterBahan] = useState<{ id: number; nama: string }[]>([]);
  const [masterSupplier, setMasterSupplier] = useState<{ id: number; nama: string }[]>([]);
  const [formStok, setFormStok] = useState({
    bahan_id: "", jumlah: "1", harga_satuan: "0", supplier_id: "", tanggal: tanggalHariIni(),
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
      } else {
        const [d, bahan, supplier] = await Promise.all([
          fetch("/api/stok-lanjutan").then(ambilJson<{
            prediksi: Baris[]; harga: Baris[]; purchaseOrder: Baris[];
          }>),
          fetch("/api/bahan").then(ambilJson<{ bahan: { id: number; nama: string }[] }>),
          fetch("/api/supplier").then(ambilJson<{ supplier: { id: number; nama: string }[] }>),
        ]);
        setStokLanjutan({ prediksi: d.prediksi ?? [], harga: d.harga ?? [], purchaseOrder: d.purchaseOrder ?? [] });
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
            <h2 className="text-lg font-semibold">Purchase order</h2>
            <ul className="mt-4 space-y-2">
              {stokLanjutan.purchaseOrder.map((p) => (
                <li key={String(p.id)} className="flex flex-wrap items-center gap-2 rounded-xl border border-garis px-3 py-2 text-sm">
                  <span className="font-semibold">{String(p.nomor)}</span>
                  <Badge warna={p.status === "diterima" ? "sukses" : "peringatan"}>{String(p.status)}</Badge>
                  <span className="text-xs text-tinta-lemah">{String(p.supplier ?? "Tanpa supplier")} - {Number(p.jumlah_item)} item - {formatRupiah(Number(p.total))}</span>
                  {p.status !== "diterima" && (
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
          </div>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={formPromo.aktif} onChange={(e) => setFormPromo({ ...formPromo, aktif: e.target.checked })} /> Aktif</label>
          <Tombol tipe="submit" kelas="w-full">Simpan promo</Tombol>
        </form>
      </Dialog>
    </div>
  );
}
