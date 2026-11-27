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
    alamat_usaha: pengaturan.alamat_usaha ?? "",
    peta_usaha: pengaturan.peta_usaha ?? "",
    deskripsi_usaha: pengaturan.deskripsi_usaha ?? "",
    email_usaha: pengaturan.email_usaha ?? "",
    instagram_usaha: pengaturan.instagram_usaha ?? "",
    logo_url: pengaturan.logo_url ?? "",
    pemeliharaan: pengaturan.pemeliharaan ?? "false",
    banner_judul: pengaturan.banner_judul ?? "",
    banner_isi: pengaturan.banner_isi ?? "",
    banner_tautan: pengaturan.banner_tautan ?? "",
    minimum_preorder: pengaturan.minimum_preorder ?? "0",
    biaya_kirim: pengaturan.biaya_kirim ?? "0",
    bundling_aktif: pengaturan.bundling_aktif ?? "false",
    bundling_min: pengaturan.bundling_min ?? "3",
    bundling_diskon: pengaturan.bundling_diskon ?? "5",
    batal_batas_menit: pengaturan.batal_batas_menit ?? "120",
    qris_gambar: pengaturan.qris_gambar ?? "",
    qris_teks: pengaturan.qris_teks ?? "",
    ppn_aktif: pengaturan.ppn_aktif ?? "false",
    ppn_persen: pengaturan.ppn_persen ?? "0",
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
