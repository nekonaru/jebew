"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { formatRupiah } from "@/lib/format.ts";
import { metodeValid } from "@/lib/validasi.ts";
import { Kartu, Pesan, Tombol } from "./ui.tsx";

type MenuKasir = {
  id: number;
  nama: string;
  harga: number;
  tersedia: boolean;
  porsi: number;
};

type BarisKeranjang = { menu_id: number; nama: string; harga: number; jumlah: number };

export default function HalamanKasir() {
  const [daftarMenu, setDaftarMenu] = useState<MenuKasir[]>([]);
  const [pilihanMenu, setPilihanMenu] = useState("");
  const [jumlah, setJumlah] = useState("1");
  const [keranjang, setKeranjang] = useState<BarisKeranjang[]>([]);
  const [metode, setMetode] = useState<string>(metodeValid[0]);
  const [catatan, setCatatan] = useState("");
  const [pesan, setPesan] = useState("");
  const [jenisPesan, setJenisPesan] = useState<"info" | "sukses" | "galat">("info");
  const [sedangKirim, setSedangKirim] = useState(false);
  const [transaksiTerakhir, setTransaksiTerakhir] = useState<{ id: number; total: number } | null>(null);

  const muat = useCallback(async () => {
    try {
      const jawaban = await fetch("/api/menu");
      const data = (await jawaban.json()) as { menu: MenuKasir[] };
      setDaftarMenu(data.menu);
    } catch {
      setJenisPesan("galat");
      setPesan("Daftar menu gagal dimuat.");
    }
  }, []);

  useEffect(() => { void muat(); }, [muat]);

  const menuTersedia = useMemo(() => daftarMenu.filter((menu) => menu.tersedia), [daftarMenu]);
  const total = keranjang.reduce((nilai, item) => nilai + item.harga * item.jumlah, 0);

  function tambahKeKeranjang() {
    const menu = menuTersedia.find((item) => item.id === Number(pilihanMenu));
    const jumlahAngka = Number(jumlah);
    if (!menu || !Number.isInteger(jumlahAngka) || jumlahAngka < 1) {
      setJenisPesan("galat");
      setPesan("Pilih menu dan jumlah yang valid.");
      return;
    }

    setKeranjang((nilai) => {
      const sudahAda = nilai.find((item) => item.menu_id === menu.id);
      if (sudahAda) {
        return nilai.map((item) => item.menu_id === menu.id ? { ...item, jumlah: item.jumlah + jumlahAngka } : item);
      }
      return [...nilai, { menu_id: menu.id, nama: menu.nama, harga: menu.harga, jumlah: jumlahAngka }];
    });
    setPilihanMenu("");
    setJumlah("1");
    setPesan("");
    setTransaksiTerakhir(null);
  }

  function ubahJumlah(indeks: number, jumlahBaru: string) {
    setKeranjang((nilai) => nilai.map((item, posisi) =>
      posisi === indeks ? { ...item, jumlah: Math.max(1, Number(jumlahBaru) || 1) } : item));
  }

  async function simpanTransaksi(peristiwa: FormEvent<HTMLFormElement>) {
    peristiwa.preventDefault();
    if (keranjang.length === 0) {
      setJenisPesan("galat");
      setPesan("Keranjang masih kosong.");
      return;
    }
    setSedangKirim(true);
    try {
      const jawaban = await fetch("/api/kasir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: keranjang.map((item) => ({ menu_id: item.menu_id, jumlah: item.jumlah })),
          metode,
          catatan,
        }),
      });
      const hasil = (await jawaban.json()) as { id?: number; total?: number; pesan?: string };
      if (!jawaban.ok) throw new Error(hasil.pesan ?? "Transaksi gagal dicatat");
      setTransaksiTerakhir({ id: hasil.id!, total: hasil.total! });
      setJenisPesan("sukses");
      setPesan(`Transaksi #${hasil.id} berhasil. Stok bahan sudah berkurang otomatis.`);
      setKeranjang([]);
      setCatatan("");
      await muat();
    } catch (kesalahan) {
      setJenisPesan("galat");
      setPesan(kesalahan instanceof Error ? kesalahan.message : "Transaksi gagal dicatat");
    } finally {
      setSedangKirim(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold">Kasir</h2>
          <p className="text-sm text-coklatMuda">Catat penjualan. Stok bahan berkurang otomatis sesuai resep.</p>
        </div>
        <Pesan teks={pesan} jenis={jenisPesan} />

        <Kartu>
          <h3 className="text-lg font-semibold">Pilih menu</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_110px_auto]">
            <label className="visually-hidden" htmlFor="pilih-menu-kasir">Menu</label>
            <select id="pilih-menu-kasir" value={pilihanMenu}
              onChange={(e) => setPilihanMenu(e.target.value)}>
              <option value="">Pilih menu yang tersedia</option>
              {menuTersedia.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.nama} - {formatRupiah(menu.harga)} (sisa {menu.porsi})
                </option>
              ))}
            </select>
            <label className="visually-hidden" htmlFor="jumlah-kasir">Jumlah</label>
            <input id="jumlah-kasir" type="number" min={1} max={100} value={jumlah}
              onChange={(e) => setJumlah(e.target.value)} />
            <Tombol onClick={tambahKeKeranjang}>Tambah</Tombol>
          </div>
          {menuTersedia.length === 0 && (
            <p className="mt-3 text-sm text-red-700">Tidak ada menu tersedia. Periksa stok dan resep dulu.</p>
          )}
        </Kartu>

        <Kartu>
          <h3 className="text-lg font-semibold">Daftar menu</h3>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {daftarMenu.map((menu) => (
              <li key={menu.id} className="flex items-center justify-between rounded-xl border border-tepi px-4 py-3 text-sm">
                <span>{menu.nama}</span>
                <span className={menu.tersedia ? "font-semibold text-sukses" : "text-stone-500"}>
                  {menu.tersedia ? `${menu.porsi} porsi` : "Habis"}
                </span>
              </li>
            ))}
          </ul>
        </Kartu>
      </div>

      <Kartu kelas="lg:sticky lg:top-6 lg:self-start">
        <form onSubmit={simpanTransaksi} className="space-y-4">
          <h3 className="text-lg font-semibold">Keranjang</h3>
          {keranjang.length === 0 ? (
            <p className="text-sm text-coklatMuda">Belum ada item.</p>
          ) : (
            <ul className="space-y-3">
              {keranjang.map((item, indeks) => (
                <li key={item.menu_id} className="rounded-xl border border-tepi p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{item.nama}</span>
                    <Tombol onClick={() => setKeranjang((nilai) => nilai.filter((_, posisi) => posisi !== indeks))}
                      jenis="bahaya" kelas="min-h-[36px] px-2 text-xs">Hapus</Tombol>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <label className="visually-hidden" htmlFor={`qty-keranjang-${indeks}`}>Jumlah {item.nama}</label>
                    <input id={`qty-keranjang-${indeks}`} type="number" min={1} max={100} className="min-h-[40px]"
                      value={item.jumlah} onChange={(e) => ubahJumlah(indeks, e.target.value)} />
                    <span className="ml-auto text-sm">{formatRupiah(item.harga * item.jumlah)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-tepi pt-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="text-bata">{formatRupiah(total)}</span>
            </div>
          </div>

          <div>
            <label htmlFor="metode-bayar">Metode pembayaran</label>
            <select id="metode-bayar" value={metode} onChange={(e) => setMetode(e.target.value)}>
              {metodeValid.map((opsi) => <option key={opsi} value={opsi}>{opsi}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="catatan-kasir">Catatan (opsional)</label>
            <textarea id="catatan-kasir" maxLength={200} value={catatan}
              onChange={(e) => setCatatan(e.target.value)} />
          </div>

          <Tombol tipe="submit" kelas="w-full" nonaktif={sedangKirim || keranjang.length === 0}>
            {sedangKirim ? "Menyimpan..." : "Simpan transaksi"}
          </Tombol>
          {transaksiTerakhir && (
            <p className="text-center text-xs text-coklatMuda">
              Transaksi terakhir: #{transaksiTerakhir.id}, {formatRupiah(transaksiTerakhir.total)}
            </p>
          )}
        </form>
      </Kartu>
    </div>
  );
}
