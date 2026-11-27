import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { aman, galat , bacaJsonTerbatasi} from "@/lib/api-final.ts";
import { ambilPengaturan, simpanPengaturan } from "@/lib/final/pengaturan.ts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "masuk");
    if (penolakan) return penolakan;
    return NextResponse.json(await ambilPengaturan());
  } catch (e) { return galat(e) as NextResponse; }
}

const skema = z.object({
  nama_usaha: z.string().trim().min(1).max(100),
  tagline: z.string().trim().max(150),
  whatsapp_admin: z.string().trim().regex(/^[0-9+\-() ]{8,20}$/),
  hari_buka: z.string().trim().regex(
    /^(?:Minggu|Senin|Selasa|Rabu|Kamis|Jumat|Sabtu)(?: - (?:Minggu|Senin|Selasa|Rabu|Kamis|Jumat|Sabtu))?$/,
    "Format hari: Senin - Minggu",
  ),
  jam_buka: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam: HH:mm"),
  jam_tutup: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam: HH:mm"),
  toko_aktif: z.enum(["true", "false"]),
  preorder_aktif: z.enum(["true", "false"]),
  preorder_jam_buka: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam: HH:mm"),
  preorder_jam_tutup: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam: HH:mm"),
  alamat_usaha: z.string().trim().max(200).optional(),
  peta_usaha: z.string().trim().max(500).optional(),
  deskripsi_usaha: z.string().trim().max(1000).optional(),
  email_usaha: z.union([z.literal(""), z.string().email()]).optional(),
  instagram_usaha: z.string().trim().max(100).optional(),
  logo_url: z.string().trim().max(500).optional(),
  pemeliharaan: z.enum(["true", "false"]).optional(),
  banner_judul: z.string().trim().max(100).optional(),
  banner_isi: z.string().trim().max(300).optional(),
  banner_tautan: z.string().trim().max(500).optional(),
  minimum_preorder: z.union([z.literal(""), z.string().regex(/^\d+$/)]).optional(),
  biaya_kirim: z.union([z.literal(""), z.string().regex(/^\d+$/)]).optional(),
  bundling_aktif: z.enum(["true", "false"]).optional(),
  bundling_min: z.union([z.literal(""), z.string().regex(/^\d+$/)]).optional(),
  bundling_diskon: z.union([z.literal(""), z.string().regex(/^\d+$/)]).optional(),
  batal_batas_menit: z.union([z.literal(""), z.string().regex(/^\d+$/)]).optional(),
  qris_gambar: z.string().trim().max(500).optional(),
  qris_teks: z.string().trim().max(300).optional(),
  ppn_aktif: z.enum(["true", "false"]).optional(),
  ppn_persen: z.union([z.literal(""), z.string().regex(/^\d+$/)]).optional(),
}).strict();

export async function PUT(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    await simpanPengaturan(skema.parse(await bacaJsonTerbatasi(req)), pengguna?.id);
    revalidateTag("status-final");
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
