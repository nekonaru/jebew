import { NextResponse } from "next/server";
import { aman, galat, izinLaju } from "@/lib/api-final.ts";
import { query } from "@/lib/database.ts";

export const runtime = "nodejs";

/** Menu yang sering dipesan bersamaan dengan menu tertentu. */
export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "publik");
    if (penolakan) return penolakan;
    const alamat = req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "lokal";
    if (!(await izinLaju(`rekomendasi:${alamat}`, 120, 60 * 1000))) {
      return NextResponse.json({ pesan: "Terlalu banyak permintaan. Coba lagi sebentar." }, { status: 429 });
    }
    const id = Number(new URL(req.url).searchParams.get("menu"));
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ pesan: "Menu tidak valid" }, { status: 400 });
    }
    const rekomendasi = await query(
      `SELECT ip2.menu_id AS id, m.nama, COUNT(*)::int AS jumlah
       FROM item_preorder ip1
       JOIN item_preorder ip2 ON ip2.preorder_id = ip1.preorder_id AND ip2.menu_id <> ip1.menu_id
       JOIN menu m ON m.id = ip2.menu_id
       JOIN preorder p ON p.id = ip1.preorder_id
       WHERE ip1.menu_id = $1 AND p.status <> 'batal'
         AND p.dibuat_pada >= (now() AT TIME ZONE 'Asia/Jakarta') - INTERVAL '30 days'
       GROUP BY ip2.menu_id, m.nama
       ORDER BY jumlah DESC, m.nama
       LIMIT 4`,
      [id],
    );
    return NextResponse.json({ rekomendasi });
  } catch (e) { return galat(e) as NextResponse; }
}
