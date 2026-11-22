-- Skema database prototipe Jebew.
-- Dijalankan otomatis saat aplikasi pertama kali menyentuh data.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS bahan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  satuan TEXT NOT NULL,
  stok REAL NOT NULL DEFAULT 0 CHECK (stok >= 0),
  stok_minimum REAL NOT NULL DEFAULT 0 CHECK (stok_minimum >= 0),
  dibuat_pada TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', '+7 hours'))
);

CREATE TABLE IF NOT EXISTS menu (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  harga INTEGER NOT NULL CHECK (harga >= 0),
  deskripsi TEXT NOT NULL DEFAULT '',
  kategori TEXT NOT NULL DEFAULT 'Makanan',
  foto TEXT,
  aktif INTEGER NOT NULL DEFAULT 1 CHECK (aktif IN (0, 1)),
  dibuat_pada TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', '+7 hours'))
);

CREATE TABLE IF NOT EXISTS resep (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_id INTEGER NOT NULL REFERENCES menu(id) ON DELETE CASCADE,
  bahan_id INTEGER NOT NULL REFERENCES bahan(id) ON DELETE RESTRICT,
  jumlah_per_porsi REAL NOT NULL CHECK (jumlah_per_porsi > 0),
  UNIQUE (menu_id, bahan_id)
);

CREATE TABLE IF NOT EXISTS penjualan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  total INTEGER NOT NULL CHECK (total >= 0),
  metode TEXT NOT NULL DEFAULT 'tunai',
  catatan TEXT NOT NULL DEFAULT '',
  sumber TEXT NOT NULL DEFAULT 'kasir' CHECK (sumber IN ('kasir', 'preorder')),
  preorder_id INTEGER,
  dibuat_pada TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', '+7 hours'))
);

CREATE TABLE IF NOT EXISTS item_penjualan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  penjualan_id INTEGER NOT NULL REFERENCES penjualan(id) ON DELETE CASCADE,
  menu_id INTEGER NOT NULL,
  nama_menu TEXT NOT NULL,
  harga_satuan INTEGER NOT NULL CHECK (harga_satuan >= 0),
  jumlah INTEGER NOT NULL CHECK (jumlah > 0),
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0)
);

CREATE TABLE IF NOT EXISTS preorder (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kode TEXT NOT NULL UNIQUE,
  nama_pelanggan TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  waktu_ambil TEXT NOT NULL,
  catatan TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru', 'diproses', 'selesai', 'batal')),
  penjualan_id INTEGER REFERENCES penjualan(id),
  dibuat_pada TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', '+7 hours'))
);

CREATE TABLE IF NOT EXISTS item_preorder (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  preorder_id INTEGER NOT NULL REFERENCES preorder(id) ON DELETE CASCADE,
  menu_id INTEGER NOT NULL,
  nama_menu TEXT NOT NULL,
  harga_satuan INTEGER NOT NULL CHECK (harga_satuan >= 0),
  jumlah INTEGER NOT NULL CHECK (jumlah > 0),
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0)
);

CREATE TABLE IF NOT EXISTS pengaturan (
  kunci TEXT PRIMARY KEY,
  nilai TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS indeks_resep_menu ON resep(menu_id);
CREATE INDEX IF NOT EXISTS indeks_penjualan_tanggal ON penjualan(dibuat_pada);
CREATE INDEX IF NOT EXISTS indeks_item_penjualan ON item_penjualan(penjualan_id);
CREATE INDEX IF NOT EXISTS indeks_preorder_status ON preorder(status);
CREATE INDEX IF NOT EXISTS indeks_item_preorder ON item_preorder(preorder_id);
