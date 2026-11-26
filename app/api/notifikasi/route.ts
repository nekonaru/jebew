import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, bacaJsonTerbatasi, galat } from "@/lib/api-final.ts";
import { ambilNotifikasi, tandaiNotifikasi } from "@/lib/final/tambahan.ts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const batas = Number(new URL(req.url).searchParams.get("batas") ?? 100);
    return NextResponse.json({ notifikasi: await ambilNotifikasi(batas) });
  } catch (e) { return galat(e) as NextResponse; }
}

export async function PUT(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = z.object({
      id: z.number().int().positive(),
      status: z.enum(["terkirim", "gagal"]),
    }).strict().parse(await bacaJsonTerbatasi(req));
    await tandaiNotifikasi(badan.id, badan.status);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
