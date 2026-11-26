import { NextResponse } from "next/server";
import { aman, galat } from "@/lib/api-final.ts";
import { query } from "@/lib/database.ts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { penolakan } = await aman(req, "pemilik");
    if (penolakan) return penolakan;
    return NextResponse.json({
      konversi: await query("SELECT dari_satuan, ke_satuan, faktor FROM konversi_satuan ORDER BY dari_satuan"),
    });
  } catch (kesalahan) {
    return galat(kesalahan) as NextResponse;
  }
}
