import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { deviceApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { initSocket, getSocket } from "../services/socket.js";
import RelayControlPanel from "../components/device/RelayControlPanel.jsx";
import TelemetryChart from "../components/device/TelemetryChart.jsx";
import ActivityLogTab from "../components/device/ActivityLogTab.jsx";
import AccessControlTab from "../components/device/AccessControlTab.jsx";
import {
  ArrowLeft,
  Beaker,
  Thermometer,
  RotateCw,
  Zap,
  LineChart,
  Activity,
  Users,
  ShieldCheck,
  UserCheck,
  Eye,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";

export default function DeviceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("live"); // 'live', 'chart', 'activity', 'access'

  // Fetch device details
  const fetchDeviceDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deviceApi.getDevice(id);
      setDevice(data.device);
    } catch (err) {
      console.error("[DeviceDetailPage] error fetching device:", err);
      setError(err.message || "Gagal memuat detail instrumen.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeviceDetail();
  }, [id]);

  // Real-time Socket.IO room subscription
  useEffect(() => {
    if (!token || !id) return;
    const socket = initSocket(token);

    if (socket) {
      // Subscribe to device room
      socket.emit("subscribe_device", { deviceId: id }, (ack) => {
        if (!ack?.ok) {
          console.warn("[DeviceDetailPage] room subscribe error:", ack?.error);
        }
      });

      // Handle telemetry update
      const handleTelemetry = (data) => {
        if (data.deviceId === id) {
          setDevice((prev) =>
            prev
              ? {
                  ...prev,
                  last_telemetry: {
                    temperature: data.temperature,
                    rpm: data.rpm,
                    relay: data.relay,
                    ts: data.ts,
                  },
                  last_seen_at: new Date(data.ts * 1000).toISOString(),
                }
              : prev
          );
        }
      };

      // Handle status change
      const handleStatus = (data) => {
        if (data.deviceId === id) {
          setDevice((prev) =>
            prev ? { ...prev, connection_status: data.status } : prev
          );
        }
      };

      socket.on("telemetry_update", handleTelemetry);
      socket.on("device_status_changed", handleStatus);

      return () => {
        socket.emit("unsubscribe_device", { deviceId: id });
        socket.off("telemetry_update", handleTelemetry);
        socket.off("device_status_changed", handleStatus);
      };
    }
  }, [token, id]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#3A5F43] animate-spin" />
        <span className="font-mono text-xs text-[#6B6862]">
          Menghubungkan instrumen maserasi...
        </span>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="max-w-md mx-auto my-12 lab-card p-6 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-[#C84B31] mx-auto" />
        <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
          Gagal Mengakses Instrumen
        </h3>
        <p className="text-xs text-[#6B6862]">{error || "Instrumen tidak ditemukan."}</p>
        <Link
          to="/"
          className="inline-block px-4 py-2 bg-[#3A5F43] text-[#F9F8F3] text-xs font-semibold rounded"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const isOnline = device.connection_status === "online";
  const userRole = device.role || "viewer";
  const isOwner = userRole === "owner";
  const telemetry = device.last_telemetry || {};

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 text-xs text-[#6B6862] hover:text-[#1A1A1A] font-medium mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard Utama</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E0D7] pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#1A1A1A] bg-[#E2E0D7] px-2.5 py-0.5 rounded-xs border border-[#D3D0C3]">
                {device.device_code}
              </span>

              {userRole === "owner" && (
                <span className="font-mono text-[10px] font-bold text-[#3A5F43] bg-[#3A5F43]/10 border border-[#3A5F43]/20 px-2 py-0.5 rounded-xs">
                  <ShieldCheck className="w-3 h-3 inline mr-0.5" /> OWNER
                </span>
              )}
              {userRole === "operator" && (
                <span className="font-mono text-[10px] font-bold text-[#D97736] bg-[#D97736]/10 border border-[#D97736]/20 px-2 py-0.5 rounded-xs">
                  <UserCheck className="w-3 h-3 inline mr-0.5" /> OPERATOR
                </span>
              )}
              {userRole === "viewer" && (
                <span className="font-mono text-[10px] font-bold text-[#6B6862] bg-[#E2E0D7] border border-[#D3D0C3] px-2 py-0.5 rounded-xs">
                  <Eye className="w-3 h-3 inline mr-0.5" /> VIEWER
                </span>
              )}
            </div>

            <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mt-1">
              {device.name}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#3A5F43] bg-[#3A5F43]/10 border border-[#3A5F43]/20 px-3 py-1.5 rounded-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3A5F43] animate-pulse-live" />
                ONLINE (MQTT LINKED)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#6B6862] bg-[#E2E0D7] border border-[#D3D0C3] px-3 py-1.5 rounded-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6B6862]" />
                OFFLINE
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Realtime Sensor Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Suhu Card */}
        <div className="lab-card p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded bg-[#3A5F43]/10 text-[#3A5F43] flex items-center justify-center shrink-0">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <div className="font-mono text-[10px] text-[#6B6862] uppercase tracking-wider">
              Suhu Masera (Suhu Ekstraksi)
            </div>
            <div className="font-mono text-3xl font-bold text-[#1A1A1A] mt-0.5">
              {telemetry.temperature !== undefined ? `${telemetry.temperature} °C` : "-- °C"}
            </div>
            <div className="font-mono text-[10px] text-[#6B6862] mt-0.5">
              Target Suhu: 30°C - 50°C
            </div>
          </div>
        </div>

        {/* Kecepatan RPM Card */}
        <div className="lab-card p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded bg-[#D97736]/10 text-[#D97736] flex items-center justify-center shrink-0">
            <RotateCw className="w-6 h-6" />
          </div>
          <div>
            <div className="font-mono text-[10px] text-[#6B6862] uppercase tracking-wider">
              Kecepatan Aduk (Stirrer Speed)
            </div>
            <div className="font-mono text-3xl font-bold text-[#D97736] mt-0.5">
              {telemetry.rpm !== undefined ? `${telemetry.rpm} RPM` : "-- RPM"}
            </div>
            <div className="font-mono text-[10px] text-[#6B6862] mt-0.5">
              Status Aduk: {telemetry.rpm > 0 ? "AKTIF MENGADUK" : "DIAM / STASIONER"}
            </div>
          </div>
        </div>

        {/* Last Seen Card */}
        <div className="lab-card p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded bg-[#1A1A1A]/10 text-[#1A1A1A] flex items-center justify-center shrink-0">
            <Beaker className="w-6 h-6" />
          </div>
          <div>
            <div className="font-mono text-[10px] text-[#6B6862] uppercase tracking-wider">
              Terakhir Aktif (Heartbeat)
            </div>
            <div className="font-mono text-sm font-bold text-[#1A1A1A] mt-1">
              {device.last_seen_at
                ? new Date(device.last_seen_at).toLocaleTimeString()
                : "Belum Pernah"}
            </div>
            <div className="font-mono text-[10px] text-[#6B6862] mt-0.5">
              Pemilik:{' '}
              {device.owner_name ? (
                <Link
                  to={`/users/${device.owner_id}`}
                  className="text-[#3A5F43] hover:underline"
                >
                  {device.owner_name}
                </Link>
              ) : (
                "Milik Anda"
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="border-b border-[#E2E0D7] flex items-center space-x-2">
        <button
          onClick={() => setActiveTab("live")}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "live"
              ? "border-[#3A5F43] text-[#3A5F43] bg-[#F1F0EA]"
              : "border-transparent text-[#6B6862] hover:text-[#1A1A1A]"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Kontrol Relay Live</span>
        </button>

        <button
          onClick={() => setActiveTab("chart")}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "chart"
              ? "border-[#3A5F43] text-[#3A5F43] bg-[#F1F0EA]"
              : "border-transparent text-[#6B6862] hover:text-[#1A1A1A]"
          }`}
        >
          <LineChart className="w-4 h-4" />
          <span>Riwayat Sensor (Grafik)</span>
        </button>

        <button
          onClick={() => setActiveTab("activity")}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "activity"
              ? "border-[#3A5F43] text-[#3A5F43] bg-[#F1F0EA]"
              : "border-transparent text-[#6B6862] hover:text-[#1A1A1A]"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Log Aktivitas</span>
        </button>

        {isOwner && (
          <button
            onClick={() => setActiveTab("access")}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "access"
                ? "border-[#3A5F43] text-[#3A5F43] bg-[#F1F0EA]"
                : "border-transparent text-[#6B6862] hover:text-[#1A1A1A]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Kelola Akses &amp; Pengaturan</span>
          </button>
        )}
      </div>

      {/* Tab Contents Viewport */}
      <div>
        {activeTab === "live" && (
          <RelayControlPanel
            deviceId={device.id}
            relayState={telemetry.relay || {}}
            userRole={userRole}
            isOnline={isOnline}
            onRelayToggled={(rKey, val) => {
              setDevice((prev) => ({
                ...prev,
                last_telemetry: {
                  ...prev.last_telemetry,
                  relay: {
                    ...(prev.last_telemetry?.relay || {}),
                    [rKey]: val,
                  },
                },
              }));
            }}
          />
        )}

        {activeTab === "chart" && <TelemetryChart deviceId={device.id} />}

        {activeTab === "activity" && <ActivityLogTab deviceId={device.id} />}

        {activeTab === "access" && isOwner && (
          <AccessControlTab
            device={device}
            onDeviceUpdated={(updated) => setDevice(updated)}
            onDeviceReleased={() => navigate("/")}
          />
        )}
      </div>
    </div>
  );
}
