"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Peran } from "@/lib/auth.ts";
import { Dialog } from "./ui.tsx";

const KonteksPeran = createContext<Peran>("kasir");

/** Peran pengguna yang aktif, dipakai halaman untuk menyembunyikan aksi terlarang. */
export function usePeran(): Peran {
  return useContext(KonteksPeran);
}

type ItemNav = { href: string; label: string; ikon: string; grup: string };

const NAV: ItemNav[] = [
  { href: "/admin", label: "Ringkasan", ikon: "M3 12l9-9 9 9M5 10v10h14V10", grup: "Utama" },
  { href: "/admin/kasir", label: "Kasir", ikon: "M3 5h18v14H3zM7 9h10M7 13h6", grup: "Utama" },
  { href: "/admin/riwayat", label: "Riwayat", ikon: "M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z", grup: "Utama" },
  { href: "/admin/stok", label: "Bahan & Stok", ikon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m-8-14l8 4m-8-4v10l8 4m0-10v10", grup: "Operasional" },
  { href: "/admin/menu", label: "Menu & Resep", ikon: "M4 6h16M4 12h16M4 18h10", grup: "Operasional" },
  { href: "/admin/preorder", label: "Pre-order", ikon: "M6 2h9l5 5v15H6zM15 2v5h5", grup: "Operasional" },
  { href: "/admin/dapur", label: "Papan dapur", ikon: "M4 6h16v12H4zM8 10h8M8 14h5", grup: "Operasional" },
  { href: "/admin/laporan", label: "Laporan", ikon: "M4 19V9m6 10V5m6 14v-7m4 7H2", grup: "Keuangan" },
  { href: "/admin/keuangan", label: "Keuangan", ikon: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6", grup: "Keuangan" },
  { href: "/admin/master", label: "Master data", ikon: "M4 7h16M4 12h16M4 17h10", grup: "Pengaturan" },
  { href: "/admin/lanjutan", label: "Fitur lanjutan", ikon: "M12 2v4m0 12v4M4.9 4.9l2.8 2.8m9.6 9.6l2.8 2.8M2 12h4m12 0h4M4.9 19.1l2.8-2.8m9.6-9.6l2.8-2.8M12 8a4 4 0 100 8 4 4 0 000-8z", grup: "Pengaturan" },
  { href: "/admin/pengaturan", label: "Pengaturan", ikon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 00-1.7-1L14.5 3h-4l-.3 2.5a7 7 0 00-1.7 1l-2.4-1-2 3.5L6.1 11a7 7 0 000 2l-2 1.5 2 3.5 2.4-1a7 7 0 001.7 1l.3 2h4l.3-2a7 7 0 001.7-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1z", grup: "Pengaturan" },
];

const GRUP = ["Utama", "Operasional", "Keuangan", "Pengaturan"];
const NAV_BAWAH = ["/admin", "/admin/kasir", "/admin/preorder", "/admin/dapur", "/admin/menu"];
const HANYA_PEMILIK = ["/admin/master", "/admin/pengaturan", "/admin/laporan", "/admin/keuangan"];

export default function Panel({
  children, nama, peran,
}: { children: ReactNode; nama: string; peran: Peran }) {
  const jalur = usePathname();
  const router = useRouter();
  const [palette, setPalette] = useState(false);
  const [cari, setCari] = useState("");
  const acuanCari = useRef<HTMLInputElement>(null);
  const [jumlahNotif, setJumlahNotif] = useState(0);

  const item = useMemo(
    () => NAV.filter((n) => !HANYA_PEMILIK.includes(n.href) || peran === "pemilik"),
    [peran],
  );
  const hasil = useMemo(() => {
    const teks = cari.trim().toLowerCase();
    if (!teks) return item;
    return item.filter((n) => n.label.toLowerCase().includes(teks) || n.href.includes(teks));
  }, [cari, item]);

  useEffect(() => {
    const dengar = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setPalette(true); setCari("");
      }
    };
    window.addEventListener("keydown", dengar);
    return () => window.removeEventListener("keydown", dengar);
  }, []);

  useEffect(() => {
    if (palette) acuanCari.current?.focus();
  }, [palette]);

  useEffect(() => {
    if (peran !== "pemilik") return;
    void fetch("/api/notifikasi?batas=50")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { notifikasi?: { status?: string }[] } | null) =>
        setJumlahNotif((d?.notifikasi ?? []).filter((n) => n.status === "tertunda").length))
      .catch(() => setJumlahNotif(0));
  }, [peran, jalur]);

  async function keluar() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  function buka(href: string) {
    setPalette(false);
    router.push(href);
  }

  return (
    <KonteksPeran.Provider value={peran}>
      <div className="min-h-screen pb-16 lg:grid lg:grid-cols-[250px_1fr] lg:pb-0">
        <aside className="border-b border-garis bg-permukaan lg:min-h-screen lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 px-5 py-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/jebew-icon.svg" alt="" width={42} height={42} />
            <div className="min-w-0">
              <p className="truncate font-judul text-sm font-bold uppercase tracking-[0.14em] text-tinta">Mie Jebew</p>
              <p className="mt-0.5 truncate text-[10px] text-tinta-lemah">Warung Kak Ikaa · Panel</p>
            </div>
          </div>
          <nav aria-label="Navigasi utama" className="hidden flex-col gap-4 px-3 lg:flex">
            {GRUP.map((grup) => (
              <div key={grup}>
                <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-tinta-lemah">{grup}</p>
                <div className="space-y-0.5">
                  {item.filter((n) => n.grup === grup).map((n) => {
                    const aktif = jalur === n.href;
                    return (
                      <Link key={n.href} href={n.href}
                        aria-current={aktif ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                          aktif ? "bg-utama text-white shadow-sm" : "text-tinta-lemah hover:bg-latar hover:text-tinta"
                        }`}>
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0 fill-none stroke-current stroke-2">
                          <path d={n.ikon} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {n.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <nav aria-label="Navigasi cepat" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:hidden">
            {item.map((n) => (
              <Link key={n.href} href={n.href}
                aria-current={jalur === n.href ? "page" : undefined}
                className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${
                  jalur === n.href ? "bg-utama text-white" : "border border-garis bg-white text-tinta-lemah"
                }`}>{n.label}</Link>
            ))}
          </nav>
          <div className="hidden px-4 py-5 lg:block">
            <div className="mb-3 rounded-xl bg-latar px-3 py-2.5">
              <p className="text-xs font-semibold">{nama}</p>
              <p className="text-[11px] capitalize text-tinta-lemah">{peran === "pemilik" ? "Pemilik" : "Kasir"}</p>
            </div>
            <button onClick={() => void keluar()}
              className="w-full rounded-xl border border-garis px-3 py-2 text-sm font-semibold text-tinta-lemah transition hover:bg-latar">
              Keluar
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="flex items-center justify-between gap-4 border-b border-garis bg-permukaan px-5 py-3">
            <div className="lg:hidden">
              <p className="font-judul text-sm font-bold uppercase tracking-[0.14em]">Mie Jebew</p>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <Link href="/admin/dapur" className="relative hidden text-sm font-semibold text-tinta-lemah hover:text-utama sm:inline-flex">
                Notifikasi
                {jumlahNotif > 0 && (
                  <span aria-label={`${jumlahNotif} notifikasi tertunda`}
                    className="animasi-pop absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-utama px-1 text-[9px] font-bold text-white">
                    {jumlahNotif}
                  </span>
                )}
              </Link>
              <button type="button" onClick={() => setPalette(true)}
                className="hidden items-center gap-2 rounded-xl border border-garis px-3 py-2 text-xs font-semibold text-tinta-lemah transition hover:bg-latar sm:inline-flex">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" strokeLinecap="round" /></svg>
                Cari halaman
                <kbd className="rounded-md bg-latar px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
              </button>
              <Link href="/" className="text-sm font-semibold text-utama hover:underline">Lihat website</Link>
              <button onClick={() => void keluar()} className="text-sm text-tinta-lemah lg:hidden">Keluar</button>
              <span className="hidden text-sm text-tinta-lemah sm:inline">{nama}</span>
            </div>
          </header>
          <main id="konten-utama" className="mx-auto max-w-7xl px-4 py-7 sm:px-6">{children}</main>
        </div>
      </div>

      <nav aria-label="Navigasi bawah" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-garis bg-permukaan/95 px-2 py-1 backdrop-blur lg:hidden">
        {item.filter((n) => NAV_BAWAH.includes(n.href)).map((n) => {
          const aktif = jalur === n.href;
          return (
            <Link key={n.href} href={n.href}
              aria-current={aktif ? "page" : undefined}
              className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-semibold ${
                aktif ? "text-utama" : "text-tinta-lemah"
              }`}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-2">
                <path d={n.ikon} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="truncate px-1">{n.label}</span>
            </Link>
          );
        })}
      </nav>

      <Dialog terbuka={palette} judul="Cari halaman" padaTutup={() => setPalette(false)}>
        <label htmlFor="palet-cari" className="visually-hidden">Cari halaman</label>
        <input id="palet-cari" ref={acuanCari} type="search" value={cari}
          onChange={(e) => setCari(e.target.value)} placeholder="Ketik nama halaman" />
        <ul className="mt-4 space-y-1">
          {hasil.map((n) => (
            <li key={n.href}>
              <button type="button" onClick={() => buka(n.href)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-tinta hover:bg-latar">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2">
                  <path d={n.ikon} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{n.label}</span>
                <span className="ml-auto text-[10px] text-tinta-lemah">{n.grup}</span>
              </button>
            </li>
          ))}
          {hasil.length === 0 && <li className="py-6 text-center text-sm text-tinta-lemah">Halaman tidak ditemukan.</li>}
        </ul>
      </Dialog>
    </KonteksPeran.Provider>
  );
}
