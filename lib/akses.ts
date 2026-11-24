// Perlindungan dashboard admin: PIN, cookie sesi bertanda tangan, dan pembatasan percobaan.

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ZodError } from "zod";
import { GalatBisnis } from "./operasi.ts";

const NAMA_COOKIE = "jebew_sesi";
const DURASI_AKTIF = 60 * 60 * 8;
const BATAS_PERCOBAAN = 5;
const JENDELA_PERCOBAAN = 10 * 60 * 1000;
const BATAS_UKURAN = 64 * 1024;
const BATAS_PREORDER = 5;
const JENDELA_PREORDER = 60 * 1000;

type CatatanPercobaan = { jumlah: number; resetPada: number };
const percobaanMasuk = new Map<string, CatatanPercobaan>();
const kirimanPreorder = new Map<string, CatatanPercobaan>();

/** Nilai bawaan hanya dipakai saat pengembangan. Produksi gagal bila env kosong. */
function ambilNilaiRahasia(nama: string, bawaanDemo: string): string {
  const nilai = process.env[nama];
  if (nilai && nilai.trim() !== "") return nilai;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${nama} wajib diatur di lingkungan produksi`);
  }
  return bawaanDemo;
}

function kunciRahasia(): string {
  return ambilNilaiRahasia("RAHASIA_SESI", "jebew-prototipe-kunci-sesi-ganti-melalui-env");
}

function tandaTangan(payload: string): string {
  return createHmac("sha256", kunciRahasia()).update(payload).digest("hex");
}

export function buatTokenSesi(): string {
  const isi = {
    admin: true,
    berlakuHingga: Math.floor(Date.now() / 1000) + DURASI_AKTIF,
  };
  const payload = Buffer.from(JSON.stringify(isi)).toString("base64url");
  return `${payload}.${tandaTangan(payload)}`;
}

export function verifikasiTokenSesi(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, tanda] = token.split(".");
  if (!payload || !tanda) return false;

  const tandaDihitung = Buffer.from(tandaTangan(payload));
  const tandaDiterima = Buffer.from(tanda);
  if (tandaDihitung.length !== tandaDiterima.length) return false;
  if (!timingSafeEqual(tandaDihitung, tandaDiterima)) return false;

  try {
    const isi = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      admin?: boolean;
      berlakuHingga?: number;
    };
    return isi.admin === true && typeof isi.berlakuHingga === "number" && isi.berlakuHingga > Date.now() / 1000;
  } catch {
    return false;
  }
}

export async function sudahMasuk(): Promise<boolean> {
  const toko = await cookies();
  return verifikasiTokenSesi(toko.get(NAMA_COOKIE)?.value);
}

export function cocokPin(pin: string): boolean {
  const pinBenar = ambilNilaiRahasia("ADMIN_PIN", "1234");
  const masukan = Buffer.from(pin);
  const pembanding = Buffer.from(pinBenar);
  return masukan.length === pembanding.length && timingSafeEqual(masukan, pembanding);
}

export function bolehMencoba(kunci: string): boolean {
  const sekarang = Date.now();
  const catatan = percobaanMasuk.get(kunci);
  if (!catatan || catatan.resetPada <= sekarang) {
    percobaanMasuk.set(kunci, { jumlah: 0, resetPada: sekarang + JENDELA_PERCOBAAN });
    return true;
  }
  return catatan.jumlah < BATAS_PERCOBAAN;
}

export function catatKegagalan(kunci: string): void {
  const catatan = percobaanMasuk.get(kunci);
  if (catatan) catatan.jumlah += 1;
}

export function hapusCatatanPercobaan(kunci: string): void {
  percobaanMasuk.delete(kunci);
}

/** Batasi pre-order agar form publik tidak bisa dipakai untuk membanjiri database. */
export function izinPreorder(kunci: string): boolean {
  const sekarang = Date.now();
  const catatan = kirimanPreorder.get(kunci);
  if (!catatan || catatan.resetPada <= sekarang) {
    kirimanPreorder.set(kunci, { jumlah: 1, resetPada: sekarang + JENDELA_PREORDER });
    return true;
  }
  if (catatan.jumlah >= BATAS_PREORDER) return false;
  catatan.jumlah += 1;
  return true;
}

/** Alamat klien untuk keperluan pembatasan. Mengambil nilai pertama bila lewat proxy. */
export function alamatKlien(permintaan: Request): string {
  return permintaan.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "lokal";
}

export function ukuranWajar(permintaan: Request): boolean {
  const panjang = Number(permintaan.headers.get("content-length") ?? "0");
  return Number.isFinite(panjang) && panjang <= BATAS_UKURAN;
}

/**
 * Satu pemeriksaan untuk semua endpoint yang mengubah data:
 * ukuran permintaan, asal permintaan, dan sesi admin bila diperlukan.
 */
export async function pastikanAman(
  permintaan: Request,
  perluAdmin: boolean,
): Promise<Response | null> {
  if (!ukuranWajar(permintaan)) {
    return Response.json({ pesan: "Permintaan terlalu besar" }, { status: 413 });
  }
  if (!asalValid(permintaan)) {
    return Response.json({ pesan: "Asal permintaan tidak valid" }, { status: 403 });
  }
  if (perluAdmin && !(await sudahMasuk())) {
    return Response.json({ pesan: "Silakan masuk ke dashboard admin" }, { status: 401 });
  }
  return null;
}

export const pilihanCookie = {
  name: NAMA_COOKIE,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: DURASI_AKTIF,
};

/** Menolak permintaan yang asalnya bukan situs yang sama. */
export function asalValid(permintaan: Request): boolean {
  const situs = permintaan.headers.get("sec-fetch-site");
  if (situs && situs !== "same-origin" && situs !== "none") return false;

  const asal = permintaan.headers.get("origin");
  if (!asal) return true;
  try {
    const host = permintaan.headers.get("host") ?? "";
    return new URL(asal).host === host;
  } catch {
    return false;
  }
}

export function tanggapiGalat(kesalahan: unknown): Response {
  if (kesalahan instanceof GalatBisnis) {
    return Response.json({ pesan: kesalahan.message }, { status: 400 });
  }
  if (kesalahan instanceof ZodError) {
    const pertama = kesalahan.issues[0];
    return Response.json({ pesan: pertama?.message ?? "Data tidak valid" }, { status: 400 });
  }
  console.error("Kesalahan server:", kesalahan);
  return Response.json({ pesan: "Terjadi kesalahan pada server" }, { status: 500 });
}
