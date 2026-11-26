import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat , bacaJsonTerbatasi} from "@/lib/api-final.ts";
import { ambilItemOpname, ambilOpname, simpanOpname } from "@/lib/final/stok.ts";
import { penggunaSaatIni } from "@/lib/auth.ts";
import { tanggalHariIni, tanggalValid } from "@/lib/format.ts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    if (!(await penggunaSaatIni())) {
      return NextResponse.json({ pesan: "Silakan masuk" }, { status: 401 });
    }
    const id = Number(new URL(req.url).searchParams.get("id") ?? 0);
    if (id) return NextResponse.json({ items: await ambilItemOpname(id) });
    return NextResponse.json({ opname: await ambilOpname() });
  } catch (e) { return galat(e) as NextResponse; }
}

const skema = z.object({
  tanggal: z.string().refine(tanggalValid, "Tanggal tidak valid")
    .refine((v) => v <= tanggalHariIni(), "Tanggal tidak boleh di masa depan"),
  catatan: z.string().trim().max(300),
  items: z.array(z.object({
    bahan_id: z.number().int().positive(),
    stok_fisik: z.number().finite().min(0),
    alasan: z.string().trim().max(150),
  })).min(1).max(50),
}).strict();

export async function POST(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const id = await simpanOpname(skema.parse(await bacaJsonTerbatasi(req)), pengguna);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) { return galat(e) as NextResponse; }
}
