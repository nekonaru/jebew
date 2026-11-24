import { NextResponse } from "next/server";
import { z } from "zod";
import { sudahMasuk, tanggapiGalat } from "@/lib/akses";
import { ambilLaporan } from "@/lib/operasi";
import { tanggalHariIni } from "@/lib/format";

export const runtime = "nodejs";

const skemaRentang = z
  .object({
    dari: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sampai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict()
  .superRefine((nilai, konteks) => {
    const awal = new Date(`${nilai.dari}T00:00:00Z`);
    const akhir = new Date(`${nilai.sampai}T00:00:00Z`);
    if (Number.isNaN(awal.getTime()) || Number.isNaN(akhir.getTime())) {
      konteks.addIssue({ code: z.ZodIssueCode.custom, message: "Tanggal tidak valid" });
      return;
    }
    if (awal > akhir) {
      konteks.addIssue({ code: z.ZodIssueCode.custom, message: "Tanggal awal harus sebelum tanggal akhir" });
    }
  });

export async function GET(permintaan: Request) {
  try {
    if (!(await sudahMasuk())) {
      return NextResponse.json({ pesan: "Silakan masuk ke dashboard admin" }, { status: 401 });
    }
    const parameter = new URL(permintaan.url).searchParams;
    const hariIni = tanggalHariIni();
    const rentang = skemaRentang.parse({
      dari: parameter.get("dari") ?? hariIni,
      sampai: parameter.get("sampai") ?? hariIni,
    });
    return NextResponse.json(await ambilLaporan(rentang.dari, rentang.sampai));
  } catch (kesalahan) {
    return tanggapiGalat(kesalahan);
  }
}
