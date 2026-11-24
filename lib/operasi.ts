// Operasi data dan transaksi atomik. Semua perubahan stok lewat fungsi di berkas ini.
// Kueri memakai penanda $1, $2, dan seterusnya sesuai driver Postgres.

import { randomBytes } from "node:crypto";
import { denganTransaksi, jalankan, query, querySatu } from "./database.ts";
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

async function ambilSemuaBahan(): Promise<BarisBahan[]> {
  return query<BarisBahan>("SELECT id, nama, satuan, stok, stok_minimum, dibuat_pada FROM bahan ORDER BY id");
}

async function ambilResepMenu(menuId: number): Promise<BarisResep[]> {
  return query<BarisResep>(
    `SELECT r.menu_id, r.bahan_id, r.jumlah_per_porsi,
            b.nama AS nama_bahan, b.satuan, b.stok
     FROM resep r JOIN bahan b ON b.id = r.bahan_id
     WHERE r.menu_id = $1 ORDER BY r.id`,
    [menuId],
  );
}

/** Daftar bahan beserta status menipisnya untuk dashboard admin. */
export async function ambilBahan() {
  const daftar = await ambilSemuaBahan();
  return daftar.map((bahan) => ({
    ...bahan,
    menipis: bahan.stok <= bahan.stok_minimum,
  }));
}

export async function simpanBahan(input: BahanInput, id?: number): Promise<number> {
  return denganTransaksi(async () => {
    if (id !== undefined) {
      const ada = await querySatu("SELECT id FROM bahan WHERE id = $1", [id]);
      if (!ada) throw new GalatBisnis("Bahan tidak ditemukan");
      await jalankan(
        "UPDATE bahan SET nama = $1, satuan = $2, stok = $3, stok_minimum = $4 WHERE id = $5",
        [input.nama, input.satuan, input.stok, input.stok_minimum, id],
      );
      return id;
    }

    const baris = await querySatu<{ id: number }>(
      `INSERT INTO bahan (nama, satuan, stok, stok_minimum)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [input.nama, input.satuan, input.stok, input.stok_minimum],
    );
    return baris!.id;
  });
}

export async function hapusBahan(id: number): Promise<void> {
  await denganTransaksi(async () => {
    const dipakai = await querySatu<{ jumlah: number }>(
      "SELECT COUNT(*) AS jumlah FROM resep WHERE bahan_id = $1",
      [id],
    );
    if (Number(dipakai?.jumlah ?? 0) > 0) {
      throw new GalatBisnis("Bahan masih dipakai dalam resep. Ubah resepnya dulu.");
    }
    await jalankan("DELETE FROM bahan WHERE id = $1", [id]);
  });
}

export async function restockBahan(id: number, tambahan: number): Promise<void> {
  await denganTransaksi(async () => {
    const jumlah = await jalankan("UPDATE bahan SET stok = stok + $1 WHERE id = $2", [tambahan, id]);
    if (jumlah === 0) throw new GalatBisnis("Bahan tidak ditemukan");
  });
}

export async function ubahStokBahan(id: number, stok: number): Promise<void> {
  await denganTransaksi(async () => {
    const jumlah = await jalankan("UPDATE bahan SET stok = $1 WHERE id = $2", [stok, id]);
    if (jumlah === 0) throw new GalatBisnis("Bahan tidak ditemukan");
  });
}

/** Daftar menu lengkap dengan perhitungan porsi dan bahan penghambatnya. */
export async function ambilMenu(): Promise<MenuTampil[]> {
  const daftarMenu = await query<{
    id: number;
    nama: string;
    harga: number;
    deskripsi: string;
    kategori: string;
    foto: string | null;
    aktif: boolean;
  }>("SELECT id, nama, harga, deskripsi, kategori, foto, aktif FROM menu ORDER BY kategori, id");
  const semuaBahan = await ambilSemuaBahan();

  const hasil: MenuTampil[] = [];
  for (const menu of daftarMenu) {
    const barisResep = await ambilResepMenu(menu.id);
    const itemResep: ItemResep[] = barisResep.map((baris) => ({
      bahanId: baris.bahan_id,
      jumlahPerPorsi: baris.jumlah_per_porsi,
    }));
    const perhitungan = hitungPorsi(itemResep, semuaBahan);

    hasil.push({
      id: menu.id,
      nama: menu.nama,
      harga: menu.harga,
      deskripsi: menu.deskripsi,
      kategori: menu.kategori,
      foto: menu.foto,
      aktif: Boolean(menu.aktif),
      porsi: perhitungan.porsi,
      penghambatNama: perhitungan.penghambat?.nama ?? null,
      penghambatStok: perhitungan.penghambat?.stok ?? null,
      penghambatKebutuhan: perhitungan.penghambat?.kebutuhan ?? null,
      tersedia: Boolean(menu.aktif) && perhitungan.porsi >= 1,
      resep: barisResep.map((baris) => ({
        bahan_id: baris.bahan_id,
        nama_bahan: baris.nama_bahan,
        satuan: baris.satuan,
        jumlah_per_porsi: baris.jumlah_per_porsi,
        stok: baris.stok,
      })),
    });
  }
  return hasil;
}

/** Versi ringan untuk halaman publik. */
export async function ambilMenuPublik() {
  const daftar = await ambilMenu();
  return daftar.map((menu) => ({
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

export async function simpanMenu(input: MenuInput, id?: number): Promise<number> {
  return denganTransaksi(async () => {
    let menuId: number;

    if (id !== undefined) {
      const ada = await querySatu("SELECT id FROM menu WHERE id = $1", [id]);
      if (!ada) throw new GalatBisnis("Menu tidak ditemukan");
      await jalankan(
        `UPDATE menu SET nama = $1, harga = $2, deskripsi = $3, kategori = $4, foto = $5, aktif = $6
         WHERE id = $7`,
        [input.nama, input.harga, input.deskripsi, input.kategori, input.foto, input.aktif, id],
      );
      await jalankan("DELETE FROM resep WHERE menu_id = $1", [id]);
      menuId = id;
    } else {
      const baris = await querySatu<{ id: number }>(
        `INSERT INTO menu (nama, harga, deskripsi, kategori, foto, aktif)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [input.nama, input.harga, input.deskripsi, input.kategori, input.foto, input.aktif],
      );
      menuId = baris!.id;
    }

    for (const item of input.resep) {
      await jalankan(
        "INSERT INTO resep (menu_id, bahan_id, jumlah_per_porsi) VALUES ($1, $2, $3)",
        [menuId, item.bahan_id, item.jumlah_per_porsi],
      );
    }

    return menuId;
  });
}

export async function hapusMenu(id: number): Promise<void> {
  await denganTransaksi(async () => {
    await jalankan("DELETE FROM menu WHERE id = $1", [id]);
  });
}

async function siapkanBarang(
  items: { menu_id: number; jumlah: number }[],
): Promise<{ barang: BarangTransaksi[]; total: number }> {
  const barang: BarangTransaksi[] = [];

  for (const item of items) {
    const menu = await querySatu<{ id: number; nama: string; harga: number; aktif: boolean }>(
      "SELECT id, nama, harga, aktif FROM menu WHERE id = $1",
      [item.menu_id],
    );

    if (!menu || !menu.aktif) {
      throw new GalatBisnis(`Menu dengan id ${item.menu_id} tidak tersedia`);
    }

    const barisResep = await ambilResepMenu(menu.id);
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

async function tulisPenjualan(
  barang: BarangTransaksi[],
  total: number,
  metode: string,
  catatan: string,
  sumber: string,
  preorderId: number | null,
): Promise<number> {
  const baris = await querySatu<{ id: number }>(
    `INSERT INTO penjualan (total, metode, catatan, sumber, preorder_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [total, metode, catatan, sumber, preorderId],
  );
  const penjualanId = baris!.id;

  for (const item of barang) {
    await jalankan(
      `INSERT INTO item_penjualan
       (penjualan_id, menu_id, nama_menu, harga_satuan, jumlah, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [penjualanId, item.menu_id, item.nama_menu, item.harga_satuan, item.jumlah, item.subtotal],
    );
  }

  await potongStok(barang);
  return penjualanId;
}

async function potongStok(barang: BarangTransaksi[]): Promise<void> {
  for (const item of barang) {
    const barisResep = await ambilResepMenu(item.menu_id);
    for (const bahan of barisResep) {
      await jalankan(
        "UPDATE bahan SET stok = stok - $1 WHERE id = $2",
        [bahan.jumlah_per_porsi * item.jumlah, bahan.bahan_id],
      );
    }
  }
}

/** Catat penjualan kasir. Pengecekan stok dan pemotongan terjadi dalam satu transaksi. */
export async function catatPenjualan(input: KasirInput): Promise<{ id: number; total: number }> {
  return denganTransaksi(async () => {
    const { barang, total } = await siapkanBarang(input.items);
    const id = await tulisPenjualan(barang, total, input.metode, input.catatan, "kasir", null);
    return { id, total };
  });
}

export async function ambilLaporan(dari: string, sampai: string) {
  const penjualan = await query<{
    id: number;
    total: number;
    metode: string;
    catatan: string;
    sumber: string;
    dibuat_pada: string;
    nama_menu: string | null;
    jumlah: number | null;
  }>(
    `SELECT p.id, p.total, p.metode, p.catatan, p.sumber, p.dibuat_pada,
            i.nama_menu, i.jumlah
     FROM penjualan p LEFT JOIN item_penjualan i ON i.penjualan_id = p.id
     WHERE p.dibuat_pada::date BETWEEN $1::date AND $2::date
     ORDER BY p.dibuat_pada DESC, p.id DESC`,
    [dari, sampai],
  );

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
export async function simpanPreorder(
  input: PreorderInput,
): Promise<{ kode: string; total: number; items: BarangTransaksi[] }> {
  return denganTransaksi(async () => {
    const { barang, total } = await siapkanBarang(input.items);
    const kode = buatKodePreorder();

    const baris = await querySatu<{ id: number }>(
      `INSERT INTO preorder
       (kode, nama_pelanggan, whatsapp, waktu_ambil, catatan, status)
       VALUES ($1, $2, $3, $4, $5, 'baru') RETURNING id`,
      [kode, input.nama_pelanggan, input.whatsapp, input.waktu_ambil, input.catatan],
    );
    const preorderId = baris!.id;

    for (const item of barang) {
      await jalankan(
        `INSERT INTO item_preorder
         (preorder_id, menu_id, nama_menu, harga_satuan, jumlah, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [preorderId, item.menu_id, item.nama_menu, item.harga_satuan, item.jumlah, item.subtotal],
      );
    }

    return { kode, total, items: barang };
  });
}

export async function ambilPreorder(): Promise<PreorderTampil[]> {
  const daftar = await query<Omit<PreorderTampil, "total" | "items">>(
    `SELECT id, kode, nama_pelanggan, whatsapp, waktu_ambil, catatan, status,
            penjualan_id, dibuat_pada FROM preorder ORDER BY id DESC`,
  );

  const hasil: PreorderTampil[] = [];
  for (const preorder of daftar) {
    const items = await query<BarangTransaksi>(
      `SELECT menu_id, nama_menu, harga_satuan, jumlah, subtotal
       FROM item_preorder WHERE preorder_id = $1 ORDER BY id`,
      [preorder.id],
    );
    hasil.push({
      ...preorder,
      total: items.reduce((nilai, item) => nilai + item.subtotal, 0),
      items,
    });
  }
  return hasil;
}

/** Menandai preorder selesai sekaligus mencatat penjualan dan memotong stok. */
export async function selesaikanPreorder(id: number): Promise<void> {
  await denganTransaksi(async () => {
    const preorder = await querySatu<{ id: number; status: string; catatan: string; penjualan_id: number | null }>(
      "SELECT id, status, catatan, penjualan_id FROM preorder WHERE id = $1",
      [id],
    );

    if (!preorder) throw new GalatBisnis("Preorder tidak ditemukan");
    if (preorder.status === "selesai") throw new GalatBisnis("Preorder ini sudah selesai");
    if (preorder.status === "batal") throw new GalatBisnis("Preorder ini sudah dibatalkan");
    if (preorder.penjualan_id) throw new GalatBisnis("Preorder ini sudah dicatat sebagai penjualan");

    const barisItems = await query<{ menu_id: number; jumlah: number }>(
      "SELECT menu_id, jumlah FROM item_preorder WHERE preorder_id = $1",
      [id],
    );
    if (barisItems.length === 0) throw new GalatBisnis("Preorder tidak punya item");

    const { barang, total } = await siapkanBarang(barisItems);
    const penjualanId = await tulisPenjualan(barang, total, "tunai", preorder.catatan, "preorder", id);
    await jalankan(
      "UPDATE preorder SET status = 'selesai', penjualan_id = $1 WHERE id = $2",
      [penjualanId, id],
    );
  });
}

export async function ubahStatusPreorder(
  id: number,
  status: "baru" | "diproses" | "selesai" | "batal",
): Promise<void> {
  if (status === "selesai") {
    await selesaikanPreorder(id);
    return;
  }

  await denganTransaksi(async () => {
    const preorder = await querySatu<{ status: string }>(
      "SELECT status FROM preorder WHERE id = $1",
      [id],
    );
    if (!preorder) throw new GalatBisnis("Preorder tidak ditemukan");
    if (preorder.status === "selesai") throw new GalatBisnis("Preorder selesai tidak bisa diubah statusnya");
    await jalankan("UPDATE preorder SET status = $1 WHERE id = $2", [status, id]);
  });
}

export async function ambilPengaturan(): Promise<{ nama_usaha: string; whatsapp_admin: string }> {
  const baris = await query<{ kunci: string; nilai: string }>("SELECT kunci, nilai FROM pengaturan");
  const peta = new Map(baris.map((item) => [item.kunci, item.nilai]));

  return {
    nama_usaha: peta.get("nama_usaha") ?? process.env.NAMA_USAHA ?? "Mie Jebew",
    whatsapp_admin: peta.get("whatsapp_admin") ?? process.env.WHATSAPP_ADMIN ?? "6281234567890",
  };
}
