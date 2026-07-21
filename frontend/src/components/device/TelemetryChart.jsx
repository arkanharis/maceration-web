import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { deviceApi } from "../../services/api.js";
import { LineChart as ChartIcon, Calendar, Loader2, AlertCircle } from "lucide-react";

export default function TelemetryChart({ deviceId }) {
  const [range, setRange] = useState("1h"); // '1h', '24h', '7d'
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async (selectedRange) => {
    setLoading(true);
    setError(null);

    const now = new Date();
    let fromDate = new Date();

    if (selectedRange === "24h") {
      fromDate.setHours(now.getHours() - 24);
    } else if (selectedRange === "7d") {
      fromDate.setDate(now.getDate() - 7);
    } else {
      // default 1h
      fromDate.setHours(now.getHours() - 1);
    }

    try {
      const data = await deviceApi.getHistory(deviceId, {
        from: fromDate.toISOString(),
        to: now.toISOString(),
      });
      setLogs(data.logs || []);
    } catch (err) {
      console.error("[TelemetryChart] error fetching history:", err);
      setError(err.message || "Gagal memuat data riwayat grafik.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(range);
  }, [deviceId, range]);

  // Format chart data timestamps
  const chartData = logs.map((log) => {
    const d = new Date(log.recorded_at);
    return {
      time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: d.toLocaleDateString(),
      temperature: Number(log.temperature),
      rpm: Number(log.rpm),
    };
  });

  // Custom Lab Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#F9F8F3] border border-[#E2E0D7] p-2.5 rounded shadow-md text-xs space-y-1 font-mono">
          <div className="text-[10px] text-[#6B6862] font-semibold border-b border-[#E2E0D7] pb-1">
            Waktu: {label} ({payload[0]?.payload?.date})
          </div>
          {payload.map((p, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-[#6B6862]">{p.name}:</span>
              <span className="font-bold text-[#1A1A1A]">
                {p.value} {p.name === "Suhu" ? "°C" : "RPM"}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="lab-card p-5 space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E2E0D7] pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-[#3A5F43]/10 text-[#3A5F43] flex items-center justify-center">
            <ChartIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-[#1A1A1A]">
              Riwayat Grafik Telemetri Sensor
            </h3>
            <p className="text-[11px] text-[#6B6862]">
              Tren suhu maserasi (°C) &amp; kecepatan aduk motor (RPM).
            </p>
          </div>
        </div>

        {/* Range Selector */}
        <div className="flex items-center space-x-1 bg-[#F9F8F3] p-1 rounded border border-[#E2E0D7] text-xs">
          <Calendar className="w-3.5 h-3.5 text-[#6B6862] ml-1.5 mr-0.5" />
          {[
            { id: "1h", label: "1 Jam Terakhir" },
            { id: "24h", label: "24 Jam Terakhir" },
            { id: "7d", label: "7 Hari Terakhir" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setRange(item.id)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                range === item.id
                  ? "bg-[#3A5F43] text-[#F9F8F3] font-bold shadow-xs"
                  : "text-[#6B6862] hover:text-[#1A1A1A]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#C84B31]/10 border border-[#C84B31]/30 rounded text-xs text-[#C84B31] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchHistory(range)} className="underline">
            Coba Lagi
          </button>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-2 text-[#6B6862]">
          <Loader2 className="w-6 h-6 animate-spin text-[#3A5F43]" />
          <span className="font-mono text-xs">Memuat data histori sensor...</span>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-[#6B6862] space-y-1">
          <ChartIcon className="w-8 h-8 opacity-40" />
          <span className="font-serif text-sm font-semibold">Belum Ada Data Riwayat</span>
          <span className="text-xs">
            Data grafik akan muncul secara otomatis saat telemetri diterima dari alat.
          </span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Suhu Chart */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-[#3A5F43]">
                ■ Suhu Ekstraksi (°C)
              </span>
              <span className="font-mono text-[10px] text-[#6B6862]">
                Skala Normal: 20 °C – 60 °C
              </span>
            </div>
            <div className="h-48 w-full bg-[#F9F8F3] p-2 rounded border border-[#E2E0D7]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E0D7" />
                  <XAxis dataKey="time" stroke="#6B6862" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                  <YAxis stroke="#6B6862" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} domain={["auto", "auto"]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    name="Suhu"
                    stroke="#3A5F43"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, stroke: "#3A5F43", strokeWidth: 2, fill: "#F9F8F3" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RPM Chart */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-[#D97736]">
                ■ Kecepatan Pengadukan (RPM)
              </span>
              <span className="font-mono text-[10px] text-[#6B6862]">
                Skala Operasional: 0 RPM – 1500 RPM
              </span>
            </div>
            <div className="h-48 w-full bg-[#F9F8F3] p-2 rounded border border-[#E2E0D7]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E0D7" />
                  <XAxis dataKey="time" stroke="#6B6862" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                  <YAxis stroke="#6B6862" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} domain={[0, "auto"]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="rpm"
                    name="Speed"
                    stroke="#D97736"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, stroke: "#D97736", strokeWidth: 2, fill: "#F9F8F3" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
