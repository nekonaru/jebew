// Kasir dan pre-order. Semua perubahan stok berjalan dalam satu transaksi database.

import { randomBytes } from "node:crypto";
import { denganTransaksi, jalankan, query, querySatu } from "../database.ts";
import { GalatBisnis } from "./galat.ts";
import { batasiDiskon, cekStokCukup, hitungHpp, totalDenganDiskon } from "../inti-final.ts";
import type { PenggunaSesi } from "../auth.ts";
import { ambilBahanTransaksi, ambilMenu } from "./menu.ts";
import { catatAudit } from "../audit.ts";
import { escapeLike, jamMenitWIB, tanggalHariIni } from "../format.ts";
import {
  catatRiwayatStatus, catatNotifikasi, tambahPoin, validasiPromo,
  ambilPoin, ambilRiwayatStatus, estimasiSiapMenit,
} from "./tambahan.ts";
import { kirimWhatsApp, pesanStatus } from "../notifikasi.ts";

export type Barang = {
  menu_id: number;
  varian_id: number | null;
  nama_menu: string;
  nama_varian: string;
  harga_satuan: number;
  jumlah: number;
  subtotal: number;
  hpp: number;
};

export type KasirInput = {
  items: { menu_id: number; varian_id: number | null; jumlah: number }[];
  diskon: number;
  metode: "tunai" | "qris" | "transfer";
  catatan: string;
};

type ResepDipakai = { menuId: number; varianId: number | null; jumlah: number; item: { bahanId: number; jumlahPerPorsi: number }[] };

/** Validasi stok dan susun barang. Semua menu, varian, dan resep dimuat sekali, lalu diindeks. */
async function siapkanBarang(items: KasirInput["items"], untukPreorder = false): Promise<{ barang: Barang[]; resepDipakai: ResepDipakai[] }> {
  // Di dalam transaksi semua kueri memakai satu koneksi, jadi dijalankan berurutan.
  const bahan = await ambilBahanTransaksi();
  const daftarMenu = await ambilMenu();
  const petaMenu = new Map(daftarMenu.map((m) => [m.id, m]));
  const barang: Barang[] = [];
  const resepDipakai: ResepDipakai[] = [];

  for (const item of items) {
    const menu = petaMenu.get(item.menu_id);
    if (!menu || (!menu.aktif && !untukPreorder)) throw new GalatBisnis(`Menu dengan id ${item.menu_id} tidak tersedia`);

    let varianNama = "";
    let harga = menu.harga;
    const resep: { bahanId: number; jumlahPerPorsi: number }[] = menu.resep.map((r) => ({
      bahanId: r.bahan_id, jumlahPerPorsi: r.jumlah_per_porsi,
    }));

    if (item.varian_id) {
      const varian = menu.varian.find((v) => v.id === item.varian_id && v.aktif);
      if (!varian) throw new GalatBisnis("Varian tidak tersedia");
      varianNama = varian.nama;
      harga += varian.harga_tambahan;
      for (const tambahan of varian.resep) {
        const sudahAda = resep.find((r) => r.bahanId === tambahan.bahan_id);
        if (sudahAda) sudahAda.jumlahPerPorsi += tambahan.jumlah_per_porsi;
        else resep.push({ bahanId: tambahan.bahan_id, jumlahPerPorsi: tambahan.jumlah_per_porsi });
      }
    }

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
      hpp: Math.round(hitungHpp(resep, bahan)),
    });
    resepDipakai.push({ menuId: menu.id, varianId: item.varian_id, jumlah: item.jumlah, item: resep });
  }
  return { barang, resepDipakai };
}

async function potongStok(
  resepDipakai: ResepDipakai[], referensi: string, pengguna: PenggunaSesi | null,
): Promise<number[]> {
  // Urutan kunci yang konsisten mencegah deadlock antar transaksi paralel.
  const entriTerurut = resepDipakai.map((entri) => ({
    ...entri, item: [...entri.item].sort((a, b) => a.bahanId - b.bahanId),
  })).sort((a, b) => (a.item[0]?.bahanId ?? 0) - (b.item[0]?.bahanId ?? 0));
  const hargaTerkunci = new Map<number, number>();
  for (const entri of entriTerurut) {
    for (const r of entri.item) {
      const bahan = await querySatu<{ stok: number; nama: string; harga_rata_rata: number }>(
        "SELECT stok, nama, harga_rata_rata FROM bahan WHERE id = $1 FOR UPDATE", [r.bahanId],
      );
      if (!bahan) throw new GalatBisnis("Bahan tidak ditemukan");
      if (!hargaTerkunci.has(r.bahanId)) hargaTerkunci.set(r.bahanId, Number(bahan.harga_rata_rata));
      const kebutuhan = r.jumlahPerPorsi * entri.jumlah;
      const hasil = await jalankan(
        "UPDATE bahan SET stok = stok - $1 WHERE id = $2 AND stok >= $1",
        [kebutuhan, r.bahanId],
      );
      if (hasil === 0) throw new GalatBisnis(`Stok ${bahan.nama} berubah saat transaksi diproses. Coba lagi.`);
      const batch = await query<{ id: number; sisa: number }>(
        `SELECT id, sisa FROM batch_bahan
         WHERE bahan_id = $1 AND sisa > 0
         ORDER BY CASE WHEN tanggal_kedaluwarsa IS NULL THEN 1 ELSE 0 END,
                  tanggal_kedaluwarsa ASC, tanggal_masuk ASC, id ASC`,
        [r.bahanId],
      );
      let sisaKebutuhan = kebutuhan;
      for (const b of batch) {
        if (sisaKebutuhan <= 0) break;
        const potongan = Math.min(Number(b.sisa), sisaKebutuhan);
        await jalankan("UPDATE batch_bahan SET sisa = sisa - $1 WHERE id = $2", [potongan, b.id]);
        await jalankan(
          `INSERT INTO pergerakan_stok (bahan_id, jenis, jumlah, stok_sebelum, stok_sesudah, referensi, catatan, pengguna_id, batch_id)
           VALUES ($1,'keluar',$2,$3,$4,$5,'Penjualan',$6,$7)`,
          [r.bahanId, potongan, bahan.stok, bahan.stok - kebutuhan, referensi,
            pengguna?.id ?? null, b.id],
        );
        sisaKebutuhan -= potongan;
      }
      if (sisaKebutuhan > 0) {
        await jalankan(
          `INSERT INTO pergerakan_stok (bahan_id, jenis, jumlah, stok_sebelum, stok_sesudah, referensi, catatan, pengguna_id)
           VALUES ($1,'keluar',$2,$3,$4,$5,'Penjualan',$6)`,
          [r.bahanId, sisaKebutuhan, bahan.stok, bahan.stok - kebutuhan, referensi, pengguna?.id ?? null],
        );
      }
    }
  }
  const infoBahan = [...hargaTerkunci].map(([id, harga]) => ({
    id, nama: "", satuan: "", stok: 0, harga_rata_rata: harga,
  }));
  return resepDipakai.map((entri) => Math.round(hitungHpp(entri.item, infoBahan)));
}

async function nomorPenjualan(): Promise<string> {
  // Kunci advisory menjaga nomor tetap unik bila dua transaksi masuk bersamaan.
  await query("SELECT pg_advisory_xact_lock(735211)");
  const sekarang = new Date();
  const hari = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(sekarang).replace(/-/g, "");
  const hasil = await querySatu<{ jumlah: number }>(
    "SELECT COUNT(*) AS jumlah FROM penjualan WHERE nomor LIKE $1", [`JW-${hari}-%`],
  );
  return `JW-${hari}-${String((hasil?.jumlah ?? 0) + 1).padStart(4, "0")}`;
}

export async function catatPenjualan(input: KasirInput, pengguna: PenggunaSesi | null): Promise<{
  id: number; nomor: string; total: number; dibuat_pada: string; items: Barang[];
}> {
  return denganTransaksi(async () => {
    const { barang, resepDipakai } = await siapkanBarang(input.items);
    const subtotal = barang.reduce((n, b) => n + b.subtotal, 0);
    const diskon = batasiDiskon(subtotal, input.diskon);
    const total = totalDenganDiskon(subtotal, diskon);
    const nomor = await nomorPenjualan();
    // Kunci bahan dulu agar HPP memakai harga yang sama dengan saat stok dipotong.
    const hppTerkunci = await potongStok(resepDipakai, nomor, pengguna);
    barang.forEach((b, i) => { b.hpp = hppTerkunci[i] ?? b.hpp; });

    const baris = await querySatu<{ id: number; dibuat_pada: string }>(
      `INSERT INTO penjualan (nomor, total, diskon, metode, catatan, sumber, kasir_id)
       VALUES ($1,$2,$3,$4,$5,'kasir',$6) RETURNING id, dibuat_pada`,
      [nomor, total, diskon, input.metode, input.catatan, pengguna?.id ?? null],
    );

    for (const item of barang) {
      await jalankan(
        `INSERT INTO item_penjualan (penjualan_id, menu_id, varian_id, nama_menu, nama_varian, harga_satuan, jumlah, subtotal, hpp)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [baris!.id, item.menu_id, item.varian_id, item.nama_menu, item.nama_varian,
          item.harga_satuan, item.jumlah, item.subtotal, item.hpp],
      );
    }
    await catatAudit(pengguna, "tambah", "penjualan", `${nomor}, total ${total}`);
    return { id: baris!.id, nomor, total, dibuat_pada: baris!.dibuat_pada, items: barang };
  });
}

export type PreorderInput = {
  items: { menu_id: number; varian_id: number | null; jumlah: number }[];
  nama_pelanggan: string;
  whatsapp: string;
  waktu_ambil: string;
  slot_id: number | null;
  catatan: string;
  kode_promo?: string;
  poin_dipakai?: number;
  tipe_pesanan?: "ambil" | "dine_in" | "kirim";
  meja?: string;
  alamat_kirim?: string;
  kode_undangan?: string;
  minimum?: number;
  ongkir?: number;
  metode_bayar?: "tunai" | "qris" | "transfer";
  bukti_bayar?: string;
};

function kodePendek(panjang: number): string {
  return randomBytes(panjang).toString("hex").toUpperCase().slice(0, panjang * 2);
}

export async function simpanPreorder(input: PreorderInput): Promise<{
  kode: string; kode_lacak: string; total: number; diskon: number; ongkir: number;
  items: Barang[]; kode_promo: string | null; poin_dipakai: number;
}> {
  return denganTransaksi(async () => {
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(input.waktu_ambil)
      || input.waktu_ambil.slice(0, 10) < tanggalHariIni()) {
      throw new GalatBisnis("Waktu ambil tidak valid atau sudah lewat");
    }
    if (input.waktu_ambil.slice(0, 10) === tanggalHariIni()) {
      const sekarang = jamMenitWIB();
      const diminta = Number(input.waktu_ambil.slice(11, 13)) * 60 + Number(input.waktu_ambil.slice(14, 16));
      if (diminta <= sekarang.jam * 60 + sekarang.menit) {
        throw new GalatBisnis("Waktu ambil sudah lewat");
      }
    }
    // Kunci menu yang dipesan agar penghapusan menu tidak bisa menyela preprocessing.
    const idsMenu = [...new Set(input.items.map((i) => i.menu_id))];
    await query("SELECT id FROM menu WHERE id = ANY($1::int[]) FOR SHARE", [idsMenu]);
    const { barang } = await siapkanBarang(input.items);
    const subtotal = barang.reduce((n, b) => n + b.subtotal, 0);
    const promo = input.kode_promo ? await validasiPromo(input.kode_promo, subtotal) : null;
    const poin = Math.max(0, Math.floor(Number(input.poin_dipakai ?? 0)));
    let diskonPoin = 0;
    if (poin > 0) {
      if (poin % 100 !== 0) throw new GalatBisnis("Penukaran poin kelipatan 100");
      const saldo = await ambilPoin(input.whatsapp);
      if (saldo.poin < poin) throw new GalatBisnis("Poin tidak cukup");
      diskonPoin = Math.floor(poin / 100) * 5000;
    }
    const minimum = Math.max(0, Math.floor(Number(input.minimum ?? 0)));
    if (subtotal < minimum) {
      throw new GalatBisnis(`Minimum preorder ${minimum}`);
    }
    const ongkir = input.tipe_pesanan === "kirim"
      ? Math.max(0, Math.floor(Number(input.ongkir ?? 0))) : 0;
    const diskon = Math.min(subtotal, (promo?.diskon ?? 0) + diskonPoin);
    const total = subtotal - diskon + ongkir;
    const kode = `JBW-${kodePendek(3)}`;
    const kodeLacak = kodePendek(4);

    if (input.slot_id) {
      const slot = await querySatu<{ kuota: number; terisi: number; tanggal: string; jam: string }>(
        "SELECT kuota, terisi, tanggal, jam FROM slot_waktu WHERE id = $1 FOR UPDATE", [input.slot_id],
      );
      if (!slot) throw new GalatBisnis("Slot waktu tidak ditemukan");
      if (slot.tanggal !== input.waktu_ambil.slice(0, 10) || slot.jam !== input.waktu_ambil.slice(11, 16)) {
        throw new GalatBisnis("Waktu ambil tidak cocok dengan slot yang dipilih");
      }
      if (slot.terisi >= slot.kuota) throw new GalatBisnis("Slot waktu sudah penuh");
      await jalankan("UPDATE slot_waktu SET terisi = terisi + 1 WHERE id = $1", [input.slot_id]);
    }

    const baris = await querySatu<{ id: number }>(
      `INSERT INTO preorder (kode, kode_lacak, nama_pelanggan, whatsapp, waktu_ambil, slot_id, catatan, diskon,
        tipe_pesanan, meja, alamat_kirim, kode_undangan, metode_bayar, bukti_bayar, ongkir)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
      [kode, kodeLacak, input.nama_pelanggan, input.whatsapp, input.waktu_ambil,
        input.slot_id, input.catatan, diskon, input.tipe_pesanan ?? "ambil",
        input.meja ?? "", input.alamat_kirim ?? "", input.kode_undangan ?? "",
        input.metode_bayar ?? "tunai", input.bukti_bayar ?? "", ongkir],
    );
    await catatRiwayatStatus(baris!.id, "baru");
    for (const item of barang) {
      await jalankan(
        `INSERT INTO item_preorder (preorder_id, menu_id, varian_id, nama_menu, nama_varian, harga_satuan, jumlah, subtotal, hpp)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [baris!.id, item.menu_id, item.varian_id, item.nama_menu, item.nama_varian,
          item.harga_satuan, item.jumlah, item.subtotal, item.hpp],
      );
    }
    return {
      kode, kode_lacak: kodeLacak, total, diskon, ongkir, items: barang,
      kode_promo: promo?.kode ?? null, poin_dipakai: poin,
    };
  });
}

export type FilterPreorder = { cari?: string; dari?: string; sampai?: string; status?: string; batas?: number };

export async function ambilPreorder(filter: FilterPreorder = {}) {
  const syarat: string[] = [];
  const nilai: unknown[] = [];
  if (filter.status && filter.status !== "semua") {
    nilai.push(filter.status);
    syarat.push(`status = $${nilai.length}`);
  }
  if (filter.cari) {
    nilai.push(`%${escapeLike(filter.cari)}%`);
    syarat.push(`(kode ILIKE $${nilai.length} ESCAPE '\\' OR nama_pelanggan ILIKE $${nilai.length} ESCAPE '\\')`);
  }
  if (filter.dari) {
    nilai.push(filter.dari);
    syarat.push(`dibuat_pada::date >= $${nilai.length}::date`);
  }
  if (filter.sampai) {
    nilai.push(filter.sampai);
    syarat.push(`dibuat_pada::date <= $${nilai.length}::date`);
  }
  const where = syarat.length > 0 ? `WHERE ${syarat.join(" AND ")}` : "";
  const daftar = await query<{
    id: number; kode: string; kode_lacak: string; nama_pelanggan: string; whatsapp: string;
    waktu_ambil: string; catatan: string; status: string; penjualan_id: number | null; dibuat_pada: string;
  }>(`SELECT id, kode, kode_lacak, nama_pelanggan, whatsapp, waktu_ambil, catatan, status, penjualan_id, dibuat_pada
      FROM preorder ${where} ORDER BY id DESC LIMIT $${nilai.length + 1}`,
      [...nilai, Math.min(Math.max(1, filter.batas ?? 500), 501)]);
  const ids = daftar.map((p) => p.id);
  const semuaItem = ids.length === 0 ? [] : await query<Barang & { preorder_id: number }>(
    `SELECT preorder_id, menu_id, varian_id, nama_menu, nama_varian, harga_satuan, jumlah, subtotal, hpp
     FROM item_preorder WHERE preorder_id = ANY($1::int[]) ORDER BY id`, [ids],
  );
  const peta = new Map<number, Omit<Barang, "hpp">[]>();
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
    status: string; dibuat_pada: string;
  }>(
    `SELECT kode, kode_lacak, nama_pelanggan, waktu_ambil, status, dibuat_pada
     FROM preorder WHERE kode_lacak = $1`,
    [kode.trim().toUpperCase()],
  );
  if (!hasil) return null;
  const kunci = kode.trim().toUpperCase();
  const [items, antrean, riwayat, estimasi] = await Promise.all([
    query<{ menu_id: number; varian_id: number | null; nama_menu: string; nama_varian: string; jumlah: number; subtotal: number }>(
      "SELECT menu_id, varian_id, nama_menu, nama_varian, jumlah, subtotal FROM item_preorder WHERE preorder_id = (SELECT id FROM preorder WHERE kode_lacak = $1)",
      [kunci],
    ),
    querySatu<{ jumlah: number }>(
      `SELECT COUNT(*)::int AS jumlah FROM preorder
       WHERE status IN ('baru', 'diproses', 'siap')
         AND id < (SELECT id FROM preorder WHERE kode_lacak = $1)`,
      [kunci],
    ),
    ambilRiwayatStatus(kunci),
    estimasiSiapMenit(),
  ]);
  return {
    ...hasil, items, total: items.reduce((n, i) => n + i.subtotal, 0),
    antrean: Number(antrean?.jumlah ?? 0), riwayat, estimasi_menit: estimasi,
  };
}

export async function selesaikanPreorder(
  id: number, pengguna: PenggunaSesi | null, metode: "tunai" | "qris" | "transfer" = "tunai",
): Promise<void> {
  await denganTransaksi(async () => {
    const preorder = await querySatu<{
      id: number; status: string; catatan: string; penjualan_id: number | null;
      kode: string; kode_lacak: string; whatsapp: string; waktu_ambil: string; kode_undangan: string;
    }>(
      `SELECT id, status, catatan, penjualan_id, kode, kode_lacak, whatsapp, waktu_ambil, kode_undangan
       FROM preorder WHERE id = $1 FOR UPDATE`, [id],
    );
    if (!preorder) throw new GalatBisnis("Preorder tidak ditemukan");
    if (preorder.status === "selesai") throw new GalatBisnis("Preorder sudah selesai");
    if (preorder.status === "batal") throw new GalatBisnis("Preorder sudah dibatalkan");
    if (preorder.penjualan_id) throw new GalatBisnis("Preorder sudah dicatat");

    const snapshot = await query<Barang>(
      `SELECT menu_id, varian_id, nama_menu, nama_varian, harga_satuan, jumlah, subtotal, hpp
       FROM item_preorder WHERE preorder_id = $1 ORDER BY id`, [id],
    );
    if (snapshot.length === 0) throw new GalatBisnis("Preorder tidak punya item");

    // Varian lama bisa hilang bila menu diedit. Pakai resep dasar agar pesanan lama tetap selesai.
    const varianIds = new Set<number>();
    for (const s of snapshot) {
      if (s.varian_id) {
        const v = await querySatu<{ id: number }>(
          "SELECT id FROM varian WHERE id = $1 AND menu_id = $2", [s.varian_id, s.menu_id],
        );
        if (v) varianIds.add(s.varian_id);
      }
    }
    const mangsa: KasirInput["items"] = snapshot.map((s) => ({
      menu_id: s.menu_id, varian_id: s.varian_id && varianIds.has(s.varian_id) ? s.varian_id : null, jumlah: s.jumlah,
    }));
    const { resepDipakai } = await siapkanBarang(mangsa, true);
    const total = snapshot.reduce((n, b) => n + b.subtotal, 0);
    const nomor = await nomorPenjualan();
    const hppTerkunci = await potongStok(resepDipakai, nomor, pengguna);
    snapshot.forEach((b, i) => { b.hpp = hppTerkunci[i] ?? b.hpp; });

    const baris = await querySatu<{ id: number }>(
      `INSERT INTO penjualan (nomor, total, diskon, metode, catatan, sumber, kasir_id, preorder_id)
       VALUES ($1,$2,0,$3,$4,'preorder',$5,$6) RETURNING id`,
      [nomor, total, metode, preorder.catatan, pengguna?.id ?? null, id],
    );
    for (const item of snapshot) {
      await jalankan(
        `INSERT INTO item_penjualan (penjualan_id, menu_id, varian_id, nama_menu, nama_varian, harga_satuan, jumlah, subtotal, hpp)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [baris!.id, item.menu_id, item.varian_id, item.nama_menu, item.nama_varian,
          item.harga_satuan, item.jumlah, item.subtotal, item.hpp],
      );
    }
    await jalankan(
      "UPDATE preorder SET status='selesai', penjualan_id=$1 WHERE id=$2", [baris!.id, id],
    );
    await catatRiwayatStatus(id, "selesai", pengguna?.id);
    await tambahPoin(preorder!.whatsapp, total, preorder!.kode_undangan || undefined);
    await catatNotifikasi(id, preorder!.whatsapp,
      pesanStatus(preorder!.kode, preorder!.kode_lacak, "selesai", preorder!.waktu_ambil));
    await catatAudit(pengguna, "ubah", "preorder", `${id} selesai, penjualan ${nomor}`);
  });
}

export async function ubahStatusPreorder(
  id: number, status: "diproses" | "siap" | "batal", pengguna: PenggunaSesi | null,
): Promise<void> {
  const hasilKirim = await denganTransaksi(async () => {
    const ada = await querySatu<{
      status: string; slot_id: number | null; kode: string; kode_lacak: string;
      whatsapp: string; waktu_ambil: string;
    }>(
      `SELECT status, slot_id, kode, kode_lacak, whatsapp, waktu_ambil
       FROM preorder WHERE id = $1 FOR UPDATE`, [id],
    );
    if (!ada) throw new GalatBisnis("Preorder tidak ditemukan");
    if (ada.status === "selesai") throw new GalatBisnis("Preorder selesai tidak bisa diubah");
    if (ada.status === "batal" && status !== "batal") {
      throw new GalatBisnis("Preorder batal tidak bisa diaktifkan kembali");
    }
    if (status === "batal" && ada.status !== "batal" && ada.slot_id) {
      await jalankan(
        "UPDATE slot_waktu SET terisi = GREATEST(0, terisi - 1) WHERE id = $1", [ada.slot_id],
      );
    }
    await jalankan("UPDATE preorder SET status = $1 WHERE id = $2", [status, id]);
    await catatRiwayatStatus(id, status, pengguna?.id);
    await catatAudit(pengguna, "ubah", "preorder", `${id} menjadi ${status}`);

    const pesan = pesanStatus(ada.kode, ada.kode_lacak, status, ada.waktu_ambil);
    await catatNotifikasi(id, ada.whatsapp, pesan);
    return { pesan, whatsapp: ada.whatsapp };
  });
  if (status === "siap") await kirimWhatsApp(hasilKirim.whatsapp, hasilKirim.pesan);
}
