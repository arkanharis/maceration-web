import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="text-center py-16 space-y-4">
      <div className="font-mono text-6xl font-bold text-[#C84B31]">404</div>
      <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">Halaman Tidak Ditemukan</h2>
      <p className="text-xs text-[#6B6862]">
        Halaman yang Anda cari tidak ada atau akses ditolak.
      </p>
      <Link
        to="/"
        className="inline-block px-4 py-2 bg-[#3A5F43] text-[#F9F8F3] text-xs font-semibold rounded hover:bg-[#2F4E36] transition-colors"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
