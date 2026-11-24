"use client";

import { useCallback, useEffect, useState } from "react";
import { ambilJson } from "@/komponen/api-klien.ts";
import { Badge, Dialog, Judul, Kartu, Pesan, Tombol } from "./ui.tsx";

type Pengaturan = Record<string, string>;
type Pengguna = { id: number; email: string; nama: string; peran: string; aktif: boolean };
type Slot = { id: number; tanggal: string; jam: string; kuota: number; terisi: number; dipakai: number };

export default function HalamanPengaturan() {
  const [pengaturan, setPengaturan] = useState<Pengaturan>({});
  const [pengguna, setPengguna] = useState<Pengguna[]>([]);
  const [slot, setSlot] = useState<Slot[]>([]);
  const [dialog, setDialog] = useState<"pengguna" | "slot" | null>(null);
  const [pesan, setPesan] = useState("");
  const [jenis, setJenis] = useState<"info" | "sukses" | "galat">("info");
  const [formP, setFormP] = useState({ email: "", nama: "", kata_sandi: "", peran: "kasir", aktif: true });
  const [formS, setFormS] = useState({ tanggal: "", jam: "12:00", kuota: "10" });

  const muat = useCallback(async () => {
    try {
      const [p, u, s] = await Promise.all([
        fetch("/api/pengaturan").then(ambilJson<Pengaturan>),
        fetch("/api/pengguna").then(ambilJson<{ pengguna: Pengguna[] }>),
        fetch("/api/slot").then(ambilJson<{ slot: Slot[] }>),
      ]);
      setPengaturan(p); setPengguna(u.pengguna ?? []); setSlot(s.slot ?? []);
    } catch (e) { setJenis("galat"); setPesan(e instanceof Error ? e.message : "Gagal memuat pengaturan"); }
  }, []);
  useEffect(() => { void muat(); }, [muat]);

  async function simpanUsaha(e: React.FormEvent) {
    e.preventDefault();
    try {
      const respons = await fetch("/api/pengaturan", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pengaturan),
      });
      await ambilJson(respons);
      setJenis("sukses"); setPesan("Pengaturan tersimpan.");
    } catch (err) { setJenis("galat"); setPesan(err instanceof Error ? err.message : "Gagal menyimpan"); }
  }

  async function simpanPengguna(e: React.FormEvent) {
    e.preventDefault();
    try {
      const respons = await fetch("/api/pengguna", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formP),
      });
      await ambilJson(respons);
      setDialog(null); setFormP({ email: "", nama: "", kata_sandi: "", peran: "kasir", aktif: true });
      setJenis("sukses"); setPesan("Pengguna ditambahkan."); void muat();
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

  return (
    <div>
      <Judul anak="Pengaturan" sub="Identitas usaha, jam operasional, pengguna, dan slot pre-order." />
      <Pesan teks={pesan} jenis={jenis} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Kartu>
          <h2 className="mb-4 text-lg font-semibold">Identitas usaha</h2>
          <form onSubmit={simpanUsaha} className="space-y-4">
            <div><label htmlFor="s-nama">Nama usaha</label><input id="s-nama" value={pengaturan.nama_usaha ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, nama_usaha: e.target.value })} /></div>
            <div><label htmlFor="s-tagline">Tagline</label><input id="s-tagline" value={pengaturan.tagline ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, tagline: e.target.value })} /></div>
            <div><label htmlFor="s-wa">WhatsApp admin</label><input id="s-wa" value={pengaturan.whatsapp_admin ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, whatsapp_admin: e.target.value })} /></div>
            <div>
              <label htmlFor="s-hari">Hari buka</label>
              <input id="s-hari" value={pengaturan.hari_buka ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, hari_buka: e.target.value })} placeholder="Senin - Minggu" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label htmlFor="s-buka">Jam buka</label><input id="s-buka" value={pengaturan.jam_buka ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, jam_buka: e.target.value })} /></div>
              <div><label htmlFor="s-tutup">Jam tutup</label><input id="s-tutup" value={pengaturan.jam_tutup ?? ""} onChange={(e) => setPengaturan({ ...pengaturan, jam_tutup: e.target.value })} /></div>
            </div>
            <div><label htmlFor="s-aktif">Status toko</label><select id="s-aktif" value={pengaturan.toko_aktif ?? "true"} onChange={(e) => setPengaturan({ ...pengaturan, toko_aktif: e.target.value })}><option value="true">Buka</option><option value="false">Tutup</option></select></div>
            <Tombol tipe="submit">Simpan pengaturan</Tombol>
          </form>
        </Kartu>

        <div className="space-y-5">
          <Kartu>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Pengguna</h2>
              <Tombol onClick={() => setDialog("pengguna")} kelas="min-h-[38px] px-3 text-xs">Tambah</Tombol>
            </div>
            <ul className="mt-4 space-y-2">
              {pengguna.map((u) => (
                <li key={u.id} className="flex items-center gap-3 rounded-xl border border-garis p-3 text-sm">
                  <div className="min-w-0 flex-1"><p className="font-medium">{u.nama}</p><p className="truncate text-xs text-tinta-lemah">{u.email}</p></div>
                  <Badge warna={u.peran === "pemilik" ? "peringatan" : "info"}>{u.peran}</Badge>
                  <Badge warna={u.aktif ? "sukses" : "bahaya"}>{u.aktif ? "Aktif" : "Nonaktif"}</Badge>
                </li>
              ))}
            </ul>
          </Kartu>

          <Kartu>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Slot pre-order</h2>
              <Tombol onClick={() => setDialog("slot")} kelas="min-h-[38px] px-3 text-xs">Tambah slot</Tombol>
            </div>
            <ul className="mt-4 space-y-2">
              {slot.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-xl border border-garis p-3 text-sm">
                  <span>{s.tanggal} - {s.jam}</span>
                  <Badge warna={s.dipakai >= s.kuota ? "bahaya" : "sukses"}>{s.dipakai}/{s.kuota}</Badge>
                </li>
              ))}
              {slot.length === 0 && <li className="text-sm text-tinta-lemah">Belum ada slot. Tambahkan kuota waktu ambil.</li>}
            </ul>
          </Kartu>
        </div>
      </div>

      <Dialog terbuka={dialog === "pengguna"} judul="Tambah pengguna" padaTutup={() => setDialog(null)}>
        <form onSubmit={simpanPengguna} className="space-y-4">
          <div><label htmlFor="u-nama">Nama</label><input id="u-nama" required value={formP.nama} onChange={(e) => setFormP({ ...formP, nama: e.target.value })} /></div>
          <div><label htmlFor="u-email">Email</label><input id="u-email" type="email" required value={formP.email} onChange={(e) => setFormP({ ...formP, email: e.target.value })} /></div>
          <div><label htmlFor="u-sandi">Kata sandi</label><input id="u-sandi" type="password" minLength={6} required value={formP.kata_sandi} onChange={(e) => setFormP({ ...formP, kata_sandi: e.target.value })} /></div>
          <div><label htmlFor="u-peran">Peran</label><select id="u-peran" value={formP.peran} onChange={(e) => setFormP({ ...formP, peran: e.target.value })}><option value="kasir">Kasir</option><option value="pemilik">Pemilik</option></select></div>
          <Tombol tipe="submit" kelas="w-full">Simpan pengguna</Tombol>
        </form>
      </Dialog>

      <Dialog terbuka={dialog === "slot"} judul="Tambah slot waktu" padaTutup={() => setDialog(null)}>
        <form onSubmit={simpanSlot} className="space-y-4">
          <div><label htmlFor="sl-tanggal">Tanggal</label><input id="sl-tanggal" type="date" required value={formS.tanggal} onChange={(e) => setFormS({ ...formS, tanggal: e.target.value })} /></div>
          <div><label htmlFor="sl-jam">Jam</label><input id="sl-jam" required value={formS.jam} onChange={(e) => setFormS({ ...formS, jam: e.target.value })} /></div>
          <div><label htmlFor="sl-kuota">Kuota</label><input id="sl-kuota" type="number" min={1} required value={formS.kuota} onChange={(e) => setFormS({ ...formS, kuota: e.target.value })} /></div>
          <Tombol tipe="submit" kelas="w-full">Simpan slot</Tombol>
        </form>
      </Dialog>
    </div>
  );
}
