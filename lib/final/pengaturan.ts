// Pengaturan usaha, kelola pengguna, dan riwayat audit.

import { denganTransaksi, jalankan, query, querySatu } from "../database.ts";
import { GalatBisnis } from "./galat.ts";
import { hashKataSandi } from "../auth.ts";

export async function ambilPengaturan(): Promise<Record<string, string>> {
  const baris = await query<{ kunci: string; nilai: string }>("SELECT kunci, nilai FROM pengaturan");
  return Object.fromEntries(baris.map((b) => [b.kunci, b.nilai]));
}

export async function simpanPengaturan(nilai: Record<string, string>): Promise<void> {
  await denganTransaksi(async () => {
    for (const [kunci, isi] of Object.entries(nilai)) {
      await jalankan(
        "INSERT INTO pengaturan (kunci, nilai) VALUES ($1,$2) ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai",
        [kunci, isi],
      );
    }
  });
}

export async function ambilPengguna() {
  return query("SELECT id, email, nama, peran, aktif, dibuat_pada FROM pengguna ORDER BY id");
}

export type PenggunaInput = {
  email: string;
  nama: string;
  kata_sandi?: string;
  peran: "pemilik" | "kasir";
  aktif: boolean;
};

export async function simpanPengguna(input: PenggunaInput, id?: number): Promise<void> {
  const email = input.email.trim().toLowerCase();
  await denganTransaksi(async () => {
    if (id !== undefined) {
      const ada = await querySatu("SELECT id FROM pengguna WHERE id = $1", [id]);
      if (!ada) throw new GalatBisnis("Pengguna tidak ditemukan");
      if (input.kata_sandi) {
        await jalankan(
          "UPDATE pengguna SET email=$1, nama=$2, kata_sandi=$3, peran=$4, aktif=$5 WHERE id=$6",
          [email, input.nama, hashKataSandi(input.kata_sandi), input.peran, input.aktif, id],
        );
      } else {
        await jalankan(
          "UPDATE pengguna SET email=$1, nama=$2, peran=$3, aktif=$4 WHERE id=$5",
          [email, input.nama, input.peran, input.aktif, id],
        );
      }
      return;
    }
    if (!input.kata_sandi) throw new GalatBisnis("Kata sandi wajib diisi");
    await jalankan(
      "INSERT INTO pengguna (email, nama, kata_sandi, peran, aktif) VALUES ($1,$2,$3,$4,$5)",
      [email, input.nama, hashKataSandi(input.kata_sandi), input.peran, input.aktif],
    );
  });
}

export async function hapusPengguna(id: number): Promise<void> {
  await denganTransaksi(async () => {
    const jumlah = await querySatu<{ jumlah: number }>("SELECT COUNT(*) AS jumlah FROM pengguna");
    if (Number(jumlah?.jumlah ?? 0) <= 1) throw new GalatBisnis("Tidak bisa menghapus satu-satunya pengguna");
    await jalankan("DELETE FROM pengguna WHERE id = $1", [id]);
  });
}

export async function ambilAudit() {
  return query(
    `SELECT a.id, a.aksi, a.tabel, a.catatan, a.dibuat_pada, p.nama AS nama_pengguna
     FROM log_audit a LEFT JOIN pengguna p ON p.id = a.pengguna_id
     ORDER BY a.id DESC LIMIT 200`,
  );
}

export async function ambilSlotWaktu() {
  return query(
    `SELECT s.id, s.tanggal, s.jam, s.kuota, s.terisi,
            (SELECT COUNT(*) FROM preorder p WHERE p.slot_id = s.id AND p.status <> 'batal') AS dipakai
     FROM slot_waktu s ORDER BY s.tanggal, s.jam`,
  );
}

export async function simpanSlotWaktu(input: { tanggal: string; jam: string; kuota: number }): Promise<void> {
  await jalankan(
    `INSERT INTO slot_waktu (tanggal, jam, kuota) VALUES ($1,$2,$3)
     ON CONFLICT (tanggal, jam) DO UPDATE SET kuota = EXCLUDED.kuota,
     terisi = LEAST(slot_waktu.terisi, EXCLUDED.kuota)`,
    [input.tanggal, input.jam, input.kuota],
  );
}
