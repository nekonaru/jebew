// Pembantu bersama untuk handler API final: keamanan, validasi, dan respons galat.

import { ZodError } from "zod";
import { GalatBisnis } from "./final/galat.ts";
import { query, querySatu } from "./database.ts";
import { penggunaSaatIni, type PenggunaSesi } from "./auth.ts";

const BATAS_UKURAN = 128 * 1024;

class GalatUkuran extends Error {}

/** Baca body sebagai JSON dengan penghitung byte nyata, bukan hanya Content-Length. */
export async function bacaJsonTerbatasi<T = unknown>(
  permintaan: Request, batas = BATAS_UKURAN,
): Promise<T> {
  if (!permintaan.body) throw new GalatBisnis("Isi permintaan kosong");
  const pembaca = permintaan.body.getReader();
  const potongan: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await pembaca.read();
    if (done) break;
    total += value.byteLength;
    if (total > batas) {
      await pembaca.cancel();
      throw new GalatUkuran("Permintaan terlalu besar");
    }
    potongan.push(value);
  }
  const panjang = potongan.reduce((n, p) => n + p.byteLength, 0);
  const gabungan = new Uint8Array(panjang);
  let offset = 0;
  for (const p of potongan) { gabungan.set(p, offset); offset += p.byteLength; }
  return JSON.parse(new TextDecoder().decode(gabungan)) as T;
}

export function galat(kesalahan: unknown): Response {
  if (kesalahan instanceof GalatUkuran) {
    return Response.json({ pesan: kesalahan.message }, { status: 413 });
  }
  if (kesalahan instanceof GalatBisnis) {
    return Response.json({ pesan: kesalahan.message }, { status: 400 });
  }
  if (kesalahan instanceof ZodError) {
    const isu = kesalahan.issues[0];
    const bagian = isu?.path.join(".") ?? "";
    const bawaan = isu?.code === "unrecognized_keys"
      || /^(expected|invalid|too |string must|number must|value)/i.test(isu?.message ?? "");
    const pesan = isu?.message && !bawaan ? isu.message : (bagian ? `Data ${bagian} tidak valid` : "Data tidak valid");
    return Response.json({ pesan }, { status: 400 });
  }
  if (typeof kesalahan === "object" && kesalahan !== null && "code" in kesalahan
    && ["23503", "22003", "22P02"].includes(String(kesalahan.code))) {
    return Response.json({ pesan: "Data tidak valid" }, { status: 400 });
  }
  if (typeof kesalahan === "object" && kesalahan !== null && "code" in kesalahan && kesalahan.code === "23505") {
    const nama = "constraint" in kesalahan ? String(kesalahan.constraint) : "";
    return Response.json({
      pesan: nama.includes("pengguna_email") ? "Email sudah dipakai" : "Data dengan nilai tersebut sudah ada",
    }, { status: 400 });
  }
  if (typeof kesalahan === "object" && kesalahan !== null && "code" in kesalahan
    && ["40P01", "40001"].includes(String(kesalahan.code))) {
    return Response.json({ pesan: "Transaksi bentrok dengan permintaan lain. Coba lagi sebentar." }, { status: 400 });
  }
  const teks = kesalahan instanceof Error ? kesalahan.message : String(kesalahan);
  if (/timeout exceeded when trying to connect|Connection terminated due to connection timeout/i.test(teks)) {
    return Response.json({ pesan: "Server sedang sibuk. Coba lagi sebentar." }, { status: 503 });
  }
  console.error("Galat server:", kesalahan);
  return Response.json({ pesan: "Terjadi kesalahan pada server" }, { status: 500 });
}

export function asalValid(permintaan: Request): boolean {
  const situs = permintaan.headers.get("sec-fetch-site");
  if (situs && situs !== "same-origin" && situs !== "none") return false;
  const asal = permintaan.headers.get("origin");
  if (!asal) return true;
  try {
    return new URL(asal).host === (permintaan.headers.get("host") ?? "");
  } catch {
    return false;
  }
}

/** Pembatasan laju atomik: satu pernyataan SQL, aman untuk permintaan paralel. */
export async function izinLaju(kunci: string, batas: number, jendelaMs: number): Promise<boolean> {
  const sekarang = Date.now();
  // Bersihkan baris kedaluwarsa secara berkala tanpa menambah kueri pada setiap permintaan.
  if (Math.random() < 0.02) {
    await query("DELETE FROM pembatasan_laju WHERE reset_pada < $1", [sekarang]);
  }
  const baris = await querySatu<{ boleh: boolean }>(
    `INSERT INTO pembatasan_laju (kunci, jumlah, reset_pada) VALUES ($1, 1, $2)
     ON CONFLICT (kunci) DO UPDATE SET
       jumlah = CASE WHEN pembatasan_laju.reset_pada <= $3 THEN 1 ELSE pembatasan_laju.jumlah + 1 END,
       reset_pada = CASE WHEN pembatasan_laju.reset_pada <= $3 THEN EXCLUDED.reset_pada ELSE pembatasan_laju.reset_pada END
     RETURNING jumlah <= $4 AS boleh`,
    [kunci, sekarang + jendelaMs, sekarang, batas],
  );
  return Boolean(baris?.boleh);
}

export async function aman(
  permintaan: Request,
  peran: "publik" | "masuk" | "pemilik" = "masuk",
  batasUkuran = BATAS_UKURAN,
): Promise<{ penolakan: Response | null; pengguna: PenggunaSesi | null }> {
  const panjang = Number(permintaan.headers.get("content-length") ?? "0");
  if (Number.isFinite(panjang) && panjang > batasUkuran) {
    return { penolakan: Response.json({ pesan: "Permintaan terlalu besar" }, { status: 413 }), pengguna: null };
  }
  if (!asalValid(permintaan)) {
    return { penolakan: Response.json({ pesan: "Asal permintaan tidak valid" }, { status: 403 }), pengguna: null };
  }

  const pengguna = await penggunaSaatIni();
  if (peran === "masuk" && !pengguna) {
    return { penolakan: Response.json({ pesan: "Silakan masuk" }, { status: 401 }), pengguna: null };
  }
  if (peran === "pemilik" && pengguna?.peran !== "pemilik") {
    return { penolakan: Response.json({ pesan: "Hanya pemilik yang bisa melakukan ini" }, { status: 403 }), pengguna };
  }
  return { penolakan: null, pengguna };
}
