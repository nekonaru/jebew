import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, bacaJsonTerbatasi, galat, izinLaju } from "@/lib/api-final.ts";
import { validasiPromo } from "@/lib/final/tambahan.ts";

export const runtime = "nodejs";

const skema = z.object({
  kode: z.string().trim().min(1).max(20),
  subtotal: z.number().int().min(0).max(100000000),
}).strict();

/** Cek kode promo tanpa memakai kuota. */
export async function POST(req: Request) {
  try {
    const { penolakan } = await aman(req, "publik");
    if (penolakan) return penolakan;
    const alamat = req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "lokal";
    if (!(await izinLaju(`promo:${alamat}`, 30, 60 * 1000))) {
      return NextResponse.json({ pesan: "Terlalu banyak percobaan. Coba lagi sebentar." }, { status: 429 });
    }
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    return NextResponse.json(await validasiPromo(badan.kode, badan.subtotal));
  } catch (e) { return galat(e) as NextResponse; }
}
