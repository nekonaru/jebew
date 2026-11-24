import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat } from "@/lib/api-final.ts";
import { ambilItemPembelian, ambilPembelian, ambilSupplier, simpanPembelian } from "@/lib/final/stok.ts";
import { penggunaSaatIni } from "@/lib/auth.ts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    if (!(await penggunaSaatIni())) {
      return NextResponse.json({ pesan: "Silakan masuk" }, { status: 401 });
    }
    const id = Number(new URL(req.url).searchParams.get("id") ?? 0);
    if (id) return NextResponse.json({ items: await ambilItemPembelian(id) });
    const [daftar, supplier] = await Promise.all([ambilPembelian(), ambilSupplier()]);
    return NextResponse.json({ pembelian: daftar, supplier });
  } catch (e) { return galat(e) as NextResponse; }
}

const skema = z.object({
  supplier_id: z.number().int().positive().nullable(),
  tanggal: z.string().min(10),
  catatan: z.string().trim().max(300),
  items: z.array(z.object({
    bahan_id: z.number().int().positive(),
    jumlah: z.number().finite().positive(),
    harga_satuan: z.number().int().min(0),
  })).min(1).max(50),
}).strict();

export async function POST(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const id = await simpanPembelian(skema.parse(await req.json()), pengguna);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) { return galat(e) as NextResponse; }
}
