import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, bacaJsonTerbatasi, galat } from "@/lib/api-final.ts";
import { ambilPromo, hapusPromo, simpanPromo } from "@/lib/final/tambahan.ts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    return NextResponse.json({ promo: await ambilPromo() });
  } catch (e) { return galat(e) as NextResponse; }
}

const skema = z.object({
  id: z.number().int().positive().optional(),
  kode: z.string().trim().min(3).max(20),
  jenis: z.enum(["persen", "nominal"]),
  nilai: z.number().int().positive().max(100000000),
  minimum_belanja: z.number().int().min(0).max(100000000),
  kuota: z.number().int().positive().max(100000),
  berlaku_dari: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  berlaku_sampai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  aktif: z.boolean(),
}).strict();

export async function POST(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    await simpanPromo(skema.parse(await bacaJsonTerbatasi(req)));
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}

export async function DELETE(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ pesan: "Id promo tidak valid" }, { status: 400 });
    }
    await hapusPromo(id);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
