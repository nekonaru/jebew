import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, bacaJsonTerbatasi, galat, izinLaju } from "@/lib/api-final.ts";
import { jalankan, query } from "@/lib/database.ts";
import { nomorWhatsApp } from "@/lib/wa.ts";

export const runtime = "nodejs";

const skema = z.object({ whatsapp: z.string().trim().regex(/^[0-9+\-() ]{8,20}$/) }).strict();

function kunci(req: Request): string {
  return `privasi:${req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "lokal"}`;
}

/** Unduh seluruh data pelanggan yang tersimpan. */
export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "publik");
    if (penolakan) return penolakan;
    if (!(await izinLaju(kunci(req), 10, 60 * 1000))) {
      return NextResponse.json({ pesan: "Terlalu banyak permintaan. Coba lagi sebentar." }, { status: 429 });
    }
    const whatsapp = new URL(req.url).searchParams.get("whatsapp") ?? "";
    const hasil = skema.safeParse({ whatsapp });
    if (!hasil.success) return NextResponse.json({ pesan: "Nomor WhatsApp tidak valid" }, { status: 400 });
    const nomor = nomorWhatsApp(hasil.data.whatsapp);
    if (!nomor) return NextResponse.json({ pesan: "Nomor WhatsApp tidak valid" }, { status: 400 });
    const [preorder, poin, ulasan, survei] = await Promise.all([
      query("SELECT kode, nama_pelanggan, whatsapp, waktu_ambil, status, catatan, dibuat_pada FROM preorder WHERE whatsapp = $1", [nomor]),
      query("SELECT poin, total_belanja, dibuat_pada FROM poin_pelanggan WHERE whatsapp = $1", [nomor]),
      query(`SELECT u.rating, u.komentar, u.dibuat_pada FROM ulasan u
             JOIN preorder p ON p.kode_lacak = u.kode_lacak WHERE p.whatsapp = $1`, [nomor]),
      query(`SELECT s.nilai, s.komentar, s.dibuat_pada FROM survei s
             JOIN preorder p ON p.kode_lacak = s.kode_lacak WHERE p.whatsapp = $1`, [nomor]),
    ]);
    return NextResponse.json({ whatsapp: nomor, preorder, poin, ulasan, survei });
  } catch (e) { return galat(e) as NextResponse; }
}

/** Anonimisasi data pelanggan. */
export async function DELETE(req: Request) {
  try {
    const { penolakan } = await aman(req, "publik");
    if (penolakan) return penolakan;
    if (!(await izinLaju(kunci(req), 5, 60 * 1000))) {
      return NextResponse.json({ pesan: "Terlalu banyak permintaan. Coba lagi sebentar." }, { status: 429 });
    }
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    const nomor = nomorWhatsApp(badan.whatsapp);
    const konfirmasi = new URL(req.url).searchParams.get("konfirmasi");
    if (!nomor) return NextResponse.json({ pesan: "Nomor WhatsApp tidak valid" }, { status: 400 });
    if (konfirmasi !== "HAPUS") {
      return NextResponse.json({ pesan: "Tambahkan ?konfirmasi=HAPUS untuk menganonimisasi data" }, { status: 400 });
    }
    const kode = await query<{ kode_lacak: string }>(
      "SELECT kode_lacak FROM preorder WHERE whatsapp = $1", [nomor],
    );
    for (const baris of kode) {
      await jalankan("DELETE FROM ulasan WHERE kode_lacak = $1", [baris.kode_lacak]);
      await jalankan("DELETE FROM survei WHERE kode_lacak = $1", [baris.kode_lacak]);
    }
    await jalankan(
      "UPDATE preorder SET nama_pelanggan = 'Pelanggan', catatan = '', whatsapp = 'ANON' || RIGHT(whatsapp, 4) WHERE whatsapp = $1",
      [nomor],
    );
    await jalankan("DELETE FROM poin_pelanggan WHERE whatsapp = $1", [nomor]);
    await jalankan("DELETE FROM poin_mutasi WHERE whatsapp = $1", [nomor]);
    return NextResponse.json({ berhasil: true, pesanan: kode.length });
  } catch (e) { return galat(e) as NextResponse; }
}
