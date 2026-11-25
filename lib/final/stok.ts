// Bahan baku, riwayat pergerakan, pembelian, dan stock opname.

import { denganTransaksi, jalankan, query, querySatu } from "../database.ts";
import { GalatBisnis } from "./galat.ts";
import { hargaRataRata } from "../inti-final.ts";
import type { PenggunaSesi } from "../auth.ts";
import { catatAudit } from "../audit.ts";

export type BahanTampil = {
  id: number;
  nama: string;
  satuan: string;
  stok: number;
  stok_minimum: number;
  harga_rata_rata: number;
  aktif: boolean;
  menipis: boolean;
};

export async function ambilBahan(): Promise<BahanTampil[]> {
  const baris = await query<Omit<BahanTampil, "menipis">>(
    `SELECT id, nama, satuan, stok, stok_minimum, harga_rata_rata, aktif
     FROM bahan ORDER BY nama`,
  );
  return baris.map((b) => ({ ...b, menipis: b.stok <= b.stok_minimum }));
}

export type BahanInput = {
  nama: string;
  satuan: string;
  stok: number;
  stok_minimum: number;
  harga_rata_rata: number;
  aktif: boolean;
};

export async function simpanBahan(
  input: BahanInput, id?: number, pengguna: PenggunaSesi | null = null,
): Promise<number> {
  return denganTransaksi(async () => {
    if (id !== undefined) {
      const lama = await querySatu<{ stok: number }>("SELECT stok FROM bahan WHERE id = $1 FOR UPDATE", [id]);
      if (!lama) throw new GalatBisnis("Bahan tidak ditemukan");
      await jalankan(
        `UPDATE bahan SET nama=$1, satuan=$2, stok=$3, stok_minimum=$4, harga_rata_rata=$5, aktif=$6 WHERE id=$7`,
        [input.nama, input.satuan, input.stok, input.stok_minimum, input.harga_rata_rata, input.aktif, id],
      );
      if (input.stok !== lama.stok) {
        await jalankan(
          `INSERT INTO pergerakan_stok (bahan_id, jenis, jumlah, stok_sebelum, stok_sesudah, referensi, catatan, pengguna_id)
           VALUES ($1,'penyesuaian',$2,$3,$4,'MANUAL','Perubahan lewat pengelolaan bahan',$5)`,
          [id, input.stok - lama.stok, lama.stok, input.stok, pengguna?.id ?? null],
        );
      }
      await catatAudit(pengguna, "ubah", "bahan", `id ${id}`);
      return id;
    }
    const baris = await querySatu<{ id: number }>(
      `INSERT INTO bahan (nama, satuan, stok, stok_minimum, harga_rata_rata, aktif)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [input.nama, input.satuan, input.stok, input.stok_minimum, input.harga_rata_rata, input.aktif],
    );
    await jalankan(
      `INSERT INTO pergerakan_stok (bahan_id, jenis, jumlah, stok_sebelum, stok_sesudah, referensi, catatan, pengguna_id)
       VALUES ($1,'masuk',$2,0,$3,'AWAL','Stok awal bahan baru',$4)`,
      [baris!.id, input.stok, input.stok, pengguna?.id ?? null],
    );
    await catatAudit(pengguna, "tambah", "bahan", `id ${baris!.id}`);
    return baris!.id;
  });
}

export async function hapusBahan(id: number, pengguna: PenggunaSesi | null = null): Promise<void> {
  await denganTransaksi(async () => {
    const dipakai = await querySatu<{ jumlah: number }>(
      `SELECT (SELECT COUNT(*) FROM resep WHERE bahan_id=$1) + (SELECT COUNT(*) FROM item_varian WHERE bahan_id=$1) AS jumlah`,
      [id],
    );
    if (Number(dipakai?.jumlah ?? 0) > 0) {
      throw new GalatBisnis("Bahan masih dipakai resep. Ubah resepnya dulu.");
    }
    const riwayat = await querySatu<{ jumlah: number }>(
      `SELECT (SELECT COUNT(*) FROM pergerakan_stok WHERE bahan_id=$1)
            + (SELECT COUNT(*) FROM item_pembelian WHERE bahan_id=$1)
            + (SELECT COUNT(*) FROM item_opname WHERE bahan_id=$1) AS jumlah`,
      [id],
    );
    if (Number(riwayat?.jumlah ?? 0) > 0) {
      // Riwayat harus tetap utuh, jadi bahan dinonaktifkan, bukan dihapus.
      await jalankan("UPDATE bahan SET aktif = FALSE WHERE id = $1", [id]);
      await catatAudit(pengguna, "hapus", "bahan", `id ${id} dinonaktifkan`);
      return;
    }
    await jalankan("DELETE FROM bahan WHERE id = $1", [id]);
    await catatAudit(pengguna, "hapus", "bahan", `id ${id}`);
  });
}

export async function restockBahan(
  id: number, tambahan: number, pengguna: PenggunaSesi | null, catatan: string,
): Promise<void> {
  await denganTransaksi(async () => {
    const lama = await querySatu<{ stok: number }>("SELECT stok FROM bahan WHERE id = $1 FOR UPDATE", [id]);
    if (!lama) throw new GalatBisnis("Bahan tidak ditemukan");
    const baru = lama.stok + tambahan;
    await jalankan("UPDATE bahan SET stok = $1 WHERE id = $2", [baru, id]);
    await jalankan(
      `INSERT INTO pergerakan_stok (bahan_id, jenis, jumlah, stok_sebelum, stok_sesudah, referensi, catatan, pengguna_id)
       VALUES ($1,'masuk',$2,$3,$4,'RESTOCK',$5,$6)`,
      [id, tambahan, lama.stok, baru, catatan, pengguna?.id ?? null],
    );
    await catatAudit(pengguna, "tambah", "stok", `restock ${id}, tambahan ${tambahan}`);
  });
}

export async function ambilPergerakan(bahanId?: number): Promise<{
  id: number; nama_bahan: string; jenis: string; jumlah: number;
  stok_sebelum: number; stok_sesudah: number; referensi: string;
  catatan: string; dibuat_pada: string;
}[]> {
  return query(
    `SELECT p.id, b.nama AS nama_bahan, p.jenis, p.jumlah, p.stok_sebelum, p.stok_sesudah,
            p.referensi, p.catatan, p.dibuat_pada
     FROM pergerakan_stok p JOIN bahan b ON b.id = p.bahan_id
     ${bahanId ? "WHERE p.bahan_id = $1" : ""}
     ORDER BY p.id DESC LIMIT 200`,
    bahanId ? [bahanId] : [],
  );
}

export async function ambilSupplier() {
  return query("SELECT id, nama, kontak, aktif FROM supplier WHERE aktif = TRUE ORDER BY nama");
}

export type PembelianInput = {
  supplier_id: number | null;
  tanggal: string;
  catatan: string;
  items: { bahan_id: number; jumlah: number; harga_satuan: number }[];
};

export async function simpanPembelian(input: PembelianInput, pengguna: PenggunaSesi | null): Promise<number> {
  return denganTransaksi(async () => {
    if (input.items.length === 0) throw new GalatBisnis("Tambahkan minimal satu bahan");
    if (input.supplier_id) {
      const supplier = await querySatu<{ aktif: boolean }>(
        "SELECT aktif FROM supplier WHERE id = $1", [input.supplier_id],
      );
      if (!supplier?.aktif) throw new GalatBisnis("Supplier tidak aktif");
    }
    const total = input.items.reduce((n, i) => n + i.jumlah * i.harga_satuan, 0);
    const nomor = await nomorOtomatis("pembelian", "PB");
    const baris = await querySatu<{ id: number }>(
      `INSERT INTO pembelian (nomor, supplier_id, total, tanggal, catatan, pengguna_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [nomor, input.supplier_id, total, input.tanggal, input.catatan, pengguna?.id ?? null],
    );

    const itemsTerurut = [...input.items].sort((a, b) => a.bahan_id - b.bahan_id);
    for (const item of itemsTerurut) {
      await jalankan(
        "INSERT INTO item_pembelian (pembelian_id, bahan_id, jumlah, harga_satuan, subtotal) VALUES ($1,$2,$3,$4,$5)",
        [baris!.id, item.bahan_id, item.jumlah, item.harga_satuan, item.jumlah * item.harga_satuan],
      );
      const bahan = await querySatu<{ stok: number; harga_rata_rata: number }>(
        "SELECT stok, harga_rata_rata FROM bahan WHERE id = $1 FOR UPDATE", [item.bahan_id],
      );
      if (!bahan) throw new GalatBisnis("Bahan tidak ditemukan");
      const stokBaru = bahan.stok + item.jumlah;
      const rata = hargaRataRata(bahan.stok, bahan.harga_rata_rata, item.jumlah, item.harga_satuan);
      await jalankan(
        "UPDATE bahan SET stok = $1, harga_rata_rata = $2 WHERE id = $3",
        [stokBaru, rata, item.bahan_id],
      );
      await jalankan(
        `INSERT INTO pergerakan_stok (bahan_id, jenis, jumlah, stok_sebelum, stok_sesudah, referensi, catatan, pengguna_id)
         VALUES ($1,'masuk',$2,$3,$4,$5,'Pembelian bahan',$6)`,
        [item.bahan_id, item.jumlah, bahan.stok, stokBaru, nomor, pengguna?.id ?? null],
      );
    }
    await catatAudit(pengguna, "tambah", "pembelian", nomor);
    return baris!.id;
  });
}

export async function ambilPembelian() {
  return query(
    `SELECT p.id, p.nomor, p.total, p.tanggal, p.catatan, s.nama AS supplier,
            (SELECT COUNT(*) FROM item_pembelian ip WHERE ip.pembelian_id = p.id) AS jumlah_item
     FROM pembelian p LEFT JOIN supplier s ON s.id = p.supplier_id ORDER BY p.id DESC LIMIT 500`,
  );
}

export async function ambilItemPembelian(id: number) {
  return query(
    `SELECT ip.bahan_id, b.nama AS nama_bahan, ip.jumlah, ip.harga_satuan, ip.subtotal
     FROM item_pembelian ip JOIN bahan b ON b.id = ip.bahan_id WHERE ip.pembelian_id = $1`,
    [id],
  );
}

export type OpnameInput = {
  tanggal: string;
  catatan: string;
  items: { bahan_id: number; stok_fisik: number; alasan: string }[];
};

export async function simpanOpname(input: OpnameInput, pengguna: PenggunaSesi | null): Promise<number> {
  return denganTransaksi(async () => {
    if (input.items.length === 0) throw new GalatBisnis("Tambahkan minimal satu bahan");
    const nomor = await nomorOtomatis("stok_opname", "OP");
    const baris = await querySatu<{ id: number }>(
      "INSERT INTO stok_opname (nomor, tanggal, catatan, pengguna_id) VALUES ($1,$2,$3,$4) RETURNING id",
      [nomor, input.tanggal, input.catatan, pengguna?.id ?? null],
    );

    const itemsTerurut = [...input.items].sort((a, b) => a.bahan_id - b.bahan_id);
    for (const item of itemsTerurut) {
      const bahan = await querySatu<{ stok: number }>("SELECT stok FROM bahan WHERE id = $1 FOR UPDATE", [item.bahan_id]);
      if (!bahan) throw new GalatBisnis("Bahan tidak ditemukan");
      const selisih = item.stok_fisik - bahan.stok;
      await jalankan(
        `INSERT INTO item_opname (opname_id, bahan_id, stok_fisik, stok_sistem, selisih, alasan)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [baris!.id, item.bahan_id, item.stok_fisik, bahan.stok, selisih, item.alasan],
      );
      await jalankan("UPDATE bahan SET stok = $1 WHERE id = $2", [item.stok_fisik, item.bahan_id]);
      if (selisih !== 0) {
        await jalankan(
          `INSERT INTO pergerakan_stok (bahan_id, jenis, jumlah, stok_sebelum, stok_sesudah, referensi, catatan, pengguna_id)
           VALUES ($1,'penyesuaian',$2,$3,$4,$5,$6,$7)`,
          [item.bahan_id, selisih, bahan.stok, item.stok_fisik, nomor, item.alasan, pengguna?.id ?? null],
        );
      }
    }
    await catatAudit(pengguna, "tambah", "stok_opname", nomor);
    return baris!.id;
  });
}

export async function ambilOpname() {
  return query(
    `SELECT o.id, o.nomor, o.tanggal, o.catatan,
            (SELECT COUNT(*) FROM item_opname io WHERE io.opname_id = o.id) AS jumlah_item
     FROM stok_opname o ORDER BY o.id DESC LIMIT 500`,
  );
}

export async function ambilItemOpname(id: number) {
  return query(
    `SELECT io.bahan_id, b.nama AS nama_bahan, io.stok_fisik, io.stok_sistem, io.selisih, io.alasan
     FROM item_opname io JOIN bahan b ON b.id = io.bahan_id WHERE io.opname_id = $1`,
    [id],
  );
}

async function nomorOtomatis(tabel: string, awalan: string): Promise<string> {
  // Kunci advisory memastikan nomor unik walau dua permintaan masuk bersamaan.
  await query("SELECT pg_advisory_xact_lock(hashtext($1))", [tabel]);
  const hasil = await querySatu<{ jumlah: number }>(`SELECT COUNT(*) AS jumlah FROM ${tabel}`);
  return `${awalan}-${String((hasil?.jumlah ?? 0) + 1).padStart(4, "0")}`;
}
