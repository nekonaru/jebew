// Pembantu bersama untuk handler API final: keamanan, validasi, dan respons galat.

import { ZodError } from "zod";
import { GalatBisnis } from "./final/galat.ts";
import { penggunaSaatIni, type PenggunaSesi } from "./auth.ts";

const BATAS_UKURAN = 128 * 1024;

export function galat(kesalahan: unknown): Response {
  if (kesalahan instanceof GalatBisnis) {
    return Response.json({ pesan: kesalahan.message }, { status: 400 });
  }
  if (kesalahan instanceof ZodError) {
    return Response.json({ pesan: kesalahan.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
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

export async function aman(
  permintaan: Request,
  peran: "publik" | "masuk" | "pemilik" = "masuk",
): Promise<{ penolakan: Response | null; pengguna: PenggunaSesi | null }> {
  const panjang = Number(permintaan.headers.get("content-length") ?? "0");
  if (Number.isFinite(panjang) && panjang > BATAS_UKURAN) {
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
