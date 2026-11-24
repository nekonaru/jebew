import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat, izinLaju } from "@/lib/api-final.ts";
import { ambilPreorder, selesaikanPreorder, simpanPreorder, ubahStatusPreorder } from "@/lib/final/transaksi.ts";
import { ambilPengaturan } from "@/lib/final/pengaturan.ts";
import { penggunaSaatIni } from "@/lib/auth.ts";
import { susunPesanWhatsApp, tautanWhatsApp } from "@/lib/wa.ts";

export const runtime = "nodejs";

const item = z.object({ menu_id: z.number().int().positive(), varian_id: z.number().int().positive().nullable(), jumlah: z.number().int().positive().max(100) }).strict();

export async function GET() {
  try {
    if (!(await penggunaSaatIni())) {
      return NextResponse.json({ pesan: "Silakan masuk" }, { status: 401 });
    }
    return NextResponse.json({ preorder: await ambilPreorder() });
  } catch (e) { return galat(e) as NextResponse; }
}

const skema = z.object({
  items: z.array(item).min(1).max(30),
  nama_pelanggan: z.string().trim().min(1).max(100),
  whatsapp: z.string().trim().regex(/^[0-9+\-() ]{8,20}$/),
  waktu_ambil: z.string().trim().min(4).max(100),
  slot_id: z.number().int().positive().nullable(),
  catatan: z.string().trim().max(300),
}).strict();

export async function POST(req: Request) {
  try {
    const { penolakan } = await aman(req, "publik");
    if (penolakan) return penolakan;
    const kunci = `preorder:${req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "lokal"}`;
    if (!(await izinLaju(kunci, 5, 60 * 1000))) {
      return NextResponse.json({ pesan: "Terlalu banyak pre-order. Coba lagi sebentar." }, { status: 429 });
    }
    const badan = skema.parse(await req.json());
    const hasil = await simpanPreorder(badan);
    const pengaturan = await ambilPengaturan();
    const pesan = susunPesanWhatsApp({
      kode: `${hasil.kode} / ${hasil.kode_lacak}`,
      namaPelanggan: badan.nama_pelanggan,
      whatsapp: badan.whatsapp,
      waktuAmbil: badan.waktu_ambil,
      catatan: badan.catatan,
      items: hasil.items.map((i) => ({
        namaMenu: i.nama_varian ? `${i.nama_menu} (${i.nama_varian})` : i.nama_menu,
        hargaSatuan: i.harga_satuan,
        jumlah: i.jumlah,
      })),
      namaUsaha: pengaturan.nama_usaha ?? "Warung Kak Ikaa",
    });
    return NextResponse.json({
      ...hasil,
      pesan,
      tautan: tautanWhatsApp(pengaturan.whatsapp_admin ?? "6282173282591", pesan),
    }, { status: 201 });
  } catch (e) { return galat(e) as NextResponse; }
}

export async function PUT(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "masuk");
    if (penolakan) return penolakan;
    const badan = z.object({
      id: z.number().int().positive(),
      status: z.enum(["diproses", "selesai", "batal"]),
    }).strict().parse(await req.json());
    if (badan.status === "selesai") await selesaikanPreorder(badan.id, pengguna);
    else await ubahStatusPreorder(badan.id, badan.status, pengguna);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
