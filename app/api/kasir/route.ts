import { NextResponse } from "next/server";
import { asalValid, sudahMasuk, tanggapiGalat } from "@/lib/akses";
import { catatPenjualan } from "@/lib/operasi";
import { skemaKasir } from "@/lib/validasi";

export const runtime = "nodejs";

export async function POST(permintaan: Request) {
  try {
    if (!asalValid(permintaan) || !(await sudahMasuk())) {
      return NextResponse.json({ pesan: "Silakan masuk ke dashboard admin" }, { status: 401 });
    }
    const badan = skemaKasir.parse(await permintaan.json());
    const hasil = catatPenjualan(badan);
    return NextResponse.json(hasil, { status: 201 });
  } catch (kesalahan) {
    return tanggapiGalat(kesalahan);
  }
}
