import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, bacaJsonTerbatasi, galat } from "@/lib/api-final.ts";
import {
  ambilAnggaran, arusKas, hutangSupplier, lunasiSupplier, retensiPelanggan,
  rfmPelanggan, simpanAnggaran,
} from "@/lib/final/laporan-lanjutan.ts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const p = new URL(req.url).searchParams;
    const bulan = p.get("bulan") ?? new Date().toISOString().slice(0, 7);
    const sampai = p.get("sampai") ?? new Date().toISOString().slice(0, 10);
    const dari = p.get("dari") ?? `${bulan}-01`;
    const [kas, anggaran, hutang, rfm, retensi] = await Promise.all([
      arusKas(dari, sampai), ambilAnggaran(bulan), hutangSupplier(), rfmPelanggan(), retensiPelanggan(),
    ]);
    return NextResponse.json({ kas, anggaran, hutang, rfm, retensi });
  } catch (e) { return galat(e) as NextResponse; }
}

const anggaranSkema = z.object({
  aksi: z.literal("anggaran"), kategori: z.string().trim().min(1).max(100),
  bulan: z.string().regex(/^\d{4}-\d{2}$/), jumlah: z.number().int().min(0).max(1000000000),
}).strict();
const lunasSkema = z.object({
  aksi: z.literal("lunas"), id: z.number().int().positive(),
}).strict();
const skema = z.discriminatedUnion("aksi", [anggaranSkema, lunasSkema]);

export async function POST(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    if (badan.aksi === "anggaran") await simpanAnggaran(badan.kategori, badan.bulan, badan.jumlah);
    else await lunasiSupplier(badan.id);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
