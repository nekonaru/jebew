import { NextResponse } from "next/server";
import { z } from "zod";
import { asalValid, sudahMasuk, tanggapiGalat } from "@/lib/akses";
import { ambilPengaturan, ambilPreorder, simpanPreorder, ubahStatusPreorder } from "@/lib/operasi";
import { skemaPreorder, skemaStatusPreorder } from "@/lib/validasi";
import { susunPesanWhatsApp, tautanWhatsApp } from "@/lib/wa";

export const runtime = "nodejs";

const skemaUbahStatus = z
  .object({ id: z.number().int().positive(), status: skemaStatusPreorder.shape.status })
  .strict();

export async function GET() {
  if (!(await sudahMasuk())) {
    return NextResponse.json({ pesan: "Silakan masuk ke dashboard admin" }, { status: 401 });
  }
  return NextResponse.json({ preorder: ambilPreorder() });
}

export async function POST(permintaan: Request) {
  try {
    if (!asalValid(permintaan)) {
      return NextResponse.json({ pesan: "Asal permintaan tidak valid" }, { status: 403 });
    }
    const badan = skemaPreorder.parse(await permintaan.json());
    const hasil = simpanPreorder(badan);
    const pengaturan = ambilPengaturan();
    const pesan = susunPesanWhatsApp({
      kode: hasil.kode,
      namaPelanggan: badan.nama_pelanggan,
      whatsapp: badan.whatsapp,
      waktuAmbil: badan.waktu_ambil,
      catatan: badan.catatan,
      items: hasil.items.map((item) => ({
        namaMenu: item.nama_menu,
        hargaSatuan: item.harga_satuan,
        jumlah: item.jumlah,
      })),
      namaUsaha: pengaturan.nama_usaha,
    });

    return NextResponse.json(
      {
        kode: hasil.kode,
        total: hasil.total,
        pesan,
        tautan: tautanWhatsApp(pengaturan.whatsapp_admin, pesan),
      },
      { status: 201 },
    );
  } catch (kesalahan) {
    return tanggapiGalat(kesalahan);
  }
}

export async function PUT(permintaan: Request) {
  try {
    if (!asalValid(permintaan) || !(await sudahMasuk())) {
      return NextResponse.json({ pesan: "Silakan masuk ke dashboard admin" }, { status: 401 });
    }
    const badan = skemaUbahStatus.parse(await permintaan.json());
    ubahStatusPreorder(badan.id, badan.status);
    return NextResponse.json({ berhasil: true });
  } catch (kesalahan) {
    return tanggapiGalat(kesalahan);
  }
}
