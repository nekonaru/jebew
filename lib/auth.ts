// Autentikasi pengguna: kata sandi di-hash dengan scrypt, sesi ditandatangani HMAC.
// Pemeriksaan peran dilakukan di server pada setiap endpoint.

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { jalankan, querySatu } from "./database.ts";

const NAMA_COOKIE = "jebew_final_sesi";
const DURASI = 60 * 60 * 12;

export type Peran = "pemilik" | "kasir";
export type PenggunaSesi = { id: number; nama: string; email: string; peran: Peran; versi?: number };

function kunciRahasia(): string {
  const nilai = process.env.RAHASIA_SESI;
  if (nilai && nilai.trim() !== "") return nilai;
  if (process.env.NODE_ENV === "production") {
    throw new Error("RAHASIA_SESI wajib diatur di produksi");
  }
  return "jebew-final-kunci-pengembangan";
}

export function hashKataSandi(kataSandi: string): string {
  const garam = randomBytes(16).toString("hex");
  const hash = scryptSync(kataSandi, garam, 64).toString("hex");
  return `${garam}:${hash}`;
}

export function cocokKataSandi(kataSandi: string, tersimpan: string): boolean {
  const [garam, hashTeks] = tersimpan.split(":");
  if (!garam || !hashTeks || !/^[0-9a-f]{128}$/.test(hashTeks)) return false;
  const hash = Buffer.from(hashTeks, "hex");
  if (hash.length < 32) return false;
  const hitung = scryptSync(kataSandi, garam, hash.length);
  return hash.length === hitung.length && timingSafeEqual(hash, hitung);
}

function tanda(payload: string): string {
  return createHmac("sha256", kunciRahasia()).update(payload).digest("hex");
}

export function buatToken(isi: PenggunaSesi, versi = 0): string {
  const muatan = Buffer.from(JSON.stringify({
    id: isi.id, nama: isi.nama, email: isi.email, peran: isi.peran,
    versi,
    nonce: randomBytes(12).toString("hex"),
    berlakuHingga: Math.floor(Date.now() / 1000) + DURASI,
  })).toString("base64url");
  return `${muatan}.${tanda(muatan)}`;
}

export function bacaToken(token: string | undefined): PenggunaSesi | null {
  if (!token) return null;
  const [muatan, tandaDiterima] = token.split(".");
  if (!muatan || !tandaDiterima) return null;

  const dihitung = Buffer.from(tanda(muatan));
  const diterima = Buffer.from(tandaDiterima);
  if (dihitung.length !== diterima.length || !timingSafeEqual(dihitung, diterima)) return null;

  try {
    const isi = JSON.parse(Buffer.from(muatan, "base64url").toString("utf8")) as PenggunaSesi & {
      berlakuHingga?: number; versi?: number;
    };
    if (typeof isi.berlakuHingga !== "number" || isi.berlakuHingga <= Date.now() / 1000) return null;
    if (typeof isi.versi !== "number") return null;
    if (isi.peran !== "pemilik" && isi.peran !== "kasir") return null;
    return { id: isi.id, nama: isi.nama, email: isi.email, peran: isi.peran, versi: isi.versi };
  } catch {
    return null;
  }
}

export async function penggunaSaatIni(): Promise<PenggunaSesi | null> {
  const toko = await cookies();
  const dariToken = bacaToken(toko.get(NAMA_COOKIE)?.value);
  if (!dariToken) return null;

  // Status dan peran selalu dibaca ulang dari database agar perubahan admin
  // langsung berlaku tanpa menunggu token kedaluwarsa.
  const baris = await querySatu<{
    id: number; email: string; nama: string; peran: Peran; aktif: boolean; sesi_versi: number;
  }>(
    "SELECT id, email, nama, peran, aktif, sesi_versi FROM pengguna WHERE id = $1 AND aktif = TRUE",
    [dariToken.id],
  );
  if (!baris || Number(baris.sesi_versi) !== dariToken.versi) return null;
  return { id: baris.id, email: baris.email, nama: baris.nama, peran: baris.peran, versi: baris.sesi_versi };
}

export async function verifikasiLogin(email: string, kataSandi: string): Promise<PenggunaSesi | null> {
  const baris = await querySatu<{
    id: number;
    email: string;
    nama: string;
    kata_sandi: string;
    peran: Peran;
    aktif: boolean;
    sesi_versi: number;
  }>("SELECT id, email, nama, kata_sandi, peran, aktif, sesi_versi FROM pengguna WHERE email = $1", [email]);

  if (!baris || !baris.aktif || !cocokKataSandi(kataSandi, baris.kata_sandi)) return null;
  return { id: baris.id, email: baris.email, nama: baris.nama, peran: baris.peran, versi: Number(baris.sesi_versi) };
}

/** Cabut semua sesi milik pengguna dengan menaikkan versi sesinya. */
export async function cabutSesi(id: number): Promise<void> {
  await jalankan("UPDATE pengguna SET sesi_versi = sesi_versi + 1 WHERE id = $1", [id]);
}

export const pilihanCookie = {
  name: NAMA_COOKIE,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: DURASI,
};
