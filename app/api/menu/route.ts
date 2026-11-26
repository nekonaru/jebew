import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat , bacaJsonTerbatasi} from "@/lib/api-final.ts";
import { ambilMenu, hapusMenu, simpanMenu } from "@/lib/final/menu.ts";
import { penggunaSaatIni } from "@/lib/auth.ts";

export const runtime = "nodejs";

const itemResep = z.object({ bahan_id: z.number().int().positive(), jumlah_per_porsi: z.number().finite().positive() }).strict();
const skema = z.object({
  nama: z.string().trim().min(1).max(100),
  harga: z.number().int().min(0).max(100000000),
  deskripsi: z.string().trim().max(500),
  kategori: z.string().trim().min(1).max(60),
  foto: z.string().trim().max(300).nullable(),
  aktif: z.boolean(),
  resep: z.array(itemResep).min(1).max(20),
  varian: z.array(z.object({
    id: z.number().int().positive().optional(),
    nama: z.string().trim().min(1).max(50),
    harga_tambahan: z.number().int().min(0).max(10000000),
    aktif: z.boolean(),
    resep: z.array(itemResep).max(20),
  }).strict()).max(10),
}).strict();

export async function GET() {
  try {
    const pengguna = await penggunaSaatIni();
    if (!pengguna) {
      return NextResponse.json({ pesan: "Silakan masuk" }, { status: 401 });
    }
    const daftar = await ambilMenu();
    if (pengguna.peran !== "pemilik") {
      return NextResponse.json({
        menu: daftar.map(({ hpp: _hpp, resep: _resep, ...m }) => ({
          ...m,
          varian: m.varian.map(({ resep: _r, ...v }) => v),
        })),
      });
    }
    return NextResponse.json({ menu: daftar });
  } catch (e) { return galat(e) as NextResponse; }
}

export async function POST(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const id = await simpanMenu(skema.parse(await bacaJsonTerbatasi(req)), undefined, pengguna);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) { return galat(e) as NextResponse; }
}

export async function PUT(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = z.object({ id: z.number().int().positive(), data: skema }).strict().parse(await bacaJsonTerbatasi(req));
    await simpanMenu(badan.data, badan.id, pengguna);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}

export async function DELETE(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = z.object({ id: z.number().int().positive() }).strict().parse(await bacaJsonTerbatasi(req));
    await hapusMenu(badan.id, pengguna);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
