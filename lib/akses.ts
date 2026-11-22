// Perlindungan dashboard admin: PIN, cookie sesi bertanda tangan, dan pembatasan percobaan.

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ZodError } from "zod";
import { GalatBisnis } from "./operasi.ts";

const NAMA_COOKIE = "jebew_sesi";
const DURASI_AKTIF = 60 * 60 * 8;
const BATAS_PERCOBAAN = 5;
const JENDELA_PERCOBAAN = 10 * 60 * 1000;

type CatatanPercobaan = { jumlah: number; resetPada: number };
const percobaanMasuk = new Map<string, CatatanPercobaan>();

function kunciRahasia(): string {
  return process.env.RAHASIA_SESI ?? "jebew-prototipe-kunci-sesi-ganti-melalui-env";
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
  const pinBenar = process.env.ADMIN_PIN ?? "1234";
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
