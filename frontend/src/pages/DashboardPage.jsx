import React from "react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">Dashboard Utama</h2>
          <p className="text-xs text-[#6B6862]">
            Daftar instrumen maserasi terhubung &amp; ringkasan status telemetri.
          </p>
        </div>
        <button className="px-3.5 py-2 bg-[#3A5F43] text-[#F9F8F3] text-xs font-semibold rounded hover:bg-[#2F4E36] transition-colors shadow-sm">
          + Klaim Alat Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Placeholder cards */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="lab-card p-4 lab-card-hover cursor-pointer space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="badge-lab bg-[#E2E0D7] text-[#1A1A1A] font-bold">
                  MC-000{i}
                </span>
                <h3 className="font-serif text-base font-semibold text-[#1A1A1A] mt-1">
                  Maceration Tank {i}
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#3A5F43] bg-[#3A5F43]/10 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3A5F43] animate-pulse-live" />
                ONLINE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2E0D7] text-xs">
              <div>
                <div className="text-[10px] font-mono text-[#6B6862] uppercase">Suhu</div>
                <div className="font-mono text-sm font-semibold text-[#1A1A1A]">32.5 °C</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-[#6B6862] uppercase">Kecepatan</div>
                <div className="font-mono text-sm font-semibold text-[#D97736]">850 RPM</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
