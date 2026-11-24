-- Migrasi idempoten untuk database yang sudah berjalan.
-- Menambahkan kolom HPP pada item transaksi agar laba historis tidak berubah
-- ketika resep atau harga bahan diubah kemudian.

ALTER TABLE item_penjualan
  ADD COLUMN IF NOT EXISTS hpp INTEGER NOT NULL DEFAULT 0;

ALTER TABLE item_preorder
  ADD COLUMN IF NOT EXISTS hpp INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'item_penjualan_hpp_nonneg') THEN
    ALTER TABLE item_penjualan ADD CONSTRAINT item_penjualan_hpp_nonneg CHECK (hpp >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'item_preorder_hpp_nonneg') THEN
    ALTER TABLE item_preorder ADD CONSTRAINT item_preorder_hpp_nonneg CHECK (hpp >= 0);
  END IF;
END $$;
