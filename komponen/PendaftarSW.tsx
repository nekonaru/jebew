"use client";

import { useEffect } from "react";

/** Mendaftarkan service worker untuk shell aplikasi yang dapat dipasang. */
export default function PendaftarSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    void navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
