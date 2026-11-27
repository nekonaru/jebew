"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Pesan, Tombol } from "./ui.tsx";

export default function FormulirLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);
  const [tampilSandi, setTampilSandi] = useState(false);
  const [tantangan, setTantangan] = useState("");
  const [kode2fa, setKode2fa] = useState("");

  async function masuk(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setPesan("");
    try {
      const jawaban = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, kata_sandi: kataSandi }),
      });
      const data = (await jawaban.json()) as { pesan?: string; butuh2fa?: boolean; tantangan?: string };
      if (!jawaban.ok) throw new Error(data.pesan ?? "Gagal masuk");
      if (data.butuh2fa && data.tantangan) {
        setTantangan(data.tantangan);
        setPesan("");
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setPesan(err instanceof Error ? err.message : "Gagal masuk");
      setLoading(false);
    }
  }

  async function verifikasi(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setPesan("");
    try {
      const jawaban = await fetch("/api/auth/2fa/verifikasi", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tantangan, kode: kode2fa }),
      });
      const data = (await jawaban.json()) as { pesan?: string };
      if (!jawaban.ok) throw new Error(data.pesan ?? "Kode tidak valid");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setPesan(err instanceof Error ? err.message : "Gagal memverifikasi kode");
      setLoading(false);
    }
  }

  return (
    <main id="konten-utama" className="flex min-h-screen items-center justify-center bg-latar px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/jebew-icon.svg" alt="" width={64} height={64} className="mx-auto" />
          <h1 className="mt-4 text-2xl font-semibold">Selamat datang kembali</h1>
          <p className="mt-1 text-sm text-tinta-lemah">Masuk untuk mengelola Warung Kak Ikaa.</p>
        </div>
        {tantangan ? (
          <form onSubmit={(e) => void verifikasi(e)} className="space-y-5 rounded-kartu border border-garis bg-permukaan p-6 shadow-kartu">
            <div>
              <h2 className="font-judul text-lg font-semibold">Kode verifikasi</h2>
              <p className="mt-1 text-xs text-tinta-lemah">Masukkan enam angka dari aplikasi authenticator Anda.</p>
            </div>
            <div>
              <label htmlFor="kode2fa">Kode 2FA</label>
              <input id="kode2fa" inputMode="numeric" pattern="[0-9]*" maxLength={6} required
                autoComplete="one-time-code" value={kode2fa}
                onChange={(e) => setKode2fa(e.target.value.replace(/\D/g, ""))} placeholder="000000" />
            </div>
            <Pesan teks={pesan} jenis="galat" />
            <Tombol tipe="submit" nonaktif={loading} kelas="w-full">
              {loading ? "Memverifikasi..." : "Verifikasi dan masuk"}
            </Tombol>
            <button type="button" onClick={() => { setTantangan(""); setKode2fa(""); setPesan(""); }}
              className="w-full text-center text-xs font-semibold text-utama hover:underline">
              Kembali ke halaman masuk
            </button>
          </form>
        ) : (
        <form onSubmit={masuk} className="space-y-5 rounded-kartu border border-garis bg-permukaan p-6 shadow-kartu">
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="username" required
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@warung.test" />
          </div>
          <div>
            <label htmlFor="sandi">Kata sandi</label>
            <div className="relative">
              <input id="sandi" name="kata_sandi" type={tampilSandi ? "text" : "password"}
                autoComplete="current-password" required className="pr-12"
                value={kataSandi} onChange={(e) => setKataSandi(e.target.value)} />
              <button type="button"
                onClick={() => setTampilSandi((nilai) => !nilai)}
                aria-label={tampilSandi ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-tinta-lemah transition-colors duration-[var(--gerak-cepat)] hover:text-utama focus-visible:outline-2 focus-visible:outline-aksen">
                {tampilSandi ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                    <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A10.6 10.6 0 0112 5c5 0 9 4.5 10 7-.4 1-1.2 2.4-2.4 3.6M6.3 6.3C4.5 7.5 3.1 9 2.5 10c1 2.5 5 7 9.5 7 1.2 0 2.3-.2 3.3-.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <Pesan teks={pesan} jenis="galat" />
          <Tombol tipe="submit" nonaktif={loading} kelas="w-full">
            {loading ? "Memeriksa..." : "Masuk"}
          </Tombol>
          {process.env.NODE_ENV !== "production" && (
            <p className="text-center text-xs text-tinta-lemah">
              Akun demo: pemilik@jebew.test / pemilik123
            </p>
          )}
        </form>
        )}
        <p className="mt-6 text-center text-sm">
          <a href="/" className="font-semibold text-utama hover:underline">Lihat website konsumen</a>
        </p>
      </div>
    </main>
  );
}
