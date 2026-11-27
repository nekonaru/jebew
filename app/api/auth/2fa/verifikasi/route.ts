import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import {
  bacaTantangan2FA, buatToken, daftarkanSesi, pilihanCookie,
} from "@/lib/auth.ts";
import { asalValid, bacaJsonTerbatasi, galat } from "@/lib/api-final.ts";
import { jalankan, querySatu } from "@/lib/database.ts";
import { cocokTOTP } from "@/lib/totp.ts";

export const runtime = "nodejs";

const skema = z.object({
  tantangan: z.string().min(10).max(300),
  kode: z.string().regex(/^\d{6}$/),
}).strict();

/** Selesaikan login setelah kode 2FA benar. */
export async function POST(req: Request) {
  try {
    if (!asalValid(req)) {
      return NextResponse.json({ pesan: "Asal permintaan tidak valid" }, { status: 403 });
    }
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    const id = bacaTantangan2FA(badan.tantangan);
    if (!id) return NextResponse.json({ pesan: "Tantangan kedaluwarsa. Masuk lagi." }, { status: 400 });
    const [rahasia, pengguna] = await Promise.all([
      querySatu<{ rahasia: string }>(
        "SELECT rahasia FROM totp_secret WHERE pengguna_id = $1 AND aktif = TRUE", [id],
      ),
      querySatu<{
        id: number; email: string; nama: string; peran: "pemilik" | "kasir" | "dapur"; sesi_versi: number;
      }>("SELECT id, email, nama, peran, sesi_versi FROM pengguna WHERE id = $1 AND aktif = TRUE", [id]),
    ]);
    if (!rahasia || !pengguna || !cocokTOTP(rahasia.rahasia, badan.kode)) {
      return NextResponse.json({ pesan: "Kode tidak valid" }, { status: 400 });
    }
    const jti = randomBytes(16).toString("hex");
    await daftarkanSesi(jti, pengguna.id);
    const respons = NextResponse.json({ masuk: true, pengguna: {
      id: pengguna.id, email: pengguna.email, nama: pengguna.nama, peran: pengguna.peran,
    } });
    respons.cookies.set(pilihanCookie.name,
      buatToken({ id: pengguna.id, email: pengguna.email, nama: pengguna.nama, peran: pengguna.peran },
        Number(pengguna.sesi_versi), jti), {
        httpOnly: pilihanCookie.httpOnly,
        sameSite: pilihanCookie.sameSite,
        secure: pilihanCookie.secure,
        path: pilihanCookie.path,
        maxAge: pilihanCookie.maxAge,
      });
    await jalankan("DELETE FROM totp_secret WHERE pengguna_id = $1 AND aktif = FALSE", [pengguna.id]);
    return respons;
  } catch (e) { return galat(e) as NextResponse; }
}
