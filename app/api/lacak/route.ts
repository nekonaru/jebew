import { NextResponse } from "next/server";
import { galat, izinLaju } from "@/lib/api-final.ts";
import { lacakPreorder } from "@/lib/final/transaksi.ts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const kunci = `lacak:${req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "lokal"}`;
    if (!(await izinLaju(kunci, 20, 60 * 1000))) {
      return NextResponse.json({ pesan: "Terlalu banyak percobaan. Coba lagi sebentar." }, { status: 429 });
    }
    const kode = new URL(req.url).searchParams.get("kode") ?? "";
    if (kode.trim().length < 4) {
      return NextResponse.json({ pesan: "Kode terlalu pendek" }, { status: 400 });
    }
    const hasil = await lacakPreorder(kode);
    if (!hasil) return NextResponse.json({ pesan: "Pesanan tidak ditemukan" }, { status: 404 });
    return NextResponse.json(hasil);
  } catch (e) { return galat(e) as NextResponse; }
}
