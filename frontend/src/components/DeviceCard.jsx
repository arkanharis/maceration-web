import React from "react";
import { Link } from "react-router-dom";
import { Thermometer, RotateCw, Activity, ShieldCheck, UserCheck, Eye } from "lucide-react";

export default function DeviceCard({ device }) {
  const isOnline = device.connection_status === "online";
  const role = device.role || "viewer";

  // Role badge formatting per visual-guide.md
  const getRoleBadge = (role) => {
    switch (role) {
      case "owner":
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#3A5F43] bg-[#3A5F43]/10 border border-[#3A5F43]/20 px-2 py-0.5 rounded-xs">
            <ShieldCheck className="w-3 h-3" /> OWNER
          </span>
        );
      case "operator":
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#D97736] bg-[#D97736]/10 border border-[#D97736]/20 px-2 py-0.5 rounded-xs">
            <UserCheck className="w-3 h-3" /> OPERATOR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#6B6862] bg-[#E2E0D7] border border-[#D3D0C3] px-2 py-0.5 rounded-xs">
            <Eye className="w-3 h-3" /> VIEWER
          </span>
        );
    }
  };

  return (
    <Link
      to={`/devices/${device.id}`}
      className="lab-card p-5 lab-card-hover block space-y-4 group relative overflow-hidden"
    >
      {/* Top Header: Code, Name, Role */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-[#1A1A1A] bg-[#E2E0D7] px-2 py-0.5 rounded-xs border border-[#D3D0C3]">
              {device.device_code}
            </span>
            {getRoleBadge(role)}
          </div>
          <h3 className="font-serif text-lg font-bold text-[#1A1A1A] group-hover:text-[#3A5F43] transition-colors mt-1.5">
            {device.name}
          </h3>
        </div>

        {/* Connection Status Badge */}
        <div>
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold text-[#3A5F43] bg-[#3A5F43]/10 border border-[#3A5F43]/20 px-2.5 py-1 rounded-xs">
              <span className="w-2 h-2 rounded-full bg-[#3A5F43] animate-pulse-live" />
              ONLINE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold text-[#6B6862] bg-[#E2E0D7] border border-[#D3D0C3] px-2.5 py-1 rounded-xs">
              <span className="w-2 h-2 rounded-full bg-[#6B6862]" />
              OFFLINE
            </span>
          )}
        </div>
      </div>

      {/* Sensor Metric Preview Grid */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E2E0D7]">
        {/* Temperature Box */}
        <div className="bg-[#F9F8F3] p-2.5 rounded-xs border border-[#E2E0D7] flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded bg-[#3A5F43]/10 text-[#3A5F43] flex items-center justify-center shrink-0">
            <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <div className="font-mono text-[9px] text-[#6B6862] uppercase tracking-wider">
              Suhu Masera
            </div>
            <div className="font-mono text-base font-bold text-[#1A1A1A]">
              {device.last_telemetry?.temperature !== undefined
                ? `${device.last_telemetry.temperature} °C`
                : "-- °C"}
            </div>
          </div>
        </div>

        {/* RPM Speed Box */}
        <div className="bg-[#F9F8F3] p-2.5 rounded-xs border border-[#E2E0D7] flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded bg-[#D97736]/10 text-[#D97736] flex items-center justify-center shrink-0">
            <RotateCw className="w-4 h-4" />
          </div>
          <div>
            <div className="font-mono text-[9px] text-[#6B6862] uppercase tracking-wider">
              Kecepatan Aduk
            </div>
            <div className="font-mono text-base font-bold text-[#D97736]">
              {device.last_telemetry?.rpm !== undefined
                ? `${device.last_telemetry.rpm} RPM`
                : "-- RPM"}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10px] font-mono text-[#6B6862] pt-1">
        <span>Owner: {device.owner_name || "Pemilik Akun"}</span>
        <span>
          {device.last_seen_at
            ? `Aktif: ${new Date(device.last_seen_at).toLocaleTimeString()}`
            : "Belum pernah aktif"}
        </span>
      </div>
    </Link>
  );
}
