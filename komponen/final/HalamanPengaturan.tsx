"use client";

import { useCallback, useEffect, useState } from "react";
import { ambilJson } from "@/komponen/api-klien.ts";
import { tanggalHariIni } from "@/lib/format.ts";
import { Badge, Dialog, Judul, Kartu, Pesan, Tombol } from "./ui.tsx";

type Pengaturan = Record<string, string>;
type Pengguna = { id: number; email: string; nama: string; peran: string; aktif: boolean };
type Slot = { id: number; tanggal: string; jam: string; kuota: number; terisi: number; dipakai: number };
const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function tambahHari(teks: string, jumlah: number): string {
  const t = new Date(`${teks}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + jumlah);
  return t.toISOString().slice(0, 10);
}

function menitJam(teks: string): number {
  return Number(teks.slice(0, 2)) * 60 + Number(teks.slice(3, 5));
}

export default function HalamanPengaturan() {
  const [pengaturan, setPengaturan] = useState<Pengaturan>({});
  const [pengguna, setPengguna] = useState<Pengguna[]>([]);
  const [slot, setSlot] = useState<Slot[]>([]);
  const [dialog, setDialog] = useState<"pengguna" | "slot" | "massal" | null>(null);
  const [pesan, setPesan] = useState("");
  const [jenis, setJenis] = useState<"info" | "sukses" | "galat">("info");
  const [formP, setFormP] = useState({ email: "", nama: "", kata_sandi: "", peran: "kasir", aktif: true });
  const [formS, setFormS] = useState({ tanggal: "", jam: "12:00", kuota: "10" });
  const [formM, setFormM] = useState({ dari: tanggalHariIni(), sampai: "", jam_mulai: "10:00", jam_selesai: "21:00", interval: "60", kuota: "10" });
  const [hariM, setHariM] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [hapusSlotId, setHapusSlotId] = useState<number | null>(null);
  const [cadangan, setCadangan] = useState<Record<string, unknown[]> | null>(null);
  const [konfirmasi, setKonfirmasi] = useState("");
  const [memulihkan, setMemulihkan] = useState(false);
  const [tampilSandi, setTampilSandi] = useState(false);
  const [editPengguna, setEditPengguna] = useState<number | null>(null);

  const muat = useCallback(async () => {
    try {
      const [p, u, s] = await Promise.all([
        fetch("/api/pengaturan").then(ambilJson<Pengaturan>),
        fetch("/api/pengguna").then(ambilJson<{ pengguna: Pengguna[] }>),
        fetch("/api/slot").then(ambilJson<{ slot: Slot[] }>),
      ]);
      setPengaturan({
        preorder_aktif: "true",
        preorder_jam_buka: p.jam_buka ?? "10:00",
        preorder_jam_tutup: p.jam_tutup ?? "21:00",
        ...p,
      });
      setPengguna(u.pengguna ?? []); setSlot(s.slot ?? []);
    } catch (e) { setJenis("galat"); setPesan(e instanceof Error ? e.message : "Gagal memuat pengaturan"); }
  }, []);
  useEffect(() => { void muat(); }, [muat]);

  async function simpanUsaha(e: React.FormEvent) {
    e.preventDefault();
    try {
      const respons = await fetch("/api/pengaturan", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_usaha: pengaturan.nama_usaha ?? "",
          tagline: pengaturan.tagline ?? "",
          whatsapp_admin: pengaturan.whatsapp_admin ?? "",
          hari_buka: pengaturan.hari_buka ?? "",
          jam_buka: pengaturan.jam_buka ?? "",
          jam_tutup: pengaturan.jam_tutup ?? "",
          toko_aktif: pengaturan.toko_aktif ?? "true",
          preorder_aktif: pengaturan.preorder_aktif ?? "true",
          preorder_jam_buka: pengaturan.preorder_jam_buka ?? "10:00",
          preorder_jam_tutup: pengaturan.preorder_jam_tutup ?? "21:00",
          alamat_usaha: pengaturan.alamat_usaha ?? "",
          peta_usaha: pengaturan.peta_usaha ?? "",
          deskripsi_usaha: pengaturan.deskripsi_usaha ?? "",
          email_usaha: pengaturan.email_usaha ?? "",
          instagram_usaha: pengaturan.instagram_usaha ?? "",
          logo_url: pengaturan.logo_url ?? "",
          pemeliharaan: pengaturan.pemeliharaan ?? "false",
          banner_judul: pengaturan.banner_judul ?? "",
          banner_isi: pengaturan.banner_isi ?? "",
          banner_tautan: pengaturan.banner_tautan ?? "",
          minimum_preorder: pengaturan.minimum_preorder ?? "0",
          biaya_kirim: pengaturan.biaya_kirim ?? "0",
          bundling_aktif: pengaturan.bundling_aktif ?? "false",
          bundling_min: pengaturan.bundling_min ?? "3",
          bundling_diskon: pengaturan.bundling_diskon ?? "5",
          batal_batas_menit: pengaturan.batal_batas_menit ?? "120",
          qris_gambar: pengaturan.qris_gambar ?? "",
          qris_teks: pengaturan.qris_teks ?? "",
        }),
      });
      await ambilJson(respons);
      setJenis("sukses"); setPesan("Pengaturan tersimpan.");
    } catch (err) { setJenis("galat"); setPesan(err instanceof Error ? err.message : "Gagal menyimpan"); }
  }

  function bukaPengguna(u?: Pengguna) {
    setEditPengguna(u?.id ?? null);
    setFormP({
      email: u?.email ?? "", nama: u?.nama ?? "", kata_sandi: "",
      peran: (u?.peran as "pemilik" | "kasir") ?? "kasir", aktif: u?.aktif ?? true,
    });
    setTampilSandi(false);
    setDialog("pengguna");
  }

  async function simpanPengguna(e: React.FormEvent) {
    e.preventDefault();
    try {
      const badan = editPengguna ? { id: editPengguna, data: formP } : formP;
      const respons = await fetch("/api/pengguna", {
        method: editPengguna ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(badan),
      });
      await ambilJson(respons);
      setDialog(null); setFormP({ email: "", nama: "", kata_sandi: "", peran: "kasir", aktif: true });
      setTampilSandi(false); setEditPengguna(null);
      setJenis("sukses"); setPesan(editPengguna ? "Pengguna diperbarui." : "Pengguna ditambahkan."); void muat();
    } catch (err) { setJenis("galat"); setPesan(err instanceof Error ? err.message : "Gagal menyimpan"); }
  }

  async function simpanSlot(e: React.FormEvent) {
    e.preventDefault();
    try {
      const respons = await fetch("/api/slot", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formS, kuota: Number(formS.kuota) }),
      });
      await ambilJson(respons);
      setDialog(null); setJenis("sukses"); setPesan("Slot waktu tersimpan."); void muat();
    } catch (err) { setJenis("galat"); setPesan(err instanceof Error ? err.message : "Gagal menyimpan"); }
  }

  const perkiraanSlot = (() => {
    if (!formM.dari || !formM.sampai || formM.sampai < formM.dari) return 0;
    const mulai = menitJam(formM.jam_mulai);
    const selesai = menitJam(formM.jam_selesai);
    const interval = Number(formM.interval);
    if (!interval || mulai >= selesai) return 0;
    let jumlah = 0;
    for (let t = formM.dari; t <= formM.sampai; t = tambahHari(t, 1)) {
      if (hariM.includes(new Date(`${t}T00:00:00Z`).getUTCDay())) {
        jumlah += Math.ceil((selesai - mulai) / interval);
      }
    }
    return jumlah;
  })();

  async function simpanMassal(e: React.FormEvent) {
    e.preventDefault();
    try {
      const respons = await fetch("/api/slot/massal", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formM, interval: Number(formM.interval), kuota: Number(formM.kuota), hari: hariM }),
      });
      const hasil = await ambilJson<{ dibuat: number }>(respons);
      setDialog(null); setJenis("sukses"); setPesan(`${hasil.dibuat} slot berhasil dibuat.`); void muat();
    } catch (err) { setJenis("galat"); setPesan(err instanceof Error ? err.message : "Gagal membuat slot"); }
  }

  async function hapusSlot() {
    if (hapusSlotId === null) return;
    try {
      const respons = await fetch(`/api/slot/${hapusSlotId}`, { method: "DELETE" });
      await ambilJson(respons);
      setJenis("sukses"); setPesan("Slot dihapus."); setHapusSlotId(null); void muat();
    } catch (err) { setJenis("galat"); setPesan(err instanceof Error ? err.message : "Gagal menghapus slot"); }
  }

  async function pilihBerkas(e: React.ChangeEvent<HTMLInputElement>) {
    const berkas = e.target.files?.[0];
    setCadangan(null); setKonfirmasi("");
    if (!berkas) return;
    if (berkas.size > 4 * 1024 * 1024) {
      setJenis("galat"); setPesan("Berkas terlalu besar. Maksimal 4 MB.");
      return;
    }
    try {
      const isi = JSON.parse(await berkas.text()) as {
        aplikasi?: string; versi?: string; data?: Record<string, unknown[]>;
      };
      if (isi.aplikasi !== "Jebew" || !isi.data || typeof isi.data !== "object"
        || Object.values(isi.data).some((isiTabel) => !Array.isArray(isiTabel))) {
        throw new Error("Berkas bukan cadangan Jebew yang valid");
      }
      setCadangan(isi.data);
      setJenis("info"); setPesan("Berkas terbaca. Periksa jumlah baris sebelum memulihkan.");
    } catch (err) {
      setJenis("galat"); setPesan(err instanceof Error ? err.message : "Berkas tidak valid");
    }
  }

  async function pulihkan() {
    if (!cadangan) return;
    if (konfirmasi !== "PULIHKAN") {
      setJenis("galat"); setPesan("Ketik PULIHKAN untuk mengonfirmasi."); return;
    }
    setMemulihkan(true);
    try {
      const respons = await fetch("/api/pulihkan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aplikasi: "Jebew", konfirmasi, data: cadangan }),
      });
      const hasil = await ambilJson<{ jumlahBaris?: number }>(respons);
      setJenis("sukses"); setPesan(`Data berhasil dipulihkan (${hasil.jumlahBaris ?? 0} baris).`);
      setCadangan(null); setKonfirmasi("");
      void muat();
    } catch (err) {
      setJenis("galat"); setPesan(err instanceof Error ? err.message : "Gagal memulihkan data");
    } finally { setMemulihkan(false); }
  }

  return (
    <div>
      <Judul anak="Pengaturan" sub="Identitas usaha, jam operasional, pengguna, dan slot pre-order." />
      <Pesan teks={pesan} jenis={jenis} />

      <Kartu kelas="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Cadangan data</h2>
            <p className="mt-1 text-sm text-tinta-lemah">
              Unduh salinan seluruh data usaha dalam berkas JSON. Kata sandi pengguna tidak disertakan.
            </p>
          </div>
          <a href="/api/ekspor"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-utama px-4 text-sm font-semibold text-white transition-colors duration-[var(--gerak-cepat)] hover:bg-utama-gelap">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v3h16v-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Unduh cadangan
          </a>
        </div>
        <p className="mt-3 text-xs text-tinta-lemah">
          Setiap tabel dibatasi 10.000 baris agar berkas tetap bisa dipulihkan.
        </p>
        <div className="mt-5 border-t border-garis pt-5">
          <h3 className="text-sm font-semibold">Pulihkan dari cadangan</h3>
          <p className="mt-1 text-xs text-tinta-lemah">
            Mengganti seluruh data usaha dengan isi berkas. Akun pengguna tidak diubah. Tindakan ini tidak bisa dibatalkan.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <label htmlFor="berkas-cadangan">Berkas JSON</label>
              <input id="berkas-cadangan" type="file" accept="application/json,.json" onChange={(e) => void pilihBerkas(e)} />
            </div>
            <div className="min-w-[180px]">
              <label htmlFor="konfirmasi-pulihkan">Ketik PULIHKAN</label>
              <input id="konfirmasi-pulihkan" value={konfirmasi} onChange={(e) => setKonfirmasi(e.target.value)} placeholder="PULIHKAN" />
            </div>
            <Tombol onClick={() => void pulihkan()} nonaktif={!cadangan || konfirmasi !== "PULIHKAN" || memulihkan}>
              {memulihkan ? "Memulihkan..." : "Pulihkan data"}
            </Tombol>
          </div>
          {cadangan && (
            <p className="mt-3 text-xs text-tinta-lemah" role="status">
              {Object.keys(cadangan).filter((k) => k !== "pengguna" && k !== "pembatasan_laju").length} tabel, {" "}
              {Object.entries(cadangan)
                .filter(([k]) => k !== "pengguna" && k !== "pembatasan_laju")
                .reduce((n, [, b]) => n + (Array.isArray(b) ? b.length : 0), 0)} baris siap dipulihkan.
            </p>
          )}
        </div>
      </Kartu>

      <div className="grid gap-5 lg:grid-cols-2">
        <Kartu>
          <h2 className="mb-4 text-lg font-semibold">Identitas usaha</h2>
          <form onSubmit={simpanUsaha} className="space-y-4">
            <div><label htmlFor="s-nama">Nama usaha</label><input id="s-nama" value={pengaturan.nama_usaha ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, nama_usaha: e.target.value })} /></div>
            <div><label htmlFor="s-tagline">Tagline</label><input id="s-tagline" value={pengaturan.tagline ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, tagline: e.target.value })} /></div>
            <div><label htmlFor="s-wa">WhatsApp admin</label><input id="s-wa" value={pengaturan.whatsapp_admin ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, whatsapp_admin: e.target.value })} /></div>
            <fieldset className="rounded-xl border border-garis p-4">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-tinta-lemah">Profil dan banner website</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label htmlFor="s-alamat">Alamat</label><input id="s-alamat" value={pengaturan.alamat_usaha ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, alamat_usaha: e.target.value })} /></div>
                <div><label htmlFor="s-peta">Tautan peta</label><input id="s-peta" value={pengaturan.peta_usaha ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, peta_usaha: e.target.value })} placeholder="https://maps..." /></div>
                <div><label htmlFor="s-email">Email</label><input id="s-email" type="email" value={pengaturan.email_usaha ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, email_usaha: e.target.value })} /></div>
                <div><label htmlFor="s-instagram">Instagram</label><input id="s-instagram" value={pengaturan.instagram_usaha ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, instagram_usaha: e.target.value })} /></div>
                <div className="sm:col-span-2"><label htmlFor="s-logo">URL logo</label><input id="s-logo" value={pengaturan.logo_url ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, logo_url: e.target.value })} placeholder="https://... atau /assets/logo.svg" /></div>
                <div><label htmlFor="s-minimum">Minimum preorder</label><input id="s-minimum" type="number" min={0} value={pengaturan.minimum_preorder ?? "0"} onChange={(e) => setPengaturan({ ...pengaturan, minimum_preorder: e.target.value })} /></div>
                <div><label htmlFor="s-ongkir">Biaya kirim</label><input id="s-ongkir" type="number" min={0} value={pengaturan.biaya_kirim ?? "0"} onChange={(e) => setPengaturan({ ...pengaturan, biaya_kirim: e.target.value })} /></div>
                <div><label htmlFor="s-batal">Batas batal otomatis, menit</label><input id="s-batal" type="number" min={0} value={pengaturan.batal_batas_menit ?? "120"} onChange={(e) => setPengaturan({ ...pengaturan, batal_batas_menit: e.target.value })} /></div>
                <div><label htmlFor="s-bundling-min">Minimum porsi bundling</label><input id="s-bundling-min" type="number" min={2} value={pengaturan.bundling_min ?? "3"} onChange={(e) => setPengaturan({ ...pengaturan, bundling_min: e.target.value })} /></div>
                <div><label htmlFor="s-bundling-diskon">Diskon bundling persen</label><input id="s-bundling-diskon" type="number" min={0} max={100} value={pengaturan.bundling_diskon ?? "5"} onChange={(e) => setPengaturan({ ...pengaturan, bundling_diskon: e.target.value })} /></div>
                <div className="sm:col-span-2"><label htmlFor="s-qris-teks">Informasi QRIS atau rekening</label><input id="s-qris-teks" maxLength={300} value={pengaturan.qris_teks ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, qris_teks: e.target.value })} /></div>
                <div className="sm:col-span-2"><label htmlFor="s-qris-gambar">URL gambar QRIS</label><input id="s-qris-gambar" maxLength={500} value={pengaturan.qris_gambar ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, qris_gambar: e.target.value })} placeholder="https://... atau /assets/qris.png" /></div>
                <div className="sm:col-span-2"><label className="flex items-center gap-2 text-xs text-tinta-lemah">
                  <input type="checkbox" checked={pengaturan.bundling_aktif === "true"}
                    onChange={(e) => setPengaturan({ ...pengaturan, bundling_aktif: e.target.checked ? "true" : "false" })} />
                  Aktifkan diskon bundling otomatis
                </label></div>
                <div className="sm:col-span-2"><label htmlFor="s-deskripsi">Deskripsi singkat</label><textarea id="s-deskripsi" rows={2} maxLength={1000} value={pengaturan.deskripsi_usaha ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, deskripsi_usaha: e.target.value })} /></div>
                <div><label htmlFor="s-banner-judul">Judul banner</label><input id="s-banner-judul" value={pengaturan.banner_judul ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, banner_judul: e.target.value })} /></div>
                <div><label htmlFor="s-banner-tautan">Tautan banner</label><input id="s-banner-tautan" value={pengaturan.banner_tautan ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, banner_tautan: e.target.value })} /></div>
                <div className="sm:col-span-2"><label htmlFor="s-banner-isi">Isi banner</label><input id="s-banner-isi" maxLength={300} value={pengaturan.banner_isi ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, banner_isi: e.target.value })} /></div>
              </div>
              <label className="mt-3 flex items-center gap-2 text-xs text-tinta-lemah">
                <input type="checkbox" checked={pengaturan.pemeliharaan === "true"}
                  onChange={(e) => setPengaturan({ ...pengaturan, pemeliharaan: e.target.checked ? "true" : "false" })} />
                Mode pemeliharaan, sembunyikan website konsumen sementara
              </label>
            </fieldset>
            <div>
              <label htmlFor="s-hari">Hari buka</label>
              <input id="s-hari" value={pengaturan.hari_buka ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, hari_buka: e.target.value })} placeholder="Senin - Minggu" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label htmlFor="s-buka">Jam buka</label><input id="s-buka" type="time" value={pengaturan.jam_buka ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, jam_buka: e.target.value })} /></div>
              <div><label htmlFor="s-tutup">Jam tutup</label><input id="s-tutup" type="time" value={pengaturan.jam_tutup ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, jam_tutup: e.target.value })} /></div>
            </div>
            <div><label htmlFor="s-aktif">Status toko</label><select id="s-aktif" value={pengaturan.toko_aktif ?? "true"} onChange={(e) => setPengaturan({ ...pengaturan, toko_aktif: e.target.value })}><option value="true">Buka</option><option value="false">Tutup</option></select></div>

            <fieldset className="rounded-xl border border-garis p-4">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-tinta-lemah">Jadwal pre-order</legend>
              <p className="mb-3 text-[11px] leading-relaxed text-tinta-lemah">Jadwal pre-order bisa berbeda dari jam toko. Terima pesanan hanya pada jam ini.</p>
              <div className="grid grid-cols-2 gap-4">
                <div><label htmlFor="s-po-buka">Pre-order buka</label><input id="s-po-buka" type="time" value={pengaturan.preorder_jam_buka ?? "10:00"} onChange={(e) => setPengaturan({ ...pengaturan, preorder_jam_buka: e.target.value })} /></div>
                <div><label htmlFor="s-po-tutup">Pre-order tutup</label><input id="s-po-tutup" type="time" value={pengaturan.preorder_jam_tutup ?? "21:00"} onChange={(e) => setPengaturan({ ...pengaturan, preorder_jam_tutup: e.target.value })} /></div>
              </div>
              <div className="mt-4">
                <label htmlFor="s-po-aktif">Siap menerima pre-order</label>
                <select id="s-po-aktif" value={pengaturan.preorder_aktif ?? "true"} onChange={(e) => setPengaturan({ ...pengaturan, preorder_aktif: e.target.value })}>
                  <option value="true">Siap, terima pesanan</option>
                  <option value="false">Belum siap, tutup pre-order</option>
                </select>
              </div>
            </fieldset>
            <Tombol tipe="submit">Simpan pengaturan</Tombol>
          </form>
        </Kartu>

        <div className="space-y-5">
          <Kartu>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Pengguna</h2>
              <Tombol onClick={() => bukaPengguna()} kelas="min-h-[38px] px-3 text-xs">Tambah</Tombol>
            </div>
            <ul className="mt-4 space-y-2">
              {pengguna.map((u) => (
                <li key={u.id} className="flex items-center gap-3 rounded-xl border border-garis p-3 text-sm">
                  <div className="min-w-0 flex-1"><p className="font-medium">{u.nama}</p><p className="truncate text-xs text-tinta-lemah">{u.email}</p></div>
                  <Badge warna={u.peran === "pemilik" ? "peringatan" : "info"}>{u.peran}</Badge>
                  <Badge warna={u.aktif ? "sukses" : "bahaya"}>{u.aktif ? "Aktif" : "Nonaktif"}</Badge>
                  <Tombol jenis="kosong" kelas="min-h-[36px] px-2 text-xs" onClick={() => bukaPengguna(u)}>Ubah</Tombol>
                </li>
              ))}
            </ul>
          </Kartu>

          <Kartu>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Slot pre-order</h2>
              <div className="flex gap-2">
                <Tombol onClick={() => setDialog("massal")} kelas="min-h-[38px] px-3 text-xs" jenis="sekunder">Buat massal</Tombol>
                <Tombol onClick={() => setDialog("slot")} kelas="min-h-[38px] px-3 text-xs">Tambah slot</Tombol>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {slot.map((s) => {
                const persen = s.kuota > 0 ? Math.min(100, Math.round((s.dipakai / s.kuota) * 100)) : 0;
                return (
                  <li key={s.id} className="rounded-xl border border-garis p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span>{s.tanggal} - {s.jam} WIB</span>
                      <div className="flex items-center gap-2">
                        <Badge warna={s.dipakai >= s.kuota ? "bahaya" : "sukses"}>{s.dipakai}/{s.kuota}</Badge>
                        <Tombol onClick={() => setHapusSlotId(s.id)} jenis="hapus" kelas="min-h-[32px] px-2 text-xs"
                          nama={`hapus-slot-${s.id}`}>Hapus</Tombol>
                      </div>
                    </div>
                    <div role="progressbar" aria-valuenow={persen} aria-valuemin={0} aria-valuemax={100}
                      aria-label={`Kuota terpakai ${s.tanggal} ${s.jam}`}
                      className="mt-2 h-1.5 overflow-hidden rounded-full bg-latar">
                      <div className="h-full rounded-full bg-utama" style={{ width: `${persen}%` }} />
                    </div>
                  </li>
                );
              })}
              {slot.length === 0 && <li className="text-sm text-tinta-lemah">Belum ada slot. Tambahkan kuota waktu ambil.</li>}
            </ul>
          </Kartu>
        </div>
      </div>

      <Dialog terbuka={dialog === "pengguna"} judul={editPengguna ? "Ubah pengguna" : "Tambah pengguna"} padaTutup={() => { setDialog(null); setEditPengguna(null); }}>
        <form onSubmit={simpanPengguna} className="space-y-4">
          <div><label htmlFor="u-nama">Nama</label><input id="u-nama" required value={formP.nama} onChange={(e) => setFormP({ ...formP, nama: e.target.value })} /></div>
          <div><label htmlFor="u-email">Email</label><input id="u-email" type="email" required value={formP.email} onChange={(e) => setFormP({ ...formP, email: e.target.value })} /></div>
          <div>
            <label htmlFor="u-sandi">Kata sandi {editPengguna && <span className="text-tinta-lemah">(kosongkan bila tidak diubah)</span>}</label>
            <div className="relative">
              <input id="u-sandi" type={tampilSandi ? "text" : "password"} minLength={8} required={!editPengguna} className="pr-12"
                value={formP.kata_sandi} onChange={(e) => setFormP({ ...formP, kata_sandi: e.target.value })} />
              <button type="button"
                onClick={() => setTampilSandi((nilai) => !nilai)}
                aria-label={tampilSandi ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-tinta-lemah transition-colors duration-[var(--gerak-cepat)] hover:text-utama focus-visible:outline-2 focus-visible:outline-aksen">
                {tampilSandi ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A10.6 10.6 0 0112 5c5 0 9 4.5 10 7-.4 1-1.2 2.4-2.4 3.6M6.3 6.3C4.5 7.5 3.1 9 2.5 10c1 2.5 5 7 9.5 7 1.2 0 2.3-.2 3.3-.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
                )}
              </button>
            </div>
          </div>
          <div><label htmlFor="u-peran">Peran</label><select id="u-peran" value={formP.peran} onChange={(e) => setFormP({ ...formP, peran: e.target.value })}><option value="kasir">Kasir</option><option value="dapur">Dapur</option><option value="pemilik">Pemilik</option></select></div>
          <div><label htmlFor="u-aktif">Status</label><select id="u-aktif" value={formP.aktif ? "aktif" : "nonaktif"} onChange={(e) => setFormP({ ...formP, aktif: e.target.value === "aktif" })}><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option></select></div>
          <Tombol tipe="submit" kelas="w-full">Simpan pengguna</Tombol>
        </form>
      </Dialog>

      <Dialog terbuka={dialog === "slot"} judul="Tambah slot waktu" padaTutup={() => setDialog(null)}>
        <form onSubmit={simpanSlot} className="space-y-4">
          <div><label htmlFor="sl-tanggal">Tanggal</label><input id="sl-tanggal" type="date" required min={tanggalHariIni()} value={formS.tanggal} onChange={(e) => setFormS({ ...formS, tanggal: e.target.value })} /></div>
          <div><label htmlFor="sl-jam">Jam</label><input id="sl-jam" type="time" required value={formS.jam} onChange={(e) => setFormS({ ...formS, jam: e.target.value })} /></div>
          <div><label htmlFor="sl-kuota">Kuota</label><input id="sl-kuota" type="number" min={1} required value={formS.kuota} onChange={(e) => setFormS({ ...formS, kuota: e.target.value })} /></div>
          <Tombol tipe="submit" kelas="w-full">Simpan slot</Tombol>
        </form>
      </Dialog>

      <Dialog terbuka={dialog === "massal"} judul="Buat slot massal" padaTutup={() => setDialog(null)}>
        <form onSubmit={simpanMassal} className="space-y-4">
          <p className="text-xs leading-relaxed text-tinta-lemah">
            Buat banyak slot sekaligus untuk rentang tanggal dan jam tertentu. Slot yang sudah ada kuotanya akan diperbarui.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div><label htmlFor="m-dari">Dari tanggal</label><input id="m-dari" type="date" required min={tanggalHariIni()} value={formM.dari} onChange={(e) => setFormM({ ...formM, dari: e.target.value })} /></div>
            <div><label htmlFor="m-sampai">Sampai tanggal</label><input id="m-sampai" type="date" required min={formM.dari} max={tambahHari(formM.dari, 31)} value={formM.sampai} onChange={(e) => setFormM({ ...formM, sampai: e.target.value })} /></div>
            <div><label htmlFor="m-mulai">Jam mulai</label><input id="m-mulai" type="time" required value={formM.jam_mulai} onChange={(e) => setFormM({ ...formM, jam_mulai: e.target.value })} /></div>
            <div><label htmlFor="m-selesai">Jam selesai</label><input id="m-selesai" type="time" required value={formM.jam_selesai} onChange={(e) => setFormM({ ...formM, jam_selesai: e.target.value })} /></div>
            <div>
              <label htmlFor="m-interval">Interval</label>
              <select id="m-interval" value={formM.interval} onChange={(e) => setFormM({ ...formM, interval: e.target.value })}>
                {[30, 60, 90, 120].map((n) => <option key={n} value={n}>{n} menit</option>)}
              </select>
            </div>
            <div><label htmlFor="m-kuota">Kuota per slot</label><input id="m-kuota" type="number" min={1} max={1000} required value={formM.kuota} onChange={(e) => setFormM({ ...formM, kuota: e.target.value })} /></div>
          </div>
          <fieldset className="rounded-xl border border-garis p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-tinta-lemah">Hari dibuat</legend>
            <div className="flex flex-wrap gap-2">
              {HARI.map((nama, indeks) => (
                <label key={nama} className="flex items-center gap-1.5 rounded-lg border border-garis px-2 py-1.5 text-xs">
                  <input type="checkbox" checked={hariM.includes(indeks)}
                    aria-label={`Hari ${nama}`}
                    onChange={() => setHariM((d) => d.includes(indeks) ? d.filter((h) => h !== indeks) : [...d, indeks])} />
                  {nama}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="text-xs font-semibold text-utama">Perkiraan {perkiraanSlot} slot. Maksimal 150 slot per pembuatan.</p>
          <Tombol tipe="submit" kelas="w-full" nonaktif={perkiraanSlot === 0 || perkiraanSlot > 150}>Buat {perkiraanSlot} slot</Tombol>
        </form>
      </Dialog>

      <Dialog terbuka={hapusSlotId !== null} judul="Hapus slot" padaTutup={() => setHapusSlotId(null)}>
        <p className="text-sm text-tinta-lemah">Slot yang sudah dipakai pesanan aktif tidak bisa dihapus.</p>
        <div className="mt-5 flex gap-3">
          <Tombol onClick={() => setHapusSlotId(null)} jenis="sekunder" kelas="flex-1">Batal</Tombol>
          <Tombol onClick={() => void hapusSlot()} jenis="hapus" kelas="flex-1">Hapus slot</Tombol>
        </div>
      </Dialog>
    </div>
  );
}
