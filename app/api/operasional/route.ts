import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, bacaJsonTerbatasi, galat } from "@/lib/api-final.ts";
import {
  ambilPiutang, ambilShift, bayarPiutang, catatLimbah,
  mulaiShift, selesaiShift, simpanPiutang,
} from "@/lib/final/tambahan.ts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const [piutang, shift] = await Promise.all([ambilPiutang(), ambilShift()]);
    return NextResponse.json({ piutang, shift });
  } catch (e) { return galat(e) as NextResponse; }
}

const piutangSkema = z.object({
  aksi: z.literal("piutang"), kode_lacak: z.string().trim().min(4).max(20),
  nama: z.string().trim().min(1).max(100), jumlah: z.number().int().positive().max(100000000),
  jatuh_tempo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), catatan: z.string().trim().max(300),
}).strict();
const bayarSkema = z.object({
  aksi: z.literal("bayar_piutang"), id: z.number().int().positive(),
  jumlah: z.number().int().positive().max(100000000),
}).strict();
const shiftMulaiSkema = z.object({
  aksi: z.literal("mulai_shift"), nama: z.string().trim().min(1).max(100),
  kas_awal: z.number().int().min(0).max(100000000),
}).strict();
const shiftSelesaiSkema = z.object({
  aksi: z.literal("selesai_shift"), id: z.number().int().positive(),
  kas_akhir: z.number().int().min(0).max(100000000), catatan: z.string().trim().max(300),
}).strict();
const limbahSkema = z.object({
  aksi: z.literal("limbah"), bahan_id: z.number().int().positive(),
  jumlah: z.number().positive().max(1000000), alasan: z.string().trim().min(1).max(300),
}).strict();

const skema = z.discriminatedUnion("aksi", [
  piutangSkema, bayarSkema, shiftMulaiSkema, shiftSelesaiSkema, limbahSkema,
]);

export async function POST(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    if (badan.aksi === "piutang") await simpanPiutang(badan);
    else if (badan.aksi === "bayar_piutang") await bayarPiutang(badan.id, badan.jumlah);
    else if (badan.aksi === "mulai_shift") await mulaiShift(badan.nama, badan.kas_awal, pengguna?.id);
    else if (badan.aksi === "selesai_shift") await selesaiShift(badan.id, badan.kas_akhir, badan.catatan);
    else await catatLimbah(badan.bahan_id, badan.jumlah, badan.alasan, pengguna?.id);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
