import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat, izinLaju } from "@/lib/api-final.ts";
import { ambilPreorder, selesaikanPreorder, simpanPreorder, ubahStatusPreorder } from "@/lib/final/transaksi.ts";
import { ambilPengaturan } from "@/lib/final/pengaturan.ts";
import { penggunaSaatIni } from "@/lib/auth.ts";
import { susunPesanWhatsApp, tautanWhatsApp } from "@/lib/wa.ts";
import { jamMenitWIB, tanggalHariIni, tanggalValid } from "@/lib/format.ts";

export const runtime = "nodejs";

const item = z.object({ menu_id: z.number().int().positive(), varian_id: z.number().int().positive().nullable(), jumlah: z.number().int().positive().max(100) }).strict();

export async function GET(req: Request) {
  try {
    if (!(await penggunaSaatIni())) {
      return NextResponse.json({ pesan: "Silakan masuk" }, { status: 401 });
    }
    const p = new URL(req.url).searchParams;
    const dari = p.get("dari") ?? "";
    const sampai = p.get("sampai") ?? "";
    if ((dari && !tanggalValid(dari)) || (sampai && !tanggalValid(sampai)) || (dari && sampai && dari > sampai)) {
      return NextResponse.json({ pesan: "Rentang tanggal tidak valid" }, { status: 400 });
    }
    const filter = {
      cari: (p.get("cari") ?? "").trim().slice(0, 60),
      status: p.get("status") ?? "semua",
      dari,
      sampai,
    };
    const csvMode = p.get("format") === "csv";
    const daftar = await ambilPreorder(csvMode ? { ...filter, batas: 501 } : filter);
    if (csvMode) {
      const amanCsv = (teks: string) => {
        const nilai = /^[=+\-@\t\r]/.test(teks) ? `'${teks}` : teks;
        return `"${nilai.replace(/"/g, '""')}"`;
      };
      const baris = ["Kode,Kode lacak,Pelanggan,WhatsApp,Waktu ambil,Status,Total"];
      if (daftar.length > 500) {
        baris.push("# Dipotong: menampilkan 500 pesanan terbaru. Persempit filter untuk melihat sisanya.");
      }
      for (const po of daftar.slice(0, 500)) {
        baris.push([
          po.kode, po.kode_lacak, amanCsv(po.nama_pelanggan), amanCsv(po.whatsapp),
          amanCsv(po.waktu_ambil), po.status, po.total,
        ].join(","));
      }
      return new Response("\uFEFF" + baris.join("\r\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=\"preorder.csv\"",
          "Cache-Control": "no-store",
        },
      });
    }
    return NextResponse.json({ preorder: daftar });
  } catch (e) { return galat(e) as NextResponse; }
}

const skema = z.object({
  items: z.array(item).min(1).max(30),
  nama_pelanggan: z.string().trim().min(1).max(100),
  whatsapp: z.string().trim().regex(/^[0-9+\-() ]{8,20}$/),
  waktu_ambil: z.string().trim().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/, "Format waktu ambil: YYYY-MM-DD HH:mm")
    .refine((v) => tanggalValid(v.slice(0, 10)), "Tanggal tidak valid")
    .refine((v) => v.slice(0, 10) >= tanggalHariIni(), "Waktu ambil tidak boleh lampau")
    .refine((v) => {
      const jam = Number(v.slice(11, 13));
      const menit = Number(v.slice(14, 16));
      return jam >= 0 && jam < 24 && menit >= 0 && menit < 60;
    }, "Jam atau menit tidak valid")
    .refine((v) => {
      if (v.slice(0, 10) > tanggalHariIni()) return true;
      const sekarang = jamMenitWIB();
      const jam = Number(v.slice(11, 13));
      const menit = Number(v.slice(14, 16));
      return jam * 60 + menit > sekarang.jam * 60 + sekarang.menit;
    }, "Waktu ambil sudah lewat"),
  slot_id: z.number().int().positive().nullable(),
  catatan: z.string().trim().max(300),
}).strict();

export async function POST(req: Request) {
  try {
    const { penolakan } = await aman(req, "publik");
    if (penolakan) return penolakan;
    const kunci = `preorder:${req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "lokal"}`;
    if (!(await izinLaju(kunci, 5, 60 * 1000))) {
      return NextResponse.json({ pesan: "Terlalu banyak pre-order. Coba lagi sebentar." }, { status: 429 });
    }
    const pengaturan = await ambilPengaturan();
    if (pengaturan.toko_aktif === "false") {
      return NextResponse.json({ pesan: "Toko sedang tutup. Silakan coba lagi lain waktu." }, { status: 403 });
    }
    const nomorAdmin = process.env.WHATSAPP_ADMIN ?? pengaturan.whatsapp_admin ?? "";
    if (!nomorAdmin && process.env.NODE_ENV === "production") {
      return NextResponse.json({ pesan: "Nomor WhatsApp admin belum dikonfigurasi" }, { status: 500 });
    }
    const badan = skema.parse(await req.json());
    const hasil = await simpanPreorder(badan);
    const pesan = susunPesanWhatsApp({
      kode: `${hasil.kode} / ${hasil.kode_lacak}`,
      namaPelanggan: badan.nama_pelanggan,
      whatsapp: badan.whatsapp,
      waktuAmbil: badan.waktu_ambil,
      catatan: badan.catatan,
      items: hasil.items.map((i) => ({
        namaMenu: i.nama_varian ? `${i.nama_menu} (${i.nama_varian})` : i.nama_menu,
        hargaSatuan: i.harga_satuan,
        jumlah: i.jumlah,
      })),
      namaUsaha: pengaturan.nama_usaha ?? "Warung Kak Ikaa",
    });
    return NextResponse.json({
      kode: hasil.kode, kode_lacak: hasil.kode_lacak, total: hasil.total,
      items: hasil.items.map(({ hpp: _hpp, ...i }) => i),
      pesan,
      tautan: nomorAdmin ? tautanWhatsApp(nomorAdmin, pesan) : null,
    }, { status: 201 });
  } catch (e) { return galat(e) as NextResponse; }
}

export async function PUT(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "masuk");
    if (penolakan) return penolakan;
    const badan = z.object({
      id: z.number().int().positive(),
      status: z.enum(["diproses", "selesai", "batal"]),
      metode: z.enum(["tunai", "qris", "transfer"]).optional(),
    }).strict().parse(await req.json());
    if (badan.status === "selesai") await selesaikanPreorder(badan.id, pengguna, badan.metode ?? "tunai");
    else await ubahStatusPreorder(badan.id, badan.status, pengguna);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
