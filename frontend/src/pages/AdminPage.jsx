import React, { useState, useEffect } from "react";
import { adminApi } from "../services/api.js";
import {
  Shield,
  Plus,
  Cpu,
  Users,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Key,
  ShieldCheck,
  User,
} from "lucide-react";

export default function AdminPage() {
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState(null);

  // Generate Device Modal State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [customName, setCustomName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null); // { device_code, device_secret }
  const [copied, setCopied] = useState(false);

  const fetchAdminData = async () => {
    setError(null);
    setLoadingDevices(true);
    setLoadingUsers(true);

    try {
      const devData = await adminApi.getDevices();
      setDevices(devData.devices || []);
    } catch (err) {
      console.error("[AdminPage] error fetching devices:", err);
      setError("Gagal memuat daftar instrumen sistem.");
    } finally {
      setLoadingDevices(false);
    }

    try {
      const usrData = await adminApi.getUsers();
      setUsers(usrData.users || []);
    } catch (err) {
      console.error("[AdminPage] error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Handle Generate Device
  const handleGenerateDevice = async (e) => {
    e.preventDefault();
    setError(null);
    setGenerating(true);

    try {
      const payload = {};
      if (customCode.trim()) payload.device_code = customCode.trim().toUpperCase();
      if (customName.trim()) payload.name = customName.trim();

      const res = await adminApi.generateDevice(payload);
      setGeneratedResult(res);
      setCustomCode("");
      setCustomName("");
      fetchAdminData();
    } catch (err) {
      setError(err.message || "Gagal membuat instrumen baru.");
    } finally {
      setGenerating(false);
    }
  };

  // Handle Copy Kredensial
  const handleCopyCredentials = () => {
    if (!generatedResult) return;
    const text = `DEVICE_CODE: ${generatedResult.device_code}\nDEVICE_SECRET: ${generatedResult.device_secret}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Change User Global Role
  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminApi.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, global_role: newRole } : u))
      );
    } catch (err) {
      alert(err.message || "Gagal mengubah peran pengguna.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E0D7] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="badge-lab bg-[#D97736] text-[#F9F8F3]">
              SUPERADMIN CONTROL PANEL
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mt-1">
            Administrasi System Maceration
          </h2>
          <p className="text-xs text-[#6B6862]">
            Provisioning instrumen maserasi baru, pembuatan kredensial MQTT, &amp; manajemen peran pengguna global.
          </p>
        </div>

        <button
          onClick={() => {
            setGeneratedResult(null);
            setIsGenerateModalOpen(true);
          }}
          className="px-4 py-2 bg-[#D97736] text-[#F9F8F3] text-xs font-semibold rounded hover:bg-[#B85F24] transition-colors flex items-center space-x-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ Generate Device Baru</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-[#C84B31]/10 border border-[#C84B31]/30 rounded text-xs text-[#C84B31] flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. All System Devices Table */}
      <div className="lab-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E0D7] pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded bg-[#3A5F43]/10 text-[#3A5F43] flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#1A1A1A]">
                Seluruh Instrumen Sistem ({devices.length})
              </h3>
              <p className="text-[11px] text-[#6B6862]">
                Daftar lengkap unit maserasi terdaftar (Claimed &amp; Unclaimed).
              </p>
            </div>
          </div>
        </div>

        {loadingDevices ? (
          <div className="py-8 text-center text-[#6B6862]">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D97736]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2E0D7] text-[10px] font-mono text-[#6B6862] uppercase tracking-wider bg-[#F9F8F3]">
                  <th className="py-2.5 px-3">Kode Device</th>
                  <th className="py-2.5 px-3">Nama Instrumen</th>
                  <th className="py-2.5 px-3">Status Klaim</th>
                  <th className="py-2.5 px-3">Koneksi</th>
                  <th className="py-2.5 px-3">Pemilik (Owner)</th>
                  <th className="py-2.5 px-3">Dibuat Pada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E0D7]">
                {devices.map((dev) => (
                  <tr key={dev.id} className="hover:bg-[#F9F8F3] transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#1A1A1A]">
                      {dev.device_code}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#1A1A1A]">
                      {dev.name}
                    </td>
                    <td className="py-2.5 px-3">
                      {dev.status === "claimed" ? (
                        <span className="font-mono text-[10px] font-bold text-[#3A5F43] bg-[#3A5F43]/10 px-2 py-0.5 rounded border border-[#3A5F43]/20">
                          CLAIMED
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] font-bold text-[#D97736] bg-[#D97736]/10 px-2 py-0.5 rounded border border-[#D97736]/20">
                          UNCLAIMED
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px]">
                      {dev.connection_status === "online" ? (
                        <span className="text-[#3A5F43] font-bold">ONLINE</span>
                      ) : (
                        <span className="text-[#6B6862]">OFFLINE</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[#6B6862]">
                      {dev.owner_name ? (
                        <span>{dev.owner_name} ({dev.owner_email})</span>
                      ) : (
                        <span className="italic text-[#6B6862]">- Belum Ada -</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-[#6B6862]">
                      {new Date(dev.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Global Users Management Table */}
      <div className="lab-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E0D7] pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded bg-[#3A5F43]/10 text-[#3A5F43] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#1A1A1A]">
                Kelola Pengguna Global System ({users.length})
              </h3>
              <p className="text-[11px] text-[#6B6862]">
                Pengaturan peran global pengguna (Superadmin / User biasa).
              </p>
            </div>
          </div>
        </div>

        {loadingUsers ? (
          <div className="py-8 text-center text-[#6B6862]">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#3A5F43]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2E0D7] text-[10px] font-mono text-[#6B6862] uppercase tracking-wider bg-[#F9F8F3]">
                  <th className="py-2.5 px-3">Nama Pengguna</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role Global</th>
                  <th className="py-2.5 px-3">Terdaftar Pada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E0D7]">
                {users.map((usr) => (
                  <tr key={usr.id} className="hover:bg-[#F9F8F3] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#1A1A1A]">
                      {usr.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#6B6862]">
                      {usr.email}
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={usr.global_role}
                        onChange={(e) => handleRoleChange(usr.id, e.target.value)}
                        className="font-mono text-[10px] font-bold px-2 py-1 bg-[#F9F8F3] border border-[#E2E0D7] rounded text-[#1A1A1A]"
                      >
                        <option value="user">USER</option>
                        <option value="superadmin">SUPERADMIN</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-[#6B6862]">
                      {new Date(usr.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Device Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1A1A1A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F1F0EA] border border-[#E2E0D7] rounded-sm w-full max-w-md shadow-xl p-5 space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#E2E0D7] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
                Generate Instrumen Baru
              </h3>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-[#6B6862] hover:text-[#1A1A1A]"
              >
                &times;
              </button>
            </div>

            {!generatedResult ? (
              <form onSubmit={handleGenerateDevice} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[#6B6862] uppercase mb-1">
                    Custom Device Code (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: MC-0004 (Kosongkan untuk Otomatis)"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#F9F8F3] border border-[#E2E0D7] rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#6B6862] uppercase mb-1">
                    Custom Nama Instrumen (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Maceration Tank 4"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#F9F8F3] border border-[#E2E0D7] rounded font-sans"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E2E0D7]">
                  <button
                    type="button"
                    onClick={() => setIsGenerateModalOpen(false)}
                    className="px-3 py-2 text-xs text-[#6B6862] hover:text-[#1A1A1A]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-4 py-2 bg-[#D97736] text-[#F9F8F3] text-xs font-semibold rounded hover:bg-[#B85F24]"
                  >
                    {generating ? "Membuat..." : "Generate Kredensial"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-[#D97736]/10 border border-[#D97736]/30 rounded text-xs text-[#D97736] space-y-1">
                  <div className="font-bold flex items-center space-x-1">
                    <Key className="w-4 h-4" />
                    <span>PERINGATAN PENTING!</span>
                  </div>
                  <p>
                    Catat <span className="font-bold">DEVICE_SECRET</span> ini sekarang ke file firmware <code className="font-mono bg-white px-1">config.h</code> unit ESP32 Anda. Kredensial ini <span className="underline font-bold">TIDAK AKAN DITAMPILKAN LAGI</span> demi keamanan.
                  </p>
                </div>

                <div className="bg-[#F9F8F3] p-4 rounded border border-[#E2E0D7] font-mono text-xs space-y-2">
                  <div>
                    <span className="text-[#6B6862]">DEVICE_CODE:</span>{" "}
                    <span className="font-bold text-[#1A1A1A] select-all">
                      {generatedResult.device_code}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B6862]">DEVICE_SECRET:</span>{" "}
                    <span className="font-bold text-[#D97736] select-all bg-[#D97736]/10 px-1 py-0.5 rounded">
                      {generatedResult.device_secret}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleCopyCredentials}
                    className="px-3 py-2 bg-[#E2E0D7] text-[#1A1A1A] text-xs font-medium rounded hover:bg-[#D3D0C3] flex items-center space-x-1.5"
                  >
                    {copied ? <Check className="w-4 h-4 text-[#3A5F43]" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Tersalin!" : "Salin Kredensial"}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsGenerateModalOpen(false);
                      setGeneratedResult(null);
                    }}
                    className="px-4 py-2 bg-[#3A5F43] text-[#F9F8F3] text-xs font-semibold rounded hover:bg-[#2F4E36]"
                  >
                    Selesai &amp; Tutup
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
