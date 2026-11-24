import { NextResponse } from "next/server";
import { sudahMasuk, tanggapiGalat } from "@/lib/akses";
import { ambilLaporan } from "@/lib/operasi";
import { tanggalHariIni } from "@/lib/format";

export const runtime = "nodejs";

export async function GET(permintaan: Request) {
  try {
    if (!(await sudahMasuk())) {
      return NextResponse.json({ pesan: "Silakan masuk ke dashboard admin" }, { status: 401 });
    }
    const parameter = new URL(permintaan.url).searchParams;
    const hariIni = tanggalHariIni();
    const dari = parameter.get("dari") ?? hariIni;
    const sampai = parameter.get("sampai") ?? hariIni;
    return NextResponse.json(await ambilLaporan(dari, sampai));
  } catch (kesalahan) {
    return tanggapiGalat(kesalahan);
  }
}
