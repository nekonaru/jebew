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
      const data = (await jawaban.json()) as { pesan?: string };
      if (!jawaban.ok) throw new Error(data.pesan ?? "Gagal masuk");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setPesan(err instanceof Error ? err.message : "Gagal masuk");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-latar px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/jebew-icon.svg" alt="" width={64} height={64} className="mx-auto" />
          <h1 className="mt-4 text-2xl font-semibold">Selamat datang kembali</h1>
          <p className="mt-1 text-sm text-tinta-lemah">Masuk untuk mengelola Warung Kak Ikaa.</p>
        </div>
        <form onSubmit={masuk} className="space-y-5 rounded-kartu border border-garis bg-permukaan p-6 shadow-kartu">
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="username" required
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@warung.test" />
          </div>
          <div>
            <label htmlFor="sandi">Kata sandi</label>
            <input id="sandi" name="kata_sandi" type="password" autoComplete="current-password" required
              value={kataSandi} onChange={(e) => setKataSandi(e.target.value)} />
          </div>
          <Pesan teks={pesan} jenis="galat" />
          <Tombol tipe="submit" nonaktif={loading} kelas="w-full">
            {loading ? "Memeriksa..." : "Masuk"}
          </Tombol>
          <p className="text-center text-xs text-tinta-lemah">
            Akun demo: pemilik@jebew.test / pemilik123
          </p>
        </form>
        <p className="mt-6 text-center text-sm">
          <a href="/" className="font-semibold text-utama hover:underline">Lihat website konsumen</a>
        </p>
      </div>
    </main>
  );
}
