import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat } from "@/lib/api-final.ts";
import { penggunaSaatIni } from "@/lib/auth.ts";
import { ambilBahan, hapusBahan, simpanBahan } from "@/lib/final/stok.ts";

export const runtime = "nodejs";

const skema = z.object({
  nama: z.string().trim().min(1).max(100),
  satuan: z.string().trim().min(1).max(20),
  stok: z.number().finite().min(0).max(1000000),
  stok_minimum: z.number().finite().min(0).max(1000000),
  harga_rata_rata: z.number().int().min(0).max(100000000),
  aktif: z.boolean(),
}).strict();

export async function GET() {
  try {
    const pengguna = await penggunaSaatIni();
    if (!pengguna) {
      return NextResponse.json({ pesan: "Silakan masuk" }, { status: 401 });
    }
    const semuaBahan = await ambilBahan();
    if (pengguna.peran !== "pemilik") {
      return NextResponse.json({
        bahan: semuaBahan.map(({ harga_rata_rata: _harga, ...b }) => b),
      });
    }
    const bahan = semuaBahan;
    const aktif = bahan.filter((b) => b.aktif);
    return NextResponse.json({
      bahan,
      ringkasan: {
        jumlah: aktif.length,
        menipis: aktif.filter((b) => b.menipis).length,
        nilai: aktif.reduce((n, b) => n + b.stok * b.harga_rata_rata, 0),
        terbesar: [...aktif]
          .sort((a, b) => (b.stok * b.harga_rata_rata) - (a.stok * a.harga_rata_rata))
          .slice(0, 5)
          .map((b) => ({ id: b.id, nama: b.nama, nilai: b.stok * b.harga_rata_rata })),
      },
    });
  } catch (e) { return galat(e) as NextResponse; }
}

export async function POST(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const id = await simpanBahan(skema.parse(await req.json()), undefined, pengguna);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) { return galat(e) as NextResponse; }
}

export async function PUT(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = z.object({ id: z.number().int().positive(), data: skema }).strict().parse(await req.json());
    await simpanBahan(badan.data, badan.id, pengguna);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}

export async function DELETE(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = z.object({ id: z.number().int().positive() }).strict().parse(await req.json());
    await hapusBahan(badan.id, pengguna);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
