import { NextResponse } from "next/server";
import { z } from "zod";
import { asalValid, sudahMasuk, tanggapiGalat } from "@/lib/akses";
import { ambilMenu, hapusMenu, simpanMenu } from "@/lib/operasi";
import { skemaMenu } from "@/lib/validasi";

export const runtime = "nodejs";

const skemaUbah = z
  .object({ id: z.number().int().positive(), data: skemaMenu })
  .strict();
const skemaHapus = z.object({ id: z.number().int().positive() }).strict();

async function izin(permintaan: Request): Promise<boolean> {
  return asalValid(permintaan) && (await sudahMasuk());
}

function ditolak(): NextResponse {
  return NextResponse.json({ pesan: "Silakan masuk ke dashboard admin" }, { status: 401 });
}

export async function GET() {
  if (!(await sudahMasuk())) return ditolak();
  return NextResponse.json({ menu: ambilMenu() });
}

export async function POST(permintaan: Request) {
  try {
    if (!(await izin(permintaan))) return ditolak();
    const badan = skemaMenu.parse(await permintaan.json());
    return NextResponse.json({ id: simpanMenu(badan) }, { status: 201 });
  } catch (kesalahan) {
    return tanggapiGalat(kesalahan);
  }
}

export async function PUT(permintaan: Request) {
  try {
    if (!(await izin(permintaan))) return ditolak();
    const badan = skemaUbah.parse(await permintaan.json());
    return NextResponse.json({ id: simpanMenu(badan.data, badan.id) });
  } catch (kesalahan) {
    return tanggapiGalat(kesalahan);
  }
}

export async function DELETE(permintaan: Request) {
  try {
    if (!(await izin(permintaan))) return ditolak();
    const badan = skemaHapus.parse(await permintaan.json());
    hapusMenu(badan.id);
    return NextResponse.json({ berhasil: true });
  } catch (kesalahan) {
    return tanggapiGalat(kesalahan);
  }
}
