import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { deviceApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { initSocket, getSocket } from "../services/socket.js";
import DeviceCard from "../components/DeviceCard.jsx";
import ClaimDeviceModal from "../components/ClaimDeviceModal.jsx";
import {
  Beaker,
  Plus,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  RefreshCw,
  Cpu,
} from "lucide-react";

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  const activeFilter = searchParams.get("filter") || "all";

  // Fetch initial device list
  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deviceApi.getDevices();
      setDevices(data.devices || []);
    } catch (err) {
      console.error("[DashboardPage] error fetching devices:", err);
      setError(err.message || "Gagal memuat daftar instrumen.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // Setup Socket.IO real-time listener for status/telemetry updates across devices
  useEffect(() => {
    if (!token) return;
    const socket = initSocket(token);

    if (socket) {
      // Handle status changes (online/offline)
      const handleStatusChange = ({ deviceId, status }) => {
        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceId ? { ...d, connection_status: status } : d
          )
        );
      };

      // Handle telemetry updates (temperature & RPM)
      const handleTelemetryUpdate = ({ deviceId, temperature, rpm, ts }) => {
        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceId
              ? {
                  ...d,
                  last_telemetry: { temperature, rpm, ts },
                  last_seen_at: new Date(ts * 1000).toISOString(),
                }
              : d
          )
        );
      };

      socket.on("device_status_changed", handleStatusChange);
      socket.on("telemetry_update", handleTelemetryUpdate);

      return () => {
        socket.off("device_status_changed", handleStatusChange);
        socket.off("telemetry_update", handleTelemetryUpdate);
      };
    }
  }, [token]);

  // Filter & Search Logic
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      // Tab Filter
      if (activeFilter === "owned" && device.role !== "owner") return false;
      if (activeFilter === "shared" && device.role === "owner") return false;

      // Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const codeMatch = device.device_code?.toLowerCase().includes(q);
        const nameMatch = device.name?.toLowerCase().includes(q);
        return codeMatch || nameMatch;
      }

      return true;
    });
  }, [devices, activeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header & Page Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E0D7] pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-[#6B6862] font-mono">
            <Beaker className="w-3.5 h-3.5 text-[#3A5F43]" />
            <span>Laboratorium Instumen Masearasi</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mt-0.5">
            Dashboard Utama
          </h2>
          <p className="text-xs text-[#6B6862]">
            Monitor status telemetri real-time instrumen maserasi obat alam.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchDevices}
            disabled={loading}
            className="p-2 bg-[#F1F0EA] border border-[#E2E0D7] text-[#6B6862] hover:text-[#1A1A1A] hover:bg-[#E2E0D7] rounded transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsClaimModalOpen(true)}
            className="px-4 py-2 bg-[#3A5F43] text-[#F9F8F3] text-xs font-semibold rounded hover:bg-[#2F4E36] transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Klaim Alat Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 bg-[#F1F0EA] p-1 rounded border border-[#E2E0D7]">
          <button
            onClick={() => setSearchParams({ filter: "all" })}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeFilter === "all"
                ? "bg-[#F9F8F3] text-[#1A1A1A] shadow-xs font-semibold"
                : "text-[#6B6862] hover:text-[#1A1A1A]"
            }`}
          >
            Semua Instrumen ({devices.length})
          </button>
          <button
            onClick={() => setSearchParams({ filter: "owned" })}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeFilter === "owned"
                ? "bg-[#F9F8F3] text-[#3A5F43] shadow-xs font-semibold"
                : "text-[#6B6862] hover:text-[#1A1A1A]"
            }`}
          >
            Milik Saya ({devices.filter((d) => d.role === "owner").length})
          </button>
          <button
            onClick={() => setSearchParams({ filter: "shared" })}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeFilter === "shared"
                ? "bg-[#F9F8F3] text-[#D97736] shadow-xs font-semibold"
                : "text-[#6B6862] hover:text-[#1A1A1A]"
            }`}
          >
            Dibagikan ({devices.filter((d) => d.role !== "owner").length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#6B6862] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode atau nama alat..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-[#F1F0EA] border border-[#E2E0D7] rounded focus:outline-none focus:border-[#3A5F43] text-[#1A1A1A]"
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-[#C84B31]/10 border border-[#C84B31]/30 rounded text-xs text-[#C84B31] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDevices}
            className="underline font-semibold hover:text-[#1A1A1A]"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Loading Skeleton State */}
      {loading && devices.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="lab-card p-5 space-y-4 animate-pulse"
            >
              <div className="h-4 bg-[#E2E0D7] rounded w-1/3" />
              <div className="h-6 bg-[#E2E0D7] rounded w-2/3" />
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E2E0D7]">
                <div className="h-10 bg-[#E2E0D7] rounded" />
                <div className="h-10 bg-[#E2E0D7] rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Devices Grid List */}
      {!loading && filteredDevices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredDevices.length === 0 && (
        <div className="lab-card p-12 text-center space-y-4 my-8">
          <div className="w-12 h-12 rounded-full bg-[#E2E0D7] text-[#6B6862] flex items-center justify-center mx-auto">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
              Tidak Ada Instrumen Ditemukan
            </h3>
            <p className="text-xs text-[#6B6862] max-w-sm mx-auto mt-1">
              {searchQuery
                ? `Tidak ada instrumen yang cocok dengan kata kunci "${searchQuery}".`
                : activeFilter === "shared"
                ? "Belum ada instrumen yang dibagikan oleh pemilik lain ke akun Anda."
                : "Anda belum mengklaim instrumen maserasi apa pun. Klik tombol '+ Klaim Alat Baru' untuk menambahkan."}
            </p>
          </div>
          {!searchQuery && activeFilter !== "shared" && (
            <button
              onClick={() => setIsClaimModalOpen(true)}
              className="px-4 py-2 bg-[#3A5F43] text-[#F9F8F3] text-xs font-semibold rounded hover:bg-[#2F4E36] transition-colors shadow-sm inline-flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Klaim Instrumen Pertama Anda</span>
            </button>
          )}
        </div>
      )}

      {/* Claim Device Modal */}
      <ClaimDeviceModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        onSuccess={() => fetchDevices()}
      />
    </div>
  );
}
