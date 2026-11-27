import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, bacaJsonTerbatasi, galat } from "@/lib/api-final.ts";
import { jalankan, querySatu } from "@/lib/database.ts";

export const runtime = "nodejs";

const skema = z.object({
  bahan_id: z.number().int().positive(),
  kode: z.string().trim().max(100),
}).strict();

export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const kode = new URL(req.url).searchParams.get("kode") ?? "";
    if (!kode.trim()) return NextResponse.json({ bahan: null });
    const bahan = await querySatu<{ id: number; nama: string; satuan: string }>(
      "SELECT id, nama, satuan FROM bahan WHERE kode_barcode = $1 AND aktif = TRUE", [kode.trim()],
    );
    return NextResponse.json({ bahan: bahan ?? null });
  } catch (e) { return galat(e) as NextResponse; }
}

export async function POST(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    await jalankan("UPDATE bahan SET kode_barcode = $1 WHERE id = $2", [badan.kode, badan.bahan_id]);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
