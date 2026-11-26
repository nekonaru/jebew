import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, bacaJsonTerbatasi, galat, izinLaju } from "@/lib/api-final.ts";
import { ambilUlasan, simpanUlasan, tinjauUlasan } from "@/lib/final/tambahan.ts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const status = new URL(req.url).searchParams.get("status") ?? "menunggu";
    if (!["menunggu", "diterima", "ditolak"].includes(status)) {
      return NextResponse.json({ pesan: "Status tidak valid" }, { status: 400 });
    }
    return NextResponse.json({ ulasan: await ambilUlasan(status) });
  } catch (e) { return galat(e) as NextResponse; }
}

const skema = z.object({
  kode_lacak: z.string().trim().min(4).max(20),
  rating: z.number().int().min(1).max(5),
  komentar: z.string().trim().max(500),
}).strict();

/** Pelanggan mengirim ulasan memakai kode lacak. */
export async function POST(req: Request) {
  try {
    const { penolakan } = await aman(req, "publik");
    if (penolakan) return penolakan;
    const alamat = req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "lokal";
    if (!(await izinLaju(`ulasan:${alamat}`, 10, 60 * 1000))) {
      return NextResponse.json({ pesan: "Terlalu banyak pengiriman. Coba lagi sebentar." }, { status: 429 });
    }
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    await simpanUlasan(badan.kode_lacak, badan.rating, badan.komentar);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}

export async function PUT(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = z.object({
      id: z.number().int().positive(),
      status: z.enum(["diterima", "ditolak"]),
    }).strict().parse(await bacaJsonTerbatasi(req));
    await tinjauUlasan(badan.id, badan.status);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
