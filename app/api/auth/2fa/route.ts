import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, bacaJsonTerbatasi, galat } from "@/lib/api-final.ts";
import { jalankan, querySatu } from "@/lib/database.ts";
import { buatRahasia, cocokTOTP, tautanAuthenticator } from "@/lib/totp.ts";

export const runtime = "nodejs";

/** Status 2FA akun yang sedang masuk. */
export async function GET(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "masuk");
    if (penolakan) return penolakan;
    const baris = await querySatu<{ aktif: boolean }>(
      "SELECT aktif FROM totp_secret WHERE pengguna_id = $1", [pengguna!.id],
    );
    return NextResponse.json({ aktif: Boolean(baris?.aktif) });
  } catch (e) { return galat(e) as NextResponse; }
}

/** Mulai pengaktifan. Rahasia hanya ditampilkan sekali. */
export async function POST(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "masuk");
    if (penolakan) return penolakan;
    const rahasia = buatRahasia();
    await jalankan(
      `INSERT INTO totp_secret (pengguna_id, rahasia, aktif) VALUES ($1,$2,FALSE)
       ON CONFLICT (pengguna_id) DO UPDATE SET rahasia = EXCLUDED.rahasia, aktif = FALSE`,
      [pengguna!.id, rahasia],
    );
    return NextResponse.json({
      rahasia,
      tautan: tautanAuthenticator(pengguna!.email, rahasia),
    });
  } catch (e) { return galat(e) as NextResponse; }
}

const skema = z.object({ kode: z.string().regex(/^\d{6}$/) }).strict();

/** Aktifkan 2FA setelah kode terverifikasi. */
export async function PUT(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "masuk");
    if (penolakan) return penolakan;
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    const baris = await querySatu<{ rahasia: string }>(
      "SELECT rahasia FROM totp_secret WHERE pengguna_id = $1 AND aktif = FALSE", [pengguna!.id],
    );
    if (!baris || !cocokTOTP(baris.rahasia, badan.kode)) {
      return NextResponse.json({ pesan: "Kode tidak valid" }, { status: 400 });
    }
    await jalankan("UPDATE totp_secret SET aktif = TRUE WHERE pengguna_id = $1", [pengguna!.id]);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}

/** Nonaktifkan 2FA. */
export async function DELETE(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "masuk");
    if (penolakan) return penolakan;
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    const baris = await querySatu<{ rahasia: string }>(
      "SELECT rahasia FROM totp_secret WHERE pengguna_id = $1 AND aktif = TRUE", [pengguna!.id],
    );
    if (!baris || !cocokTOTP(baris.rahasia, badan.kode)) {
      return NextResponse.json({ pesan: "Kode tidak valid" }, { status: 400 });
    }
    await jalankan("DELETE FROM totp_secret WHERE pengguna_id = $1", [pengguna!.id]);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
