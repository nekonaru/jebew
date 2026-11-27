import { NextResponse } from "next/server";
import { z } from "zod";
import { aman, galat, izinLaju , bacaJsonTerbatasi} from "@/lib/api-final.ts";
import { ambilPreorder, selesaikanPreorder, simpanPreorder, ubahStatusPreorder } from "@/lib/final/transaksi.ts";
import { ambilPengaturan } from "@/lib/final/pengaturan.ts";
import { penggunaSaatIni } from "@/lib/auth.ts";
import { susunPesanWhatsApp, tautanWhatsApp } from "@/lib/wa.ts";
import { jamMenitWIB, tanggalHariIni, tanggalValid } from "@/lib/format.ts";
import { statusPreorder } from "@/lib/jadwal.ts";
import {
  ambilHariLibur, ambilJadwalHarian, ambilPoin, pakaiPromo, tukarPoin,
} from "@/lib/final/tambahan.ts";
import { querySatu } from "@/lib/database.ts";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  kode_promo: z.string().trim().max(20).optional(),
  poin_dipakai: z.number().int().min(0).max(100000).optional(),
  tipe_pesanan: z.enum(["ambil", "dine_in", "kirim"]).optional(),
  meja: z.string().trim().max(20).optional(),
  alamat_kirim: z.string().trim().max(300).optional(),
  kode_undangan: z.string().trim().max(20).optional(),
  metode_bayar: z.enum(["tunai", "qris", "transfer"]).optional(),
  bukti_bayar: z.string().trim().max(300).optional(),
  zona_id: z.number().int().positive().optional(),
}).strict();

export async function POST(req: Request) {
  try {
    const { penolakan } = await aman(req, "publik");
    if (penolakan) return penolakan;
    const kunci = `preorder:${req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "lokal"}`;
    if (!(await izinLaju(kunci, 5, 60 * 1000))) {
      return NextResponse.json({ pesan: "Terlalu banyak pre-order. Coba lagi sebentar." }, { status: 429 });
    }
    const [pengaturan, jadwal, libur] = await Promise.all([
      ambilPengaturan(), ambilJadwalHarian(), ambilHariLibur(),
    ]);
    if ((pengaturan.pemeliharaan ?? "false") === "true") {
      return NextResponse.json({ pesan: "Warung sedang dalam pemeliharaan. Coba lagi sebentar." }, { status: 503 });
    }
    const jadwalPreorder = statusPreorder(pengaturan, new Date(),
      jadwal.map((j) => ({
        jenis: String(j.jenis), hari: Number(j.hari),
        jam_buka: String(j.jam_buka), jam_tutup: String(j.jam_tutup), aktif: Boolean(j.aktif),
      })),
      libur.map((l) => String(l.tanggal).slice(0, 10)));
    if (!jadwalPreorder.buka) {
      return NextResponse.json({ pesan: jadwalPreorder.keterangan }, { status: 403 });
    }
    const dariLingkungan = (process.env.WHATSAPP_ADMIN ?? "").trim();
    const nomorAdmin = dariLingkungan || (pengaturan.whatsapp_admin ?? "").trim();
    if (!nomorAdmin && process.env.NODE_ENV === "production") {
      return NextResponse.json({ pesan: "Nomor WhatsApp admin belum dikonfigurasi" }, { status: 500 });
    }
    const badan = skema.parse(await bacaJsonTerbatasi(req));
    if (badan.tipe_pesanan === "dine_in" && !badan.meja?.trim()) {
      return NextResponse.json({ pesan: "Nomor meja wajib diisi untuk makan di tempat" }, { status: 400 });
    }
    if (badan.tipe_pesanan === "kirim" && !badan.alamat_kirim?.trim()) {
      return NextResponse.json({ pesan: "Alamat kirim wajib diisi untuk pesanan dikirim" }, { status: 400 });
    }
    let tarifZona = 0;
    let namaZona = "";
    if (badan.zona_id) {
      const zona = await querySatu<{ tarif: number; nama: string }>(
        "SELECT tarif, nama FROM zona_kirim WHERE id = $1 AND aktif = TRUE", [badan.zona_id],
      );
      if (!zona) return NextResponse.json({ pesan: "Zona kirim tidak tersedia" }, { status: 400 });
      tarifZona = Number(zona.tarif);
      namaZona = zona.nama;
    }
    if (badan.tipe_pesanan === "kirim" && !namaZona && !badan.zona_id && !Number(pengaturan.biaya_kirim ?? 0)) {
      return NextResponse.json({ pesan: "Pilih zona kirim terlebih dahulu" }, { status: 400 });
    }
    const hasil = await simpanPreorder({
      ...badan,
      zona_kirim: namaZona,
      tingkat: (await ambilPoin(badan.whatsapp)).tingkat,
      ppn: {
        aktif: (pengaturan.ppn_aktif ?? "false") === "true",
        persen: Number(pengaturan.ppn_persen ?? 0),
      },
      minimum: Number(pengaturan.minimum_preorder ?? 0),
      ongkir: badan.zona_id ? tarifZona : Number(pengaturan.biaya_kirim ?? 0),
      bundling: {
        aktif: (pengaturan.bundling_aktif ?? "false") === "true",
        min: Number(pengaturan.bundling_min ?? 3),
        diskon: Number(pengaturan.bundling_diskon ?? 5),
      },
    });
    if (hasil.kode_promo) await pakaiPromo(hasil.kode_promo, hasil.kode_lacak, hasil.diskon ?? 0);
    if (hasil.poin_dipakai) await tukarPoin(badan.whatsapp, hasil.poin_dipakai);
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
      totalAkhir: hasil.total,
      tipe: badan.tipe_pesanan ?? "ambil",
      metode: badan.metode_bayar ?? "tunai",
      ongkir: hasil.ongkir,
      buktiBayar: badan.bukti_bayar,
      zona: hasil.zona_kirim || undefined,
      pajak: hasil.pajak,
    });
    return NextResponse.json({
      kode: hasil.kode, kode_lacak: hasil.kode_lacak, total: hasil.total, ongkir: hasil.ongkir,
      items: hasil.items.map(({ hpp: _hpp, ...i }) => i),
      pesan,
      tautan: tautanWhatsApp(nomorAdmin, pesan) || null,
    }, { status: 201 });
  } catch (e) { return galat(e) as NextResponse; }
}

export async function PUT(req: Request) {
  try {
    const { penolakan, pengguna } = await aman(req, "masuk");
    if (penolakan) return penolakan;
    const badan = z.object({
      id: z.number().int().positive(),
      status: z.enum(["diproses", "siap", "selesai", "batal"]),
      metode: z.enum(["tunai", "qris", "transfer"]).optional(),
    }).strict().parse(await bacaJsonTerbatasi(req));
    if (badan.status === "selesai") await selesaikanPreorder(badan.id, pengguna, badan.metode ?? "tunai");
    else await ubahStatusPreorder(badan.id, badan.status, pengguna);
    return NextResponse.json({ berhasil: true });
  } catch (e) { return galat(e) as NextResponse; }
}
