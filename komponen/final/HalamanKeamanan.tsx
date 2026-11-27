"use client";

import { useCallback, useEffect, useState } from "react";
import { ambilJson } from "@/komponen/api-klien.ts";
import { Badge, Kartu, Judul, Pesan, Tombol } from "./ui.tsx";

type Sesi = { id: string; dibuat_pada: string; terakhir_pakai: string; berlaku_hingga: string };

/** Pengelolaan keamanan akun: 2FA dan sesi aktif. */
export default function HalamanKeamanan() {
  const [aktif, setAktif] = useState(false);
  const [rahasia, setRahasia] = useState("");
  const [tautan, setTautan] = useState("");
  const [kode, setKode] = useState("");
  const [sesi, setSesi] = useState<Sesi[]>([]);
  const [sesiIni, setSesiIni] = useState("");
  const [pesan, setPesan] = useState("");
  const [jenis, setJenis] = useState<"info" | "sukses" | "galat">("info");

  const muat = useCallback(async () => {
    try {
      const [dua, daftar] = await Promise.all([
        fetch("/api/auth/2fa").then(ambilJson<{ aktif: boolean }>),
        fetch("/api/sesi").then(ambilJson<{ sesi: Sesi[]; sesiIni: string }>),
      ]);
      setAktif(dua.aktif); setSesi(daftar.sesi ?? []); setSesiIni(daftar.sesiIni ?? "");
    } catch (e) { setJenis("galat"); setPesan(e instanceof Error ? e.message : "Gagal memuat keamanan"); }
  }, []);
  useEffect(() => { void muat(); }, [muat]);

  async function mulai2fa() {
    try {
      const hasil = await fetch("/api/auth/2fa", { method: "POST" }).then(ambilJson<{
        rahasia: string; tautan: string;
      }>);
      setRahasia(hasil.rahasia); setTautan(hasil.tautan); setKode("");
      setJenis("info"); setPesan("Simpan rahasia ini, lalu masukkan kode dari aplikasi authenticator.");
    } catch (e) { setJenis("galat"); setPesan(e instanceof Error ? e.message : "Gagal memulai 2FA"); }
  }

  async function simpan2fa() {
    try {
      await fetch("/api/auth/2fa", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode }),
      }).then(ambilJson);
      setJenis("sukses"); setPesan("2FA berhasil diaktifkan.");
      setRahasia(""); setTautan(""); setKode(""); void muat();
    } catch (e) { setJenis("galat"); setPesan(e instanceof Error ? e.message : "Kode tidak valid"); }
  }

  async function matikan2fa() {
    try {
      await fetch("/api/auth/2fa", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode }),
      }).then(ambilJson);
      setJenis("sukses"); setPesan("2FA dinonaktifkan."); setKode(""); void muat();
    } catch (e) { setJenis("galat"); setPesan(e instanceof Error ? e.message : "Kode tidak valid"); }
  }

  async function cabut(id: string) {
    try {
      await fetch("/api/sesi", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jti: id }),
      }).then(ambilJson);
      setJenis("sukses"); setPesan("Perangkat tersebut dicabut."); void muat();
    } catch (e) { setJenis("galat"); setPesan(e instanceof Error ? e.message : "Gagal mencabut sesi"); }
  }

  return (
    <div>
      <Judul anak="Keamanan akun" sub="Lindungi akun dengan kode verifikasi dan kelola perangkat yang masuk." />
      <Pesan teks={pesan} jenis={jenis} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Kartu>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Verifikasi dua langkah</h2>
            <Badge warna={aktif ? "sukses" : "peringatan"}>{aktif ? "Aktif" : "Belum aktif"}</Badge>
          </div>
          <p className="mt-2 text-xs text-tinta-lemah">
            Gunakan aplikasi authenticator untuk menghasilkan kode enam angka setiap masuk.
          </p>
          {!aktif && !rahasia && (
            <Tombol kelas="mt-4" onClick={() => void mulai2fa()}>Aktifkan 2FA</Tombol>
          )}
          {rahasia && (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-latar p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-utama">Rahasia, simpan sekarang</p>
                <p className="mt-1 break-all font-mono text-sm">{rahasia}</p>
                {tautan && <a href={tautan} className="mt-2 inline-block text-xs font-semibold text-utama hover:underline">Buka di aplikasi authenticator</a>}
              </div>
              <div>
                <label htmlFor="kode2fa">Kode enam angka</label>
                <input id="kode2fa" inputMode="numeric" maxLength={6} value={kode}
                  onChange={(e) => setKode(e.target.value.replace(/\D/g, ""))} />
              </div>
              <Tombol onClick={() => void simpan2fa()} nonaktif={kode.length !== 6}>Aktifkan</Tombol>
            </div>
          )}
          {aktif && (
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="kode2fa-off">Kode enam angka</label>
                <input id="kode2fa-off" inputMode="numeric" maxLength={6} value={kode}
                  onChange={(e) => setKode(e.target.value.replace(/\D/g, ""))} />
              </div>
              <Tombol jenis="hapus" onClick={() => void matikan2fa()} nonaktif={kode.length !== 6}>Nonaktifkan 2FA</Tombol>
            </div>
          )}
        </Kartu>
        <Kartu>
          <h2 className="text-lg font-semibold">Perangkat aktif</h2>
          <ul className="mt-4 space-y-2">
            {sesi.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-garis px-3 py-2 text-xs">
                <span className="font-mono">{s.id.slice(0, 10)}</span>
                {s.id === sesiIni && <Badge warna="info">Perangkat ini</Badge>}
                <span className="text-tinta-lemah">Terakhir {s.terakhir_pakai}</span>
                {s.id !== sesiIni && (
                  <Tombol jenis="hapus" kelas="ml-auto min-h-[36px] px-2 text-xs" onClick={() => void cabut(s.id)}>Cabut</Tombol>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-tinta-lemah">Mengganti kata sandi juga mencabut seluruh sesi.</p>
        </Kartu>
      </div>
    </div>
  );
}
