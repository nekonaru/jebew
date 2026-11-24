import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat } from "@/lib/api-final.ts";
import { ambilKategoriPengeluaran, tambahPengeluaran } from "@/lib/final/laporan.ts";
import { penggunaSaatIni } from "@/lib/auth.ts";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!(await penggunaSaatIni())) {
      return NextResponse.json({ pesan: "Silakan masuk" }, { status: 401 });
    }
    return NextResponse.json({ kategori: await ambilKategoriPengeluaran() });
  } catch (e) { return galat(e) as NextResponse; }
}

const skema = z.object({
  kategori_id: z.number().int().positive(),
  nama: z.string().trim().min(1).max(100),
  jumlah: z.number().int().min(0).max(100000000),
  tanggal: z.string().min(10),
  catatan: z.string().trim().max(200),
}).strict();

export async function POST(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    await tambahPengeluaran(skema.parse(await req.json()), pengguna);
    return NextResponse.json({ berhasil: true }, { status: 201 });
  } catch (e) { return galat(e) as NextResponse; }
}
