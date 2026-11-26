import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat } from "@/lib/api-final.ts";
import { penggunaSaatIni } from "@/lib/auth.ts";
import { ambilPengguna, hapusPengguna, simpanPengguna } from "@/lib/final/pengaturan.ts";

export const runtime = "nodejs";

export async function GET() {
  try {
    const pengguna = await penggunaSaatIni();
    if (pengguna?.peran !== "pemilik") {
      return NextResponse.json({ pesan: "Hanya pemilik yang bisa mengelola pengguna" }, { status: 403 });
    }
    return NextResponse.json({ pengguna: await ambilPengguna() });
  } catch (e) { return galat(e) as NextResponse; }
}

const skema = z.object({
  email: z.string().email(),
  nama: z.string().trim().min(1).max(100),
  kata_sandi: z.union([z.literal(""), z.string().min(6, "Kata sandi minimal 6 karakter").max(100)]).optional(),
  peran: z.enum(["pemilik", "kasir"]),
  aktif: z.boolean(),
}).strict();

export async function POST(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    await simpanPengguna(skema.parse(await req.json()), undefined, pengguna?.id);
    return NextResponse.json({ berhasil: true }, { status: 201 });
  } catch (e) { return galat(e) as NextResponse; }
}

export async function PUT(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = z.object({ id: z.number().int().positive(), data: skema }).strict().parse(await req.json());
    await simpanPengguna(badan.data, badan.id, pengguna?.id);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}

export async function DELETE(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = z.object({ id: z.number().int().positive() }).strict().parse(await req.json());
    await hapusPengguna(badan.id, pengguna?.id);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
