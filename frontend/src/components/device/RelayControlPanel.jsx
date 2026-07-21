import React, { useState } from "react";
import { deviceApi } from "../../services/api.js";
import { getSocket } from "../../services/socket.js";
import { Zap, Loader2, Lock } from "lucide-react";

const RELAY_NAMES = {
  r1: "R1 — Pemanas (Heater Element)",
  r2: "R2 — Motor Pengaduk (Stirrer Motor)",
  r3: "R3 — Solenoid Valve Evakuasi",
  r4: "R4 — Auxiliary / Alarm Signal",
};

export default function RelayControlPanel({
  deviceId,
  relayState = {},
  userRole = "viewer",
  isOnline = false,
  onRelayToggled,
}) {
  const [togglingRelay, setTogglingRelay] = useState(null); // 'r1', 'r2', 'r3', or 'r4'
  const [errorMsg, setErrorMsg] = useState(null);

  const canControl = isOnline && (userRole === "owner" || userRole === "operator");

  const handleToggle = async (relayKey) => {
    if (!canControl || togglingRelay) return;

    setErrorMsg(null);
    setTogglingRelay(relayKey);
    const currentValue = !!relayState[relayKey];
    const newValue = !currentValue;

    try {
      const socket = getSocket();

      if (socket && socket.connected) {
        // Real-time control via Socket.IO
        await new Promise((resolve, reject) => {
          socket.emit(
            "send_command",
            {
              deviceId,
              action: "set_relay",
              relay: relayKey,
              value: newValue,
            },
            (response) => {
              if (response?.ok) resolve(response.ack);
              else reject(new Error(response?.error || "Gagal mengirim perintah."));
            }
          );
        });
      } else {
        // Fallback REST API
        await deviceApi.sendCommand(deviceId, {
          action: "set_relay",
          relay: relayKey,
          value: newValue,
        });
      }

      if (onRelayToggled) {
        onRelayToggled(relayKey, newValue);
      }
    } catch (err) {
      console.error("[RelayControlPanel] toggle error:", err);
      setErrorMsg(err.message || "Perintah relay gagal atau timeout.");
    } finally {
      setTogglingRelay(null);
    }
  };

  return (
    <div className="lab-card p-5 space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[#E2E0D7] pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-[#D97736]/10 text-[#D97736] flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-[#1A1A1A]">
              Kontrol Sakelar Relay (Actuators)
            </h3>
            <p className="text-[11px] text-[#6B6862]">
              Sakelar kontrol daya 4-saluran untuk modul ekstraksi maserasi.
            </p>
          </div>
        </div>

        {/* Lock indicator if disabled */}
        {!canControl && (
          <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-[#6B6862] bg-[#E2E0D7] px-2 py-1 rounded">
            <Lock className="w-3 h-3" />
            <span>
              {!isOnline ? "ALAT OFFLINE" : "VIEWER ONLY"}
            </span>
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="p-2.5 bg-[#C84B31]/10 border border-[#C84B31]/30 rounded text-xs text-[#C84B31]">
          {errorMsg}
        </div>
      )}

      {/* Relay Switches Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {["r1", "r2", "r3", "r4"].map((rKey) => {
          const isOn = !!relayState[rKey];
          const isToggling = togglingRelay === rKey;

          return (
            <div
              key={rKey}
              className={`p-3.5 rounded border transition-all flex items-center justify-between ${
                isOn
                  ? "bg-[#F9F8F3] border-[#D97736] shadow-xs"
                  : "bg-[#F9F8F3] border-[#E2E0D7]"
              }`}
            >
              <div>
                <div className="font-mono text-[10px] text-[#6B6862] uppercase tracking-wider">
                  Channel {rKey.toUpperCase()}
                </div>
                <div className="font-serif text-xs font-semibold text-[#1A1A1A] mt-0.5">
                  {RELAY_NAMES[rKey]}
                </div>
                <div className="font-mono text-[11px] font-bold mt-1">
                  {isOn ? (
                    <span className="text-[#D97736] flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D97736] animate-pulse-live inline-block" />
                      <span>ON (AKTIF)</span>
                    </span>
                  ) : (
                    <span className="text-[#6B6862]">OFF (MATI)</span>
                  )}
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => handleToggle(rKey)}
                disabled={!canControl || isToggling}
                title={
                  !canControl
                    ? !isOnline
                      ? "Tidak dapat mengontrol saat alat offline"
                      : "Akses Viewer hanya dapat memantau"
                    : isOn
                    ? "Matikan Sakelar"
                    : "Nyalakan Sakelar"
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
                  isOn ? "bg-[#D97736]" : "bg-[#E2E0D7]"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#F9F8F3] shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                    isOn ? "translate-x-5" : "translate-x-0"
                  }`}
                >
                  {isToggling && (
                    <Loader2 className="w-3 h-3 text-[#1A1A1A] animate-spin" />
                  )}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
