// Menu, resep, varian, perhitungan porsi, dan HPP.

import { jalankan, query, querySatu, denganTransaksi } from "../database.ts";
import { hitungHpp, hitungPorsi, type InfoBahan, type ItemResep } from "../inti-final.ts";
import { GalatBisnis } from "./galat.ts";

export type ResepBaris = {
  menu_id: number;
  bahan_id: number;
  jumlah_per_porsi: number;
  nama_bahan: string;
  satuan: string;
  stok: number;
  harga_rata_rata: number;
};

export type VarianTampil = {
  id: number;
  menu_id: number;
  nama: string;
  harga_tambahan: number;
  aktif: boolean;
  resep: { bahan_id: number; jumlah_per_porsi: number; nama_bahan: string; satuan: string }[];
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
  penghambat: string | null;
  hpp: number;
  tersedia: boolean;
  resep: ResepBaris[];
  varian: VarianTampil[];
};

export async function ambilBahanSemua(): Promise<InfoBahan[]> {
  return query<InfoBahan>(
    "SELECT id, nama, satuan, stok, harga_rata_rata FROM bahan WHERE aktif = TRUE ORDER BY nama",
  );
}

async function ambilSemuaResep(): Promise<ResepBaris[]> {
  return query<ResepBaris>(
    `SELECT r.menu_id, r.bahan_id, r.jumlah_per_porsi,
            b.nama AS nama_bahan, b.satuan, b.stok, b.harga_rata_rata
     FROM resep r JOIN bahan b ON b.id = r.bahan_id ORDER BY r.menu_id, r.id`,
  );
}

async function ambilSemuaVarian(): Promise<VarianTampil[]> {
  const baris = await query<{
    id: number; menu_id: number; nama: string; harga_tambahan: number; aktif: boolean;
  }>("SELECT id, menu_id, nama, harga_tambahan, aktif FROM varian ORDER BY menu_id, id");
  const item = await query<{
    varian_id: number; bahan_id: number; jumlah_per_porsi: number; nama_bahan: string; satuan: string;
  }>(
    `SELECT iv.varian_id, iv.bahan_id, iv.jumlah_per_porsi, b.nama AS nama_bahan, b.satuan
     FROM item_varian iv JOIN bahan b ON b.id = iv.bahan_id ORDER BY iv.id`,
  );
  const peta = new Map<number, VarianTampil["resep"]>();
  for (const barisItem of item) {
    const daftar = peta.get(barisItem.varian_id) ?? [];
    daftar.push({
      bahan_id: barisItem.bahan_id,
      jumlah_per_porsi: barisItem.jumlah_per_porsi,
      nama_bahan: barisItem.nama_bahan,
      satuan: barisItem.satuan,
    });
    peta.set(barisItem.varian_id, daftar);
  }
  return baris.map((v) => ({ ...v, resep: peta.get(v.id) ?? [] }));
}

export async function ambilMenu(): Promise<MenuTampil[]> {
  const [menu, bahan, resep, varian] = await Promise.all([
    query<{
      id: number; nama: string; harga: number; deskripsi: string; kategori: string;
      foto: string | null; aktif: boolean;
    }>("SELECT id, nama, harga, deskripsi, kategori, foto, aktif FROM menu ORDER BY kategori, nama"),
    ambilBahanSemua(),
    ambilSemuaResep(),
    ambilSemuaVarian(),
  ]);

  const resepPerMenu = new Map<number, ResepBaris[]>();
  for (const baris of resep) {
    const daftar = resepPerMenu.get(baris.menu_id) ?? [];
    daftar.push(baris);
    resepPerMenu.set(baris.menu_id, daftar);
  }
  const varianPerMenu = new Map<number, VarianTampil[]>();
  for (const v of varian) {
    const daftar = varianPerMenu.get(v.menu_id) ?? [];
    daftar.push(v);
    varianPerMenu.set(v.menu_id, daftar);
  }

  return menu.map((m) => {
    const resepMenu = resepPerMenu.get(m.id) ?? [];
    const item: ItemResep[] = resepMenu.map((r) => ({ bahanId: r.bahan_id, jumlahPerPorsi: r.jumlah_per_porsi }));
    const porsi = hitungPorsi(item, bahan);
    return {
      ...m,
      porsi: porsi.porsi,
      penghambat: porsi.penghambat?.nama ?? null,
      hpp: Math.round(hitungHpp(item, bahan)),
      tersedia: m.aktif && porsi.porsi >= 1,
      resep: resepMenu,
      varian: varianPerMenu.get(m.id) ?? [],
    };
  });
}

export async function ambilMenuPublik() {
  const daftar = await ambilMenu();
  return daftar
    .filter((m) => m.aktif)
    .map((m) => ({
      id: m.id, nama: m.nama, harga: m.harga, deskripsi: m.deskripsi, kategori: m.kategori,
      foto: m.foto, porsi: m.porsi, tersedia: m.tersedia,
      varian: m.varian.filter((v) => v.aktif).map((v) => ({
        id: v.id, nama: v.nama, harga_tambahan: v.harga_tambahan,
      })),
    }));
}

export async function resepMenu(menuId: number): Promise<ResepBaris[]> {
  const semua = await ambilSemuaResep();
  return semua.filter((r) => r.menu_id === menuId);
}

export async function varianMenu(varianId: number): Promise<VarianTampil | undefined> {
  const semua = await ambilSemuaVarian();
  return semua.find((v) => v.id === varianId);
}

export async function resepGabungan(menuId: number, varianId?: number | null): Promise<ItemResep[]> {
  const dasar = await resepMenu(menuId);
  const item: ItemResep[] = dasar.map((r) => ({ bahanId: r.bahan_id, jumlahPerPorsi: r.jumlah_per_porsi }));
  if (varianId) {
    const v = await varianMenu(varianId);
    for (const tambahan of v?.resep ?? []) {
      const sudahAda = item.find((i) => i.bahanId === tambahan.bahan_id);
      if (sudahAda) sudahAda.jumlahPerPorsi += tambahan.jumlah_per_porsi;
      else item.push({ bahanId: tambahan.bahan_id, jumlahPerPorsi: tambahan.jumlah_per_porsi });
    }
  }
  return item;
}

export type MenuInput = {
  nama: string;
  harga: number;
  deskripsi: string;
  kategori: string;
  foto: string | null;
  aktif: boolean;
  resep: { bahan_id: number; jumlah_per_porsi: number }[];
  varian: { nama: string; harga_tambahan: number; aktif: boolean; resep: { bahan_id: number; jumlah_per_porsi: number }[] }[];
};

export async function simpanMenu(input: MenuInput, id?: number): Promise<number> {
  return denganTransaksi(async () => {
    let menuId: number;
    if (id !== undefined) {
      const ada = await querySatu("SELECT id FROM menu WHERE id = $1", [id]);
      if (!ada) throw new GalatBisnis("Menu tidak ditemukan");
      await jalankan(
        `UPDATE menu SET nama=$1, harga=$2, deskripsi=$3, kategori=$4, foto=$5, aktif=$6 WHERE id=$7`,
        [input.nama, input.harga, input.deskripsi, input.kategori, input.foto, input.aktif, id],
      );
      await jalankan("DELETE FROM resep WHERE menu_id = $1", [id]);
      await jalankan("DELETE FROM varian WHERE menu_id = $1", [id]);
      menuId = id;
    } else {
      const baris = await querySatu<{ id: number }>(
        `INSERT INTO menu (nama, harga, deskripsi, kategori, foto, aktif)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [input.nama, input.harga, input.deskripsi, input.kategori, input.foto, input.aktif],
      );
      menuId = baris!.id;
    }

    for (const r of input.resep) {
      await jalankan(
        "INSERT INTO resep (menu_id, bahan_id, jumlah_per_porsi) VALUES ($1,$2,$3)",
        [menuId, r.bahan_id, r.jumlah_per_porsi],
      );
    }
    for (const v of input.varian) {
      const barisV = await querySatu<{ id: number }>(
        "INSERT INTO varian (menu_id, nama, harga_tambahan, aktif) VALUES ($1,$2,$3,$4) RETURNING id",
        [menuId, v.nama, v.harga_tambahan, v.aktif],
      );
      for (const r of v.resep) {
        await jalankan(
          "INSERT INTO item_varian (varian_id, bahan_id, jumlah_per_porsi) VALUES ($1,$2,$3)",
          [barisV!.id, r.bahan_id, r.jumlah_per_porsi],
        );
      }
    }
    return menuId;
  });
}

export async function hapusMenu(id: number): Promise<void> {
  await denganTransaksi(async () => {
    await jalankan("DELETE FROM menu WHERE id = $1", [id]);
  });
}
