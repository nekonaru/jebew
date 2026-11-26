import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, bacaJsonTerbatasi, galat } from "@/lib/api-final.ts";
import {
  ambilHariLibur, ambilJadwalHarian, hapusHariLibur, simpanHariLibur, simpanJadwalHarian,
} from "@/lib/final/tambahan.ts";

export const runtime = "nodejs";

const jam = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function GET() {
  try {
    const [jadwal, libur] = await Promise.all([ambilJadwalHarian(), ambilHariLibur()]);
    return NextResponse.json({ jadwal, libur });
  } catch (e) { return galat(e) as NextResponse; }
}

const skema = z.object({
  jadwal: z.array(z.object({
    jenis: z.enum(["toko", "preorder"]),
    hari: z.number().int().min(0).max(6),
    jam_buka: z.string().regex(jam),
    jam_tutup: z.string().regex(jam),
    aktif: z.boolean(),
  }).strict()).min(1).max(14),
  libur: z.array(z.object({
    tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    keterangan: z.string().trim().max(100),
  }).strict()).max(100),
  hapusLibur: z.array(z.number().int().positive()).max(100),
}).strict();

export async function PUT(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    await simpanJadwalHarian(badan.jadwal);
    for (const tanggal of badan.libur) await simpanHariLibur(tanggal.tanggal, tanggal.keterangan);
    for (const id of badan.hapusLibur) await hapusHariLibur(id);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
