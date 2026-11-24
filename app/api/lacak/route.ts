import { NextResponse } from "next/server";
import { galat } from "@/lib/api-final.ts";
import { lacakPreorder } from "@/lib/final/transaksi.ts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const kode = new URL(req.url).searchParams.get("kode") ?? "";
    if (kode.trim().length < 4) {
      return NextResponse.json({ pesan: "Kode terlalu pendek" }, { status: 400 });
    }
    const hasil = await lacakPreorder(kode);
    if (!hasil) return NextResponse.json({ pesan: "Pesanan tidak ditemukan" }, { status: 404 });
    return NextResponse.json(hasil);
  } catch (e) { return galat(e) as NextResponse; }
}
