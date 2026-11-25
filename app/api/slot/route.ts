import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat } from "@/lib/api-final.ts";
import { ambilSlotWaktu, simpanSlotWaktu } from "@/lib/final/pengaturan.ts";
import { penggunaSaatIni } from "@/lib/auth.ts";
import { tanggalHariIni, tanggalValid } from "@/lib/format.ts";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ slot: await ambilSlotWaktu() });
  } catch (e) { return galat(e) as NextResponse; }
}

const skema = z.object({
  tanggal: z.string().refine(tanggalValid, "Tanggal tidak valid")
    .refine((v) => v >= tanggalHariIni(), "Tanggal slot tidak boleh lampau"),
  jam: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam: HH:mm"),
  kuota: z.number().int().positive().max(1000),
}).strict();

export async function POST(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    await simpanSlotWaktu(skema.parse(await req.json()));
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
