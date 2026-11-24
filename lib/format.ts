// Fungsi format tampilan. Semua output memakai Bahasa Indonesia dan zona WIB.

const formatterRupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatRupiah(nilai: number): string {
  return formatterRupiah.format(nilai);
}

export function formatAngka(nilai: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(nilai);
}

/** Menampilkan angka stok dengan satuan, misalnya "1.000 gram". */
export function formatStok(nilai: number, satuan: string): string {
  return `${formatAngka(nilai)} ${satuan}`;
}

/** Tangka dan jam dari database sudah dalam WIB, jadi cukup diubah tampilannya. */
export function formatWaktu(teks: string): string {
  const tanggal = new Date(teks.replace(" ", "T") + "+07:00");
  if (Number.isNaN(tanggal.getTime())) {
    return teks;
  }
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(tanggal);
}

/** Tanggal hari ini dalam WIB, dipakai sebagai nilai awal filter laporan. */
export function tanggalHariIni(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Tanggal kalender yang benar, bukan sekadar pola YYYY-MM-DD. */
export function tanggalValid(nilai: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nilai)) return false;
  const tanggal = new Date(`${nilai}T00:00:00Z`);
  return !Number.isNaN(tanggal.getTime()) && tanggal.toISOString().slice(0, 10) === nilai;
}

/** Label tanggal yang ramah dibaca, misalnya "23 November 2026". */
export function formatTanggalPanjang(teks: string): string {
  const tanggal = new Date(teks + "T00:00:00+07:00");
  if (Number.isNaN(tanggal.getTime())) {
    return teks;
  }
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(tanggal);
}
