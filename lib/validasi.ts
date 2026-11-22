// Skema validasi sisi server. Setiap endpoint memakai skema di sini sebelum menyentuh data.

import { z } from "zod";

export const satuanValid = [
  "gram",
  "kg",
  "ml",
  "liter",
  "butir",
  "pcs",
  "sendok",
] as const;

export const kategoriValid = ["Makanan", "Minuman", "Lainnya"] as const;
export const metodeValid = ["tunai", "qris", "transfer"] as const;
export const statusValid = ["baru", "diproses", "selesai", "batal"] as const;

const teks = (maksimum: number) => z.string().trim().min(1).max(maksimum);
const bilangan = z.number().finite().min(0).max(1_000_000);

export const skemaBahan = z
  .object({
    nama: teks(100),
    satuan: z.enum(satuanValid),
    stok: bilangan,
    stok_minimum: bilangan,
  })
  .strict();

export const skemaRestock = z
  .object({ tambahan: z.number().finite().positive().max(1_000_000) })
  .strict();

export const skemaItemResep = z
  .object({
    bahan_id: z.number().int().positive(),
    jumlah_per_porsi: z.number().finite().positive().max(1_000_000),
  })
  .strict();

export const skemaMenu = z
  .object({
    nama: teks(100),
    harga: z.number().int().min(0).max(100_000_000),
    deskripsi: z.string().trim().max(500),
    kategori: z.enum(kategoriValid),
    foto: z.string().trim().max(500).nullable(),
    aktif: z.boolean(),
    resep: z.array(skemaItemResep).min(1).max(20),
  })
  .strict()
  .superRefine((nilai, konteks) => {
    const bahan = new Set<number>();
    for (const item of nilai.resep) {
      if (bahan.has(item.bahan_id)) {
        konteks.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Bahan tidak boleh dobel dalam satu resep",
          path: ["resep"],
        });
      }
      bahan.add(item.bahan_id);
    }
  });

export const skemaItemPesanan = z
  .object({
    menu_id: z.number().int().positive(),
    jumlah: z.number().int().positive().max(100),
  })
  .strict();

const dasarPesanan = z.object({
  items: z.array(skemaItemPesanan).min(1).max(30),
});

export const skemaKasir = dasarPesanan
  .extend({
    metode: z.enum(metodeValid),
    catatan: z.string().trim().max(200),
  })
  .strict()
  .superRefine((nilai, konteks) => {
    const menu = new Set<number>();
    for (const item of nilai.items) {
      if (menu.has(item.menu_id)) {
        konteks.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Menu tidak boleh dobel dalam satu transaksi",
          path: ["items"],
        });
      }
      menu.add(item.menu_id);
    }
  });

export const skemaPreorder = dasarPesanan
  .extend({
    nama_pelanggan: teks(100),
    whatsapp: z
      .string()
      .trim()
      .regex(/^[0-9+\-() ]{8,20}$/, "Nomor WhatsApp tidak valid"),
    waktu_ambil: teks(100),
    catatan: z.string().trim().max(300),
  })
  .strict()
  .superRefine((nilai, konteks) => {
    const menu = new Set<number>();
    for (const item of nilai.items) {
      if (menu.has(item.menu_id)) {
        konteks.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Menu tidak boleh dobel dalam satu pesanan",
          path: ["items"],
        });
      }
      menu.add(item.menu_id);
    }
  });

export const skemaStatusPreorder = z
  .object({ status: z.enum(statusValid) })
  .strict();

export const skemaLogin = z
  .object({ pin: z.string().trim().min(4).max(12) })
  .strict();

export const skemaPenyesuaianStok = z
  .object({ stok: z.number().finite().min(0).max(1_000_000) })
  .strict();

export type BahanInput = z.infer<typeof skemaBahan>;
export type MenuInput = z.infer<typeof skemaMenu>;
export type KasirInput = z.infer<typeof skemaKasir>;
export type PreorderInput = z.infer<typeof skemaPreorder>;
