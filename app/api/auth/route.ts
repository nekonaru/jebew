import { NextResponse } from "next/server";
import { z } from "zod";
import { buatToken, penggunaSaatIni, pilihanCookie, verifikasiLogin } from "@/lib/auth.ts";
import { asalValid, galat } from "@/lib/api-final.ts";

export const runtime = "nodejs";

const skemaLogin = z.object({ email: z.string().email(), kata_sandi: z.string().min(6).max(100) }).strict();
const percobaan = new Map<string, { jumlah: number; reset: number }>();

export async function GET() {
  const pengguna = await penggunaSaatIni();
  return NextResponse.json({
    masuk: Boolean(pengguna),
    pengguna: pengguna ? { nama: pengguna.nama, peran: pengguna.peran } : null,
  });
}

export async function POST(permintaan: Request) {
  try {
    if (!asalValid(permintaan)) {
      return NextResponse.json({ pesan: "Asal permintaan tidak valid" }, { status: 403 });
    }
    const badan = skemaLogin.parse(await permintaan.json());
    const kunci = permintaan.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "lokal";
    const sekarang = Date.now();
    const catatan = percobaan.get(kunci);
    if (catatan && catatan.reset > sekarang && catatan.jumlah >= 5) {
      return NextResponse.json({ pesan: "Terlalu banyak percobaan. Coba lagi sebentar." }, { status: 429 });
    }

    const pengguna = await verifikasiLogin(badan.email.toLowerCase(), badan.kata_sandi);
    if (!pengguna) {
      percobaan.set(kunci, {
        jumlah: (catatan && catatan.reset > sekarang ? catatan.jumlah : 0) + 1,
        reset: sekarang + 10 * 60 * 1000,
      });
      return NextResponse.json({ pesan: "Email atau kata sandi salah" }, { status: 401 });
    }
    percobaan.delete(kunci);

    const respons = NextResponse.json({ masuk: true, pengguna });
    respons.cookies.set(pilihanCookie.name, buatToken(pengguna), {
      httpOnly: pilihanCookie.httpOnly,
      sameSite: pilihanCookie.sameSite,
      secure: pilihanCookie.secure,
      path: pilihanCookie.path,
      maxAge: pilihanCookie.maxAge,
    });
    return respons;
  } catch (kesalahan) {
    return galat(kesalahan) as NextResponse;
  }
}

export async function DELETE() {
  const respons = NextResponse.json({ masuk: false });
  respons.cookies.set(pilihanCookie.name, "", {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 0,
  });
  return respons;
}
