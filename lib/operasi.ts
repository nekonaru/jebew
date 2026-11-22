// Operasi data dan transaksi atomik. Semua perubahan stok lewat fungsi di berkas ini.

import { randomBytes } from "node:crypto";
import { database, denganTransaksi } from "./database.ts";
import {
  cekStokCukup,
  hitungPorsi,
  hitungTotal,
  ringkasPenjualan,
  type InfoBahan,
  type ItemResep,
} from "./inti.ts";
import type { BahanInput, KasirInput, MenuInput, PreorderInput } from "./validasi.ts";

/** Kesalahan yang aman ditampilkan ke pengguna. Tidak mengandung detail teknis. */
export class GalatBisnis extends Error {}

type BarisBahan = InfoBahan & { stok_minimum: number; dibuat_pada: string };

type BarisResep = {
  menu_id: number;
  bahan_id: number;
  jumlah_per_porsi: number;
  nama_bahan: string;
  satuan: string;
  stok: number;
};

export type DetailResep = {
  bahan_id: number;
  nama_bahan: string;
  satuan: string;
  jumlah_per_porsi: number;
  stok: number;
};

export type MenuTampil = {
  id: number;
  nama: string;
  harga: number;
  deskripsi: string;
  kategori: string;
  foto: string | null;
  aktif: boolean;
  porsi: number;
  penghambatNama: string | null;
  penghambatStok: number | null;
  penghambatKebutuhan: number | null;
  tersedia: boolean;
  resep: DetailResep[];
};

export type BarangTransaksi = {
  menu_id: number;
  nama_menu: string;
  harga_satuan: number;
  jumlah: number;
  subtotal: number;
};

export type PreorderTampil = {
  id: number;
  kode: string;
  nama_pelanggan: string;
  whatsapp: string;
  waktu_ambil: string;
  catatan: string;
  status: string;
  penjualan_id: number | null;
  dibuat_pada: string;
  total: number;
  items: BarangTransaksi[];
};

function ambilSemuaBahan(): BarisBahan[] {
  return database.prepare("SELECT * FROM bahan ORDER BY id").all() as BarisBahan[];
}

function ambilResepMenu(menuId: number): BarisResep[] {
  return database
    .prepare(
      `SELECT r.menu_id, r.bahan_id, r.jumlah_per_porsi,
              b.nama AS nama_bahan, b.satuan, b.stok
       FROM resep r JOIN bahan b ON b.id = r.bahan_id
       WHERE r.menu_id = ? ORDER BY r.id`,
    )
    .all(menuId) as BarisResep[];
}

/** Daftar bahan beserta status menipisnya untuk dashboard admin. */
export function ambilBahan() {
  return ambilSemuaBahan().map((bahan) => ({
    ...bahan,
    menipis: bahan.stok <= bahan.stok_minimum,
  }));
}

export function simpanBahan(input: BahanInput, id?: number): number {
  return denganTransaksi(() => {
    if (id !== undefined) {
      const ada = database.prepare("SELECT id FROM bahan WHERE id = ?").get(id);
      if (!ada) throw new GalatBisnis("Bahan tidak ditemukan");
      database
        .prepare("UPDATE bahan SET nama = ?, satuan = ?, stok = ?, stok_minimum = ? WHERE id = ?")
        .run(input.nama, input.satuan, input.stok, input.stok_minimum, id);
      return id;
    }

    const hasil = database
      .prepare("INSERT INTO bahan (nama, satuan, stok, stok_minimum) VALUES (?, ?, ?, ?)")
      .run(input.nama, input.satuan, input.stok, input.stok_minimum);
    return Number(hasil.lastInsertRowid);
  });
}

export function hapusBahan(id: number): void {
  denganTransaksi(() => {
    const dipakai = database.prepare("SELECT COUNT(*) AS jumlah FROM resep WHERE bahan_id = ?").get(id) as {
      jumlah: number;
    };
    if (dipakai.jumlah > 0) {
      throw new GalatBisnis("Bahan masih dipakai dalam resep. Ubah resepnya dulu.");
    }
    database.prepare("DELETE FROM bahan WHERE id = ?").run(id);
  });
}

export function restockBahan(id: number, tambahan: number): void {
  denganTransaksi(() => {
    const hasil = database.prepare("UPDATE bahan SET stok = stok + ? WHERE id = ?").run(tambahan, id);
    if (hasil.changes === 0) throw new GalatBisnis("Bahan tidak ditemukan");
  });
}

export function ubahStokBahan(id: number, stok: number): void {
  denganTransaksi(() => {
    const hasil = database.prepare("UPDATE bahan SET stok = ? WHERE id = ?").run(stok, id);
    if (hasil.changes === 0) throw new GalatBisnis("Bahan tidak ditemukan");
  });
}

/** Daftar menu lengkap dengan perhitungan porsi dan bahan penghambatnya. */
export function ambilMenu(): MenuTampil[] {
  const daftarMenu = database.prepare("SELECT * FROM menu ORDER BY kategori, id").all() as {
    id: number;
    nama: string;
    harga: number;
    deskripsi: string;
    kategori: string;
    foto: string | null;
    aktif: number;
  }[];
  const semuaBahan = ambilSemuaBahan();

  return daftarMenu.map((menu) => {
    const barisResep = ambilResepMenu(menu.id);
    const itemResep: ItemResep[] = barisResep.map((baris) => ({
      bahanId: baris.bahan_id,
      jumlahPerPorsi: baris.jumlah_per_porsi,
    }));
    const hasil = hitungPorsi(itemResep, semuaBahan);

    return {
      id: menu.id,
      nama: menu.nama,
      harga: menu.harga,
      deskripsi: menu.deskripsi,
      kategori: menu.kategori,
      foto: menu.foto,
      aktif: Boolean(menu.aktif),
      porsi: hasil.porsi,
      penghambatNama: hasil.penghambat?.nama ?? null,
      penghambatStok: hasil.penghambat?.stok ?? null,
      penghambatKebutuhan: hasil.penghambat?.kebutuhan ?? null,
      tersedia: Boolean(menu.aktif) && hasil.porsi >= 1,
      resep: barisResep.map((baris) => ({
        bahan_id: baris.bahan_id,
        nama_bahan: baris.nama_bahan,
        satuan: baris.satuan,
        jumlah_per_porsi: baris.jumlah_per_porsi,
        stok: baris.stok,
      })),
    };
  });
}

/** Versi ringan untuk halaman publik. */
export function ambilMenuPublik() {
  return ambilMenu().map((menu) => ({
    id: menu.id,
    nama: menu.nama,
    harga: menu.harga,
    deskripsi: menu.deskripsi,
    kategori: menu.kategori,
    foto: menu.foto,
    porsi: menu.porsi,
    tersedia: menu.tersedia,
  }));
}

export function simpanMenu(input: MenuInput, id?: number): number {
  return denganTransaksi(() => {
    let menuId: number;

    if (id !== undefined) {
      const ada = database.prepare("SELECT id FROM menu WHERE id = ?").get(id);
      if (!ada) throw new GalatBisnis("Menu tidak ditemukan");
      database
        .prepare(
          `UPDATE menu SET nama = ?, harga = ?, deskripsi = ?, kategori = ?, foto = ?, aktif = ?
           WHERE id = ?`,
        )
        .run(input.nama, input.harga, input.deskripsi, input.kategori, input.foto, Number(input.aktif), id);
      database.prepare("DELETE FROM resep WHERE menu_id = ?").run(id);
      menuId = id;
    } else {
      const hasil = database
        .prepare(
          `INSERT INTO menu (nama, harga, deskripsi, kategori, foto, aktif)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(input.nama, input.harga, input.deskripsi, input.kategori, input.foto, Number(input.aktif));
      menuId = Number(hasil.lastInsertRowid);
    }

    for (const item of input.resep) {
      database
        .prepare("INSERT INTO resep (menu_id, bahan_id, jumlah_per_porsi) VALUES (?, ?, ?)")
        .run(menuId, item.bahan_id, item.jumlah_per_porsi);
    }

    return menuId;
  });
}

export function hapusMenu(id: number): void {
  denganTransaksi(() => {
    database.prepare("DELETE FROM menu WHERE id = ?").run(id);
  });
}

function siapkanBarang(
  items: { menu_id: number; jumlah: number }[],
): { barang: BarangTransaksi[]; total: number } {
  const barang: BarangTransaksi[] = [];

  for (const item of items) {
    const menu = database
      .prepare("SELECT id, nama, harga, aktif FROM menu WHERE id = ?")
      .get(item.menu_id) as { id: number; nama: string; harga: number; aktif: number } | undefined;

    if (!menu || !menu.aktif) {
      throw new GalatBisnis(`Menu dengan id ${item.menu_id} tidak tersedia`);
    }

    const barisResep = ambilResepMenu(menu.id);
    if (barisResep.length === 0) {
      throw new GalatBisnis(`Menu ${menu.nama} belum punya resep`);
    }

    const bahan: InfoBahan[] = barisResep.map((baris) => ({
      id: baris.bahan_id,
      nama: baris.nama_bahan,
      satuan: baris.satuan,
      stok: baris.stok,
    }));
    const itemResep: ItemResep[] = barisResep.map((baris) => ({
      bahanId: baris.bahan_id,
      jumlahPerPorsi: baris.jumlah_per_porsi,
    }));

    const pemeriksaan = cekStokCukup(itemResep, item.jumlah, bahan);
    if (!pemeriksaan.cukup) {
      const rincian = pemeriksaan.kekurangan
        .map((kurang) => `${kurang.nama} kurang ${kurang.kurang} ${kurang.satuan}`)
        .join(", ");
      throw new GalatBisnis(`Stok tidak cukup untuk ${menu.nama}: ${rincian}`);
    }

    barang.push({
      menu_id: menu.id,
      nama_menu: menu.nama,
      harga_satuan: menu.harga,
      jumlah: item.jumlah,
      subtotal: menu.harga * item.jumlah,
    });
  }

  return {
    barang,
    total: hitungTotal(barang.map((item) => ({ hargaSatuan: item.harga_satuan, jumlah: item.jumlah }))),
  };
}

function tulisPenjualan(
  barang: BarangTransaksi[],
  total: number,
  metode: string,
  catatan: string,
  sumber: string,
  preorderId: number | null,
): number {
  const hasil = database
    .prepare(
      `INSERT INTO penjualan (total, metode, catatan, sumber, preorder_id)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(total, metode, catatan, sumber, preorderId);
  const penjualanId = Number(hasil.lastInsertRowid);

  for (const item of barang) {
    database
      .prepare(
        `INSERT INTO item_penjualan
         (penjualan_id, menu_id, nama_menu, harga_satuan, jumlah, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(penjualanId, item.menu_id, item.nama_menu, item.harga_satuan, item.jumlah, item.subtotal);
  }

  potongStok(barang);
  return penjualanId;
}

function potongStok(barang: BarangTransaksi[]): void {
  for (const item of barang) {
    const barisResep = ambilResepMenu(item.menu_id);
    for (const bahan of barisResep) {
      database
        .prepare("UPDATE bahan SET stok = stok - ? WHERE id = ?")
        .run(bahan.jumlah_per_porsi * item.jumlah, bahan.bahan_id);
    }
  }
}

/** Catat penjualan kasir. Pengecekan stok dan pemotongan terjadi dalam satu transaksi. */
export function catatPenjualan(input: KasirInput): { id: number; total: number } {
  return denganTransaksi(() => {
    const { barang, total } = siapkanBarang(input.items);
    const id = tulisPenjualan(barang, total, input.metode, input.catatan, "kasir", null);
    return { id, total };
  });
}

export function ambilLaporan(dari: string, sampai: string) {
  const penjualan = database
    .prepare(
      `SELECT p.id, p.total, p.metode, p.catatan, p.sumber, p.dibuat_pada,
              i.nama_menu, i.jumlah
       FROM penjualan p LEFT JOIN item_penjualan i ON i.penjualan_id = p.id
       WHERE date(p.dibuat_pada) BETWEEN ? AND ?
       ORDER BY p.dibuat_pada DESC, p.id DESC`,
    )
    .all(dari, sampai) as {
    id: number;
    total: number;
    metode: string;
    catatan: string;
    sumber: string;
    dibuat_pada: string;
    nama_menu: string | null;
    jumlah: number | null;
  }[];

  const peta = new Map<number, { total: number; dibuat_pada: string; items: { namaMenu: string; jumlah: number }[] }>();
  for (const baris of penjualan) {
    if (!peta.has(baris.id)) {
      peta.set(baris.id, { total: baris.total, dibuat_pada: baris.dibuat_pada, items: [] });
    }
    if (baris.nama_menu) {
      peta.get(baris.id)!.items.push({ namaMenu: baris.nama_menu, jumlah: baris.jumlah ?? 0 });
    }
  }

  const daftar = [...peta.entries()].map(([id, nilai]) => ({ id, ...nilai }));
  const ringkasan = ringkasPenjualan(daftar);
  return { daftar, ringkasan };
}

function buatKodePreorder(): string {
  return `JBW-${randomBytes(3).toString("hex").toUpperCase()}`;
}

/** Simpan preorder publik. Tidak mengurangi stok sampai admin menandainya selesai. */
export function simpanPreorder(input: PreorderInput): { kode: string; total: number; items: BarangTransaksi[] } {
  return denganTransaksi(() => {
    const { barang, total } = siapkanBarang(input.items);
    const kode = buatKodePreorder();

    const hasil = database
      .prepare(
        `INSERT INTO preorder
         (kode, nama_pelanggan, whatsapp, waktu_ambil, catatan, status)
         VALUES (?, ?, ?, ?, ?, 'baru')`,
      )
      .run(kode, input.nama_pelanggan, input.whatsapp, input.waktu_ambil, input.catatan);
    const preorderId = Number(hasil.lastInsertRowid);

    for (const item of barang) {
      database
        .prepare(
          `INSERT INTO item_preorder
           (preorder_id, menu_id, nama_menu, harga_satuan, jumlah, subtotal)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(preorderId, item.menu_id, item.nama_menu, item.harga_satuan, item.jumlah, item.subtotal);
    }

    return { kode, total, items: barang };
  });
}

export function ambilPreorder(): PreorderTampil[] {
  const daftar = database
    .prepare("SELECT * FROM preorder ORDER BY id DESC")
    .all() as Omit<PreorderTampil, "total" | "items">[];

  return daftar.map((preorder) => {
    const items = database
      .prepare("SELECT * FROM item_preorder WHERE preorder_id = ? ORDER BY id")
      .all(preorder.id) as BarangTransaksi[];
    return {
      ...preorder,
      total: items.reduce((nilai, item) => nilai + item.subtotal, 0),
      items,
    };
  });
}

/** Menandai preorder selesai sekaligus mencatat penjualan dan memotong stok. */
export function selesaikanPreorder(id: number): void {
  denganTransaksi(() => {
    const preorder = database.prepare("SELECT * FROM preorder WHERE id = ?").get(id) as
      | { id: number; status: string; catatan: string; penjualan_id: number | null }
      | undefined;

    if (!preorder) throw new GalatBisnis("Preorder tidak ditemukan");
    if (preorder.status === "selesai") throw new GalatBisnis("Preorder ini sudah selesai");
    if (preorder.status === "batal") throw new GalatBisnis("Preorder ini sudah dibatalkan");
    if (preorder.penjualan_id) throw new GalatBisnis("Preorder ini sudah dicatat sebagai penjualan");

    const barisItems = database
      .prepare("SELECT menu_id, jumlah FROM item_preorder WHERE preorder_id = ?")
      .all(id) as { menu_id: number; jumlah: number }[];
    if (barisItems.length === 0) throw new GalatBisnis("Preorder tidak punya item");

    const { barang, total } = siapkanBarang(barisItems);
    const penjualanId = tulisPenjualan(barang, total, "tunai", preorder.catatan, "preorder", id);
    database
      .prepare("UPDATE preorder SET status = 'selesai', penjualan_id = ? WHERE id = ?")
      .run(penjualanId, id);
  });
}

export function ubahStatusPreorder(id: number, status: "baru" | "diproses" | "selesai" | "batal"): void {
  if (status === "selesai") {
    selesaikanPreorder(id);
    return;
  }

  denganTransaksi(() => {
    const preorder = database.prepare("SELECT status FROM preorder WHERE id = ?").get(id) as
      | { status: string }
      | undefined;
    if (!preorder) throw new GalatBisnis("Preorder tidak ditemukan");
    if (preorder.status === "selesai") throw new GalatBisnis("Preorder selesai tidak bisa diubah statusnya");
    database.prepare("UPDATE preorder SET status = ? WHERE id = ?").run(status, id);
  });
}

export function ambilPengaturan(): { nama_usaha: string; whatsapp_admin: string } {
  const baris = database.prepare("SELECT kunci, nilai FROM pengaturan").all() as {
    kunci: string;
    nilai: string;
  }[];
  const peta = new Map(baris.map((barisPengaturan) => [barisPengaturan.kunci, barisPengaturan.nilai]));

  return {
    nama_usaha: peta.get("nama_usaha") ?? process.env.NAMA_USAHA ?? "Mie Jebew",
    whatsapp_admin: peta.get("whatsapp_admin") ?? process.env.WHATSAPP_ADMIN ?? "6281234567890",
  };
}
