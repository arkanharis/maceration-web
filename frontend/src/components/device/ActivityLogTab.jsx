import React, { useState, useEffect } from "react";
import { deviceApi } from "../../services/api.js";
import { Activity, ShieldCheck, Zap, Wifi, WifiOff, UserPlus, Trash2, Loader2, RefreshCw } from "lucide-react";

export default function ActivityLogTab({ deviceId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deviceApi.getEvents(deviceId, 100);
      setEvents(data.events || []);
    } catch (err) {
      console.error("[ActivityLogTab] error fetching events:", err);
      setError(err.message || "Gagal memuat log aktivitas instrumen.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [deviceId]);

  // Event Icon & Tag Helpers
  const getEventBadge = (eventType, detail) => {
    switch (eventType) {
      case "relay_toggled":
        return {
          icon: Zap,
          label: `RELAY ${detail?.relay?.toUpperCase() || ""} TOGGLED`,
          color: "text-[#D97736] bg-[#D97736]/10 border-[#D97736]/30",
          desc: `Relay ${detail?.relay?.toUpperCase()} diubah menjadi ${detail?.value ? "ON" : "OFF"}`,
        };
      case "device_online":
        return {
          icon: Wifi,
          label: "DEVICE ONLINE",
          color: "text-[#3A5F43] bg-[#3A5F43]/10 border-[#3A5F43]/30",
          desc: `Instrumen terhubung ke broker MQTT (${detail?.ip || "Local Network"})`,
        };
      case "device_offline":
        return {
          icon: WifiOff,
          label: "DEVICE OFFLINE",
          color: "text-[#C84B31] bg-[#C84B31]/10 border-[#C84B31]/30",
          desc: "Koneksi instrumen terputus (LWT Heartbeat Timeout)",
        };
      case "access_granted":
        return {
          icon: UserPlus,
          label: "AKSES DIBAGIKAN",
          color: "text-[#3A5F43] bg-[#3A5F43]/10 border-[#3A5F43]/30",
          desc: `Akses ${detail?.role?.toUpperCase()} diberikan kepada ${detail?.target_email}`,
        };
      case "access_revoked":
        return {
          icon: Trash2,
          label: "AKSES DICABUT",
          color: "text-[#C84B31] bg-[#C84B31]/10 border-[#C84B31]/30",
          desc: `Akses untuk ${detail?.target_email || "pengguna"} telah dicabut`,
        };
      case "device_claimed":
        return {
          icon: ShieldCheck,
          label: "DEVICE CLAIMED",
          color: "text-[#3A5F43] bg-[#3A5F43]/10 border-[#3A5F43]/30",
          desc: "Instrumen berhasil diklaim oleh pemilik akun",
        };
      default:
        return {
          icon: Activity,
          label: eventType.toUpperCase(),
          color: "text-[#6B6862] bg-[#E2E0D7] border-[#D3D0C3]",
          desc: JSON.stringify(detail || {}),
        };
    }
  };

  return (
    <div className="lab-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E0D7] pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-[#3A5F43]/10 text-[#3A5F43] flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-[#1A1A1A]">
              Log Aktivitas &amp; Audit Trail Alat
            </h3>
            <p className="text-[11px] text-[#6B6862]">
              Rekaman jejak aktivitas kontrol relay, status jaringan, &amp; perubahan izin akses.
            </p>
          </div>
        </div>

        <button
          onClick={fetchEvents}
          disabled={loading}
          className="p-1.5 bg-[#F9F8F3] border border-[#E2E0D7] text-[#6B6862] hover:text-[#1A1A1A] rounded transition-colors"
          title="Refresh Log"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-[#C84B31]/10 border border-[#C84B31]/30 rounded text-xs text-[#C84B31]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-2 text-[#6B6862]">
          <Loader2 className="w-6 h-6 animate-spin text-[#3A5F43]" />
          <span className="font-mono text-xs">Memuat log aktivitas lab...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="py-12 text-center text-[#6B6862] space-y-1">
          <Activity className="w-8 h-8 opacity-40 mx-auto" />
          <div className="font-serif text-sm font-semibold">Belum Ada Catatan Aktivitas</div>
          <div className="text-xs">Aktivitas kontrol dan peristiwa instrumen akan dicatat di sini.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((evt) => {
            const config = getEventBadge(evt.event_type, evt.detail);
            const Icon = config.icon;
            const eventDate = new Date(evt.created_at);

            return (
              <div
                key={evt.id}
                className="bg-[#F9F8F3] p-3 rounded border border-[#E2E0D7] flex items-start space-x-3 text-xs"
              >
                <div className={`p-2 rounded shrink-0 border ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="font-mono text-[10px] text-[#6B6862]">
                      {eventDate.toLocaleDateString()} {eventDate.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-[#1A1A1A] mt-1.5 font-medium">
                    {config.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
