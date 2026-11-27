// TOTP RFC 6238 memakai HMAC-SHA1, tanpa dependensi luar.

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const ABJAD = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function keBase32(data: Buffer): string {
  let bit = 0;
  let nilai = 0;
  let hasil = "";
  for (const byte of data) {
    nilai = (nilai << 8) | byte;
    bit += 8;
    while (bit >= 5) {
      hasil += ABJAD[(nilai >>> (bit - 5)) & 31];
      bit -= 5;
    }
  }
  if (bit > 0) hasil += ABJAD[(nilai << (5 - bit)) & 31];
  return hasil;
}

function dariBase32(teks: string): Buffer {
  const bersih = teks.trim().toUpperCase().replace(/=+$/, "");
  let bit = 0;
  let nilai = 0;
  const hasil: number[] = [];
  for (const huruf of bersih) {
    const indeks = ABJAD.indexOf(huruf);
    if (indeks < 0) continue;
    nilai = (nilai << 5) | indeks;
    bit += 5;
    if (bit >= 8) {
      hasil.push((nilai >>> (bit - 8)) & 255);
      bit -= 8;
    }
  }
  return Buffer.from(hasil);
}

/** Rahasia baru untuk pengguna. */
export function buatRahasia(): string {
  return keBase32(randomBytes(20));
}

function kodePada(rahasia: string, menghitung: number): string {
  const penanda = Buffer.alloc(8);
  let sisa = Math.floor(menghitung / 30);
  for (let i = 7; i >= 0; i--) {
    penanda[i] = sisa & 255;
    sisa = Math.floor(sisa / 256);
  }
  const tanda = createHmac("sha1", dariBase32(rahasia)).update(penanda).digest();
  const ofset = tanda[tanda.length - 1] & 15;
  const potong = ((tanda[ofset] & 127) << 24)
    | (tanda[ofset + 1] << 16)
    | (tanda[ofset + 2] << 8)
    | tanda[ofset + 3];
  return String(potong % 1000000).padStart(6, "0");
}

/** Kode enam angka untuk waktu tertentu. */
export function kodeTOTP(rahasia: string, waktu = Date.now()): string {
  return kodePada(rahasia, Math.floor(waktu / 1000));
}

/** Terima kode dari jendela 30 detik sebelum dan sesudah. */
export function cocokTOTP(rahasia: string, kode: string, waktu = Date.now()): boolean {
  if (!/^\d{6}$/.test(kode)) return false;
  const detik = Math.floor(waktu / 1000);
  for (const selisih of [-30, 0, 30]) {
    const hitung = kodePada(rahasia, detik + selisih);
    const a = Buffer.from(hitung);
    const b = Buffer.from(kode);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

/** URL untuk aplikasi authenticator. */
export function tautanAuthenticator(email: string, rahasia: string): string {
  const nama = encodeURIComponent(`Jebew (${email})`);
  return `otpauth://totp/${nama}?secret=${rahasia}&issuer=Jebew&algorithm=SHA1&digits=6&period=30`;
}
