import { NextResponse } from "next/server";
import {
  asalValid,
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

async function izin(permintaan: Request): Promise<boolean> {
  return asalValid(permintaan) && (await sudahMasuk());
}

function ditolak(): NextResponse {
  return NextResponse.json({ pesan: "Silakan masuk ke dashboard admin" }, { status: 401 });
}

export async function GET() {
  if (!(await sudahMasuk())) return ditolak();
  return NextResponse.json({ bahan: ambilBahan() });
}

export async function POST(permintaan: Request) {
  try {
    if (!(await izin(permintaan))) return ditolak();
    const badan = skemaBahan.parse(await permintaan.json());
    return NextResponse.json({ id: simpanBahan(badan) }, { status: 201 });
  } catch (kesalahan) {
    return tanggapiGalat(kesalahan);
  }
}

export async function PUT(permintaan: Request) {
  try {
    if (!(await izin(permintaan))) return ditolak();
    const badan = skemaUbah.parse(await permintaan.json());
    return NextResponse.json({ id: simpanBahan(badan.data, badan.id) });
  } catch (kesalahan) {
    return tanggapiGalat(kesalahan);
  }
}

export async function PATCH(permintaan: Request) {
  try {
    if (!(await izin(permintaan))) return ditolak();
    const badan = await permintaan.json();
    if ("tambahan" in badan) {
      const data = skemaRestockBahan.parse(badan);
      restockBahan(data.id, data.tambahan);
    } else {
      const data = skemaStokBahan.parse(badan);
      ubahStokBahan(data.id, data.data.stok);
    }
    return NextResponse.json({ berhasil: true });
  } catch (kesalahan) {
    return tanggapiGalat(kesalahan);
  }
}

export async function DELETE(permintaan: Request) {
  try {
    if (!(await izin(permintaan))) return ditolak();
    const badan = skemaHapus.parse(await permintaan.json());
    hapusBahan(badan.id);
    return NextResponse.json({ berhasil: true });
  } catch (kesalahan) {
    return tanggapiGalat(kesalahan);
  }
}
