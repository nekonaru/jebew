import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat } from "@/lib/api-final.ts";
import { denganTransaksi, jalankan, query, querySatu } from "@/lib/database.ts";
import { catatAudit } from "@/lib/audit.ts";

export const runtime = "nodejs";

const skema = z.object({ nama: z.string().trim().min(1).max(100) }).strict();

function galatSimpan(kesalahan: unknown): NextResponse {
  if (typeof kesalahan === "object" && kesalahan !== null && "code" in kesalahan) {
    if (kesalahan.code === "23505") {
      return NextResponse.json({ pesan: "Nama kategori sudah dipakai" }, { status: 400 });
    }
    if (kesalahan.code === "23503") {
      return NextResponse.json({ pesan: "Kategori masih dipakai pengeluaran" }, { status: 400 });
    }
  }
  return galat(kesalahan) as NextResponse;
}

export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "masuk");
    if (penolakan) return penolakan;
    return NextResponse.json({
      kategori: await query("SELECT id, nama FROM kategori_pengeluaran ORDER BY nama"),
    });
  } catch (kesalahan) {
    return galatSimpan(kesalahan);
  }
}

export async function POST(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = skema.parse(await req.json());
    const id = await denganTransaksi(async () => {
      const baris = await querySatu<{ id: number }>(
        "INSERT INTO kategori_pengeluaran (nama) VALUES ($1) RETURNING id", [badan.nama],
      );
      await catatAudit(pengguna, "tambah", "kategori_pengeluaran", badan.nama);
      return baris!.id;
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (kesalahan) {
    return galatSimpan(kesalahan);
  }
}

export async function PUT(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = z.object({ id: z.number().int().positive(), nama: skema.shape.nama }).strict().parse(await req.json());
    let tidakAda = false;
    await denganTransaksi(async () => {
      const ada = await querySatu("SELECT id FROM kategori_pengeluaran WHERE id = $1 FOR UPDATE", [badan.id]);
      if (!ada) { tidakAda = true; return; }
      await jalankan("UPDATE kategori_pengeluaran SET nama = $1 WHERE id = $2", [badan.nama, badan.id]);
      await catatAudit(pengguna, "ubah", "kategori_pengeluaran", `${badan.id} menjadi ${badan.nama}`);
    });
    if (tidakAda) return NextResponse.json({ pesan: "Kategori tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ berhasil: true });
  } catch (kesalahan) {
    return galatSimpan(kesalahan);
  }
}

export async function DELETE(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const teksId = new URL(req.url).searchParams.get("id") ?? "";
    if (!/^\d+$/.test(teksId)) return NextResponse.json({ pesan: "Id tidak valid" }, { status: 400 });
    const id = Number(teksId);
    let dipakai = false;
    let tidakAda = false;
    await denganTransaksi(async () => {
      const baris = await querySatu<{ ada: boolean; dipakai: number }>(
        `SELECT (SELECT COUNT(*) FROM kategori_pengeluaran WHERE id = $1) > 0 AS ada,
                (SELECT COUNT(*) FROM pengeluaran WHERE kategori_id = $1) AS dipakai`,
        [id],
      );
      if (!baris?.ada) { tidakAda = true; return; }
      if (Number(baris.dipakai) > 0) { dipakai = true; return; }
      await jalankan("DELETE FROM kategori_pengeluaran WHERE id = $1", [id]);
      await catatAudit(pengguna, "hapus", "kategori_pengeluaran", String(id));
    });
    if (tidakAda) return NextResponse.json({ pesan: "Kategori tidak ditemukan" }, { status: 404 });
    if (dipakai) return NextResponse.json({ pesan: "Kategori masih dipakai pengeluaran" }, { status: 400 });
    return NextResponse.json({ berhasil: true });
  } catch (kesalahan) {
    return galatSimpan(kesalahan);
  }
}
