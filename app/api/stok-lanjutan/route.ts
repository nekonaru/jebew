import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, bacaJsonTerbatasi, galat } from "@/lib/api-final.ts";
import {
  ambilBatch, ambilPurchaseOrder, ambilSupplierHarga, prediksiStok,
  simpanBatch, simpanPurchaseOrder, simpanSupplierHarga, terimaPurchaseOrder,
} from "@/lib/final/stok-lanjutan.ts";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const [prediksi, harga, purchaseOrder, batch] = await Promise.all([
      prediksiStok(), ambilSupplierHarga(), ambilPurchaseOrder(), ambilBatch(),
    ]);
    return NextResponse.json({ prediksi, harga, purchaseOrder, batch });
  } catch (e) { return galat(e) as NextResponse; }
}

const hargaSkema = z.object({
  aksi: z.literal("harga"),
  supplier_id: z.number().int().positive(),
  bahan_id: z.number().int().positive(),
  harga_satuan: z.number().int().positive(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict();

const poSkema = z.object({
  aksi: z.literal("purchase_order"),
  supplier_id: z.number().int().positive().nullable(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  catatan: z.string().trim().max(300),
  items: z.array(z.object({
    bahan_id: z.number().int().positive(),
    jumlah: z.number().positive().max(1000000),
    harga_satuan: z.number().int().positive().max(100000000),
  }).strict()).min(1).max(50),
}).strict();

const terimaSkema = z.object({
  aksi: z.literal("terima"),
  id: z.number().int().positive(),
}).strict();

const batchSkema = z.object({
  aksi: z.literal("batch"),
  bahan_id: z.number().int().positive(),
  nomor_batch: z.string().trim().min(1).max(50),
  tanggal_masuk: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tanggal_kedaluwarsa: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
  jumlah: z.number().positive().max(1000000),
  harga_satuan: z.number().int().min(0).max(100000000),
}).strict();

const skema = z.discriminatedUnion("aksi", [hargaSkema, poSkema, terimaSkema, batchSkema]);

export async function POST(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    if (badan.aksi === "harga") {
      await simpanSupplierHarga(badan);
    } else if (badan.aksi === "purchase_order") {
      const nomor = await simpanPurchaseOrder(badan, pengguna?.id);
      return NextResponse.json({ berhasil: true, nomor });
    } else if (badan.aksi === "batch") {
      await simpanBatch(badan);
    } else {
      await terimaPurchaseOrder(badan.id, pengguna?.id);
    }
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
