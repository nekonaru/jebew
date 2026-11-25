"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatRupiah, formatWaktu } from "@/lib/format.ts";
import { ambilJson } from "@/komponen/api-klien.ts";
import { Badge, Dialog, Judul, Kartu, Pesan, Tombol } from "./ui.tsx";

type Menu = {
  id: number; nama: string; harga: number; tersedia: boolean; porsi: number; kategori: string;
  varian: { id: number; nama: string; harga_tambahan: number }[];
};
type Baris = { kunci: string; menu: Menu; varianId: number | null; jumlah: number };

export default function HalamanKasir() {
  const [menu, setMenu] = useState<Menu[]>([]);
  const [keranjang, setKeranjang] = useState<Baris[]>([]);
  const [pilihMenu, setPilihMenu] = useState("");
  const [pilihVarian, setPilihVarian] = useState("");
  const [jumlah, setJumlah] = useState("1");
  const [diskon, setDiskon] = useState("0");
  const [metode, setMetode] = useState("tunai");
  const [catatan, setCatatan] = useState("");
  const [pesan, setPesan] = useState("");
  const [jenis, setJenis] = useState<"info" | "sukses" | "galat">("info");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<{
    nomor: string; total: number; dibuat_pada: string;
    items: { nama_menu: string; nama_varian: string; harga_satuan: number; jumlah: number; subtotal: number }[];
  } | null>(null);

  const muat = useCallback(async () => {
    try {
      const data = await fetch("/api/dashboard").then(ambilJson<{ menu: Menu[] }>);
      setMenu(data.menu);
    } catch { /* abaikan */ }
  }, []);
  useEffect(() => { void muat(); }, [muat]);

  const menuPilih = useMemo(() => menu.find((m) => m.id === Number(pilihMenu)), [menu, pilihMenu]);
  const tersedia = useMemo(() => menu.filter((m) => m.tersedia), [menu]);

  const subtotal = keranjang.reduce((n, b) => {
    const tambahan = b.menu.varian.find((v) => v.id === b.varianId)?.harga_tambahan ?? 0;
    return n + (b.menu.harga + tambahan) * b.jumlah;
  }, 0);
  const total = Math.max(0, subtotal - (Number(diskon) || 0));

  function tambah() {
    const m = menuPilih;
    const j = Number(jumlah);
    if (!m || !Number.isInteger(j) || j < 1 || j > 100) {
      setJenis("galat"); setPesan("Pilih menu dan jumlah 1 sampai 100."); return;
    }
    const varianId = pilihVarian ? Number(pilihVarian) : null;
    const kunci = `${m.id}-${varianId ?? 0}`;
    setKeranjang((lama) => {
      const ada = lama.find((b) => b.kunci === kunci);
      if (ada) return lama.map((b) => b.kunci === kunci ? { ...b, jumlah: Math.min(100, b.jumlah + j) } : b);
      return [...lama, { kunci, menu: m, varianId, jumlah: j }];
    });
    setPilihMenu(""); setPilihVarian(""); setJumlah("1"); setPesan(""); setHasil(null);
  }

  async function simpan() {
    if (keranjang.length === 0) { setJenis("galat"); setPesan("Keranjang masih kosong."); return; }
    setLoading(true); setPesan("");
    try {
      const respons = await fetch("/api/kasir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: keranjang.map((b) => ({ menu_id: b.menu.id, varian_id: b.varianId, jumlah: b.jumlah })),
          diskon: Number(diskon) || 0,
          metode,
          catatan,
        }),
      });
      const data = await ambilJson<{
        nomor: string; total: number; dibuat_pada: string;
        items: { nama_menu: string; nama_varian: string; harga_satuan: number; jumlah: number; subtotal: number }[];
      }>(respons);
      setHasil({ nomor: data.nomor, total: data.total, dibuat_pada: data.dibuat_pada, items: data.items ?? [] });
      setJenis("sukses");
      setPesan(`Transaksi ${data.nomor} berhasil. Stok sudah berkurang otomatis.`);
      setKeranjang([]); setDiskon("0"); setCatatan("");
      void muat();
    } catch (e) {
      setJenis("galat"); setPesan(e instanceof Error ? e.message : "Gagal menyimpan transaksi");
    } finally { setLoading(false); }
  }

  return (
    <div>
      <Judul anak="Kasir" sub="Catat penjualan. Stok berkurang otomatis sesuai resep dan varian." />
      <Pesan teks={pesan} jenis={jenis} />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Kartu>
            <h2 className="mb-4 text-lg font-semibold">Tambah item</h2>
            <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_90px_auto] sm:items-end">
              <div>
                <label htmlFor="pilih-menu">Menu</label>
                <select id="pilih-menu" value={pilihMenu} onChange={(e) => { setPilihMenu(e.target.value); setPilihVarian(""); }}>
                  <option value="">Pilih menu</option>
                  {tersedia.map((m) => <option key={m.id} value={m.id}>{m.nama} - {formatRupiah(m.harga)}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="pilih-varian">Varian</label>
                <select id="pilih-varian" value={pilihVarian} onChange={(e) => setPilihVarian(e.target.value)} disabled={!menuPilih?.varian.length}>
                  <option value="">Tanpa varian</option>
                  {menuPilih?.varian.map((v) => (
                    <option key={v.id} value={v.id}>{v.nama}{v.harga_tambahan ? ` +${formatRupiah(v.harga_tambahan)}` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="jumlah">Jumlah</label>
                <input id="jumlah" type="number" min={1} max={100} value={jumlah} onChange={(e) => setJumlah(e.target.value)} />
              </div>
              <Tombol onClick={tambah} kelas="w-full sm:w-auto">Tambah</Tombol>
            </div>
          </Kartu>

          <Kartu>
            <h2 className="mb-4 text-lg font-semibold">Daftar menu</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {menu.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 rounded-xl border border-garis px-3 py-2.5 text-sm">
                  <span className="truncate">{m.nama}</span>
                  <Badge warna={m.tersedia ? "sukses" : "bahaya"}>{m.tersedia ? `${m.porsi}` : "Habis"}</Badge>
                </div>
              ))}
            </div>
          </Kartu>
        </div>

        <Kartu kelas="lg:sticky lg:top-6 lg:self-start">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Keranjang</h2>
            <Badge>{keranjang.length} item</Badge>
          </div>

          {keranjang.length === 0 ? (
            <p className="py-8 text-center text-sm text-tinta-lemah">Belum ada item. Pilih menu di atas.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {keranjang.map((b) => {
                const tambahan = b.menu.varian.find((v) => v.id === b.varianId)?.harga_tambahan ?? 0;
                return (
                  <li key={b.kunci} className="rounded-xl border border-garis p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{b.menu.nama}</p>
                        {b.varianId && <p className="text-xs text-tinta-lemah">{b.menu.varian.find((v) => v.id === b.varianId)?.nama}</p>}
                      </div>
                      <button onClick={() => setKeranjang((l) => l.filter((x) => x.kunci !== b.kunci))}
                        className="text-xs font-semibold text-bahaya hover:underline">Hapus</button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button type="button" aria-label={`Kurangi ${b.menu.nama}`}
                          onClick={() => setKeranjang((l) => l.map((x) => x.kunci === b.kunci ? { ...x, jumlah: Math.max(1, x.jumlah - 1) } : x))}
                          className="h-11 w-11 rounded-lg border border-garis text-base font-semibold">-</button>
                        <span className="w-6 text-center text-sm font-semibold" aria-live="polite">{b.jumlah}</span>
                        <button type="button" aria-label={`Tambah ${b.menu.nama}`}
                          onClick={() => setKeranjang((l) => l.map((x) => x.kunci === b.kunci ? { ...x, jumlah: Math.min(100, x.jumlah + 1) } : x))}
                          className="h-11 w-11 rounded-lg border border-garis text-base font-semibold">+</button>
                      </div>
                      <span className="text-sm font-semibold">{formatRupiah((b.menu.harga + tambahan) * b.jumlah)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-5 space-y-4 border-t border-garis pt-4">
            <div>
              <label htmlFor="diskon">Diskon (Rp)</label>
              <input id="diskon" type="number" min={0} max={subtotal} value={diskon} onChange={(e) => setDiskon(e.target.value)} />
            </div>
            <div>
              <label htmlFor="metode">Metode pembayaran</label>
              <select id="metode" value={metode} onChange={(e) => setMetode(e.target.value)}>
                <option value="tunai">Tunai</option>
                <option value="qris">QRIS</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <div>
              <label htmlFor="catatan">Catatan</label>
              <textarea id="catatan" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Opsional" />
            </div>
            <div className="rounded-xl bg-latar px-4 py-3">
              <div className="flex justify-between text-sm text-tinta-lemah"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
              <div className="mt-1 flex justify-between text-sm text-tinta-lemah"><span>Diskon</span><span>-{formatRupiah(Number(diskon) || 0)}</span></div>
              <div className="mt-2 flex items-center justify-between border-t border-garis pt-2">
                <span className="font-semibold">Total</span>
                <span className="font-judul text-xl font-semibold text-utama">{formatRupiah(total)}</span>
              </div>
            </div>
            <Tombol onClick={() => void simpan()} nonaktif={loading || keranjang.length === 0} kelas="w-full">
              {loading ? "Menyimpan..." : "Simpan transaksi"}
            </Tombol>
          </div>
        </Kartu>
      </div>

      <Dialog terbuka={Boolean(hasil)} judul="Transaksi berhasil" padaTutup={() => setHasil(null)}>
        {hasil && (
          <div id="struk-kasir" className="space-y-4">
            <div className="text-center">
              <p className="font-judul text-lg font-semibold">Mie Jebew</p>
              <p className="text-xs text-tinta-lemah">{hasil.nomor} · {formatWaktu(hasil.dibuat_pada)}</p>
            </div>
            <ul className="divide-y divide-garis text-sm">
              {hasil.items.map((i, n) => (
                <li key={n} className="flex items-start justify-between gap-3 py-2">
                  <span>{i.nama_menu}{i.nama_varian ? ` (${i.nama_varian})` : ""} · {i.jumlah}x</span>
                  <span className="font-semibold">{formatRupiah(i.subtotal)}</span>
                </li>
              ))}
            </ul>
            <p className="border-t border-garis pt-3 text-right font-judul text-lg font-semibold">
              Total {formatRupiah(hasil.total)}
            </p>
            <div className="flex gap-2">
              <Tombol jenis="sekunder" kelas="flex-1" onClick={() => window.print()}>Cetak struk</Tombol>
              <Tombol kelas="flex-1" onClick={() => setHasil(null)}>Selesai</Tombol>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
