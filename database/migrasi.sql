-- Migrasi idempoten untuk database yang sudah berjalan.
-- Menambahkan kolom HPP pada item transaksi agar laba historis tidak berubah
-- ketika resep atau harga bahan diubah kemudian.

ALTER TABLE item_penjualan
  ADD COLUMN IF NOT EXISTS hpp INTEGER NOT NULL DEFAULT 0;

ALTER TABLE item_preorder
  ADD COLUMN IF NOT EXISTS hpp INTEGER NOT NULL DEFAULT 0;

-- Perbaiki sequence identity yang tertinggal setelah pemuatan data contoh.
DO $$
DECLARE nama_tabel TEXT;
BEGIN
  FOREACH nama_tabel IN ARRAY ARRAY[
    'pengaturan','pembatasan_laju','pengguna','log_audit','supplier','konversi_satuan',
    'bahan','pergerakan_stok','pembelian','item_pembelian','stok_opname','item_opname',
    'menu','resep','varian','item_varian','slot_waktu','preorder','item_preorder',
    'penjualan','item_penjualan','kategori_pengeluaran','pengeluaran','tutup_kasir'
  ] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = nama_tabel AND column_name = 'id' AND is_identity = 'YES'
    ) THEN
      EXECUTE format(
        'SELECT setval(pg_get_serial_sequence(%L, %L), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM %I',
        nama_tabel, 'id', nama_tabel
      );
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'item_penjualan_hpp_nonneg') THEN
    ALTER TABLE item_penjualan ADD CONSTRAINT item_penjualan_hpp_nonneg CHECK (hpp >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'item_preorder_hpp_nonneg') THEN
    ALTER TABLE item_preorder ADD CONSTRAINT item_preorder_hpp_nonneg CHECK (hpp >= 0);
  END IF;
END $$;
