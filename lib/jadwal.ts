// Status operasional toko dan pre-order. Semua perhitungan memakai WIB.

export type StatusJadwal = {
  buka: boolean;
  label: string;
  keterangan: string;
};

export type JadwalHari = {
  jenis?: string; hari: number; jam_buka: string; jam_tutup: string; aktif: boolean;
};

const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function indeksHari(nama: string): number {
  const bersih = nama.trim().toLowerCase();
  return NAMA_HARI.findIndex((h) => h.toLowerCase() === bersih);
}

/** Cek apakah hari ini termasuk rentang hari, misalnya "Senin - Minggu". */
export function hariTermasuk(rentang: string, sekarang: Date): boolean {
  const hari = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", weekday: "short" })
    .format(sekarang);
  const indeksSekarang = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(hari);
  const bagian = rentang.split("-").map((b) => b.trim());
  if (bagian.length === 1) {
    const indeks = indeksHari(bagian[0]);
    return indeks >= 0 && indeks === indeksSekarang;
  }
  if (bagian.length !== 2) return false;
  const mulai = indeksHari(bagian[0]);
  const selesai = indeksHari(bagian[1]);
  if (mulai < 0 || selesai < 0) return false;
  if (mulai <= selesai) return indeksSekarang >= mulai && indeksSekarang <= selesai;
  return indeksSekarang >= mulai || indeksSekarang <= selesai;
}

export function menitDariJam(jam: string): number {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(jam)) return 0;
  return Number(jam.slice(0, 2)) * 60 + Number(jam.slice(3, 5));
}

/** Cek jam berada di rentang, termasuk rentang yang melewati tengah malam. */
export function jamDalamRentang(jam: string, mulai: string, selesai: string): boolean {
  const nilai = menitDariJam(jam);
  const awal = menitDariJam(mulai);
  const akhir = menitDariJam(selesai);
  if (awal === akhir) return true;
  if (awal < akhir) return nilai >= awal && nilai < akhir;
  return nilai >= awal || nilai < akhir;
}

function jamSekarang(sekarang: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(sekarang);
}

/** Status toko berdasarkan jadwal usaha. */
function teks(nilai: unknown, cadangan: string): string {
  return typeof nilai === "string" && nilai ? nilai : cadangan;
}

function hariSekarang(sekarang: Date): number {
  const hari = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", weekday: "short" })
    .format(sekarang);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(hari);
}

function tanggalSekarang(sekarang: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(sekarang);
}

function jadwalHariIni(jadwal: JadwalHari[] | undefined, jenis: string, sekarang: Date): JadwalHari | null {
  if (!jadwal?.length) return null;
  const indeks = hariSekarang(sekarang);
  return jadwal.find((j) => j.jenis === jenis && j.hari === indeks) ?? null;
}

export function statusToko(
  pengaturan: Record<string, unknown>, sekarang: Date = new Date(),
  jadwal?: JadwalHari[], libur: string[] = [],
): StatusJadwal {
  if (teks(pengaturan.toko_aktif, "true") === "false") {
    return { buka: false, label: "Toko tutup", keterangan: "Pemilik sedang menutup toko" };
  }
  if (libur.includes(tanggalSekarang(sekarang))) {
    return { buka: false, label: "Toko tutup", keterangan: "Hari libur" };
  }
  const harian = jadwalHariIni(jadwal, "toko", sekarang);
  if (harian && !harian.aktif) {
    return { buka: false, label: "Toko tutup", keterangan: "Libur pada hari ini" };
  }
  const jamBuka = harian?.jam_buka ?? teks(pengaturan.jam_buka, "10:00");
  const jamTutup = harian?.jam_tutup ?? teks(pengaturan.jam_tutup, "21:00");
  const hariBuka = teks(pengaturan.hari_buka, "Senin - Minggu");
  if (!harian && !hariTermasuk(hariBuka, sekarang)) {
    return { buka: false, label: "Toko tutup", keterangan: `Hari libur: ${hariBuka}` };
  }
  if (!jamDalamRentang(jamSekarang(sekarang), jamBuka, jamTutup)) {
    return { buka: false, label: "Toko tutup", keterangan: `Buka ${jamBuka} - ${jamTutup} WIB` };
  }
  return { buka: true, label: "Toko buka", keterangan: `Buka sampai ${jamTutup} WIB` };
}

/** Status pre-order. Terpisah dari status toko. */
export function statusPreorder(
  pengaturan: Record<string, unknown>, sekarang: Date = new Date(),
  jadwal?: JadwalHari[], libur: string[] = [],
): StatusJadwal {
  if (teks(pengaturan.preorder_aktif, "true") === "false") {
    return { buka: false, label: "Pre-order ditutup", keterangan: "Pemilik belum membuka pre-order" };
  }
  if (libur.includes(tanggalSekarang(sekarang))) {
    return { buka: false, label: "Pre-order ditutup", keterangan: "Hari libur" };
  }
  const harian = jadwalHariIni(jadwal, "preorder", sekarang);
  if (harian && !harian.aktif) {
    return { buka: false, label: "Pre-order ditutup", keterangan: "Libur pada hari ini" };
  }
  const jamBuka = harian?.jam_buka ?? teks(pengaturan.preorder_jam_buka, teks(pengaturan.jam_buka, "10:00"));
  const jamTutup = harian?.jam_tutup ?? teks(pengaturan.preorder_jam_tutup, teks(pengaturan.jam_tutup, "21:00"));
  if (!jamDalamRentang(jamSekarang(sekarang), jamBuka, jamTutup)) {
    return { buka: false, label: "Pre-order ditutup", keterangan: `Pre-order dibuka ${jamBuka} - ${jamTutup} WIB` };
  }
  return { buka: true, label: "Pre-order dibuka", keterangan: `Pre-order sampai ${jamTutup} WIB` };
}
