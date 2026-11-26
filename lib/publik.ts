import { statusPreorder, statusToko, type JadwalHari } from "./jadwal.ts";

/** Daftar putih pengaturan yang boleh dikirim ke pengunjung website. */
export function pengaturanPublik(pengaturan: Record<string, string>) {
  return {
    nama_usaha: pengaturan.nama_usaha ?? "Warung Kak Ikaa",
    tagline: pengaturan.tagline ?? "Mie Jebew Chili Oil",
    whatsapp_admin: (process.env.WHATSAPP_ADMIN ?? "").trim() || (pengaturan.whatsapp_admin ?? "").trim(),
    jam_buka: pengaturan.jam_buka ?? "10:00",
    jam_tutup: pengaturan.jam_tutup ?? "21:00",
    hari_buka: pengaturan.hari_buka ?? "Senin - Minggu",
    toko_aktif: pengaturan.toko_aktif ?? "true",
    preorder_aktif: pengaturan.preorder_aktif ?? "true",
    preorder_jam_buka: pengaturan.preorder_jam_buka ?? pengaturan.jam_buka ?? "10:00",
    preorder_jam_tutup: pengaturan.preorder_jam_tutup ?? pengaturan.jam_tutup ?? "21:00",
  };
}

/** Data publik lengkap dengan status operasional yang dihitung server. */
export function dataPengunjung(
  pengaturan: Record<string, string>, jadwal: JadwalHari[] = [], libur: string[] = [],
) {
  return {
    ...pengaturanPublik(pengaturan),
    status_toko: statusToko(pengaturan, new Date(), jadwal, libur),
    status_preorder: statusPreorder(pengaturan, new Date(), jadwal, libur),
  };
}
