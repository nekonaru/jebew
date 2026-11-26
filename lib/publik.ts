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
  };
}
