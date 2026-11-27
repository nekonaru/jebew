// Pengaturan usaha, kelola pengguna, dan riwayat audit.

import { denganTransaksi, jalankan, query, querySatu } from "../database.ts";
import { GalatBisnis } from "./galat.ts";
import { hashKataSandi } from "../auth.ts";
import { escapeLike } from "../format.ts";
import { catatAudit } from "../audit.ts";

export async function ambilPengaturan(): Promise<Record<string, string>> {
  const baris = await query<{ kunci: string; nilai: string }>("SELECT kunci, nilai FROM pengaturan");
  return Object.fromEntries(baris.map((b) => [b.kunci, b.nilai]));
}

export async function simpanPengaturan(
  nilai: Record<string, string>, actorId?: number,
): Promise<void> {
  await denganTransaksi(async () => {
    for (const [kunci, isi] of Object.entries(nilai)) {
      await jalankan(
        "INSERT INTO pengaturan (kunci, nilai) VALUES ($1,$2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai",
        [kunci, isi],
      );
    }
    await catatAudit(actorId ? { id: actorId } : null, "ubah", "pengaturan", "Identitas dan jam operasional diperbarui");
  });
}

export async function ambilPengguna() {
  return query("SELECT id, email, nama, peran, aktif, dibuat_pada FROM pengguna ORDER BY id");
}

export type PenggunaInput = {
  email: string;
  nama: string;
  kata_sandi?: string;
  peran: "pemilik" | "kasir" | "dapur";
  aktif: boolean;
};

export async function simpanPengguna(input: PenggunaInput, id?: number, actorId?: number): Promise<void> {
  const email = input.email.trim().toLowerCase();
  await denganTransaksi(async () => {
    await query("SELECT pg_advisory_xact_lock(818881)");
    const pelaku = actorId ? { id: actorId } : null;
    if (id !== undefined) {
      const ada = await querySatu<{ id: number; peran: string; aktif: boolean }>(
        "SELECT id, peran, aktif FROM pengguna WHERE id = $1", [id],
      );
      if (!ada) throw new GalatBisnis("Pengguna tidak ditemukan");
      if (id === actorId && (input.peran !== "pemilik" || !input.aktif)) {
        throw new GalatBisnis("Anda tidak bisa menurunkan peran atau menonaktifkan akun sendiri");
      }
      if (ada.peran === "pemilik" && (input.peran !== "pemilik" || !input.aktif)) {
        const pemilik = await querySatu<{ jumlah: number }>(
          "SELECT COUNT(*) AS jumlah FROM pengguna WHERE peran = 'pemilik' AND aktif = TRUE",
        );
        if (Number(pemilik?.jumlah ?? 0) <= 1) {
          throw new GalatBisnis("Tidak bisa menurunkan satu-satunya pemilik aktif");
        }
      }
      const naikkanVersi = Boolean(input.kata_sandi) || ada.peran !== input.peran || Boolean(ada.aktif) !== input.aktif;
      if (input.kata_sandi) {
        await jalankan(
          "UPDATE pengguna SET email=$1, nama=$2, kata_sandi=$3, peran=$4, aktif=$5, sesi_versi = sesi_versi + 1 WHERE id=$6",
          [email, input.nama, hashKataSandi(input.kata_sandi), input.peran, input.aktif, id],
        );
      } else if (naikkanVersi) {
        await jalankan(
          "UPDATE pengguna SET email=$1, nama=$2, peran=$3, aktif=$4, sesi_versi = sesi_versi + 1 WHERE id=$5",
          [email, input.nama, input.peran, input.aktif, id],
        );
      } else {
        await jalankan(
          "UPDATE pengguna SET email=$1, nama=$2, peran=$3, aktif=$4 WHERE id=$5",
          [email, input.nama, input.peran, input.aktif, id],
        );
      }
      await catatAudit(pelaku, "ubah", "pengguna", `id ${id} diperbarui`);
      return;
    }
    if (!input.kata_sandi) throw new GalatBisnis("Kata sandi wajib diisi");
    const baris = await querySatu<{ id: number }>(
      "INSERT INTO pengguna (email, nama, kata_sandi, peran, aktif) VALUES ($1,$2,$3,$4,$5) RETURNING id",
      [email, input.nama, hashKataSandi(input.kata_sandi), input.peran, input.aktif],
    );
    await catatAudit(pelaku, "tambah", "pengguna", `id ${baris?.id ?? 0} ditambahkan`);
  });
}

export async function hapusPengguna(id: number, actorId?: number): Promise<void> {
  await denganTransaksi(async () => {
    await query("SELECT pg_advisory_xact_lock(818881)");
    if (id === actorId) throw new GalatBisnis("Anda tidak bisa menghapus akun sendiri");
    const pengguna = await querySatu<{ peran: string; aktif: boolean }>(
      "SELECT peran, aktif FROM pengguna WHERE id = $1", [id],
    );
    if (!pengguna) throw new GalatBisnis("Pengguna tidak ditemukan");
    if (pengguna.peran === "pemilik" && pengguna.aktif) {
      const jumlah = await querySatu<{ jumlah: number }>(
        "SELECT COUNT(*) AS jumlah FROM pengguna WHERE peran = 'pemilik' AND aktif = TRUE",
      );
      if (Number(jumlah?.jumlah ?? 0) <= 1) throw new GalatBisnis("Tidak bisa menghapus satu-satunya pemilik aktif");
    }
    const riwayat = await querySatu<{ jumlah: number }>(
      `SELECT (SELECT COUNT(*) FROM log_audit WHERE pengguna_id = $1)
            + (SELECT COUNT(*) FROM penjualan WHERE kasir_id = $1)
            + (SELECT COUNT(*) FROM pembelian WHERE pengguna_id = $1)
            + (SELECT COUNT(*) FROM pengeluaran WHERE pengguna_id = $1)
            + (SELECT COUNT(*) FROM pergerakan_stok WHERE pengguna_id = $1)
            + (SELECT COUNT(*) FROM tutup_kasir WHERE kasir_id = $1)
            + (SELECT COUNT(*) FROM stok_opname WHERE pengguna_id = $1) AS jumlah`,
      [id],
    );
    const pelaku = actorId ? { id: actorId } : null;
    if (Number(riwayat?.jumlah ?? 0) > 0) {
      await jalankan("UPDATE pengguna SET aktif = FALSE WHERE id = $1", [id]);
      await catatAudit(pelaku, "hapus", "pengguna", `id ${id} dinonaktifkan`);
      return;
    }
    await jalankan("DELETE FROM pengguna WHERE id = $1", [id]);
    await catatAudit(pelaku, "hapus", "pengguna", `id ${id} dihapus`);
  });
}

export type FilterAudit = { aksi?: string; tabel?: string; cari?: string; batas?: number };

export async function ambilAudit(filter: FilterAudit = {}): Promise<{
  id: number; aksi: string; tabel: string; catatan: string; dibuat_pada: string; nama_pengguna: string | null;
}[]> {
  const batas = Math.min(Math.max(1, filter.batas ?? 200), 5001);
  const syarat: string[] = [];
  const nilai: unknown[] = [];
  if (filter.aksi) {
    nilai.push(filter.aksi);
    syarat.push(`a.aksi = $${nilai.length}`);
  }
  if (filter.tabel) {
    nilai.push(filter.tabel);
    syarat.push(`a.tabel = $${nilai.length}`);
  }
  if (filter.cari) {
    nilai.push(`%${escapeLike(filter.cari)}%`);
    syarat.push(`(a.catatan ILIKE $${nilai.length} ESCAPE '\\' OR p.nama ILIKE $${nilai.length} ESCAPE '\\')`);
  }
  const where = syarat.length > 0 ? `WHERE ${syarat.join(" AND ")}` : "";
  nilai.push(batas);
  return query(
    `SELECT a.id, a.aksi, a.tabel, a.catatan, a.dibuat_pada, p.nama AS nama_pengguna
     FROM log_audit a LEFT JOIN pengguna p ON p.id = a.pengguna_id
     ${where} ORDER BY a.id DESC LIMIT $${nilai.length}`,
    nilai,
  );
}

export async function ambilSlotWaktu(): Promise<{
  id: number; tanggal: string; jam: string; kuota: number; terisi: number; dipakai: number;
}[]> {
  return query(
    `SELECT s.id, s.tanggal, s.jam, s.kuota, s.terisi,
            (SELECT COUNT(*) FROM preorder p WHERE p.slot_id = s.id AND p.status <> 'batal') AS dipakai
     FROM slot_waktu s ORDER BY s.tanggal, s.jam`,
  );
}

export async function simpanSlotWaktu(
  input: { tanggal: string; jam: string; kuota: number }, actorId?: number,
): Promise<void> {
  await denganTransaksi(async () => {
    const ada = await querySatu<{ terisi: number }>(
      "SELECT terisi FROM slot_waktu WHERE tanggal = $1::date AND jam = $2 FOR UPDATE",
      [input.tanggal, input.jam],
    );
    if (ada && Number(ada.terisi) > input.kuota) {
      throw new GalatBisnis("Kuota tidak boleh lebih kecil dari pesanan yang sudah terdaftar");
    }
    await jalankan(
    `INSERT INTO slot_waktu (tanggal, jam, kuota) VALUES ($1,$2,$3)
     ON CONFLICT (tanggal, jam) DO UPDATE SET kuota = EXCLUDED.kuota`,
      [input.tanggal, input.jam, input.kuota],
    );
    await catatAudit(actorId ? { id: actorId } : null, "ubah", "slot_waktu", `Slot ${input.tanggal} ${input.jam} kuota ${input.kuota}`);
  });
}

/** Buat banyak slot sekaligus dalam satu transaksi. */
export async function simpanSlotMassal(
  input: { tanggal: string; jam: string; kuota: number }[], actorId?: number,
): Promise<void> {
  await denganTransaksi(async () => {
    for (const s of input) {
      const ada = await querySatu<{ terisi: number }>(
        "SELECT terisi FROM slot_waktu WHERE tanggal = $1::date AND jam = $2 FOR UPDATE",
        [s.tanggal, s.jam],
      );
      if (ada && Number(ada.terisi) > s.kuota) {
        throw new GalatBisnis(`Kuota ${s.tanggal} ${s.jam} lebih kecil dari pesanan yang sudah terdaftar`);
      }
      await jalankan(
        `INSERT INTO slot_waktu (tanggal, jam, kuota) VALUES ($1,$2,$3)
         ON CONFLICT (tanggal, jam) DO UPDATE SET kuota = EXCLUDED.kuota`,
        [s.tanggal, s.jam, s.kuota],
      );
    }
    await catatAudit(actorId ? { id: actorId } : null, "ubah", "slot_waktu", `${input.length} slot waktu dibuat`);
  });
}

/** Hapus slot yang belum dipakai pesanan aktif. */
export async function hapusSlotWaktu(id: number, actorId?: number): Promise<boolean> {
  return denganTransaksi(async () => {
    const baris = await querySatu<{ dipakai: number }>(
      `SELECT COUNT(*) AS dipakai FROM preorder
       WHERE slot_id = $1 AND status <> 'batal'`,
      [id],
    );
    if (Number(baris?.dipakai ?? 0) > 0) return false;
    await jalankan("DELETE FROM slot_waktu WHERE id = $1", [id]);
    await catatAudit(actorId ? { id: actorId } : null, "hapus", "slot_waktu", `Slot ${id} dihapus`);
    return true;
  });
}
