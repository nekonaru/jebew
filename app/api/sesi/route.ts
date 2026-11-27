import { NextResponse } from "next/server";
import { aman, bacaJsonTerbatasi, galat } from "@/lib/api-final.ts";
import { z } from "zod";
import { cabutSesiId, daftarSesi } from "@/lib/auth.ts";

export const runtime = "nodejs";

/** Perangkat yang sedang memiliki sesi aktif. */
export async function GET(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "masuk");
    if (penolakan) return penolakan;
    return NextResponse.json({ sesi: await daftarSesi(pengguna!.id), sesiIni: pengguna!.jti });
  } catch (e) { return galat(e) as NextResponse; }
}

export async function DELETE(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "masuk");
    if (penolakan) return penolakan;
    const badan = z.object({ jti: z.string().min(8).max(64) }).strict()
      .parse(await bacaJsonTerbatasi(req));
    if (badan.jti === pengguna!.jti) {
      return NextResponse.json({ pesan: "Gunakan tombol Keluar untuk sesi ini" }, { status: 400 });
    }
    await cabutSesiId(badan.jti, pengguna!.id);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
