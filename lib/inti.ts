// Logika inti prototipe. Modul ini murni: tidak membaca database dan tidak punya efek samping,
// supaya bisa diuji langsung dengan node:test.

export type InfoBahan = {
  id: number;
  nama: string;
  satuan: string;
  stok: number;
};

export type ItemResep = {
  bahanId: number;
  jumlahPerPorsi: number;
};

export type Penghambat = {
  bahanId: number;
  nama: string;
  satuan: string;
  stok: number;
  kebutuhan: number;
  maksPorsi: number;
};

export type HasilPorsi = {
  porsi: number;
  penghambat: Penghambat | null;
};

export type Kekurangan = {
  nama: string;
  satuan: string;
  tersedia: number;
  dibutuhkan: number;
  kurang: number;
};

/**
 * Porsi yang bisa dibuat adalah nilai terkecil dari stok bahan dibagi kebutuhan per porsi.
 * Bahan dengan nilai terkecil itulah yang disebut bahan penghambat.
 */
export function hitungPorsi(resep: ItemResep[], daftarBahan: InfoBahan[]): HasilPorsi {
  if (resep.length === 0) {
    return { porsi: 0, penghambat: null };
  }

  const petaBahan = new Map(daftarBahan.map((bahan) => [bahan.id, bahan]));
  let porsiTerkecil = Number.POSITIVE_INFINITY;
  let penghambat: Penghambat | null = null;

  for (const item of resep) {
    if (!Number.isFinite(item.jumlahPerPorsi) || item.jumlahPerPorsi <= 0) {
      return { porsi: 0, penghambat: null };
    }

    const bahan = petaBahan.get(item.bahanId);
    const stok = bahan && Number.isFinite(bahan.stok) ? Math.max(0, bahan.stok) : 0;
    const maksPorsi = Math.floor(stok / item.jumlahPerPorsi);

    if (maksPorsi < porsiTerkecil) {
      porsiTerkecil = maksPorsi;
      penghambat = {
        bahanId: item.bahanId,
        nama: bahan?.nama ?? "Bahan tidak ditemukan",
        satuan: bahan?.satuan ?? "",
        stok,
        kebutuhan: item.jumlahPerPorsi,
        maksPorsi,
      };
    }
  }

  return { porsi: Number.isFinite(porsiTerkecil) ? porsiTerkecil : 0, penghambat };
}

/**
 * Memeriksa apakah stok mencukupi untuk sejumlah porsi.
 * Dipakai sebelum menyimpan transaksi supaya stok tidak pernah negatif.
 */
export function cekStokCukup(
  resep: ItemResep[],
  jumlahPorsi: number,
  daftarBahan: InfoBahan[],
): { cukup: boolean; kekurangan: Kekurangan[] } {
  const petaBahan = new Map(daftarBahan.map((bahan) => [bahan.id, bahan]));
  const kekurangan: Kekurangan[] = [];

  for (const item of resep) {
    const bahan = petaBahan.get(item.bahanId);
    const stok = bahan ? Math.max(0, bahan.stok) : 0;
    const dibutuhkan = item.jumlahPerPorsi * jumlahPorsi;

    if (dibutuhkan > stok + 1e-9) {
      kekurangan.push({
        nama: bahan?.nama ?? "Bahan tidak ditemukan",
        satuan: bahan?.satuan ?? "",
        tersedia: stok,
        dibutuhkan,
        kurang: dibutuhkan - stok,
      });
    }
  }

  return { cukup: kekurangan.length === 0, kekurangan };
}

/** Total harga untuk satu baris pesanan. */
export function hitungSubtotal(hargaSatuan: number, jumlah: number): number {
  return hargaSatuan * jumlah;
}

/** Total seluruh baris pesanan. */
export function hitungTotal(
  items: { hargaSatuan: number; jumlah: number }[],
): number {
  return items.reduce((total, item) => total + hitungSubtotal(item.hargaSatuan, item.jumlah), 0);
}

/** Ringkasan yang dipakai halaman laporan harian. */
export function ringkasPenjualan(
  penjualan: { total: number; items: { namaMenu: string; jumlah: number }[] }[],
): {
  omzet: number;
  jumlahTransaksi: number;
  menuTerlaris: { nama: string; jumlah: number } | null;
} {
  const omzet = penjualan.reduce((nilai, transaksi) => nilai + transaksi.total, 0);
  const hitunganMenu = new Map<string, number>();

  for (const transaksi of penjualan) {
    for (const item of transaksi.items) {
      hitunganMenu.set(item.namaMenu, (hitunganMenu.get(item.namaMenu) ?? 0) + item.jumlah);
    }
  }

  let menuTerlaris: { nama: string; jumlah: number } | null = null;
  for (const [nama, jumlah] of hitunganMenu) {
    if (!menuTerlaris || jumlah > menuTerlaris.jumlah) {
      menuTerlaris = { nama, jumlah };
    }
  }

  return { omzet, jumlahTransaksi: penjualan.length, menuTerlaris };
}
