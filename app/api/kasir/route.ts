import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat } from "@/lib/api-final.ts";
import { catatPenjualan } from "@/lib/final/transaksi.ts";

export const runtime = "nodejs";
export const maxDuration = 60;

const skema = z.object({
  items: z.array(z.object({
    menu_id: z.number().int().positive(),
    varian_id: z.number().int().positive().nullable(),
    jumlah: z.number().int().positive().max(100),
  })).min(1).max(30),
  diskon: z.number().int().min(0).max(100000000),
  metode: z.enum(["tunai", "qris", "transfer"]),
  catatan: z.string().trim().max(200),
}).strict();

export async function POST(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "masuk");
    if (penolakan) return penolakan;
    const hasil = await catatPenjualan(skema.parse(await req.json()), pengguna);
    return NextResponse.json({
      id: hasil.id, nomor: hasil.nomor, total: hasil.total, dibuat_pada: hasil.dibuat_pada,
      items: hasil.items.map(({ hpp: _hpp, ...i }) => i),
    }, { status: 201 });
  } catch (e) { return galat(e) as NextResponse; }
}
