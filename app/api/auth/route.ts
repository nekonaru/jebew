import { NextResponse } from "next/server";
import {
  alamatKlien,
  buatTokenSesi,
  catatKegagalan,
  cocokPin,
  hapusCatatanPercobaan,
  sudahMasuk,
  tanggapiGalat,
  pastikanAman,
  bolehMencoba,
  pilihanCookie,
} from "@/lib/akses";
import { skemaLogin } from "@/lib/validasi";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ masuk: await sudahMasuk() });
}

export async function POST(permintaan: Request) {
  try {
    const penolakan = await pastikanAman(permintaan, false);
    if (penolakan) return penolakan;

    const badan = skemaLogin.parse(await permintaan.json());
    const alamat = alamatKlien(permintaan);

    if (!bolehMencoba(alamat)) {
      return NextResponse.json(
        { pesan: "Terlalu banyak percobaan. Coba lagi beberapa menit." },
        { status: 429 },
      );
    }

    if (!cocokPin(badan.pin)) {
      catatKegagalan(alamat);
      return NextResponse.json({ pesan: "PIN salah" }, { status: 401 });
    }

    hapusCatatanPercobaan(alamat);
    const respons = NextResponse.json({ masuk: true });
    respons.cookies.set(pilihanCookie.name, buatTokenSesi(), {
      httpOnly: pilihanCookie.httpOnly,
      sameSite: pilihanCookie.sameSite,
      secure: pilihanCookie.secure,
      path: pilihanCookie.path,
      maxAge: pilihanCookie.maxAge,
    });
    return respons;
  } catch (kesalahan) {
    return tanggapiGalat(kesalahan);
  }
}

export async function DELETE() {
  const respons = NextResponse.json({ masuk: false });
  respons.cookies.set(pilihanCookie.name, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return respons;
}
