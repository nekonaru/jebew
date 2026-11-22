import { NextResponse } from "next/server";
import { pastikanAman, tanggapiGalat } from "@/lib/akses";
import { catatPenjualan } from "@/lib/operasi";
import { skemaKasir } from "@/lib/validasi";

export const runtime = "nodejs";

export async function POST(permintaan: Request) {
  try {
    const penolakan = await pastikanAman(permintaan, true);
    if (penolakan) return penolakan;
    const badan = skemaKasir.parse(await permintaan.json());
    const hasil = catatPenjualan(badan);
    return NextResponse.json(hasil, { status: 201 });
  } catch (kesalahan) {
    return tanggapiGalat(kesalahan);
  }
}
