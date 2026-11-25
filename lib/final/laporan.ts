// Laporan keuangan: omzet, HPP, laba, pengeluaran, dan tutup kasir.

import { query, querySatu, denganTransaksi, jalankan } from "../database.ts";
import { GalatBisnis } from "./galat.ts";
import { hppBaris, hppPerTransaksi, ringkasKeuangan } from "../inti-final.ts";
import type { PenggunaSesi } from "../auth.ts";
import { catatAudit } from "../audit.ts";

export async function ambilLaporan(dari: string, sampai: string) {
  const penjualan = await query<{
    id: number; nomor: string; total: number; diskon: number; metode: string;
    catatan: string; sumber: string; dibuat_pada: string;
    nama_menu: string; nama_varian: string; jumlah: number;
    subtotal: number; menu_id: number; varian_id: number | null; hpp: number;
  }>(
    `SELECT p.id, p.nomor, p.total, p.diskon, p.metode, p.catatan, p.sumber, p.dibuat_pada,
            i.nama_menu, i.nama_varian, i.jumlah, i.subtotal, i.menu_id, i.varian_id, i.hpp
     FROM penjualan p LEFT JOIN item_penjualan i ON i.penjualan_id = p.id
     WHERE p.dibuat_pada::date BETWEEN $1::date AND $2::date
     ORDER BY p.dibuat_pada DESC, p.id DESC`,
    [dari, sampai],
  );

  const pengeluaran = await querySatu<{ jumlah: number }>(
    `SELECT COALESCE(SUM(jumlah),0) AS jumlah FROM pengeluaran
     WHERE tanggal::date BETWEEN $1::date AND $2::date`, [dari, sampai],
  );

  const peta = new Map<number, {
    nomor: string; total: number; diskon: number; metode: string; sumber: string;
    dibuat_pada: string; hpp: number; items: { nama: string; jumlah: number; omzet: number; hpp: number }[];
  }>();
  for (const baris of penjualan) {
    if (!peta.has(baris.id)) {
      peta.set(baris.id, {
        nomor: baris.nomor, total: baris.total, diskon: baris.diskon, metode: baris.metode,
        sumber: baris.sumber, dibuat_pada: baris.dibuat_pada, items: [], hpp: 0,
      });
    }
    if (baris.nama_menu) {
      const nama = baris.nama_varian ? `${baris.nama_menu} (${baris.nama_varian})` : baris.nama_menu;
      peta.get(baris.id)!.items.push({
        nama, jumlah: baris.jumlah,
        omzet: Number(baris.subtotal ?? 0),
        hpp: hppBaris(Number(baris.hpp ?? 0), Number(baris.jumlah ?? 0)),
      });
    }
  }

  // HPP diambil dari snapshot saat transaksi, sehingga laporan historis tidak berubah.
  const hppTransaksi = hppPerTransaksi(penjualan.map((b) => ({
    id: b.id, hpp: Number(b.hpp ?? 0), jumlah: Number(b.jumlah ?? 0),
  })));
  for (const [id, nilai] of peta) nilai.hpp = hppTransaksi.get(id) ?? 0;
  const daftar = [...peta.entries()].map(([id, nilai]) => ({ id, ...nilai }));

  const ringkasan = ringkasKeuangan(
    daftar.map((d) => ({ total: d.total, diskon: d.diskon, metode: d.metode, hpp: d.hpp })),
    Number(pengeluaran?.jumlah ?? 0),
  );

  const menuTerlaris = new Map<string, { jumlah: number; omzet: number; hpp: number }>();
  for (const transaksi of daftar) {
    for (const item of transaksi.items) {
      const nilai = menuTerlaris.get(item.nama) ?? { jumlah: 0, omzet: 0, hpp: 0 };
      nilai.jumlah += item.jumlah;
      nilai.omzet += item.omzet;
      nilai.hpp += item.hpp;
      menuTerlaris.set(item.nama, nilai);
    }
  }
  const terlaris = [...menuTerlaris.entries()]
    .map(([nama, v]) => ({ nama, ...v, laba: v.omzet - v.hpp }))
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, 8);

  const harian = new Map<string, number>();
  for (const transaksi of daftar) {
    const tanggal = transaksi.dibuat_pada.slice(0, 10);
    harian.set(tanggal, (harian.get(tanggal) ?? 0) + transaksi.total);
  }

  return {
    daftar,
    ringkasan,
    menuTerlaris: terlaris,
    harian: [...harian.entries()].map(([tanggal, omzet]) => ({ tanggal, omzet })).sort((a, b) => a.tanggal.localeCompare(b.tanggal)),
    pengeluaranList: await query(
      `SELECT e.id, e.nama, e.jumlah, e.tanggal, k.nama AS kategori
       FROM pengeluaran e JOIN kategori_pengeluaran k ON k.id = e.kategori_id
       WHERE e.tanggal::date BETWEEN $1::date AND $2::date ORDER BY e.tanggal DESC`,
      [dari, sampai],
    ),
  };
}

export async function tambahPengeluaran(
  input: { kategori_id: number; nama: string; jumlah: number; tanggal: string; catatan: string },
  pengguna: PenggunaSesi | null,
): Promise<void> {
  await denganTransaksi(async () => {
    await jalankan(
      "INSERT INTO pengeluaran (kategori_id, nama, jumlah, tanggal, catatan, pengguna_id) VALUES ($1,$2,$3,$4,$5,$6)",
      [input.kategori_id, input.nama, input.jumlah, input.tanggal, input.catatan, pengguna?.id ?? null],
    );
    await catatAudit(pengguna, "tambah", "pengeluaran", `${input.nama}, ${input.jumlah}`);
  });
}

export async function ambilKategoriPengeluaran() {
  return query("SELECT id, nama FROM kategori_pengeluaran ORDER BY nama");
}

export async function ambilTutupKasir() {
  return query("SELECT * FROM tutup_kasir ORDER BY tanggal DESC LIMIT 30");
}

export async function tutupKasir(
  input: { tanggal: string; kas_fisik: number; catatan: string },
  pengguna: PenggunaSesi | null,
): Promise<void> {
  await denganTransaksi(async () => {
    const hasil = await querySatu<{ tunai: number; qris: number; transfer: number }>(
      `SELECT
        COALESCE(SUM(CASE WHEN metode='tunai' THEN total ELSE 0 END),0) AS tunai,
        COALESCE(SUM(CASE WHEN metode='qris' THEN total ELSE 0 END),0) AS qris,
        COALESCE(SUM(CASE WHEN metode='transfer' THEN total ELSE 0 END),0) AS transfer
       FROM penjualan WHERE dibuat_pada::date = $1::date`, [input.tanggal],
    );
    const tunai = Number(hasil?.tunai ?? 0);
    const qris = Number(hasil?.qris ?? 0);
    const transfer = Number(hasil?.transfer ?? 0);
    const selisih = input.kas_fisik - tunai;
    await jalankan(
      `INSERT INTO tutup_kasir (tanggal, kasir_id, total_tunai, total_qris, total_transfer, kas_fisik, selisih, catatan)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (tanggal) DO UPDATE SET kasir_id=EXCLUDED.kasir_id, total_tunai=EXCLUDED.total_tunai,
         total_qris=EXCLUDED.total_qris, total_transfer=EXCLUDED.total_transfer,
         kas_fisik=EXCLUDED.kas_fisik, selisih=EXCLUDED.selisih, catatan=EXCLUDED.catatan`,
      [input.tanggal, pengguna?.id ?? null, tunai, qris, transfer, input.kas_fisik, selisih, input.catatan],
    );
    await catatAudit(pengguna, "tambah", "tutup_kasir", `${input.tanggal}, selisih ${selisih}`);
  });
}

export function keCsv(laporan: Awaited<ReturnType<typeof ambilLaporan>>): string {
  const baris = ["Nomor,Waktu,Menu,Jumlah,Metode,Omzet,HPP"];
  for (const transaksi of laporan.daftar) {
    const menu = transaksi.items.map((i) => `${i.nama} x${i.jumlah}`).join(" | ");
    baris.push([
      transaksi.nomor,
      `${transaksi.dibuat_pada} WIB`,
      `"${menu.replace(/"/g, '""')}"`,
      transaksi.items.reduce((n, i) => n + i.jumlah, 0),
      transaksi.metode,
      transaksi.total,
      transaksi.hpp,
    ].join(","));
  }
  return "\uFEFF" + baris.join("\r\n");
}
