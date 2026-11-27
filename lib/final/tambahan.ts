// Fitur lanjutan Jebew: riwayat status, notifikasi, promo, poin, ulasan, dan jadwal.
// Semua akses data terjadi di server. Semua waktu memakai WIB.

import { randomBytes } from "node:crypto";
import { jalankan, query, querySatu, denganTransaksi } from "../database.ts";
import { GalatBisnis } from "./galat.ts";
import { nomorWhatsApp } from "../wa.ts";

type Baris = Record<string, unknown>;

function angka(nilai: unknown): number {
  return Number(nilai ?? 0);
}

/** Catat perubahan status preorder untuk antrean dan estimasi. */
export async function catatRiwayatStatus(
  preorderId: number, status: string, penggunaId?: number,
): Promise<void> {
  await jalankan(
    `INSERT INTO riwayat_status_preorder (preorder_id, status, pengguna_id)
     VALUES ($1, $2, $3)`,
    [preorderId, status, penggunaId ?? null],
  );
}

/** Riwayat status yang tampil pada halaman lacak. */
export async function ambilRiwayatStatus(kodeLacak: string): Promise<{
  status: string; dicatat_pada: string;
}[]> {
  return query(
    `SELECT r.status, r.dicatat_pada
     FROM riwayat_status_preorder r
     JOIN preorder p ON p.id = r.preorder_id
     WHERE p.kode_lacak = $1
     ORDER BY r.dicatat_pada, r.id`,
    [kodeLacak.trim().toUpperCase()],
  );
}

/** Rata rata menit dari status baru hingga siap dalam 30 hari terakhir. */
export async function estimasiSiapMenit(): Promise<number> {
  const baris = await querySatu<{ menit: number }>(
    `WITH selesai AS (
       SELECT preorder_id,
              MIN(CASE WHEN status = 'diproses' THEN dicatat_pada END) AS mulai,
              MIN(CASE WHEN status = 'siap' THEN dicatat_pada END) AS siap
       FROM riwayat_status_preorder
       WHERE dicatat_pada >= (now() AT TIME ZONE 'Asia/Jakarta') - INTERVAL '30 days'
       GROUP BY preorder_id
     )
     SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (siap - mulai)) / 60), 0) AS menit
     FROM selesai WHERE mulai IS NOT NULL AND siap IS NOT NULL AND siap >= mulai`,
  );
  return Math.max(1, Math.round(angka(baris?.menit)));
}

/** Simpan notifikasi yang masih menunggu pengiriman. */
export async function catatNotifikasi(
  preorderId: number | null, tujuan: string, pesan: string,
): Promise<void> {
  await jalankan(
    `INSERT INTO notifikasi (preorder_id, tujuan, pesan) VALUES ($1,$2,$3)`,
    [preorderId, tujuan, pesan],
  );
}

export async function ambilNotifikasi(batas = 100): Promise<Baris[]> {
  return query(
    `SELECT n.id, n.kanal, n.status, n.pesan, n.tujuan, n.dicatat_pada,
            p.kode AS kode_pesanan
     FROM notifikasi n LEFT JOIN preorder p ON p.id = n.preorder_id
     ORDER BY n.dicatat_pada DESC, n.id DESC LIMIT $1`,
    [Math.min(500, Math.max(1, batas))],
  );
}

export async function tandaiNotifikasi(id: number, status: "terkirim" | "gagal"): Promise<void> {
  await jalankan(
    `UPDATE notifikasi SET status = $1, terkirim_pada = CASE WHEN $1 = 'terkirim'
     THEN (now() AT TIME ZONE 'Asia/Jakarta') ELSE NULL END WHERE id = $2`,
    [status, id],
  );
}

/** Daftar promo milik pemilik. */
export async function ambilPromo(): Promise<Baris[]> {
  return query("SELECT * FROM promo ORDER BY berlaku_sampai DESC, id DESC");
}

export async function simpanPromo(input: {
  id?: number; kode: string; jenis: "persen" | "nominal"; nilai: number;
  minimum_belanja: number; kuota: number; berlaku_dari: string;
  berlaku_sampai: string; aktif: boolean;
  jam_mulai?: string; jam_selesai?: string;
}): Promise<void> {
  const kode = input.kode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (kode.length < 3 || kode.length > 20) throw new GalatBisnis("Kode promo 3 sampai 20 karakter");
  if (input.jenis === "persen" && input.nilai > 100) throw new GalatBisnis("Persentase maksimal 100");
  const nilai = [kode, input.jenis, input.nilai, input.minimum_belanja, input.kuota,
    input.berlaku_dari, input.berlaku_sampai, input.aktif,
    input.jam_mulai ?? "00:00", input.jam_selesai ?? "23:59"];
  if (input.id) {
    await jalankan(
      `UPDATE promo SET kode=$1, jenis=$2, nilai=$3, minimum_belanja=$4, kuota=$5,
       berlaku_dari=$6, berlaku_sampai=$7, aktif=$8, jam_mulai=$9, jam_selesai=$10 WHERE id=$11`,
      [...nilai, input.id],
    );
    return;
  }
  await jalankan(
    `INSERT INTO promo (kode, jenis, nilai, minimum_belanja, kuota, berlaku_dari, berlaku_sampai, aktif, jam_mulai, jam_selesai)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    nilai,
  );
}

export async function hapusPromo(id: number): Promise<void> {
  await jalankan("DELETE FROM promo WHERE id = $1", [id]);
}

/** Validasi promo untuk subtotal tertentu. Tidak mengubah kuota. */
export async function validasiPromo(kode: string, subtotal: number): Promise<{
  kode: string; diskon: number; jenis: string; nilai: number;
}> {
  const sekarang = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date());
  const bersih = kode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!bersih) throw new GalatBisnis("Kode promo wajib diisi");
  const promo = await querySatu<{
    id: number; kode: string; jenis: string; nilai: number;
    minimum_belanja: number; kuota: number; terpakai: number;
    berlaku_dari: string; berlaku_sampai: string; aktif: boolean;
    jam_mulai: string; jam_selesai: string;
  }>("SELECT * FROM promo WHERE kode = $1 AND aktif = TRUE", [bersih]);
  if (!promo) throw new GalatBisnis("Kode promo tidak ditemukan atau tidak aktif");
  if (subtotal < angka(promo.minimum_belanja)) {
    throw new GalatBisnis(`Minimum belanja promo ${promo.minimum_belanja}`);
  }
  if (angka(promo.terpakai) >= angka(promo.kuota)) throw new GalatBisnis("Kuota promo habis");
  const hari = new Date().toISOString().slice(0, 10);
  if (hari < String(promo.berlaku_dari).slice(0, 10) || hari > String(promo.berlaku_sampai).slice(0, 10)) {
    throw new GalatBisnis("Promo di luar masa berlaku");
  }
  const mulai = String(promo.jam_mulai ?? "00:00");
  const selesai = String(promo.jam_selesai ?? "23:59");
  if ((mulai < selesai && (sekarang < mulai || sekarang >= selesai))
    || (mulai > selesai && sekarang < mulai && sekarang >= selesai)) {
    throw new GalatBisnis("Promo hanya berlaku pada jam tertentu");
  }
  const diskon = promo.jenis === "persen"
    ? Math.floor(subtotal * Math.min(100, angka(promo.nilai)) / 100)
    : Math.min(subtotal, angka(promo.nilai));
  return { kode: promo.kode, diskon, jenis: promo.jenis, nilai: angka(promo.nilai) };
}

/** Catat pemakaian promo setelah pesanan berhasil dibuat. */
export async function pakaiPromo(
  kode: string, kodeLacak: string, diskon: number,
): Promise<void> {
  await denganTransaksi(async () => {
    const promo = await querySatu<{ id: number }>("SELECT id FROM promo WHERE kode = $1", [kode]);
    if (!promo) throw new GalatBisnis("Promo tidak ditemukan");
    await jalankan(
      `INSERT INTO promo_pemakaian (promo_id, kode_lacak, diskon) VALUES ($1,$2,$3)
       ON CONFLICT (promo_id, kode_lacak) DO NOTHING`,
      [promo.id, kodeLacak, diskon],
    );
    await jalankan(
      `UPDATE promo SET terpakai = (SELECT COUNT(*) FROM promo_pemakaian WHERE promo_id = $1) WHERE id = $1`,
      [promo.id],
    );
  });
}

/** Tambah poin loyalitas. Seribu rupiah setara satu poin. */
export async function tambahPoin(
  whatsapp: string, total: number, kodeUndangan?: string,
): Promise<void> {
  const nomor = nomorWhatsApp(whatsapp);
  if (!nomor) return;
  const poin = Math.floor(total / 1000);
  if (poin <= 0) return;
  await denganTransaksi(async () => {
    await jalankan(
      `INSERT INTO poin_pelanggan (whatsapp, poin, total_belanja, diperbarui_pada)
       VALUES ($1,$2,$3,(now() AT TIME ZONE 'Asia/Jakarta'))
       ON CONFLICT (whatsapp) DO UPDATE SET
         poin = poin_pelanggan.poin + EXCLUDED.poin,
         total_belanja = poin_pelanggan.total_belanja + EXCLUDED.total_belanja,
         diperbarui_pada = EXCLUDED.diperbarui_pada`,
      [nomor, poin, total],
    );
    await jalankan(
      "INSERT INTO poin_mutasi (whatsapp, poin, keterangan) VALUES ($1,$2,$3)",
      [nomor, poin, "Pesanan pre-order"],
    );
    if (kodeUndangan) {
      const pengaju = await querySatu<{ whatsapp: string }>(
        "SELECT whatsapp FROM poin_pelanggan WHERE kode_undangan = $1", [kodeUndangan.trim().toUpperCase()],
      );
      if (pengaju && pengaju.whatsapp !== nomor) {
        await jalankan(
          `UPDATE poin_pelanggan SET diundang_oleh = COALESCE(diundang_oleh, $1)
           WHERE whatsapp = $2 AND diundang_oleh IS NULL`,
          [pengaju.whatsapp, nomor],
        );
        await jalankan(
          "UPDATE poin_pelanggan SET poin = poin + 50, diperbarui_pada = (now() AT TIME ZONE 'Asia/Jakarta') WHERE whatsapp = $1",
          [pengaju.whatsapp],
        );
        await jalankan(
          "INSERT INTO poin_mutasi (whatsapp, poin, keterangan) VALUES ($1,$2,$3)",
          [pengaju.whatsapp, 50, "Undangan pelanggan baru"],
        );
      }
    }
  });
}

export async function ambilPoin(whatsapp: string): Promise<{
  poin: number; total_belanja: number; tingkat: string; kode_undangan: string;
}> {
  const nomor = nomorWhatsApp(whatsapp);
  const baris = await querySatu<{
    poin: number; total_belanja: number; kode_undangan: string | null;
  }>("SELECT poin, total_belanja, kode_undangan FROM poin_pelanggan WHERE whatsapp = $1", [nomor]);
  const total = angka(baris?.total_belanja);
  const tingkat = total >= 1000000 ? "Platinum" : total >= 500000 ? "Gold" : total >= 100000 ? "Silver" : "Reguler";
  let kode = String(baris?.kode_undangan ?? "");
  if (!kode && nomor) {
    kode = randomBytes(4).toString("hex").toUpperCase();
    await jalankan(
      "UPDATE poin_pelanggan SET kode_undangan = $1 WHERE whatsapp = $2 AND kode_undangan IS NULL",
      [kode, nomor],
    );
  }
  return { poin: angka(baris?.poin), total_belanja: total, tingkat, kode_undangan: kode };
}

/** Tukar poin menjadi diskon. Seratus poin setara lima ribu rupiah. */
export async function tukarPoin(whatsapp: string, poin: number): Promise<number> {
  const nomor = nomorWhatsApp(whatsapp);
  if (!nomor) throw new GalatBisnis("Nomor WhatsApp tidak valid");
  if (!Number.isInteger(poin) || poin < 100) throw new GalatBisnis("Minimal penukaran 100 poin");
  return denganTransaksi(async () => {
    const baris = await querySatu<{ poin: number }>(
      "SELECT poin FROM poin_pelanggan WHERE whatsapp = $1 FOR UPDATE", [nomor],
    );
    if (!baris || angka(baris.poin) < poin) throw new GalatBisnis("Poin tidak cukup");
    await jalankan(
      "UPDATE poin_pelanggan SET poin = poin - $1, diperbarui_pada = (now() AT TIME ZONE 'Asia/Jakarta') WHERE whatsapp = $2",
      [poin, nomor],
    );
    await jalankan(
      "INSERT INTO poin_mutasi (whatsapp, poin, keterangan) VALUES ($1,$2,$3)",
      [nomor, -poin, "Penukaran diskon"],
    );
    return Math.floor(poin / 100) * 5000;
  });
}

/** Ulasan dari pelanggan memakai kode lacak. */
export async function simpanUlasan(
  kodeLacak: string, rating: number, komentar: string, foto = "",
): Promise<void> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new GalatBisnis("Rating 1 sampai 5");
  const ada = await querySatu<{ id: number }>(
    "SELECT id FROM preorder WHERE kode_lacak = $1", [kodeLacak.trim().toUpperCase()],
  );
  if (!ada) throw new GalatBisnis("Pesanan tidak ditemukan");
  await jalankan(
    `INSERT INTO ulasan (kode_lacak, rating, komentar, foto) VALUES ($1,$2,$3,$4)
     ON CONFLICT (kode_lacak) DO UPDATE SET rating = EXCLUDED.rating,
     komentar = EXCLUDED.komentar, foto = EXCLUDED.foto,
     status = 'menunggu', ditinjau_pada = NULL`,
    [kodeLacak.trim().toUpperCase(), rating, komentar.slice(0, 500), foto],
  );
}

export async function ambilUlasan(status = "menunggu"): Promise<Baris[]> {
  return query(
    `SELECT id, kode_lacak, rating, komentar, status, dibuat_pada
     FROM ulasan WHERE status = $1 ORDER BY dibuat_pada DESC LIMIT 200`,
    [status],
  );
}

export async function tinjauUlasan(id: number, status: "diterima" | "ditolak"): Promise<void> {
  await jalankan(
    "UPDATE ulasan SET status = $1, ditinjau_pada = (now() AT TIME ZONE 'Asia/Jakarta') WHERE id = $2",
    [status, id],
  );
}

/** Jadwal operasional per hari. */
export async function ambilJadwalHarian(): Promise<Baris[]> {
  return query("SELECT id, jenis, hari, jam_buka, jam_tutup, aktif FROM jadwal_harian ORDER BY jenis, hari");
}

export async function simpanJadwalHarian(input: {
  jenis: "toko" | "preorder"; hari: number; jam_buka: string;
  jam_tutup: string; aktif: boolean;
}[]): Promise<void> {
  await denganTransaksi(async () => {
    for (const j of input) {
      await jalankan(
        `INSERT INTO jadwal_harian (jenis, hari, jam_buka, jam_tutup, aktif)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (jenis, hari) DO UPDATE SET jam_buka = EXCLUDED.jam_buka,
         jam_tutup = EXCLUDED.jam_tutup, aktif = EXCLUDED.aktif`,
        [j.jenis, j.hari, j.jam_buka, j.jam_tutup, j.aktif],
      );
    }
  });
}

export async function ambilHariLibur(): Promise<Baris[]> {
  return query("SELECT id, tanggal, keterangan FROM hari_libur ORDER BY tanggal DESC LIMIT 100");
}

export async function simpanHariLibur(tanggal: string, keterangan: string): Promise<void> {
  await jalankan(
    `INSERT INTO hari_libur (tanggal, keterangan) VALUES ($1,$2)
     ON CONFLICT (tanggal) DO UPDATE SET keterangan = EXCLUDED.keterangan`,
    [tanggal, keterangan.slice(0, 100)],
  );
}

export async function hapusHariLibur(id: number): Promise<void> {
  await jalankan("DELETE FROM hari_libur WHERE id = $1", [id]);
}

/** Tagihan piutang pelanggan. */
export async function ambilPiutang(): Promise<Baris[]> {
  return query(
    `SELECT id, kode_lacak, nama, jumlah, dibayar, jatuh_tempo, status, catatan
     FROM piutang ORDER BY jatuh_tempo, id DESC LIMIT 200`,
  );
}

export async function simpanPiutang(input: {
  kode_lacak: string; nama: string; jumlah: number; jatuh_tempo: string; catatan: string;
}): Promise<void> {
  await jalankan(
    `INSERT INTO piutang (kode_lacak, nama, jumlah, jatuh_tempo, catatan)
     VALUES ($1,$2,$3,$4,$5)`,
    [input.kode_lacak.trim().toUpperCase(), input.nama.trim().slice(0, 100),
      input.jumlah, input.jatuh_tempo, input.catatan.slice(0, 300)],
  );
}

export async function bayarPiutang(id: number, jumlah: number): Promise<void> {
  await denganTransaksi(async () => {
    const baris = await querySatu<{ jumlah: number; dibayar: number }>(
      "SELECT jumlah, dibayar FROM piutang WHERE id = $1 FOR UPDATE", [id],
    );
    if (!baris) throw new GalatBisnis("Tagihan tidak ditemukan");
    const dibayar = Number(baris.dibayar) + jumlah;
    if (dibayar > Number(baris.jumlah)) throw new GalatBisnis("Pembayaran melebihi tagihan");
    await jalankan(
      `UPDATE piutang SET dibayar = $1,
       status = CASE WHEN $1 >= jumlah THEN 'lunas' ELSE 'sebagian' END WHERE id = $2`,
      [dibayar, id],
    );
  });
}

/** Shift kerja staf. */
export async function ambilShift(): Promise<Baris[]> {
  return query(
    `SELECT s.id, s.nama, s.mulai, s.selesai, s.kas_awal, s.kas_akhir, s.catatan,
            p.nama AS pengguna
     FROM shift s LEFT JOIN pengguna p ON p.id = s.pengguna_id
     ORDER BY s.mulai DESC LIMIT 100`,
  );
}

export async function mulaiShift(nama: string, kasAwal: number, penggunaId?: number): Promise<void> {
  await jalankan(
    `INSERT INTO shift (nama, kas_awal, pengguna_id) VALUES ($1,$2,$3)`,
    [nama.trim().slice(0, 100), kasAwal, penggunaId ?? null],
  );
}

export async function selesaiShift(id: number, kasAkhir: number, catatan: string): Promise<void> {
  await jalankan(
    `UPDATE shift SET selesai = (now() AT TIME ZONE 'Asia/Jakarta'),
     kas_akhir = $1, catatan = $2 WHERE id = $3 AND selesai IS NULL`,
    [kasAkhir, catatan.slice(0, 300), id],
  );
}

/** Catat bahan rusak atau terbuang. */
export async function catatLimbah(
  bahanId: number, jumlah: number, alasan: string, penggunaId?: number,
): Promise<void> {
  await denganTransaksi(async () => {
    const baris = await querySatu<{ stok: number }>(
      "SELECT stok FROM bahan WHERE id = $1 FOR UPDATE", [bahanId],
    );
    if (!baris) throw new GalatBisnis("Bahan tidak ditemukan");
    await jalankan("UPDATE bahan SET stok = stok - $1 WHERE id = $2 AND stok >= $1", [jumlah, bahanId]);
    await jalankan(
      `INSERT INTO pergerakan_stok (bahan_id, jenis, jumlah, stok_sebelum, stok_sesudah, referensi, catatan, pengguna_id)
       VALUES ($1,'rusak',$2,$3,$4,'Limbah',$5,$6)`,
      [bahanId, jumlah, Number(baris.stok), Number(baris.stok) - jumlah, alasan.slice(0, 300), penggunaId ?? null],
    );
  });
}

/** Target omzet harian. */
export async function ambilTarget(dari: string, sampai: string): Promise<Baris[]> {
  return query(
    "SELECT tanggal, target_omzet, target_transaksi FROM target_harian WHERE tanggal BETWEEN $1 AND $2 ORDER BY tanggal",
    [dari, sampai],
  );
}

export async function simpanTarget(
  tanggal: string, targetOmzet: number, targetTransaksi: number,
): Promise<void> {
  await jalankan(
    `INSERT INTO target_harian (tanggal, target_omzet, target_transaksi)
     VALUES ($1,$2,$3)
     ON CONFLICT (tanggal) DO UPDATE SET target_omzet = EXCLUDED.target_omzet,
     target_transaksi = EXCLUDED.target_transaksi`,
    [tanggal, targetOmzet, targetTransaksi],
  );
}
