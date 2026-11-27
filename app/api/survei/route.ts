import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, bacaJsonTerbatasi, galat, izinLaju } from "@/lib/api-final.ts";
import { jalankan } from "@/lib/database.ts";

export const runtime = "nodejs";

const skema = z.object({
  kode_lacak: z.string().trim().min(4).max(20),
  nilai: z.number().int().min(1).max(5),
  komentar: z.string().trim().max(300),
}).strict();

/** Survei kepuasan dua pertanyaan pasca pesanan. */
export async function POST(req: Request) {
  try {
    const { penolakan } = await aman(req, "publik");
    if (penolakan) return penolakan;
    const alamat = req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "lokal";
    if (!(await izinLaju(`survei:${alamat}`, 10, 60 * 1000))) {
      return NextResponse.json({ pesan: "Terlalu banyak pengiriman. Coba lagi sebentar." }, { status: 429 });
    }
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    await jalankan(
      `INSERT INTO survei (kode_lacak, nilai, komentar) VALUES ($1,$2,$3)
       ON CONFLICT DO NOTHING`,
      [badan.kode_lacak.trim().toUpperCase(), badan.nilai, badan.komentar],
    );
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
