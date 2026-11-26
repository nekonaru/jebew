// Membuka jadwal penuh saat uji agar tes tidak bergantung pada jam nyata.
// Pengaturan asli dipulihkan oleh fungsi yang dikembalikan.
function kunciAman(pengaturan) {
  return {
    nama_usaha: pengaturan.nama_usaha ?? "Warung Kak Ikaa",
    tagline: pengaturan.tagline ?? "Mie Jebew Chili Oil",
    whatsapp_admin: pengaturan.whatsapp_admin ?? "6282173282591",
    hari_buka: pengaturan.hari_buka ?? "Senin - Minggu",
    jam_buka: pengaturan.jam_buka ?? "10:00",
    jam_tutup: pengaturan.jam_tutup ?? "21:00",
    toko_aktif: pengaturan.toko_aktif ?? "true",
    preorder_aktif: pengaturan.preorder_aktif ?? "true",
    preorder_jam_buka: pengaturan.preorder_jam_buka ?? pengaturan.jam_buka ?? "10:00",
    preorder_jam_tutup: pengaturan.preorder_jam_tutup ?? pengaturan.jam_tutup ?? "21:00",
  };
}

/** Buka jadwal penuh. Kembalikan fungsi pemulih. */
export async function jadwalTerbuka(dasar) {
  const masuk = await fetch(`${dasar}/api/auth`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "pemilik@jebew.test", kata_sandi: "pemilik123" }),
  });
  const cookie = masuk.headers.get("set-cookie")?.split(";")[0] ?? "";
  const H = { "Content-Type": "application/json", Cookie: cookie };
  const asli = kunciAman(await (await fetch(`${dasar}/api/pengaturan`, { headers: H })).json());
  const penuh = { ...asli, jam_buka: "00:00", jam_tutup: "23:59", preorder_jam_buka: "00:00", preorder_jam_tutup: "23:59" };
  await fetch(`${dasar}/api/pengaturan`, { method: "PUT", headers: H, body: JSON.stringify(penuh) });

  return async () => {
    await fetch(`${dasar}/api/pengaturan`, { method: "PUT", headers: H, body: JSON.stringify(asli) });
  };
}
