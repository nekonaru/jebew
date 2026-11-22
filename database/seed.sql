-- Data contoh untuk keperluan demo Tahap 1.

INSERT INTO bahan (id, nama, satuan, stok, stok_minimum) VALUES
  (1, 'Mie', 'gram', 1000, 200),
  (2, 'Bumbu', 'gram', 80, 50),
  (3, 'Telur', 'butir', 15, 5),
  (4, 'Cabai', 'gram', 100, 30),
  (5, 'Teh', 'gram', 50, 20),
  (6, 'Gula', 'gram', 200, 50);

INSERT INTO menu (id, nama, harga, deskripsi, kategori, foto, aktif) VALUES
  (1, 'Mie Jebew Original', 15000, 'Mie dengan bumbu khas Jebew dan telur.', 'Makanan', NULL, 1),
  (2, 'Mie Jebew Pedas', 17000, 'Mie Jebew dengan tambahan cabai pedas.', 'Makanan', NULL, 1),
  (3, 'Es Teh', 5000, 'Teh manis dingin, pendamping yang pas.', 'Minuman', NULL, 1);

INSERT INTO resep (menu_id, bahan_id, jumlah_per_porsi) VALUES
  (1, 1, 100),
  (1, 2, 10),
  (1, 3, 1),
  (2, 1, 100),
  (2, 2, 10),
  (2, 3, 1),
  (2, 4, 15),
  (3, 5, 5),
  (3, 6, 10);

INSERT INTO pengaturan (kunci, nilai) VALUES
  ('nama_usaha', 'Mie Jebew'),
  ('whatsapp_admin', '6281234567890');
