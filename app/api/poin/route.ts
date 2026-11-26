import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat, izinLaju } from "@/lib/api-final.ts";
import { ambilPoin } from "@/lib/final/tambahan.ts";

export const runtime = "nodejs";

/** Cek saldo poin dari nomor WhatsApp. */
export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "publik");
    if (penolakan) return penolakan;
    const alamat = req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "lokal";
    if (!(await izinLaju(`poin:${alamat}`, 30, 60 * 1000))) {
      return NextResponse.json({ pesan: "Terlalu banyak permintaan. Coba lagi sebentar." }, { status: 429 });
    }
    const whatsapp = new URL(req.url).searchParams.get("whatsapp") ?? "";
    const hasil = z.string().trim().regex(/^[0-9+\-() ]{8,20}$/).safeParse(whatsapp);
    if (!hasil.success) return NextResponse.json({ pesan: "Nomor WhatsApp tidak valid" }, { status: 400 });
    return NextResponse.json(await ambilPoin(hasil.data));
  } catch (e) { return galat(e) as NextResponse; }
}
