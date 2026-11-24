// Logika murni final. Tidak mengakses database agar bisa diuji langsung.

export type InfoBahan = { id: number; nama: string; satuan: string; stok: number; harga_rata_rata?: number };
export type ItemResep = { bahanId: number; jumlahPerPorsi: number };

export type HasilPorsi = {
  porsi: number;
  penghambat: { nama: string; satuan: string; stok: number; kebutuhan: number } | null;
};

/** Porsi terkecil dari seluruh bahan resep, dibulatkan ke bawah. */
export function hitungPorsi(resep: ItemResep[], bahan: InfoBahan[]): HasilPorsi {
  if (resep.length === 0) return { porsi: 0, penghambat: null };
  const peta = new Map(bahan.map((b) => [b.id, b]));
  let terkecil = Number.POSITIVE_INFINITY;
  let penghambat: HasilPorsi["penghambat"] = null;

  for (const item of resep) {
    if (!Number.isFinite(item.jumlahPerPorsi) || item.jumlahPerPorsi <= 0) {
      return { porsi: 0, penghambat: null };
    }
    const info = peta.get(item.bahanId);
    const stok = info && Number.isFinite(info.stok) ? Math.max(0, info.stok) : 0;
    const maks = Math.floor(stok / item.jumlahPerPorsi);
    if (maks < terkecil) {
      terkecil = maks;
      penghambat = {
        nama: info?.nama ?? "Bahan tidak ditemukan",
        satuan: info?.satuan ?? "",
        stok,
        kebutuhan: item.jumlahPerPorsi,
      };
    }
  }
  return { porsi: Number.isFinite(terkecil) ? terkecil : 0, penghambat };
}

export type Kekurangan = { nama: string; satuan: string; tersedia: number; dibutuhkan: number; kurang: number };

export function cekStokCukup(
  resep: ItemResep[],
  jumlah: number,
  bahan: InfoBahan[],
): { cukup: boolean; kekurangan: Kekurangan[] } {
  const peta = new Map(bahan.map((b) => [b.id, b]));
  const kekurangan: Kekurangan[] = [];
  for (const item of resep) {
    const info = peta.get(item.bahanId);
    const tersedia = info ? Math.max(0, info.stok) : 0;
    const dibutuhkan = item.jumlahPerPorsi * jumlah;
    if (dibutuhkan > tersedia + 1e-9) {
      kekurangan.push({
        nama: info?.nama ?? "Bahan tidak ditemukan",
        satuan: info?.satuan ?? "",
        tersedia,
        dibutuhkan,
        kurang: dibutuhkan - tersedia,
      });
    }
  }
  return { cukup: kekurangan.length === 0, kekurangan };
}

/** HPP satu porsi dari resep dan harga rata rata bahan. */
export function hitungHpp(resep: ItemResep[], bahan: InfoBahan[]): number {
  const peta = new Map(bahan.map((b) => [b.id, b]));
  return resep.reduce((nilai, item) => {
    const info = peta.get(item.bahanId);
    return nilai + item.jumlahPerPorsi * (info?.harga_rata_rata ?? 0);
  }, 0);
}

export function margin(hargaJual: number, hpp: number): { laba: number; persen: number } {
  const laba = hargaJual - hpp;
  return { laba, persen: hargaJual > 0 ? (laba / hargaJual) * 100 : 0 };
}

export function totalDenganDiskon(subtotal: number, diskon: number): number {
  return Math.max(0, subtotal - Math.max(0, diskon));
}

export function ringkasKeuangan(
  penjualan: { total: number; diskon: number; metode: string; hpp: number }[],
  pengeluaran: number,
) {
  const omzet = penjualan.reduce((n, p) => n + p.total, 0);
  const hpp = penjualan.reduce((n, p) => n + p.hpp, 0);
  const diskon = penjualan.reduce((n, p) => n + p.diskon, 0);
  const labaKotor = omzet - hpp;
  const labaBersih = labaKotor - pengeluaran;
  const perMetode = penjualan.reduce<Record<string, number>>((peta, p) => {
    peta[p.metode] = (peta[p.metode] ?? 0) + p.total;
    return peta;
  }, {});
  return { omzet, hpp, diskon, labaKotor, pengeluaran, labaBersih, perMetode };
}
