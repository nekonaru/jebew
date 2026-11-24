import { NextResponse } from "next/server";
import {
  pastikanAman,
  sudahMasuk,
  tanggapiGalat,
} from "@/lib/akses";
import {
  ambilBahan,
  hapusBahan,
  restockBahan,
  simpanBahan,
  ubahStokBahan,
} from "@/lib/operasi";
import { skemaBahan, skemaPenyesuaianStok, skemaRestock } from "@/lib/validasi";
import { z } from "zod";

export const runtime = "nodejs";

const skemaHapus = z.object({ id: z.number().int().positive() }).strict();
const skemaUbah = z
  .object({ id: z.number().int().positive(), data: skemaBahan })
  .strict();
const skemaRestockBahan = z
  .object({ id: z.number().int().positive(), tambahan: skemaRestock.shape.tambahan })
  .strict();
const skemaStokBahan = z
  .object({ id: z.number().int().positive(), data: skemaPenyesuaianStok })
  .strict();

async function izin(permintaan: Request): Promise<Response | null> {
  return pastikanAman(permintaan, true);
}

function ditolak(): NextResponse {
  return NextResponse.json({ pesan: "Silakan masuk ke dashboard admin" }, { status: 401 });
}

export async function GET() {
  if (!(await sudahMasuk())) return ditolak();
  return NextResponse.json({ bahan: await ambilBahan() });
}

export async function POST(permintaan: Request) {
  try {
    const penolakan = await izin(permintaan);
    if (penolakan) return penolakan;
    const badan = skemaBahan.parse(await permintaan.json());
    return NextResponse.json({ id: await simpanBahan(badan) }, { status: 201 });
  } catch (kesalahan) {
    return tanggapiGalat(kesalahan);
  }
}

export async function PUT(permintaan: Request) {
  try {
    const penolakan = await izin(permintaan);
    if (penolakan) return penolakan;
    const badan = skemaUbah.parse(await permintaan.json());
    return NextResponse.json({ id: await simpanBahan(badan.data, badan.id) });
  } catch (kesalahan) {
    return tanggapiGalat(kesalahan);
  }
}

export async function PATCH(permintaan: Request) {
  try {
    const penolakan = await izin(permintaan);
    if (penolakan) return penolakan;
    const badan = await permintaan.json();
    if ("tambahan" in badan) {
      const data = skemaRestockBahan.parse(badan);
      await restockBahan(data.id, data.tambahan);
    } else {
      const data = skemaStokBahan.parse(badan);
      await ubahStokBahan(data.id, data.data.stok);
    }
    return NextResponse.json({ berhasil: true });
  } catch (kesalahan) {
    return tanggapiGalat(kesalahan);
  }
}

export async function DELETE(permintaan: Request) {
  try {
    const penolakan = await izin(permintaan);
    if (penolakan) return penolakan;
    const badan = skemaHapus.parse(await permintaan.json());
    await hapusBahan(badan.id);
    return NextResponse.json({ berhasil: true });
  } catch (kesalahan) {
    return tanggapiGalat(kesalahan);
  }
}
