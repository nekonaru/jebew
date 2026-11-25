import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat } from "@/lib/api-final.ts";
import { denganTransaksi, jalankan, query, querySatu } from "@/lib/database.ts";
import { catatAudit } from "@/lib/audit.ts";

export const runtime = "nodejs";

const skema = z.object({ nama: z.string().trim().min(1).max(100) }).strict();

export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "masuk");
    if (penolakan) return penolakan;
    return NextResponse.json({
      kategori: await query("SELECT id, nama FROM kategori_pengeluaran ORDER BY nama"),
    });
  } catch (kesalahan) {
    return galat(kesalahan) as NextResponse;
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
    return galat(kesalahan) as NextResponse;
  }
}

export async function PUT(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const badan = z.object({ id: z.number().int().positive(), nama: skema.shape.nama }).strict().parse(await req.json());
    const ada = await querySatu("SELECT id FROM kategori_pengeluaran WHERE id = $1", [badan.id]);
    if (!ada) return NextResponse.json({ pesan: "Kategori tidak ditemukan" }, { status: 404 });
    await denganTransaksi(async () => {
      await jalankan("UPDATE kategori_pengeluaran SET nama = $1 WHERE id = $2", [badan.nama, badan.id]);
      await catatAudit(pengguna, "ubah", "kategori_pengeluaran", `${badan.id} menjadi ${badan.nama}`);
    });
    return NextResponse.json({ berhasil: true });
  } catch (kesalahan) {
    return galat(kesalahan) as NextResponse;
  }
}

export async function DELETE(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    const id = Number(new URL(req.url).searchParams.get("id") ?? 0);
    if (!id) return NextResponse.json({ pesan: "Id tidak valid" }, { status: 400 });
    const dipakai = await querySatu<{ jumlah: number }>(
      "SELECT COUNT(*) AS jumlah FROM pengeluaran WHERE kategori_id = $1", [id],
    );
    if (Number(dipakai?.jumlah ?? 0) > 0) {
      return NextResponse.json({ pesan: "Kategori masih dipakai pengeluaran" }, { status: 400 });
    }
    await denganTransaksi(async () => {
      await jalankan("DELETE FROM kategori_pengeluaran WHERE id = $1", [id]);
      await catatAudit(pengguna, "hapus", "kategori_pengeluaran", String(id));
    });
    return NextResponse.json({ berhasil: true });
  } catch (kesalahan) {
    return galat(kesalahan) as NextResponse;
  }
}
