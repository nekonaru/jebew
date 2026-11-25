import { NextResponse } from "next/server";
import { z } from "zod";
import { buatToken, penggunaSaatIni, pilihanCookie, verifikasiLogin } from "@/lib/auth.ts";
import { asalValid, galat, izinLaju } from "@/lib/api-final.ts";

export const runtime = "nodejs";

const skemaLogin = z.object({ email: z.string().email(), kata_sandi: z.string().min(6).max(100) }).strict();

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
    const panjang = Number(permintaan.headers.get("content-length") ?? "0");
    if (Number.isFinite(panjang) && panjang > 4096) {
      return NextResponse.json({ pesan: "Permintaan terlalu besar" }, { status: 413 });
    }
    const badan = skemaLogin.parse(await permintaan.json());
    const email = badan.email.toLowerCase();
    const alamat = permintaan.headers.get("x-real-ip")
      ?? permintaan.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim()
      ?? "lokal";
    const kunci = `login:${alamat}:${email}`;
    const kunciKasar = `login-kasar:${alamat}`;
    if (!(await izinLaju(kunciKasar, 20, 10 * 60 * 1000))) {
      return NextResponse.json({ pesan: "Terlalu banyak percobaan. Coba lagi beberapa menit." }, { status: 429 });
    }

    const pengguna = await verifikasiLogin(email, badan.kata_sandi);
    if (!pengguna) {
      // Hanya percobaan gagal yang dihitung, supaya login sukses tidak mengunci alamat bersama.
      if (!(await izinLaju(kunci, 5, 10 * 60 * 1000))) {
        return NextResponse.json({ pesan: "Terlalu banyak percobaan. Coba lagi beberapa menit." }, { status: 429 });
      }
      return NextResponse.json({ pesan: "Email atau kata sandi salah" }, { status: 401 });
    }

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
