-- Data contoh Warung Kak Ikaa: Mie Jebew Chili Oil & Wonton Ayam Chili Oil.
-- Dijalankan oleh scripts/siap-supabase.mjs atau scripts/muat-contoh.mjs.

INSERT INTO bahan (id, nama, satuan, stok, stok_minimum) VALUES
  (1, 'Mie', 'gram', 2000, 300),
  (2, 'Bumbu Chili Oil', 'gram', 120, 30),
  (3, 'Telur', 'butir', 60, 15),
  (4, 'Beef', 'gram', 1000, 200),
  (5, 'Bakso Kecil', 'pcs', 80, 20),
  (6, 'Bakso Besar', 'pcs', 60, 15),
  (7, 'Sosis Jumbo', 'pcs', 50, 12),
  (8, 'Wonton Ayam', 'pcs', 80, 20),
  (9, 'Dumpling Ayam', 'pcs', 60, 15),
  (10, 'Dumpling Keju', 'pcs', 2, 5),
  (11, 'Ayam Katsu', 'pcs', 40, 10),
  (12, 'Otak-Otak', 'pcs', 20, 8),
  (13, 'Pentol', 'pcs', 60, 15),
  (14, 'Bakso Mozarella', 'pcs', 25, 8),
  (15, 'Teh', 'gram', 200, 50),
  (16, 'Lemon', 'pcs', 40, 10),
  (17, 'Nutrisari', 'gram', 200, 50),
  (18, 'Kopi', 'gram', 150, 40),
  (19, 'Air Mineral', 'botol', 40, 10),
  (20, 'Pop Ice', 'gram', 200, 50),
  (21, 'Susu', 'ml', 2000, 400),
  (22, 'Gula', 'gram', 1000, 200),
  (23, 'Air', 'ml', 5000, 1000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO menu (id, nama, harga, deskripsi, kategori, foto, aktif) VALUES
  (1, 'Mie Jebew Original', 10000, 'Mie Jebew dengan bumbu chili oil khas. Level pedas 0 sampai 3.', 'Mie Jebew', NULL, TRUE),
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

INSERT INTO pengaturan (kunci, nilai) VALUES
  ('nama_usaha', 'Warung Kak Ikaa'),
  ('whatsapp_admin', '6281234567890')
ON CONFLICT (kunci) DO NOTHING;

SELECT setval(pg_get_serial_sequence('bahan', 'id'), (SELECT MAX(id) FROM bahan));
SELECT setval(pg_get_serial_sequence('menu', 'id'), (SELECT MAX(id) FROM menu));
