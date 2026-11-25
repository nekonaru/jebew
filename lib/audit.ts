// Catatan aktivitas sensitif. Dipanggil dari handler setelah operasi berhasil.

import { jalankan } from "./database.ts";
import type { PenggunaSesi } from "./auth.ts";

export async function catatAudit(
  pengguna: Pick<PenggunaSesi, "id"> | null,
  aksi: string,
  tabel: string,
  catatan: string,
): Promise<void> {
  await jalankan(
    "INSERT INTO log_audit (pengguna_id, aksi, tabel, catatan) VALUES ($1, $2, $3, $4)",
    [pengguna?.id ?? null, aksi, tabel, catatan],
  );
}
