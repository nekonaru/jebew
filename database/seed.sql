-- Data awal Jebew Final. Dijalankan sekali oleh scripts/siap-supabase.mjs.

INSERT INTO pengaturan (kunci, nilai) VALUES
  ('nama_usaha', 'Warung Kak Ikaa'),
  ('tagline', 'Mie Jebew Chili Oil & Wonton Ayam'),
  ('whatsapp_admin', '6282173282591'),
  ('hari_buka', 'Senin - Minggu'),
  ('jam_buka', '10:00'),
  ('jam_tutup', '21:00'),
  ('toko_aktif', 'true'),
  ('preorder_aktif', 'true'),
  ('preorder_jam_buka', '10:00'),
  ('preorder_jam_tutup', '21:00')
ON CONFLICT (kunci) DO NOTHING;

INSERT INTO pengguna (id, email, nama, kata_sandi, peran, aktif) VALUES
  (1, 'pemilik@jebew.test', 'Kak Ika', '29a88f8874ac11d6c7bb458adf086bde:1bad92cedd267e9748ffbe55443168279c262514e9eb1a48f70776af18b2c0c160a511ad83971ba5878646b13e7f34443fd6ff01684c09de673a758c28bb2059', 'pemilik', TRUE),
  (2, 'kasir@jebew.test', 'Kasir Warung', '80f5214e124be5440d83acbba4c66f9d:b9aeb1326c6cf9e726a7ebc7bab99f214a06c9470f225e4da3c589aceaad129fb8c5f48f3d811dec119596fc40761574bef05be55344f25d0a3baa0e964b13cb', 'kasir', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO kategori_pengeluaran (id, nama) VALUES
  (1, 'Bahan baku'),
  (2, 'Gas'),
  (3, 'Listrik'),
  (4, 'Sewa'),
  (5, 'Gaji'),
  (6, 'Lainnya')
ON CONFLICT (id) DO NOTHING;

INSERT INTO supplier (id, nama, kontak, aktif) VALUES
  (1, 'Supplier Mie Segar', '081200000001', TRUE),
  (2, 'Toko Bumbu Jaya', '081200000002', TRUE),
  (3, 'Pasar Ayam Sentral', '081200000003', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO konversi_satuan (dari_satuan, ke_satuan, faktor) VALUES
  ('kg', 'gram', 1000),
  ('liter', 'ml', 1000),
  ('lusin', 'pcs', 12)
ON CONFLICT (dari_satuan, ke_satuan) DO NOTHING;

INSERT INTO bahan (id, nama, satuan, stok, stok_minimum, harga_rata_rata, aktif) VALUES
  (1, 'Mie', 'gram', 2000, 300, 12, TRUE),
  (2, 'Bumbu Chili Oil', 'gram', 120, 30, 85, TRUE),
  (3, 'Telur', 'butir', 60, 15, 3000, TRUE),
  (4, 'Beef', 'gram', 1000, 200, 95, TRUE),
  (5, 'Bakso Kecil', 'pcs', 80, 20, 1500, TRUE),
  (6, 'Bakso Besar', 'pcs', 60, 15, 4000, TRUE),
  (7, 'Sosis Jumbo', 'pcs', 50, 12, 6000, TRUE),
  (8, 'Wonton Ayam', 'pcs', 80, 20, 2500, TRUE),
  (9, 'Dumpling Ayam', 'pcs', 60, 15, 2500, TRUE),
  (10, 'Dumpling Keju', 'pcs', 2, 5, 3000, TRUE),
  (11, 'Ayam Katsu', 'pcs', 40, 10, 12000, TRUE),
  (12, 'Otak-Otak', 'pcs', 20, 8, 2000, TRUE),
  (13, 'Pentol', 'pcs', 60, 15, 1000, TRUE),
  (14, 'Bakso Mozarella', 'pcs', 25, 8, 9000, TRUE),
  (15, 'Teh', 'gram', 200, 50, 60, TRUE),
  (16, 'Lemon', 'pcs', 40, 10, 2000, TRUE),
  (17, 'Nutrisari', 'gram', 200, 50, 70, TRUE),
  (18, 'Kopi', 'gram', 150, 40, 110, TRUE),
  (19, 'Air Mineral', 'botol', 40, 10, 4000, TRUE),
  (20, 'Pop Ice', 'gram', 200, 50, 80, TRUE),
  (21, 'Susu', 'ml', 2000, 400, 15, TRUE),
  (22, 'Gula', 'gram', 1000, 200, 15, TRUE),
  (23, 'Air', 'ml', 5000, 1000, 1, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO menu (id, nama, harga, deskripsi, kategori, foto, aktif) VALUES
  (1, 'Mie Jebew Original', 10000, 'Mie Jebew dengan bumbu chili oil khas.', 'Mie Jebew', NULL, TRUE),
  (2, 'Mie Jebew Beef', 12000, 'Mie Jebew dengan tambahan beef.', 'Mie Jebew', NULL, TRUE),
  (3, 'Mie Jebew + Bakso Kecil', 13000, 'Mie Jebew dengan tiga bakso kecil.', 'Mie Jebew', NULL, TRUE),
  (4, 'Mie Jebew + Bakso Besar', 15000, 'Mie Jebew dengan satu bakso besar.', 'Mie Jebew', NULL, TRUE),
  (5, 'Mie Jebew + Sosis Besar', 15000, 'Mie Jebew dengan satu sosis jumbo.', 'Mie Jebew', NULL, TRUE),
  (6, 'Mie Jebew + Wonton', 12000, 'Mie Jebew dengan empat wonton ayam.', 'Mie Jebew', NULL, TRUE),
  (7, 'Mie Jebew + Telur', 13000, 'Mie Jebew dengan dua telur.', 'Mie Jebew', NULL, TRUE),
  (8, 'Mie Jebew + Dumpling', 14000, 'Mie Jebew dengan empat dumpling ayam.', 'Mie Jebew', NULL, TRUE),
  (9, 'Mie Jebew Komplit', 18000, 'Beef, bakso, telur, dan wonton dalam satu mangkok.', 'Mie Jebew', NULL, TRUE),
  (10, 'Mie Jebew Chicken Katsu', 17000, 'Mie Jebew dengan ayam katsu.', 'Mie Jebew', NULL, TRUE),
  (11, 'Mie Jebew + Bakso Mozarella', 17000, 'Mie Jebew dengan bakso mozarella.', 'Mie Jebew', NULL, TRUE),
  (12, 'Wonton Basah isi 5', 10000, 'Lima wonton ayam dengan kuah basah.', 'Wonton Ayam Chili Oil', NULL, TRUE),
  (13, 'Wonton Kuah isi 5', 10000, 'Lima wonton ayam dalam kuah chili oil.', 'Wonton Ayam Chili Oil', NULL, TRUE),
  (14, 'Wonton Goreng isi 5', 10000, 'Lima wonton ayam goreng.', 'Wonton Ayam Chili Oil', NULL, TRUE),
  (15, 'Wonton Satuan', 2000, 'Wonton ayam per keping.', 'Wonton Ayam Chili Oil', NULL, TRUE),
  (16, 'Mie Chili Oil + Telur', 13000, 'Mie chili oil dengan telur.', 'Mie Chili Oil', NULL, TRUE),
  (17, 'Mie Chili Oil Original', 10000, 'Mie chili oil tanpa tambahan.', 'Mie Chili Oil', NULL, TRUE),
  (18, 'Beef', 1000, 'Tambahan beef per porsi.', 'Extra Topping', NULL, TRUE),
  (19, 'Wonton', 2000, 'Tambahan wonton ayam per keping.', 'Extra Topping', NULL, TRUE),
  (20, 'Telor', 3000, 'Tambahan telur per butir.', 'Extra Topping', NULL, TRUE),
  (21, 'Sosis Jumbo', 5000, 'Tambahan sosis jumbo per buah.', 'Extra Topping', NULL, TRUE),
  (22, 'Dumpling Ayam', 2000, 'Tambahan dumpling ayam per keping.', 'Extra Topping', NULL, TRUE),
  (23, 'Dumpling Keju', 2000, 'Tambahan dumpling keju per keping.', 'Extra Topping', NULL, TRUE),
  (24, 'Otak-Otak', 1000, 'Tambahan otak-otak per keping.', 'Extra Topping', NULL, TRUE),
  (25, 'Pentol', 1000, 'Tambahan pentol per buah.', 'Extra Topping', NULL, TRUE),
  (26, 'Bakso Mozarella', 7000, 'Tambahan bakso mozarella per buah.', 'Extra Topping', NULL, TRUE),
  (27, 'Bakso Besar', 7000, 'Tambahan bakso besar per buah.', 'Extra Topping', NULL, TRUE),
  (28, 'Es Teh', 4000, 'Teh manis dingin.', 'Minuman', NULL, TRUE),
  (29, 'Lemon Tea', 5000, 'Teh lemon segar.', 'Minuman', NULL, TRUE),
  (30, 'Nutrisari', 4000, 'Minuman nutrisari.', 'Minuman', NULL, TRUE),
  (31, 'Cappucino', 6000, 'Kopi cappucino.', 'Minuman', NULL, TRUE),
  (32, 'Mineral', 4000, 'Air mineral dalam botol.', 'Minuman', NULL, TRUE),
  (33, 'Aneka Pop Ice Milky', 5000, 'Pop Ice Milky Cooling.', 'Minuman', NULL, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO resep (menu_id, bahan_id, jumlah_per_porsi) VALUES
  (1, 1, 100), (1, 2, 15), (1, 3, 1),
  (2, 1, 100), (2, 2, 15), (2, 4, 50),
  (3, 1, 100), (3, 2, 15), (3, 5, 3),
  (4, 1, 100), (4, 2, 15), (4, 6, 1),
  (5, 1, 100), (5, 2, 15), (5, 7, 1),
  (6, 1, 100), (6, 2, 15), (6, 8, 4),
  (7, 1, 100), (7, 2, 15), (7, 3, 2),
  (8, 1, 100), (8, 2, 15), (8, 9, 4),
  (9, 1, 100), (9, 2, 15), (9, 4, 30), (9, 5, 2), (9, 3, 1), (9, 8, 2),
  (10, 1, 100), (10, 2, 15), (10, 11, 1),
  (11, 1, 100), (11, 2, 15), (11, 14, 1),
  (12, 8, 5), (12, 2, 10),
  (13, 8, 5), (13, 2, 10), (13, 23, 200),
  (14, 8, 5), (14, 2, 10),
  (15, 8, 1),
  (16, 1, 100), (16, 2, 15), (16, 3, 1),
  (17, 1, 100), (17, 2, 15),
  (18, 4, 30),
  (19, 8, 1),
  (20, 3, 1),
  (21, 7, 1),
  (22, 9, 1),
  (23, 10, 1),
  (24, 12, 1),
  (25, 13, 1),
  (26, 14, 1),
  (27, 6, 1),
  (28, 15, 5), (28, 22, 10), (28, 23, 200),
  (29, 15, 5), (29, 16, 1), (29, 22, 10), (29, 23, 200),
  (30, 17, 10), (30, 23, 200),
  (31, 18, 10), (31, 21, 100), (31, 22, 5),
  (32, 19, 1),
  (33, 20, 15), (33, 21, 150), (33, 23, 100)
ON CONFLICT (menu_id, bahan_id) DO NOTHING;

-- Level pedas sebagai varian terstruktur pada menu Mie Jebew.
INSERT INTO varian (id, menu_id, nama, harga_tambahan, aktif) VALUES
  (1, 1, 'Level 0', 0, TRUE),
  (2, 1, 'Level 1', 0, TRUE),
  (3, 1, 'Level 2', 0, TRUE),
  (4, 1, 'Level 3', 0, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO pembelian (id, nomor, supplier_id, total, tanggal, catatan, pengguna_id) VALUES
  (1, 'PB-0001', 1, 24000, (now() AT TIME ZONE 'Asia/Jakarta') - INTERVAL '3 days', 'Pembelian mie bulan ini', 1),
  (2, 'PB-0002', 2, 170000, (now() AT TIME ZONE 'Asia/Jakarta') - INTERVAL '2 days', 'Bumbu dan teh', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO item_pembelian (pembelian_id, bahan_id, jumlah, harga_satuan, subtotal) VALUES
  (1, 1, 2000, 12, 24000),
  (2, 2, 1000, 85, 85000),
  (2, 15, 500, 60, 30000),
  (2, 22, 1000, 15, 15000)
ON CONFLICT DO NOTHING;

INSERT INTO pergerakan_stok (bahan_id, jenis, jumlah, stok_sebelum, stok_sesudah, referensi, catatan, pengguna_id) VALUES
  (1, 'masuk', 2000, 0, 2000, 'PB-0001', 'Pembelian mie', 1),
  (2, 'masuk', 1000, 0, 1000, 'PB-0002', 'Pembelian bumbu', 1),
  (2, 'keluar', 880, 1000, 120, 'PENJUALAN', 'Pemakaian periode sebelumnya', 1),
  (1, 'masuk', 2000, 0, 2000, 'PB-0001', 'Stok awal', 1)
ON CONFLICT DO NOTHING;

INSERT INTO pengeluaran (id, kategori_id, nama, jumlah, tanggal, catatan, pengguna_id) VALUES
  (1, 3, 'Listrik bulan ini', 150000, (now() AT TIME ZONE 'Asia/Jakarta') - INTERVAL '5 days', 'Tagihan listrik', 1),
  (2, 2, 'Gas melon', 100000, (now() AT TIME ZONE 'Asia/Jakarta') - INTERVAL '4 days', 'Isi gas', 1)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('pengguna', 'id'), (SELECT MAX(id) FROM pengguna));
SELECT setval(pg_get_serial_sequence('bahan', 'id'), (SELECT MAX(id) FROM bahan));
SELECT setval(pg_get_serial_sequence('menu', 'id'), (SELECT MAX(id) FROM menu));
SELECT setval(pg_get_serial_sequence('varian', 'id'), (SELECT MAX(id) FROM varian));
SELECT setval(pg_get_serial_sequence('pembelian', 'id'), (SELECT MAX(id) FROM pembelian));
SELECT setval(pg_get_serial_sequence('pengeluaran', 'id'), (SELECT MAX(id) FROM pengeluaran));

-- Samakan semua sequence identity dengan data yang sudah ada supaya data baru
-- tidak menabrak id dari seed. Berlaku juga untuk tabel yang kosong.
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
