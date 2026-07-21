import React from "react";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#E2E0D7] pb-4">
        <div>
          <span className="badge-lab bg-[#D97736] text-[#F9F8F3]">SUPERADMIN ONLY</span>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mt-1">
            Panel Administrasi Sistem
          </h2>
          <p className="text-xs text-[#6B6862]">
            Kelola pembuatan instrumen baru, kredensial MQTT, dan hak akses pengguna global.
          </p>
        </div>
      </div>

      <div className="lab-card p-6">
        <h3 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">
          Provisioning Instrumen Baru
        </h3>
        <p className="text-xs text-[#6B6862] mb-4">
          Generate device code dan device secret untuk unit ESP32 baru.
        </p>
        <button className="px-3.5 py-2 bg-[#D97736] text-[#F9F8F3] text-xs font-semibold rounded hover:bg-[#B85F24] transition-colors">
          + Generate Device Baru
        </button>
      </div>
    </div>
  );
}
