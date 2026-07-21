import React from "react";
import { useParams } from "react-router-dom";

export default function DeviceDetailPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#E2E0D7] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="badge-lab bg-[#3A5F43] text-[#F9F8F3]">OWNER</span>
            <span className="font-mono text-xs text-[#6B6862]">ID: {id}</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mt-1">
            Detail Instrumen Maserasi
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="lab-card p-4 space-y-1">
          <div className="text-[10px] font-mono text-[#6B6862] uppercase">Suhu Terkini</div>
          <div className="font-mono text-3xl font-bold text-[#1A1A1A]">32.5 °C</div>
        </div>
        <div className="lab-card p-4 space-y-1">
          <div className="text-[10px] font-mono text-[#6B6862] uppercase">Kecepatan Aduk</div>
          <div className="font-mono text-3xl font-bold text-[#D97736]">850 RPM</div>
        </div>
        <div className="lab-card p-4 space-y-1">
          <div className="text-[10px] font-mono text-[#6B6862] uppercase">Status Alat</div>
          <div className="font-mono text-3xl font-bold text-[#3A5F43]">ONLINE</div>
        </div>
      </div>
    </div>
  );
}
