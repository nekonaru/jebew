import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat, izinLaju , bacaJsonTerbatasi} from "@/lib/api-final.ts";
import { simpanSlotMassal } from "@/lib/final/pengaturan.ts";
import { tanggalHariIni, tanggalValid } from "@/lib/format.ts";

export const runtime = "nodejs";

function tambahHari(teks: string, jumlah: number): string {
  const t = new Date(`${teks}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + jumlah);
  return t.toISOString().slice(0, 10);
}

const jam = /^([01]\d|2[0-3]):[0-5]\d$/;

const skema = z.object({
  dari: z.string().refine(tanggalValid, "Tanggal tidak valid")
    .refine((v) => v >= tanggalHariIni(), "Tanggal tidak boleh lampau"),
  sampai: z.string().refine(tanggalValid, "Tanggal tidak valid"),
  jam_mulai: z.string().regex(jam, "Format jam: HH:mm"),
  jam_selesai: z.string().regex(jam, "Format jam: HH:mm"),
  interval: z.union([z.literal(30), z.literal(60), z.literal(90), z.literal(120)]),
  kuota: z.number().int().positive().max(1000),
  hari: z.array(z.number().int().min(0).max(6)).min(1).max(7),
}).strict().refine((v) => v.sampai >= v.dari, {
  message: "Tanggal sampai harus setelah tanggal mulai",
  path: ["sampai"],
}).refine((v) => v.sampai <= tambahHari(v.dari, 31), {
  message: "Rentang maksimal 31 hari",
  path: ["sampai"],
}).refine((v) => v.jam_mulai < v.jam_selesai, {
  message: "Jam selesai harus setelah jam mulai",
  path: ["jam_selesai"],
});

function menit(teks: string): number {
  return Number(teks.slice(0, 2)) * 60 + Number(teks.slice(3, 5));
}

/** Buat slot berulang untuk rentang tanggal dan jam tertentu. */
export async function POST(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const kunci = `slot-massal:${pengguna?.id ?? "pemilik"}`;
    if (!(await izinLaju(kunci, 20, 60 * 1000))) {
      return NextResponse.json({ pesan: "Terlalu banyak permintaan. Coba lagi sebentar." }, { status: 429 });
    }
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    const hariDipilih = new Set(badan.hari);
    const slots: { tanggal: string; jam: string; kuota: number }[] = [];
    const awal = menit(badan.jam_mulai);
    const akhir = menit(badan.jam_selesai);
    for (let tanggal = badan.dari; tanggal <= badan.sampai; tanggal = tambahHari(tanggal, 1)) {
      const hari = new Date(`${tanggal}T00:00:00Z`).getUTCDay();
      if (!hariDipilih.has(hari)) continue;
      for (let m = awal; m < akhir; m += badan.interval) {
        slots.push({
          tanggal,
          jam: `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`,
          kuota: badan.kuota,
        });
      }
    }
    if (slots.length === 0) {
      return NextResponse.json({ pesan: "Tidak ada slot yang dibuat. Periksa hari yang dipilih." }, { status: 400 });
    }
    if (slots.length > 150) {
      return NextResponse.json({ pesan: "Terlalu banyak slot. Persempit tanggal atau perbesar interval." }, { status: 400 });
    }
    await simpanSlotMassal(slots, pengguna?.id);
    return NextResponse.json({ berhasil: true, dibuat: slots.length });
  } catch (kesalahan) {
    return galat(kesalahan) as NextResponse;
  }
}
