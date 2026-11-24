// Kasir dan pre-order. Semua perubahan stok berjalan dalam satu transaksi database.

import { randomBytes } from "node:crypto";
import { denganTransaksi, jalankan, query, querySatu } from "../database.ts";
import { GalatBisnis } from "./galat.ts";
import { cekStokCukup, totalDenganDiskon } from "../inti-final.ts";
import type { PenggunaSesi } from "../auth.ts";
import { ambilBahanSemua, resepGabungan } from "./menu.ts";
import { catatAudit } from "../audit.ts";

export type Barang = {
  menu_id: number;
  varian_id: number | null;
  nama_menu: string;
  nama_varian: string;
  harga_satuan: number;
  jumlah: number;
  subtotal: number;
};

export type KasirInput = {
  items: { menu_id: number; varian_id: number | null; jumlah: number }[];
  diskon: number;
  metode: "tunai" | "qris" | "transfer";
  catatan: string;
};

type ResepDipakai = { menuId: number; varianId: number | null; jumlah: number; item: { bahanId: number; jumlahPerPorsi: number }[] };

/** Validasi stok dan susun barang dengan harga dari database, bukan dari klien. */
async function siapkanBarang(items: KasirInput["items"]): Promise<{ barang: Barang[]; resepDipakai: ResepDipakai[] }> {
  const barang: Barang[] = [];
  const resepDipakai: ResepDipakai[] = [];
  const bahan = await ambilBahanSemua();

  for (const item of items) {
    const menu = await querySatu<{ id: number; nama: string; harga: number; aktif: boolean }>(
      "SELECT id, nama, harga, aktif FROM menu WHERE id = $1", [item.menu_id],
    );
    if (!menu || !menu.aktif) throw new GalatBisnis(`Menu dengan id ${item.menu_id} tidak tersedia`);

    let varianNama = "";
    let harga = menu.harga;
    if (item.varian_id) {
      const varian = await querySatu<{ id: number; nama: string; harga_tambahan: number; aktif: boolean }>(
        "SELECT id, nama, harga_tambahan, aktif FROM varian WHERE id = $1 AND menu_id = $2",
        [item.varian_id, item.menu_id],
      );
      if (!varian || !varian.aktif) throw new GalatBisnis("Varian tidak tersedia");
      varianNama = varian.nama;
      harga += varian.harga_tambahan;
    }

    const resep = await resepGabungan(menu.id, item.varian_id);
    if (resep.length === 0) throw new GalatBisnis(`Menu ${menu.nama} belum punya resep`);
    const cek = cekStokCukup(resep, item.jumlah, bahan);
    if (!cek.cukup) {
      const rincian = cek.kekurangan
        .map((k) => `${k.nama} kurang ${k.kurang} ${k.satuan}`).join(", ");
      throw new GalatBisnis(`Stok tidak cukup untuk ${menu.nama}: ${rincian}`);
    }

    barang.push({
      menu_id: menu.id,
      varian_id: item.varian_id,
      nama_menu: menu.nama,
      nama_varian: varianNama,
      harga_satuan: harga,
      jumlah: item.jumlah,
      subtotal: harga * item.jumlah,
    });
    resepDipakai.push({ menuId: menu.id, varianId: item.varian_id, jumlah: item.jumlah, item: resep });
  }
  return { barang, resepDipakai };
}

async function potongStok(resepDipakai: ResepDipakai[], referensi: string, pengguna: PenggunaSesi | null): Promise<void> {
  for (const entri of resepDipakai) {
    for (const r of entri.item) {
      const bahan = await querySatu<{ stok: number; nama: string }>(
        "SELECT stok, nama FROM bahan WHERE id = $1 FOR UPDATE", [r.bahanId],
      );
      if (!bahan) throw new GalatBisnis("Bahan tidak ditemukan");
      const kebutuhan = r.jumlahPerPorsi * entri.jumlah;
      const hasil = await jalankan(
        "UPDATE bahan SET stok = stok - $1 WHERE id = $2 AND stok >= $1",
        [kebutuhan, r.bahanId],
      );
      if (hasil === 0) throw new GalatBisnis(`Stok ${bahan.nama} berubah saat transaksi diproses. Coba lagi.`);
      await jalankan(
        `INSERT INTO pergerakan_stok (bahan_id, jenis, jumlah, stok_sebelum, stok_sesudah, referensi, catatan, pengguna_id)
         VALUES ($1,'keluar',$2,$3,$4,$5,'Penjualan',$6)`,
        [r.bahanId, kebutuhan, bahan.stok, bahan.stok - kebutuhan, referensi, pengguna?.id ?? null],
      );
    }
  }
}

async function nomorPenjualan(): Promise<string> {
  const sekarang = new Date();
  const hari = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(sekarang).replace(/-/g, "");
  const hasil = await querySatu<{ jumlah: number }>(
    "SELECT COUNT(*) AS jumlah FROM penjualan WHERE nomor LIKE $1", [`JW-${hari}-%`],
  );
  return `JW-${hari}-${String((hasil?.jumlah ?? 0) + 1).padStart(4, "0")}`;
}

export async function catatPenjualan(input: KasirInput, pengguna: PenggunaSesi | null): Promise<{ id: number; nomor: string; total: number }> {
  return denganTransaksi(async () => {
    const { barang, resepDipakai } = await siapkanBarang(input.items);
    const subtotal = barang.reduce((n, b) => n + b.subtotal, 0);
    const total = totalDenganDiskon(subtotal, input.diskon);
    const nomor = await nomorPenjualan();

    const baris = await querySatu<{ id: number }>(
      `INSERT INTO penjualan (nomor, total, diskon, metode, catatan, sumber, kasir_id)
       VALUES ($1,$2,$3,$4,$5,'kasir',$6) RETURNING id`,
      [nomor, total, input.diskon, input.metode, input.catatan, pengguna?.id ?? null],
    );

    for (const item of barang) {
      await jalankan(
        `INSERT INTO item_penjualan (penjualan_id, menu_id, varian_id, nama_menu, nama_varian, harga_satuan, jumlah, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [baris!.id, item.menu_id, item.varian_id, item.nama_menu, item.nama_varian,
          item.harga_satuan, item.jumlah, item.subtotal],
      );
    }
    await potongStok(resepDipakai, nomor, pengguna);
    await catatAudit(pengguna, "tambah", "penjualan", `${nomor}, total ${total}`);
    return { id: baris!.id, nomor, total };
  });
}

export type PreorderInput = {
  items: { menu_id: number; varian_id: number | null; jumlah: number }[];
  nama_pelanggan: string;
  whatsapp: string;
  waktu_ambil: string;
  slot_id: number | null;
  catatan: string;
};

function kodePendek(panjang: number): string {
  return randomBytes(panjang).toString("hex").toUpperCase().slice(0, panjang * 2);
}

export async function simpanPreorder(input: PreorderInput): Promise<{
  kode: string; kode_lacak: string; total: number; items: Barang[];
}> {
  return denganTransaksi(async () => {
    const { barang } = await siapkanBarang(input.items);
    const total = barang.reduce((n, b) => n + b.subtotal, 0);
    const kode = `JBW-${kodePendek(3)}`;
    const kodeLacak = kodePendek(4);

    if (input.slot_id) {
      const slot = await querySatu<{ kuota: number; terisi: number }>(
        "SELECT kuota, terisi FROM slot_waktu WHERE id = $1 FOR UPDATE", [input.slot_id],
      );
      if (!slot) throw new GalatBisnis("Slot waktu tidak ditemukan");
      if (slot.terisi >= slot.kuota) throw new GalatBisnis("Slot waktu sudah penuh");
      await jalankan("UPDATE slot_waktu SET terisi = terisi + 1 WHERE id = $1", [input.slot_id]);
    }

    const baris = await querySatu<{ id: number }>(
      `INSERT INTO preorder (kode, kode_lacak, nama_pelanggan, whatsapp, waktu_ambil, slot_id, catatan)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [kode, kodeLacak, input.nama_pelanggan, input.whatsapp, input.waktu_ambil, input.slot_id, input.catatan],
    );
    for (const item of barang) {
      await jalankan(
        `INSERT INTO item_preorder (preorder_id, menu_id, varian_id, nama_menu, nama_varian, harga_satuan, jumlah, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [baris!.id, item.menu_id, item.varian_id, item.nama_menu, item.nama_varian,
          item.harga_satuan, item.jumlah, item.subtotal],
      );
    }
    return { kode, kode_lacak: kodeLacak, total, items: barang };
  });
}

export async function ambilPreorder() {
  const daftar = await query<{
    id: number; kode: string; kode_lacak: string; nama_pelanggan: string; whatsapp: string;
    waktu_ambil: string; catatan: string; status: string; penjualan_id: number | null; dibuat_pada: string;
  }>("SELECT id, kode, kode_lacak, nama_pelanggan, whatsapp, waktu_ambil, catatan, status, penjualan_id, dibuat_pada FROM preorder ORDER BY id DESC");
  const semuaItem = await query<Barang & { preorder_id: number }>(
    `SELECT preorder_id, menu_id, varian_id, nama_menu, nama_varian, harga_satuan, jumlah, subtotal
     FROM item_preorder ORDER BY id`,
  );
  const peta = new Map<number, Barang[]>();
  for (const item of semuaItem) {
    const daftarItem = peta.get(item.preorder_id) ?? [];
    daftarItem.push({
      menu_id: item.menu_id, varian_id: item.varian_id, nama_menu: item.nama_menu,
      nama_varian: item.nama_varian, harga_satuan: item.harga_satuan,
      jumlah: item.jumlah, subtotal: item.subtotal,
    });
    peta.set(item.preorder_id, daftarItem);
  }
  return daftar.map((p) => {
    const items = peta.get(p.id) ?? [];
    return { ...p, items, total: items.reduce((n, i) => n + i.subtotal, 0) };
  });
}

export async function lacakPreorder(kode: string) {
  const hasil = await querySatu<{
    kode: string; kode_lacak: string; nama_pelanggan: string; waktu_ambil: string;
    status: string; catatan: string; dibuat_pada: string;
  }>(
    `SELECT kode, kode_lacak, nama_pelanggan, waktu_ambil, status, catatan, dibuat_pada
     FROM preorder WHERE kode_lacak = $1 OR kode = $1`,
    [kode.trim().toUpperCase()],
  );
  if (!hasil) return null;
  const items = await query<{ nama_menu: string; nama_varian: string; jumlah: number; subtotal: number }>(
    "SELECT nama_menu, nama_varian, jumlah, subtotal FROM item_preorder WHERE preorder_id = (SELECT id FROM preorder WHERE kode_lacak = $1 OR kode = $1)",
    [kode.trim().toUpperCase()],
  );
  return { ...hasil, items, total: items.reduce((n, i) => n + i.subtotal, 0) };
}

export async function selesaikanPreorder(id: number, pengguna: PenggunaSesi | null): Promise<void> {
  await denganTransaksi(async () => {
    const preorder = await querySatu<{ id: number; status: string; catatan: string; penjualan_id: number | null }>(
      "SELECT id, status, catatan, penjualan_id FROM preorder WHERE id = $1 FOR UPDATE", [id],
    );
    if (!preorder) throw new GalatBisnis("Preorder tidak ditemukan");
    if (preorder.status === "selesai") throw new GalatBisnis("Preorder sudah selesai");
    if (preorder.status === "batal") throw new GalatBisnis("Preorder sudah dibatalkan");
    if (preorder.penjualan_id) throw new GalatBisnis("Preorder sudah dicatat");

    const snapshot = await query<Barang>(
      `SELECT menu_id, varian_id, nama_menu, nama_varian, harga_satuan, jumlah, subtotal
       FROM item_preorder WHERE preorder_id = $1 ORDER BY id`, [id],
    );
    if (snapshot.length === 0) throw new GalatBisnis("Preorder tidak punya item");

    const mangsa: KasirInput["items"] = snapshot.map((s) => ({
      menu_id: s.menu_id, varian_id: s.varian_id, jumlah: s.jumlah,
    }));
    const { resepDipakai } = await siapkanBarang(mangsa);
    const total = snapshot.reduce((n, b) => n + b.subtotal, 0);
    const nomor = await nomorPenjualan();

    const baris = await querySatu<{ id: number }>(
      `INSERT INTO penjualan (nomor, total, diskon, metode, catatan, sumber, kasir_id, preorder_id)
       VALUES ($1,$2,0,'tunai',$3,'preorder',$4,$5) RETURNING id`,
      [nomor, total, preorder.catatan, pengguna?.id ?? null, id],
    );
    for (const item of snapshot) {
      await jalankan(
        `INSERT INTO item_penjualan (penjualan_id, menu_id, varian_id, nama_menu, nama_varian, harga_satuan, jumlah, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [baris!.id, item.menu_id, item.varian_id, item.nama_menu, item.nama_varian,
          item.harga_satuan, item.jumlah, item.subtotal],
      );
    }
    await potongStok(resepDipakai, nomor, pengguna);
    await jalankan(
      "UPDATE preorder SET status='selesai', penjualan_id=$1 WHERE id=$2", [baris!.id, id],
    );
    await catatAudit(pengguna, "ubah", "preorder", `${id} selesai, penjualan ${nomor}`);
  });
}

export async function ubahStatusPreorder(
  id: number, status: "diproses" | "batal", pengguna: PenggunaSesi | null,
): Promise<void> {
  await denganTransaksi(async () => {
    const ada = await querySatu<{ status: string }>(
      "SELECT status FROM preorder WHERE id = $1 FOR UPDATE", [id],
    );
    if (!ada) throw new GalatBisnis("Preorder tidak ditemukan");
    if (ada.status === "selesai") throw new GalatBisnis("Preorder selesai tidak bisa diubah");
    await jalankan("UPDATE preorder SET status = $1 WHERE id = $2", [status, id]);
    await catatAudit(pengguna, "ubah", "preorder", `${id} menjadi ${status}`);
  });
}
