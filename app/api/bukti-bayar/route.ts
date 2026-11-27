import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, bacaJsonTerbatasi, galat, izinLaju } from "@/lib/api-final.ts";
import { jalankan, querySatu } from "@/lib/database.ts";

export const runtime = "nodejs";

const skema = z.object({
  kode_lacak: z.string().trim().min(4).max(20),
  data_url: z.string().startsWith("data:image/").max(400000),
}).strict();

/** Simpan bukti transfer sebagai data URL kecil pada pesanan. */
export async function POST(req: Request) {
  try {
    const { penolakan } = await aman(req, "publik");
    if (penolakan) return penolakan;
    const alamat = req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "lokal";
    if (!(await izinLaju(`bukti:${alamat}`, 10, 60 * 1000))) {
      return NextResponse.json({ pesan: "Terlalu banyak unggahan. Coba lagi sebentar." }, { status: 429 });
    }
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(badan.data_url)) {
      return NextResponse.json({ pesan: "Format gambar tidak didukung" }, { status: 400 });
    }
    const ada = await querySatu<{ id: number }>(
      "SELECT id FROM preorder WHERE kode_lacak = $1", [badan.kode_lacak.trim().toUpperCase()],
    );
    if (!ada) return NextResponse.json({ pesan: "Pesanan tidak ditemukan" }, { status: 404 });
    await jalankan("UPDATE preorder SET bukti_bayar = $1 WHERE id = $2",
      [badan.data_url, ada.id]);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
