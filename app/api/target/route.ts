import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, bacaJsonTerbatasi, galat } from "@/lib/api-final.ts";
import { ambilTarget, simpanTarget } from "@/lib/final/tambahan.ts";
import { tanggalHariIni } from "@/lib/format.ts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const p = new URL(req.url).searchParams;
    const sampai = p.get("sampai") ?? tanggalHariIni();
    const dari = p.get("dari") ?? sampai;
    return NextResponse.json({ target: await ambilTarget(dari, sampai) });
  } catch (e) { return galat(e) as NextResponse; }
}

const skema = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  target_omzet: z.number().int().min(0).max(1000000000),
  target_transaksi: z.number().int().min(0).max(100000),
}).strict();

export async function PUT(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    await simpanTarget(badan.tanggal, badan.target_omzet, badan.target_transaksi);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
