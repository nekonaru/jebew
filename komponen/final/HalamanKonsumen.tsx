"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { besokWIB, formatRupiah, jamMenitWIB, tanggalHariIni } from "@/lib/format.ts";
import { statusPreorder, statusToko } from "@/lib/jadwal.ts";
import { ambilJson } from "@/komponen/api-klien.ts";
import { Badge, CentangSukses, Dialog, Langkah, Pesan, Tombol } from "./ui.tsx";

type Menu = {
  id: number; nama: string; harga: number; deskripsi: string; kategori: string; foto: string | null;
  porsi: number; tersedia: boolean; varian: { id: number; nama: string; harga_tambahan: number }[];
};
type Slot = { id: number; tanggal: string; jam: string; kuota: number; dipakai: number };
type InfoStatus = { buka: boolean; label: string; keterangan: string };
type PengaturanTampil = {
  nama_usaha?: string; tagline?: string; whatsapp_admin?: string;
  hari_buka?: string; jam_buka?: string; jam_tutup?: string; toko_aktif?: string;
  preorder_aktif?: string; preorder_jam_buka?: string; preorder_jam_tutup?: string;
  status_toko?: InfoStatus; status_preorder?: InfoStatus;
  alamat_usaha?: string; peta_usaha?: string; deskripsi_usaha?: string;
  email_usaha?: string; instagram_usaha?: string; logo_url?: string;
  banner_judul?: string; banner_isi?: string; banner_tautan?: string;
  minimum_preorder?: string; biaya_kirim?: string;
};
type DataAwal = { menu: Menu[]; pengaturan: PengaturanTampil };
type KeranjangItem = { menuId: number; varianId: number | null; jumlah: number };
type Hasil = { kode: string; kode_lacak: string; total: number; pesan: string; tautan: string | null };

const AKSESEN_KATEGORI: Record<string, { teks: string; garis: string; pinggir: string; ikon: string }> = {
  "Mie Jebew": {
    teks: "text-utama", garis: "bg-utama", pinggir: "border-t-utama",
    ikon: "M4 12h16a8 8 0 01-16 0zM8 9c0-2 2-3 4-3s4 1 4 3",
  },
  "Mie Chili Oil": {
    teks: "text-[#9A5608]", garis: "bg-aksen", pinggir: "border-t-aksen",
    ikon: "M12 3c1 4-3 5-3 9a3 3 0 006 0c0-2-1-3-1-5 3 2 4 4 4 6a6 6 0 11-12 0c0-4 4-6 6-10z",
  },
  "Wonton Ayam Chili Oil": {
    teks: "text-orange-700", garis: "bg-orange-500", pinggir: "border-t-orange-500",
    ikon: "M4 12a8 8 0 1116 0 8 8 0 01-16 0zM8 12h8M12 8v8",
  },
  "Extra Topping": {
    teks: "text-amber-700", garis: "bg-amber-500", pinggir: "border-t-amber-500",
    ikon: "M12 5v14M5 12h14",
  },
  Minuman: {
    teks: "text-info", garis: "bg-blue-500", pinggir: "border-t-blue-500",
    ikon: "M6 8h12l-1 12H7L6 8zM9 8V5h6v3",
  },
};

export default function HalamanKonsumen({ awal }: { awal: DataAwal }) {
  const [data, setData] = useState<DataAwal>(awal);
  const [slot, setSlot] = useState<Slot[]>([]);
  const [kategori, setKategori] = useState("Semua");
  const [cari, setCari] = useState("");
  const [keranjang, setKeranjang] = useState<KeranjangItem[]>([]);
  const [pilihVarian, setPilihVarian] = useState<Menu | null>(null);
  const [dialogKeranjang, setDialogKeranjang] = useState(false);
  const [dialogCheckout, setDialogCheckout] = useState(false);
  const [totalCheckout, setTotalCheckout] = useState(0);
  const [hasilDialog, setHasilDialog] = useState(false);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [nama, setNama] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [ingatKontak, setIngatKontak] = useState(false);
  const [favorit, setFavorit] = useState<number[]>([]);
  const [rekomendasi, setRekomendasi] = useState<{ id: number; nama: string; jumlah: number }[]>([]);
  const [slotId, setSlotId] = useState("");
  const [tanggalPilih, setTanggalPilih] = useState("");
  const [waktu, setWaktu] = useState("");
  const [catatan, setCatatan] = useState("");
  const [kodePromo, setKodePromo] = useState("");
  const [diskonPromo, setDiskonPromo] = useState(0);
  const [poinDipakai, setPoinDipakai] = useState("");
  const [saldoPoin, setSaldoPoin] = useState(0);
  const [tingkatPoin, setTingkatPoin] = useState("Reguler");
  const [infoDiskon, setInfoDiskon] = useState("");
  const [pesananBesar, setPesananBesar] = useState(false);
  const [setuju, setSetuju] = useState(false);
  const [tipePesanan, setTipePesanan] = useState<"ambil" | "dine_in" | "kirim">("ambil");
  const [meja, setMeja] = useState("");
  const [alamatKirim, setAlamatKirim] = useState("");
  const [kodeUndangan, setKodeUndangan] = useState("");
  const [metodeBayar, setMetodeBayar] = useState<"tunai" | "qris" | "transfer">("tunai");
  const [buktiBayar, setBuktiBayar] = useState("");
  const [ulasanPublik, setUlasanPublik] = useState<{
    rating: number; komentar: string; dibuat_pada: string;
  }[]>([]);
  const [kesalahan, setKesalahan] = useState<{
    nama?: string; whatsapp?: string; waktu?: string; setuju?: string;
    meja?: string; alamat?: string;
  }>({});
  const [pesan, setPesan] = useState("");
  const [jenis, setJenis] = useState<"galat">("galat");
  const [loading, setLoading] = useState(false);
  const [kodeLacak, setKodeLacak] = useState("");
  const [toast, setToast] = useState("");
  const [toastGalat, setToastGalat] = useState(false);
  const [toastUrut, setToastUrut] = useState(0);
  const [diperbarui, setDiperbarui] = useState("");

  const muat = useCallback(async () => {
    try {
      const [d, s] = await Promise.all([
        fetch("/api/dashboard").then(ambilJson<DataAwal>),
        fetch("/api/slot").then(ambilJson<{ slot: Slot[] }>),
      ]);
      setData(d); setSlot(s.slot ?? []);
      setDiperbarui(new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit",
      }).format(new Date()));
    } catch { /* biarkan data awal */ }
  }, []);
  useEffect(() => {
    void fetch("/api/slot").then(ambilJson<{ slot: Slot[] }>).then((s) => setSlot(s.slot ?? [])).catch(() => {});
    void fetch("/api/ulasan/publik")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { ulasan?: { rating: number; komentar: string; dibuat_pada: string }[] } | null) =>
        setUlasanPublik(d?.ulasan ?? []))
      .catch(() => setUlasanPublik([]));
    void muat();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void muat();
    }, 15000);
    return () => clearInterval(t);
  }, [muat]);

  useEffect(() => {
    const nilai = new URLSearchParams(window.location.search).get("undangan");
    if (nilai) setKodeUndangan(nilai.slice(0, 20));
  }, []);

  useEffect(() => {
    try {
      const teks = localStorage.getItem("jebew_kontak");
      if (teks) {
        const kontak = JSON.parse(teks) as { nama?: string; whatsapp?: string };
        if (typeof kontak.nama === "string") setNama(kontak.nama.slice(0, 100));
        if (typeof kontak.whatsapp === "string") setWhatsapp(kontak.whatsapp.slice(0, 30));
      }
    } catch { /* abaikan data rusak */ }
    try {
      const draf = localStorage.getItem("jebew_draf");
      if (draf) {
        const isi = JSON.parse(draf) as {
          nama?: string; whatsapp?: string; catatan?: string; kodePromo?: string;
          poinDipakai?: string; waktu?: string; pesananBesar?: boolean;
          tipePesanan?: string; meja?: string; alamatKirim?: string;
          metodeBayar?: string; buktiBayar?: string;
        };
        if (typeof isi.nama === "string") setNama(isi.nama.slice(0, 100));
        if (typeof isi.whatsapp === "string") setWhatsapp(isi.whatsapp.slice(0, 30));
        if (typeof isi.catatan === "string") setCatatan(isi.catatan.slice(0, 300));
        if (typeof isi.kodePromo === "string") setKodePromo(isi.kodePromo.slice(0, 20));
        if (typeof isi.poinDipakai === "string") setPoinDipakai(isi.poinDipakai.slice(0, 10));
        if (typeof isi.waktu === "string") setWaktu(isi.waktu.slice(0, 30));
        if (typeof isi.pesananBesar === "boolean") setPesananBesar(isi.pesananBesar);
        if (isi.tipePesanan === "ambil" || isi.tipePesanan === "dine_in" || isi.tipePesanan === "kirim") {
          setTipePesanan(isi.tipePesanan);
        }
        if (typeof isi.meja === "string") setMeja(isi.meja.slice(0, 20));
        if (typeof isi.alamatKirim === "string") setAlamatKirim(isi.alamatKirim.slice(0, 300));
        if (["tunai", "qris", "transfer"].includes(isi.metodeBayar ?? "")) {
          setMetodeBayar(isi.metodeBayar as "tunai" | "qris" | "transfer");
        }
        if (typeof isi.buktiBayar === "string") setBuktiBayar(isi.buktiBayar.slice(0, 300));
      }
    } catch { /* abaikan draf rusak */ }
  }, []);

  useEffect(() => {
    try {
      const teks = localStorage.getItem("jebew_favorit");
      const daftar = teks ? JSON.parse(teks) : [];
      if (Array.isArray(daftar)) setFavorit(daftar.filter((n) => Number.isInteger(n)));
    } catch { /* abaikan data rusak */ }
  }, []);

  useEffect(() => {
    const id = keranjang[0]?.menuId;
    if (!id) { setRekomendasi([]); return; }
    void fetch(`/api/rekomendasi?menu=${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: { rekomendasi?: { id: number; nama: string; jumlah: number }[] } | null) =>
        setRekomendasi(d?.rekomendasi ?? []))
      .catch(() => setRekomendasi([]));
  }, [keranjang]);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem("jebew_draf", JSON.stringify({
          nama, whatsapp, catatan, kodePromo, poinDipakai, waktu, pesananBesar,
          tipePesanan, meja, alamatKirim, metodeBayar, buktiBayar,
        }));
      } catch { /* penyimpanan lokal tidak tersedia */ }
    }, 300);
    return () => clearTimeout(t);
  }, [nama, whatsapp, catatan, kodePromo, poinDipakai, waktu, pesananBesar,
    tipePesanan, meja, alamatKirim, metodeBayar, buktiBayar]);

  useEffect(() => {
    if (whatsapp.trim().length < 8) { setSaldoPoin(0); return; }
    const t = setTimeout(() => {
      void fetch(`/api/poin?whatsapp=${encodeURIComponent(whatsapp.trim())}`)
        .then((r) => r.ok ? r.json() : null)
        .then((d: { poin?: number; tingkat?: string } | null) => {
          setSaldoPoin(Number(d?.poin ?? 0));
          setTingkatPoin(d?.tingkat ?? "Reguler");
        })
        .catch(() => setSaldoPoin(0));
    }, 300);
    return () => clearTimeout(t);
  }, [whatsapp]);

  useEffect(() => {
    if (data.menu.length === 0) return;
    try {
      const teks = localStorage.getItem("jebew_pesan_lagi");
      localStorage.removeItem("jebew_pesan_lagi");
      if (!teks) return;
      const simpan = JSON.parse(teks) as {
        items?: { menu_id: number; varian_id: number | null; jumlah: number }[];
        nama?: string;
      };
      const items = (Array.isArray(simpan.items) ? simpan.items : []).flatMap((i) => {
        const menu = data.menu.find((m) => m.id === i.menu_id);
        if (!menu) return [];
        const varianValid = i.varian_id === null || menu.varian.some((v) => v.id === i.varian_id);
        if (!varianValid) return [];
        const jumlah = Math.min(100, Math.max(1, Math.floor(Number(i.jumlah) || 1)));
        return [{ menuId: menu.id, varianId: i.varian_id, jumlah }];
      });
      if (items.length === 0) return;
      setKeranjang(items);
      setDialogKeranjang(true);
      setToast("Menu dari pesanan sebelumnya sudah dimasukkan ke keranjang.");
      setToastGalat(false);
      setToastUrut((n) => n + 1);
      if (typeof simpan.nama === "string") setNama(simpan.nama.slice(0, 100));
    } catch { /* abaikan data rusak */ }
  }, [data.menu]);

  const daftarKategori = useMemo(() => ["Favorit", ...new Set(data.menu.map((m) => m.kategori))], [data.menu]);
  const tersaring = useMemo(() => data.menu.filter((m) => {
    const cocokKat = kategori === "Semua" || (kategori === "Favorit" ? favorit.includes(m.id) : m.kategori === kategori);
    const cocokCari = cari.trim() === "" || m.nama.toLowerCase().includes(cari.toLowerCase());
    return cocokKat && cocokCari;
  }), [data.menu, kategori, cari, favorit]);

  const detailKeranjang = useMemo(() => keranjang.map((item) => {
    const menu = data.menu.find((m) => m.id === item.menuId);
    const varian = menu?.varian.find((v) => v.id === item.varianId);
    const harga = (menu?.harga ?? 0) + (varian?.harga_tambahan ?? 0);
    return { ...item, menu, varian, harga, subtotal: harga * item.jumlah };
  }), [keranjang, data.menu]);
  const totalKeranjang = detailKeranjang.reduce((n, i) => n + i.subtotal, 0);
  const jumlahItem = keranjang.reduce((n, i) => n + i.jumlah, 0);

  const slotTersedia = useMemo(() => slot.filter((s) => {
    if (s.dipakai >= s.kuota) return false;
    if (s.tanggal > tanggalHariIni()) return true;
    if (s.tanggal < tanggalHariIni()) return false;
    const sekarang = jamMenitWIB();
    const jamSlot = Number(s.jam.slice(0, 2)) * 60 + Number(s.jam.slice(3, 5));
    return jamSlot > sekarang.jam * 60 + sekarang.menit;
  }), [slot]);
  const slotPerTanggal = useMemo(() => {
    const peta = new Map<string, typeof slot>();
    for (const s of slotTersedia) {
      const daftar = peta.get(s.tanggal) ?? [];
      daftar.push(s); peta.set(s.tanggal, daftar);
    }
    return [...peta.entries()];
  }, [slotTersedia]);

  useEffect(() => {
    if (tanggalPilih) return;
    const pertama = slotPerTanggal[0]?.[0];
    if (pertama) setTanggalPilih(pertama);
  }, [slotPerTanggal, tanggalPilih]);

  function toggleFavorit(id: number) {
    setFavorit((d) => {
      const baru = d.includes(id) ? d.filter((n) => n !== id) : [...d, id];
      try { localStorage.setItem("jebew_favorit", JSON.stringify(baru)); } catch { /* abaikan */ }
      return baru;
    });
  }

  function tambah(menu: Menu, varianId: number | null = null) {
    if (!menu.tersedia) return;
    setKeranjang((lama) => {
      const ada = lama.find((i) => i.menuId === menu.id && i.varianId === varianId);
      if (ada) return lama.map((i) => i === ada ? { ...i, jumlah: Math.min(100, i.jumlah + 1) } : i);
      return [...lama, { menuId: menu.id, varianId, jumlah: 1 }];
    });
    setPilihVarian(null);
    setPesan("");
    setToastGalat(false);
    setToast(`${menu.nama} masuk keranjang`);
    setToastUrut((n) => n + 1);
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => { setToast(""); setToastGalat(false); }, 2600);
    return () => clearTimeout(t);
  }, [toast, toastUrut]);

  function klikMenu(menu: Menu) {
    if (!menu.tersedia) return;
    if (menu.varian.length > 0) setPilihVarian(menu);
    else tambah(menu);
  }

  function ubahJumlah(indeks: number, selisih: number) {
    setKeranjang((lama) => lama.map((item, i) => i === indeks
      ? { ...item, jumlah: Math.min(100, Math.max(1, item.jumlah + selisih)) } : item));
  }

  function bukaCheckout() {
    if (keranjang.length === 0) return;
    setPesan(""); setTotalCheckout(totalKeranjang); setInfoDiskon("");
    setDialogKeranjang(false); setDialogCheckout(true);
  }

  async function cekPromo() {
    if (!kodePromo.trim()) { setInfoDiskon("Masukkan kode promo terlebih dahulu."); return; }
    try {
      const respons = await fetch("/api/promo/validasi", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode: kodePromo, subtotal: totalCheckout }),
      });
      const hasil = await ambilJson<{ diskon: number }>(respons);
      setDiskonPromo(hasil.diskon);
      setInfoDiskon(`Promo dipakai. Diskon ${formatRupiah(hasil.diskon)}.`);
    } catch (err) {
      setDiskonPromo(0);
      setInfoDiskon(err instanceof Error ? err.message : "Promo tidak valid");
    }
  }

  const diskonPoin = Math.min(1000000, Math.floor(Number(poinDipakai || 0) / 100) * 5000);
  const ongkirDiperkirakan = tipePesanan === "kirim"
    ? Math.max(0, Number(data.pengaturan.biaya_kirim ?? 0)) : 0;
  const totalAkhir = Math.max(0, totalCheckout - diskonPromo - diskonPoin + ongkirDiperkirakan);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    const galatBaru: typeof kesalahan = {};
    if (!nama.trim()) galatBaru.nama = "Nama wajib diisi";
    const angkaWa = whatsapp.replace(/\D/g, "");
    if (angkaWa.length < 8 || angkaWa.length > 16) galatBaru.whatsapp = "Nomor WhatsApp harus 8 sampai 16 angka";
    if (!slotId && !waktu.trim()) galatBaru.waktu = "Pilih slot atau ketik waktu ambil";
    if (!setuju) galatBaru.setuju = "Periksa pesanan lalu centang konfirmasi";
    if (tipePesanan === "dine_in" && !meja.trim()) galatBaru.meja = "Nomor meja wajib diisi";
    if (tipePesanan === "kirim" && !alamatKirim.trim()) galatBaru.alamat = "Alamat kirim wajib diisi";
    setKesalahan(galatBaru);
    if (Object.keys(galatBaru).length > 0) {
      const urutan: [keyof typeof galatBaru, string][] = [
        ["nama", "p-nama"], ["whatsapp", "p-wa"], ["waktu", "p-waktu"],
        ["meja", "p-meja"], ["alamat", "p-alamat-kirim"], ["setuju", "p-setuju"],
      ];
      const pertama = urutan.find(([kunci]) => galatBaru[kunci]);
      if (pertama) document.getElementById(pertama[1])?.focus();
      return;
    }
    if (pesananBesar && jumlahItem < 10) {
      setJenis("galat");
      setPesan("Pesanan besar minimal 10 porsi. Tambahkan menu atau matikan pilihan pesanan besar.");
      return;
    }
    let slotDipilih = slot.find((s) => s.id === Number(slotId));
    if (slotId && !slotDipilih) {
      setSlotId("");
      setJenis("galat");
      setPesan("Slot yang dipilih sudah tidak tersedia. Pilih slot lain atau ketik waktu ambil manual.");
      return;
    }
    if (!slotId && !waktu.trim()) {
      setJenis("galat");
      setPesan("Waktu ambil wajib diisi. Pilih slot yang tersedia atau ketik waktu manual.");
      return;
    }
    setLoading(true); setPesan("");
    try {
      const respons = await fetch("/api/preorder", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: keranjang.map((i) => ({ menu_id: i.menuId, varian_id: i.varianId, jumlah: i.jumlah })),
          nama_pelanggan: nama, whatsapp,
          waktu_ambil: slotDipilih ? `${String(slotDipilih.tanggal).slice(0, 10)} ${slotDipilih.jam}` : waktu,
          slot_id: slotId ? Number(slotId) : null,
          catatan: pesananBesar ? `${catatan}${catatan ? " - " : ""}[PESANAN BESAR]` : catatan,
          kode_promo: kodePromo.trim() || undefined,
          poin_dipakai: Number(poinDipakai || 0) > 0 ? Number(poinDipakai) : undefined,
          tipe_pesanan: tipePesanan,
          meja: tipePesanan === "dine_in" ? meja : "",
          alamat_kirim: tipePesanan === "kirim" ? alamatKirim : "",
          kode_undangan: kodeUndangan || undefined,
          metode_bayar: metodeBayar,
          bukti_bayar: metodeBayar === "transfer" ? buktiBayar : "",
        }),
      });
      const dataHasil = await ambilJson<Hasil>(respons);
      setHasil(dataHasil); setKodeLacak(dataHasil.kode_lacak); setDialogCheckout(false); setHasilDialog(true);
      try {
        if (ingatKontak) localStorage.setItem("jebew_kontak", JSON.stringify({ nama, whatsapp }));
        else localStorage.removeItem("jebew_kontak");
      } catch { /* penyimpanan lokal tidak tersedia */ }
      setKeranjang([]); setNama(""); setWhatsapp(""); setSlotId(""); setWaktu(""); setCatatan("");
      setKodePromo(""); setDiskonPromo(0); setPoinDipakai(""); setInfoDiskon(""); setPesananBesar(false); setSetuju(false); setKesalahan({});
      try { localStorage.removeItem("jebew_draf"); } catch { /* abaikan */ }
      void muat();
    } catch (err) { setPesan(err instanceof Error ? err.message : "Gagal mengirim pre-order"); }
    finally { setLoading(false); }
  }

  const statusTokoSaatIni = data.pengaturan.status_toko ?? statusToko(data.pengaturan);
  const statusPreorderSaatIni = data.pengaturan.status_preorder ?? statusPreorder(data.pengaturan);
  const tokoBuka = statusTokoSaatIni.buka;
  const preorderBuka = statusPreorderSaatIni.buka;
  const tersediaCount = data.menu.filter((m) => m.tersedia).length;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-garis bg-permukaan/95 backdrop-blur">
        <div className="h-0.5 bg-gradient-to-r from-utama via-aksen to-utama" aria-hidden="true" />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/jebew-icon.svg" alt="" width={42} height={42} />
            <div className="h-8 w-px bg-garis" aria-hidden="true" />
            <div>
              <p className="font-judul text-[17px] font-bold uppercase leading-none tracking-[0.12em] text-tinta">Mie Jebew</p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-utama">Chili Oil & Wonton</p>
              <p className="mt-0.5 text-[10px] text-tinta-lemah">{data.pengaturan.nama_usaha ?? "Warung Kak Ikaa"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="group relative flex items-center">
              <button type="button" aria-describedby="info-jam-buka"
                className="flex items-center gap-1.5 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aksen">
                <span className={`h-2 w-2 rounded-full ${tokoBuka ? "bg-sukses" : "bg-bahaya"}`} aria-hidden="true" />
                <span className="text-xs font-semibold text-tinta">{statusTokoSaatIni.label}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 text-tinta-lemah">
                  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 11v5m0-8h.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <div id="info-jam-buka" role="tooltip"
                className="pointer-events-none absolute right-0 top-full z-30 mt-2 w-60 rounded-xl border border-garis bg-permukaan p-3 text-left shadow-angkat opacity-0 translate-y-1 transition-[opacity,transform] duration-[var(--gerak-cepat)] group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-utama">Jam toko</p>
                <p className="mt-1 text-sm font-semibold text-tinta">{data.pengaturan.hari_buka ?? "Senin - Minggu"}</p>
                <p className="text-sm text-tinta-lemah">{data.pengaturan.jam_buka ?? "10:00"} - {data.pengaturan.jam_tutup ?? "21:00"} WIB</p>
                <p className="mt-1 text-[11px] text-tinta-lemah">{statusTokoSaatIni.keterangan}</p>
              </div>
            </div>
            <div className="group relative flex items-center">
              <button type="button" aria-describedby="info-jam-preorder"
                className="flex items-center gap-1.5 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aksen">
                <span className={`h-2 w-2 rounded-full ${preorderBuka ? "bg-aksen" : "bg-bahaya"}`} aria-hidden="true" />
                <span className="text-[10px] font-semibold text-tinta sm:text-xs">{statusPreorderSaatIni.label}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 text-tinta-lemah">
                  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 11v5m0-8h.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <div id="info-jam-preorder" role="tooltip"
                className="pointer-events-none absolute right-0 top-full z-30 mt-2 w-60 rounded-xl border border-garis bg-permukaan p-3 text-left shadow-angkat opacity-0 translate-y-1 transition-[opacity,transform] duration-[var(--gerak-cepat)] group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-utama">Jam pre-order</p>
                <p className="mt-1 text-sm font-semibold text-tinta">
                  {data.pengaturan.preorder_jam_buka ?? "10:00"} - {data.pengaturan.preorder_jam_tutup ?? "21:00"} WIB
                </p>
                <p className="mt-1 text-[11px] text-tinta-lemah">{statusPreorderSaatIni.keterangan}</p>
              </div>
            </div>
            <button type="button" onClick={() => setDialogKeranjang(true)}
              aria-label={`Lihat keranjang, ${jumlahItem} item`}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-garis bg-white text-tinta transition-colors duration-[var(--gerak-cepat)] hover:border-utama/40">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path d="M3 4h2l2.4 11.2a2 2 0 002 1.6h7.7a2 2 0 002-1.6L21 8H6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="10" cy="20" r="1" fill="currentColor" /><circle cx="18" cy="20" r="1" fill="currentColor" /></svg>
              {jumlahItem > 0 && (
                <span key={jumlahItem} className="animasi-pop absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-utama px-1 text-[10px] font-bold text-white">{jumlahItem}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main id="konten-utama" className="mx-auto max-w-6xl px-4 pb-16">
        <section className="animasi-muncul relative my-7 overflow-hidden rounded-kartu border border-garis bg-permukaan px-6 py-9 sm:px-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/jebew-mark.svg" alt="" aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-20 hidden h-80 w-80 opacity-[0.06] md:block" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-aksen/5" aria-hidden="true" />
          <div className="relative grid gap-8 md:grid-cols-[1.5fr_0.7fr] md:items-end">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/jebew-hero.svg" alt="" aria-hidden="true"
                className="pointer-events-none absolute -right-6 top-1 hidden h-56 w-56 opacity-90 lg:block" />
              <div className="animasi-geser flex items-center gap-3">
                <span className="h-px w-10 bg-utama" aria-hidden="true" />
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-utama">Mie Jebew Chili Oil · Pre-order</p>
              </div>
              <h1 className="animasi-muncul mt-4 max-w-xl font-judul text-3xl font-semibold leading-[1.12] tracking-tight text-tinta sm:text-[2.7rem]" style={{ animationDelay: "60ms" }}>
                Mie hangat,<br /><span className="text-utama">pesan lebih mudah.</span>
              </h1>
              <p className="animasi-muncul mt-4 max-w-lg text-sm leading-relaxed text-tinta-lemah" style={{ animationDelay: "120ms" }}>
                Klik menu yang kamu mau, lalu isi data di akhir. Status menu mengikuti sisa bahan di dapur.
              </p>
              <div className="animasi-muncul mt-6" style={{ animationDelay: "180ms" }}>
                <Tombol onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })} kelas="gap-3 px-5">
                  Mulai pesan
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><path d="M5 12h14m-6-6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Tombol>
              </div>
            </div>
            <div className="relative hidden overflow-hidden rounded-kartu bg-utama p-6 text-white md:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/jebew-mark.svg" alt="" aria-hidden="true"
                className="pointer-events-none absolute -bottom-12 -right-10 h-44 w-44 opacity-20" />
              <div className="relative">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white">Hari ini</p>
                <p className="mt-2 font-judul text-4xl font-semibold leading-none">{tersediaCount}</p>
                <p className="mt-1 text-xs text-white">menu siap dipesan</p>
                <div className="mt-5 border-t border-white/25 pt-3">
                  <p className="inline-flex items-center gap-2 rounded-full bg-utama-gelap px-3 py-1.5 text-[11px] font-semibold text-white">
                    <span className={`h-1.5 w-1.5 rounded-full ${tokoBuka ? "bg-green-300" : "bg-red-200"}`} aria-hidden="true" />
                    {tokoBuka ? "Toko buka" : "Toko tutup"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {data.pengaturan.banner_judul && (
          <section className="reveal mb-9 rounded-kartu border border-aksen/30 bg-gradient-to-r from-aksen/15 to-utama/10 px-6 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-utama">Info dari warung</p>
            <h2 className="mt-2 font-judul text-xl font-semibold">{data.pengaturan.banner_judul}</h2>
            {data.pengaturan.banner_isi && <p className="mt-1 text-sm text-tinta-lemah">{data.pengaturan.banner_isi}</p>}
            {data.pengaturan.banner_tautan && (
              <a href={data.pengaturan.banner_tautan} target="_blank" rel="noopener noreferrer"
                className="mt-3 inline-flex text-sm font-semibold text-utama hover:underline">Lihat detail</a>
            )}
          </section>
        )}

        <section className="reveal mb-9 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-kartu border border-garis bg-permukaan px-5 py-4 shadow-kartu sm:px-7">
          <InfoRingkas judul="Jam toko" isi={`${data.pengaturan.jam_buka ?? "10:00"} - ${data.pengaturan.jam_tutup ?? "21:00"} WIB`}
            ikon="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
          <InfoRingkas judul="Jam pre-order" isi={`${data.pengaturan.preorder_jam_buka ?? "10:00"} - ${data.pengaturan.preorder_jam_tutup ?? "21:00"} WIB`}
            ikon="M6 2h9l5 5v15H6zM15 2v5h5M9 13h6M9 17h4" />
          <InfoRingkas judul="Lacak pesanan" isi="Pakai kode dari website" aksi="/lacak"
            ikon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          <InfoRingkas judul="Pesan cepat" isi="Klik menu, isi data di akhir"
            ikon="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          {diperbarui && (
            <p className="ml-auto text-[11px] text-tinta-lemah" role="status">Diperbarui pukul {diperbarui} WIB</p>
          )}
        </section>

        <section className="reveal mb-10">
          <div className="mb-4 flex items-center gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-utama">Cara pesan</p>
            <span className="h-px flex-1 bg-garis" aria-hidden="true" />
          </div>
          <ol className="grid gap-4 md:grid-cols-3">
            {[
              { angka: "01", judul: "Pilih menu", isi: "Klik tombol Tambah pada menu yang kamu mau. Bisa lebih dari satu." },
              { angka: "02", judul: "Isi data", isi: "Setelah selesai, isi nama, WhatsApp, dan waktu ambil di akhir." },
              { angka: "03", judul: "Kirim ke admin", isi: "Setelah kode lacak muncul, tekan Kirim ke WhatsApp agar admin menerima rincian pesanan." },
            ].map((langkah) => (
              <li key={langkah.angka} className="flex gap-4 rounded-kartu border border-garis bg-permukaan p-5 shadow-kartu">
                <span className="font-judul text-3xl font-semibold leading-none text-utama">{langkah.angka}</span>
                <div>
                  <p className="font-judul text-base font-semibold text-tinta">{langkah.judul}</p>
                  <p className="mt-1 text-xs leading-relaxed text-tinta-lemah">{langkah.isi}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="menu" className="scroll-mt-28">
          <div className="reveal mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-utama">Klik untuk menambah</p>
              <h2 id="judul-menu" className="mt-1 font-judul text-2xl font-semibold tracking-tight">Menu hari ini</h2>
            </div>
            <span className="rounded-full border border-garis bg-permukaan px-3 py-1.5 text-xs font-semibold text-tinta-lemah">{tersaring.length} menu</span>
          </div>

          <div className="sticky top-[86px] z-20 -mx-4 border-y border-garis bg-latar/95 px-4 py-3 shadow-[0_6px_16px_rgba(43,28,22,0.04)] backdrop-blur">
            <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filter kategori">
              {["Semua", ...daftarKategori].map((k) => (
                <button key={k} type="button" aria-pressed={kategori === k} onClick={() => setKategori(k)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-[background-color,color,box-shadow] duration-[var(--gerak-cepat)] ${
                    kategori === k ? "bg-utama text-white shadow-sm" : "border border-garis bg-white text-tinta-lemah hover:border-utama/40 hover:text-tinta"
                  }`}>
                    {k}
                    <span className={`text-[10px] font-bold ${kategori === k ? "text-white" : "text-tinta-lemah"}`}>
                      {data.menu.filter((x) => k === "Semua" || (k === "Favorit" ? favorit.includes(x.id) : x.kategori === k)).length}
                    </span>
                  </button>
              ))}
            </div>
            <div className="relative">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-lemah">
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <label htmlFor="cari" className="visually-hidden">Cari menu</label>
              <input id="cari" type="search" placeholder="Cari nama menu..." value={cari} onChange={(e) => setCari(e.target.value)} className="min-h-[44px] pl-10 text-sm" />
            </div>
          </div>

          <div className="daftar-panjang mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tersaring.map((m, indeks) => (
              <article key={m.id} className={`animasi-muncul group flex flex-col overflow-hidden rounded-kartu border border-t-2 border-garis bg-permukaan shadow-kartu transition-[transform,box-shadow] duration-[var(--gerak-standar)] ease-[var(--ease-halus)] hover:-translate-y-1 hover:shadow-angkat ${AKSESEN_KATEGORI[m.kategori]?.pinggir ?? "border-t-tinta-lemah"}`}
                style={{ animationDelay: `${Math.min(indeks, 12) * 35}ms` }}>
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-latar ${AKSESEN_KATEGORI[m.kategori]?.teks ?? "text-tinta-lemah"}`} aria-hidden="true">
                      <svg viewBox="0 0 24 24" className="h-4 w-4"><path d={AKSESEN_KATEGORI[m.kategori]?.ikon ?? "M4 6h16"} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                    <span className={`h-0.5 w-8 rounded-full transition-all duration-[var(--gerak-standar)] group-hover:w-14 ${AKSESEN_KATEGORI[m.kategori]?.garis ?? "bg-tinta-lemah"}`} aria-hidden="true" />
                  </div>
                  {m.foto && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.foto} alt="" loading="lazy" referrerPolicy="no-referrer"
                      className="mb-3 h-32 w-full rounded-xl object-cover" />
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${AKSESEN_KATEGORI[m.kategori]?.teks ?? "text-tinta-lemah"}`}>{m.kategori}</p>
                    <span className={`mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      !preorderBuka ? "bg-red-50 text-bahaya" : m.tersedia ? "bg-sukses-terang text-sukses" : "bg-stone-100 text-stone-600"
                    }`}>
                      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${!preorderBuka ? "bg-bahaya" : m.tersedia ? "bg-sukses" : "bg-stone-400"}`} />
                      {!preorderBuka ? statusPreorderSaatIni.label : m.tersedia ? "Tersedia" : "Habis"}
                    </span>
                    <button type="button" onClick={() => toggleFavorit(m.id)}
                      aria-label={favorit.includes(m.id) ? `Hapus ${m.nama} dari favorit` : `Simpan ${m.nama} ke favorit`}
                      aria-pressed={favorit.includes(m.id)}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-garis transition ${favorit.includes(m.id) ? "bg-utama text-white" : "bg-white text-tinta-lemah hover:text-utama"}`}>
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                        <path d="M12 20s-7-4.6-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.4-7 10-7 10z"
                          fill={favorit.includes(m.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <h3 className="font-judul text-[18px] font-semibold leading-snug text-tinta">{m.nama}</h3>
                    <span className="shrink-0 font-judul text-lg font-semibold tracking-tight text-utama">{formatRupiah(m.harga)}</span>
                  </div>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-tinta-lemah">{m.deskripsi}</p>
                  {m.varian.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5" aria-label={`Varian ${m.nama}`}>
                      {m.varian.map((v) => (
                        <span key={v.id} className="rounded-md border border-garis bg-latar px-2 py-1 text-[10px] font-semibold text-tinta-lemah">{v.nama}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-t border-garis bg-latar/60 px-4 py-3">
                  <button type="button" onClick={() => klikMenu(m)} disabled={!m.tersedia || !preorderBuka}
                    aria-label={`${!preorderBuka ? statusPreorderSaatIni.label : m.tersedia ? "Tambah ke pesanan" : "Sedang habis"}: ${m.nama}`}
                    className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-utama text-sm font-semibold text-white transition-[background-color,transform] duration-[var(--gerak-cepat)] hover:bg-utama-gelap active:scale-[0.98] disabled:bg-stone-300">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    {!preorderBuka ? statusPreorderSaatIni.label : m.tersedia ? "Tambah ke pesanan" : "Sedang habis"}
                  </button>
                </div>
              </article>
            ))}
          </div>
          {tersaring.length === 0 && (
            <div className="rounded-kartu border border-dashed border-garis bg-permukaan py-14 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/jebew-mark.svg" alt="" width={48} height={48} className="mx-auto opacity-40" />
              <p className="mt-4 font-judul text-lg font-semibold">Menu tidak ditemukan</p>
              <p className="mt-1 text-sm text-tinta-lemah">Coba kata kunci atau kategori lain.</p>
              <Tombol onClick={() => { setKategori("Semua"); setCari(""); }} jenis="sekunder" kelas="mt-5">Tampilkan semua menu</Tombol>
            </div>
          )}
        </section>
      </main>

      {toast && (
        <div role={toastGalat ? "alert" : "status"} aria-live={toastGalat ? "assertive" : "polite"}
          className={`animasi-muncul fixed left-1/2 top-4 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-white shadow-angkat ${toastGalat ? "bg-bahaya" : "bg-tinta"}`}>
          {toastGalat ? (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 text-white"><path d="M12 8v5m0 3h.01M10.3 3.9L2.6 17.2A2 2 0 004.3 20h15.4a2 2 0 001.7-2.8L13.7 3.9a2 2 0 00-3.4 0z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 text-aksen-terang"><path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          )}
          {toast}
        </div>
      )}

      {jumlahItem > 0 && (
        <div className="animasi-muncul fixed inset-x-0 bottom-0 z-30 border-t border-garis bg-permukaan/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <button type="button" onClick={() => setDialogKeranjang(true)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-garis px-3 py-2 text-left">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-utama text-xs font-bold text-white">{jumlahItem}</span>
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-tinta-lemah">Keranjang kamu</span>
                <span className="block truncate text-sm font-semibold text-tinta">{formatRupiah(totalKeranjang)}</span>
              </span>
            </button>
            <Tombol onClick={bukaCheckout} kelas="shrink-0 px-5">Isi data pesanan</Tombol>
          </div>
        </div>
      )}

      <Dialog terbuka={Boolean(pilihVarian)} judul={`Pilih varian ${pilihVarian?.nama ?? ""}`} padaTutup={() => setPilihVarian(null)}>
        {pilihVarian && (
          <div className="space-y-2">
            <p className="text-sm text-tinta-lemah">Pilih satu varian untuk ditambahkan ke keranjang.</p>
            {pilihVarian.varian.map((v) => (
              <button key={v.id} type="button" onClick={() => tambah(pilihVarian, v.id)}
                className="flex w-full items-center justify-between rounded-xl border border-garis px-4 py-3 text-left transition-colors duration-[var(--gerak-cepat)] hover:border-utama hover:bg-latar">
                <span className="text-sm font-semibold">{v.nama}</span>
                <span className="text-sm font-semibold text-utama">{v.harga_tambahan ? `+${formatRupiah(v.harga_tambahan)}` : "Gratis"}</span>
              </button>
            ))}
          </div>
        )}
      </Dialog>

      <Dialog terbuka={dialogKeranjang} judul="Keranjang pesanan" padaTutup={() => setDialogKeranjang(false)}>
        {detailKeranjang.length === 0 ? (
          <p className="py-8 text-center text-sm text-tinta-lemah">Keranjang masih kosong. Klik menu untuk menambah.</p>
        ) : (
          <div className="space-y-4">
            <ul className="space-y-3">
              {detailKeranjang.map((item, i) => (
                <li key={`${item.menuId}-${item.varianId}`} className="rounded-xl border border-garis p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{item.menu?.nama}</p>
                      {item.varian && <p className="text-xs text-tinta-lemah">{item.varian.nama}</p>}
                    </div>
                    <button type="button" aria-label={`Hapus ${item.menu?.nama ?? "menu"} dari pesanan`}
                      onClick={() => setKeranjang((l) => l.filter((_, j) => j !== i))}
                      className="text-xs font-semibold text-bahaya hover:underline">Hapus</button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button type="button" aria-label={`Kurangi ${item.menu?.nama ?? "menu"}`} onClick={() => ubahJumlah(i, -1)} className="h-11 w-11 rounded-lg border border-garis">-</button>
                      <span className="w-6 text-center text-sm font-semibold">{item.jumlah}</span>
                      <button type="button" aria-label={`Tambah ${item.menu?.nama ?? "menu"}`} onClick={() => ubahJumlah(i, 1)} className="h-11 w-11 rounded-lg border border-garis">+</button>
                    </div>
                    <span className="text-sm font-semibold">{formatRupiah(item.subtotal)}</span>
                  </div>
                </li>
              ))}
            </ul>
            {rekomendasi.length > 0 && (
              <div className="rounded-xl bg-latar p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-utama">Sering dipesan bersamaan</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {rekomendasi.map((r) => (
                    <button key={r.id} type="button"
                      onClick={() => { const menu = data.menu.find((m) => m.id === r.id); if (menu) tambah(menu); }}
                      className="rounded-full border border-garis bg-white px-3 py-1.5 text-xs font-semibold text-tinta hover:border-utama">
                      + {r.nama}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-garis pt-3">
              <span className="font-semibold">Total</span>
              <span className="font-judul text-xl font-semibold text-utama">{formatRupiah(totalKeranjang)}</span>
            </div>
            <Tombol onClick={bukaCheckout} kelas="w-full">Isi data pesanan</Tombol>
          </div>
        )}
      </Dialog>

      <Dialog terbuka={dialogCheckout} judul="Langkah 2 dari 3 - Isi data pemesanan" padaTutup={() => setDialogCheckout(false)} lebar="42rem">
        <form onSubmit={kirim} noValidate className="space-y-5">
          <Langkah langkah={2} aktif={2} judul={["Pilih menu", "Isi data", "Kirim WA"]} />
          <div>
            <h3 className="font-judul text-lg font-semibold text-tinta">Data diri dan waktu ambil</h3>
            <p className="mt-1 text-xs leading-relaxed text-tinta-lemah">
              Isi nama dan WhatsApp, lalu pilih slot atau ketik waktu ambil. Setelah pesanan dibuat, tekan Kirim ke WhatsApp agar admin menerima pesanmu.
            </p>
          </div>
          <div className="rounded-xl bg-latar px-4 py-3 text-sm lg:sticky lg:top-0 lg:z-10 lg:shadow-sm">
            <div className="flex justify-between"><span>{jumlahItem} item pesanan</span><span className="font-semibold">{formatRupiah(totalCheckout)}</span></div>
            {(diskonPromo > 0 || diskonPoin > 0) && (
              <div className="flex justify-between text-sukses"><span>Diskon</span><span>- {formatRupiah(diskonPromo + diskonPoin)}</span></div>
            )}
            {ongkirDiperkirakan > 0 && (
              <div className="flex justify-between"><span>Estimasi ongkir</span><span>{formatRupiah(ongkirDiperkirakan)}</span></div>
            )}
            <div className="flex justify-between border-t border-garis pt-2 font-bold"><span>Total bayar</span><span>{formatRupiah(totalAkhir)}</span></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="p-nama">Nama kamu</label>
              <input id="p-nama" required value={nama} aria-invalid={Boolean(kesalahan.nama)}
                aria-describedby={kesalahan.nama ? "p-nama-galat" : undefined}
                onChange={(e) => setNama(e.target.value)} />
              {kesalahan.nama && <p id="p-nama-galat" className="mt-1 text-xs text-bahaya">{kesalahan.nama}</p>}
            </div>
            <div>
              <label htmlFor="p-wa">Nomor WhatsApp</label>
              <input id="p-wa" inputMode="tel" required value={whatsapp} aria-invalid={Boolean(kesalahan.whatsapp)}
                aria-describedby={kesalahan.whatsapp ? "p-wa-galat" : undefined}
                onChange={(e) => setWhatsapp(e.target.value)} placeholder="08..." />
              {kesalahan.whatsapp && <p id="p-wa-galat" className="mt-1 text-xs text-bahaya">{kesalahan.whatsapp}</p>}
            </div>
          </div>
          <label className="flex items-start gap-2 text-xs text-tinta-lemah">
            <input type="checkbox" className="mt-0.5" checked={ingatKontak}
              onChange={(e) => setIngatKontak(e.target.checked)} />
            Ingat nama dan WhatsApp di perangkat ini untuk pesanan berikutnya.
          </label>
          <fieldset className="rounded-xl border border-garis p-4">
            <legend className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-utama">Jenis pesanan</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {([
                ["ambil", "Ambil di warung"],
                ["dine_in", "Makan di tempat"],
                ["kirim", "Dikirim"],
              ] as const).map(([nilai, label]) => (
                <label key={nilai} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold ${
                  tipePesanan === nilai ? "border-utama bg-utama/5 text-utama" : "border-garis text-tinta-lemah"
                }`}>
                  <input type="radio" name="tipe-pesanan" value={nilai} checked={tipePesanan === nilai}
                    onChange={() => setTipePesanan(nilai)} />
                  {label}
                </label>
              ))}
            </div>
            {tipePesanan === "dine_in" && (
              <div className="mt-3">
                <label htmlFor="p-meja">Nomor meja</label>
                <input id="p-meja" maxLength={20} value={meja} aria-invalid={Boolean(kesalahan.meja)}
                  onChange={(e) => setMeja(e.target.value)} placeholder="Contoh: A3" />
                {kesalahan.meja && <p className="mt-1 text-xs text-bahaya">{kesalahan.meja}</p>}
              </div>
            )}
            {tipePesanan === "kirim" && (
              <div className="mt-3">
                <label htmlFor="p-alamat-kirim">Alamat kirim</label>
                <textarea id="p-alamat-kirim" maxLength={300} rows={2} value={alamatKirim}
                  aria-invalid={Boolean(kesalahan.alamat)} onChange={(e) => setAlamatKirim(e.target.value)}
                  placeholder="Nama jalan, nomor rumah, patokan" />
                {kesalahan.alamat && <p className="mt-1 text-xs text-bahaya">{kesalahan.alamat}</p>}
                <p className="mt-1 text-[11px] text-tinta-lemah">Admin akan menghubungi untuk konfirmasi biaya kirim.</p>
              </div>
            )}
          </fieldset>
          <fieldset className="rounded-xl border border-garis p-4">
            <legend className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-utama">Metode bayar</legend>
            <div className="flex flex-wrap gap-2">
              {(["tunai", "qris", "transfer"] as const).map((nilai) => (
                <label key={nilai} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                  metodeBayar === nilai ? "border-utama bg-utama/5 text-utama" : "border-garis text-tinta-lemah"
                }`}>
                  <input type="radio" name="metode-bayar" value={nilai} className="mr-1.5"
                    checked={metodeBayar === nilai} onChange={() => setMetodeBayar(nilai)} />
                  {nilai === "tunai" ? "Tunai" : nilai === "qris" ? "QRIS" : "Transfer"}
                </label>
              ))}
            </div>
            {metodeBayar === "transfer" && (
              <div className="mt-3">
                <label htmlFor="p-bukti">Nomor referensi transfer</label>
                <input id="p-bukti" maxLength={300} value={buktiBayar}
                  onChange={(e) => setBuktiBayar(e.target.value)}
                  placeholder="Contoh: BNI 1234567890 atas nama Kak Ika" />
              </div>
            )}
          </fieldset>
          <label className="flex items-start gap-2 rounded-xl border border-garis p-3 text-xs text-tinta-lemah">
            <input type="checkbox" className="mt-0.5" checked={pesananBesar}
              onChange={(e) => setPesananBesar(e.target.checked)} />
            Pesanan besar, minimal 10 porsi. Admin akan menghubungi untuk konfirmasi jumlah dan waktu ambil.
          </label>
          <fieldset className="rounded-xl border border-garis p-4">
            <legend className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-utama">Promo dan poin, opsional</legend>
            <div className="flex gap-2">
              <input id="p-promo" value={kodePromo} onChange={(e) => setKodePromo(e.target.value)} placeholder="Kode promo" aria-label="Kode promo" />
              <Tombol jenis="sekunder" kelas="min-h-[46px] px-3 text-xs" onClick={() => void cekPromo()}>Cek</Tombol>
            </div>
            <div className="mt-3">
              <label htmlFor="p-poin">Pakai poin, saldo {saldoPoin} poin, tingkat {tingkatPoin}</label>
              <input id="p-poin" type="number" min={0} step={100} max={saldoPoin} value={poinDipakai}
                onChange={(e) => setPoinDipakai(e.target.value)} placeholder="Kelipatan 100 poin" />
              <p className="mt-1 text-[11px] text-tinta-lemah">100 poin menjadi diskon 5.000 rupiah.</p>
            </div>
            {infoDiskon && <p className="mt-2 text-xs font-semibold text-utama">{infoDiskon}</p>}
          </fieldset>
          <div className="rounded-xl border border-garis bg-latar/60 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-utama">Wajib diisi</p>
            <div className="mt-3">
              <p id="p-tanggal-label" className="mb-2 text-xs font-semibold uppercase tracking-wide text-tinta-lemah">Pilih tanggal ambil</p>
              <div role="group" aria-labelledby="p-tanggal-label" className="flex gap-2 overflow-x-auto pb-2">
                {slotPerTanggal.map(([tanggal]) => (
                  <button key={tanggal} type="button" aria-pressed={tanggalPilih === tanggal}
                    onClick={() => { setTanggalPilih(tanggal); setSlotId(""); }}
                    className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      tanggalPilih === tanggal ? "border-utama bg-utama text-white" : "border-garis bg-white text-tinta-lemah hover:border-utama/40"
                    }`}>
                    {tanggal}
                  </button>
                ))}
                {slotPerTanggal.length === 0 && <p className="text-xs text-tinta-lemah">Belum ada slot tersedia.</p>}
              </div>
              <div role="group" aria-label="Pilih jam ambil" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(slotPerTanggal.find(([t]) => t === tanggalPilih)?.[1] ?? []).map((s) => (
                  <button key={s.id} type="button" aria-pressed={slotId === String(s.id)}
                    onClick={() => setSlotId(String(s.id))}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                      slotId === String(s.id) ? "border-sukses bg-sukses-terang text-sukses" : "border-garis bg-white text-tinta hover:border-utama/40"
                    }`}>
                    {s.jam} WIB
                    <span className="mt-0.5 block text-[10px] font-normal text-tinta-lemah">sisa {s.kuota - s.dipakai}</span>
                  </button>
                ))}
              </div>
              <p id="p-slot-bantuan" className="mt-2 text-[11px] leading-relaxed text-tinta-lemah">
                Pilih salah satu jam. Bila tidak ada slot, isi waktu manual di bawah.
              </p>
            </div>
            {!slotId && (
              <div className="mt-3">
                <label htmlFor="p-waktu">Atau ketik waktu ambil sendiri</label>
                <input id="p-waktu" aria-describedby={kesalahan.waktu ? "p-waktu-galat" : "p-waktu-bantuan"}
                  aria-invalid={Boolean(kesalahan.waktu)} value={waktu} onChange={(e) => setWaktu(e.target.value)}
                  placeholder={`${besokWIB()} 18:00`} />
                {kesalahan.waktu && <p id="p-waktu-galat" className="mt-1 text-xs text-bahaya">{kesalahan.waktu}</p>}
                <p id="p-waktu-bantuan" className="mt-1.5 text-[11px] text-tinta-lemah">
                  Format: tanggal jam, contoh 2026-11-26 18:00. Semua waktu memakai WIB.
                </p>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="p-catatan">Catatan (opsional)</label>
            <textarea id="p-catatan" maxLength={300} rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Misalnya: level pedas 2, tanpa daun bawang" />
          </div>
          <details className="rounded-xl border border-garis bg-latar/60 px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-utama">Periksa pesanan sebelum kirim</summary>
            <dl className="mt-3 space-y-1 text-xs text-tinta-lemah">
              <div className="flex justify-between gap-3"><dt>Nama</dt><dd className="font-semibold text-tinta">{nama || "-"}</dd></div>
              <div className="flex justify-between gap-3"><dt>WhatsApp</dt><dd className="font-semibold text-tinta">{whatsapp || "-"}</dd></div>
              <div className="flex justify-between gap-3"><dt>Waktu ambil</dt><dd className="font-semibold text-tinta">{slot.find((s) => s.id === Number(slotId)) ? `${slot.find((s) => s.id === Number(slotId))?.tanggal} ${slot.find((s) => s.id === Number(slotId))?.jam} WIB` : waktu || "-"}</dd></div>
              <div className="flex justify-between gap-3"><dt>Jenis</dt><dd className="font-semibold text-tinta">{tipePesanan === "dine_in" ? `Makan di tempat${meja ? `, meja ${meja}` : ""}` : tipePesanan === "kirim" ? "Dikirim" : "Ambil di warung"}</dd></div>
              <div className="flex justify-between gap-3"><dt>Jumlah</dt><dd className="font-semibold text-tinta">{jumlahItem} porsi</dd></div>
              {kodePromo && <div className="flex justify-between gap-3"><dt>Promo</dt><dd className="font-semibold text-tinta">{kodePromo}</dd></div>}
              {diskonPoin > 0 && <div className="flex justify-between gap-3"><dt>Poin</dt><dd className="font-semibold text-tinta">{poinDipakai} poin</dd></div>}
              {kodeUndangan && <div className="flex justify-between gap-3"><dt>Undangan</dt><dd className="font-semibold text-tinta">{kodeUndangan}</dd></div>}
              <div className="flex justify-between gap-3"><dt>Bayar</dt><dd className="font-semibold text-tinta">{metodeBayar === "tunai" ? "Tunai" : metodeBayar === "qris" ? "QRIS" : `Transfer${buktiBayar ? `, ${buktiBayar}` : ""}`}</dd></div>
              <div className="flex justify-between gap-3 border-t border-garis pt-2 text-sm"><dt className="font-semibold text-tinta">Total bayar</dt><dd className="font-bold text-utama">{formatRupiah(totalAkhir)}</dd></div>
            </dl>
          </details>
          <div>
            <label className="flex items-start gap-2 text-xs text-tinta-lemah">
              <input id="p-setuju" type="checkbox" className="mt-0.5" checked={setuju}
                aria-invalid={Boolean(kesalahan.setuju)}
                aria-describedby={kesalahan.setuju ? "p-setuju-galat" : undefined}
                onChange={(e) => setSetuju(e.target.checked)} />
              Saya sudah memeriksa menu, waktu ambil, dan total pembayaran di atas.
            </label>
            {kesalahan.setuju && <p id="p-setuju-galat" className="mt-1 text-xs text-bahaya">{kesalahan.setuju}</p>}
          </div>
          <Pesan teks={pesan} jenis={jenis} />
          <Tombol tipe="submit" nonaktif={loading} kelas="w-full">{loading ? "Mengirim..." : `Kirim pre-order - ${formatRupiah(totalAkhir)}`}</Tombol>
        </form>
      </Dialog>

      <Dialog terbuka={hasilDialog} judul="Pesanan tercatat" padaTutup={() => setHasilDialog(false)}>
        {hasil && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CentangSukses />
              <Pesan teks={`Pesanan ${hasil.kode} tersimpan. Simpan kode lacak ${hasil.kode_lacak}, lalu tekan Kirim ke WhatsApp agar admin menerima pesananmu.`} jenis="sukses" />
            </div>
            <button type="button"
              onClick={() => {
                if (!navigator.clipboard?.writeText) {
                  setToastGalat(true); setToast("Browser tidak mendukung penyalinan. Catat kode secara manual.");
                  setToastUrut((n) => n + 1);
                  return;
                }
                void navigator.clipboard.writeText(hasil.kode_lacak)
                  .then(() => {
                    setToastGalat(false); setToast(`Kode lacak ${hasil.kode_lacak} disalin.`);
                    setToastUrut((n) => n + 1);
                  })
                  .catch(() => {
                    setToastGalat(true); setToast("Kode lacak tidak berhasil disalin.");
                    setToastUrut((n) => n + 1);
                  });
              }}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-garis px-4 text-sm font-semibold text-utama transition hover:bg-latar">
              Salin kode lacak {hasil.kode_lacak}
            </button>
            <pre className="overflow-x-auto rounded-xl bg-latar p-4 text-xs leading-relaxed">{hasil.pesan}</pre>
            {hasil.tautan ? (
              <a href={hasil.tautan} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-sukses px-4 text-sm font-semibold text-white hover:brightness-95">Kirim ke WhatsApp</a>
            ) : (
              <p className="rounded-xl bg-latar px-4 py-3 text-xs text-tinta-lemah">
                Salin pesan di atas dan kirim manual. Nomor WhatsApp admin belum tersedia.
              </p>
            )}
            <Link href={`/lacak?kode=${encodeURIComponent(hasil.kode_lacak)}`}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-garis px-4 text-sm font-semibold text-tinta transition hover:bg-latar">
              Cek status pesanan
            </Link>
          </div>
        )}
      </Dialog>

      {(data.pengaturan.deskripsi_usaha || data.pengaturan.alamat_usaha) && (
        <section className="reveal border-t border-garis">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-utama">Tentang kami</p>
            <h2 className="mt-3 font-judul text-2xl font-semibold">{data.pengaturan.nama_usaha ?? "Warung Kak Ikaa"}</h2>
            {data.pengaturan.deskripsi_usaha && (
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-tinta-lemah">{data.pengaturan.deskripsi_usaha}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-tinta-lemah">
              {data.pengaturan.alamat_usaha && <span>Alamat: {data.pengaturan.alamat_usaha}</span>}
              {data.pengaturan.email_usaha && <span>Email: {data.pengaturan.email_usaha}</span>}
              {data.pengaturan.instagram_usaha && <span>Instagram: {data.pengaturan.instagram_usaha}</span>}
              {data.pengaturan.peta_usaha && (
                <a href={data.pengaturan.peta_usaha} target="_blank" rel="noopener noreferrer"
                  className="font-semibold text-utama hover:underline">Lihat lokasi di peta</a>
              )}
            </div>
          </div>
        </section>
      )}

      {ulasanPublik.length > 0 && (
        <section className="reveal border-t border-garis">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-utama">Kata pelanggan</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {ulasanPublik.slice(0, 6).map((u, i) => (
                <figure key={i} className="rounded-kartu border border-garis bg-permukaan p-4">
                  <div aria-label={`${u.rating} dari 5 bintang`} className="text-sm text-aksen">
                    {"★".repeat(u.rating)}{"☆".repeat(5 - u.rating)}
                  </div>
                  <blockquote className="mt-2 text-sm text-tinta">{u.komentar || "Pelanggan memberikan rating tanpa komentar."}</blockquote>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="reveal border-t border-garis">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-utama">Tanya jawab</p>
            <span className="h-px flex-1 bg-garis" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-judul text-2xl font-semibold sm:text-3xl">Yang sering ditanyakan</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              {
                t: "Bagaimana cara memesan?",
                j: "Pilih menu, tekan Tambah ke pesanan, lalu tekan Isi data pesanan. Isi nama, WhatsApp, dan waktu ambil, lalu kirim ke WhatsApp admin.",
              },
              {
                t: "Kapan pesanan bisa diambil?",
                j: `Warung buka ${data.pengaturan.hari_buka ?? "Senin - Minggu"} pukul ${data.pengaturan.jam_buka ?? "10:00"} sampai ${data.pengaturan.jam_tutup ?? "21:00"} WIB. Waktu di luar jam tersebut perlu konfirmasi admin.`,
              },
              {
                t: "Kapan pre-order dibuka?",
                j: `Pre-order dibuka pukul ${data.pengaturan.preorder_jam_buka ?? "10:00"} sampai ${data.pengaturan.preorder_jam_tutup ?? "21:00"} WIB bila pemilik menyatakannya siap. Di luar jam itu, atau saat pre-order ditutup, tombol pesan dinonaktifkan. Jam toko bisa berbeda dari jam pre-order.`,
              },
              {
                t: "Boleh pesan lebih dari satu menu?",
                j: "Boleh. Setiap menu yang ditambahkan ke keranjang bisa diubah jumlahnya sebelum pesanan dikirim.",
              },
              {
                t: "Bagaimana cara cek status pesanan?",
                j: "Simpan kode lacak yang muncul setelah pesan, lalu masukkan pada kolom Cek status pesanan di bawah.",
              },
            ].map((tj) => (
              <details key={tj.t} className="group rounded-kartu border border-garis bg-permukaan p-4 shadow-kartu">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-tinta marker:hidden">
                  {tj.t}
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0 text-utama transition-transform duration-[var(--gerak-cepat)] group-open:rotate-180">
                    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-tinta-lemah">{tj.j}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-garis bg-permukaan">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-utama">Sudah pesan?</p>
              <p className="mt-1 font-judul text-lg font-semibold">Cek status pesananmu</p>
            </div>
            <div className="flex w-full flex-wrap items-end gap-3 sm:w-auto">
              <div className="min-w-[220px] flex-1">
                <label htmlFor="lacak">Kode lacak</label>
                <input id="lacak" value={kodeLacak} onChange={(e) => setKodeLacak(e.target.value)} placeholder="Contoh: A1B2C3D4" />
              </div>
              <Link href={kodeLacak.trim() ? `/lacak?kode=${encodeURIComponent(kodeLacak.trim())}` : "#"}
                aria-disabled={!kodeLacak.trim()}
                onClick={(e) => { if (!kodeLacak.trim()) e.preventDefault(); }}
                className={`inline-flex min-h-[46px] items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition-colors duration-[var(--gerak-cepat)] ${kodeLacak.trim() ? "bg-tinta hover:bg-utama" : "cursor-not-allowed bg-stone-400"}`}>
                Cek status
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4"><path d="M5 12h14m-6-6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-garis pt-5">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/jebew-icon.svg" alt="" width={30} height={30} />
              <div>
                <p className="font-judul text-sm font-bold uppercase tracking-[0.16em] text-tinta">Mie Jebew</p>
                <p className="text-[10px] text-tinta-lemah">{data.pengaturan.nama_usaha ?? "Warung Kak Ikaa"}</p>
              </div>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-tinta-lemah">Chili Oil & Wonton Ayam</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRingkas({
  judul, isi, ikon, aksi,
}: { judul: string; isi: string; ikon: string; aksi?: string }) {
  const isiTeks = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-latar text-utama">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
          <path d={ikon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-tinta-lemah">{judul}</span>
        <span className="mt-0.5 block truncate text-sm font-semibold text-tinta">{isi}</span>
      </span>
      {aksi && (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="ml-auto h-4 w-4 shrink-0 text-tinta-lemah">
          <path d="M5 12h14m-6-6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </>
  );
  const kelas = "flex flex-1 items-center gap-3 rounded-lg px-2 py-1 transition-colors duration-[var(--gerak-cepat)]";
  return aksi
    ? <Link href={aksi} className={`${kelas} hover:text-utama`}>{isiTeks}</Link>
    : <div className={kelas}>{isiTeks}</div>;
}
