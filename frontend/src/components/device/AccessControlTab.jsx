import React, { useState, useEffect } from "react";
import { deviceApi } from "../../services/api.js";
import {
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  UserCheck,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit2,
  AlertTriangle,
} from "lucide-react";

export default function AccessControlTab({ device, onDeviceUpdated, onDeviceReleased }) {
  const [accessList, setAccessList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Share Access Form State
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("operator");
  const [sharing, setSharing] = useState(false);

  // Edit Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(device.name || "");
  const [updatingName, setUpdatingName] = useState(false);

  // Release State
  const [isReleasing, setIsReleasing] = useState(false);

  const fetchAccess = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deviceApi.getAccessList(device.id);
      setAccessList(data.access || []);
    } catch (err) {
      console.error("[AccessControlTab] error fetching access:", err);
      setError(err.message || "Gagal memuat daftar pengguna yang memiliki akses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccess();
  }, [device.id]);

  // Handle Share Access
  const handleShare = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!shareEmail.trim()) {
      setError("Email pengguna wajib diisi");
      return;
    }

    setSharing(true);
    try {
      await deviceApi.grantAccess(device.id, {
        email: shareEmail.trim(),
        role: shareRole,
      });
      setSuccessMsg(`Berhasil membagikan akses ${shareRole.toUpperCase()} ke ${shareEmail}`);
      setShareEmail("");
      fetchAccess();
    } catch (err) {
      setError(err.message || "Gagal membagikan akses.");
    } finally {
      setSharing(false);
    }
  };

  // Handle Role Change
  const handleRoleChange = async (userId, role) => {
    setError(null);
    setSuccessMsg(null);
    try {
      await deviceApi.updateAccessRole(device.id, userId, role);
      setSuccessMsg("Peran pengguna berhasil diperbarui.");
      fetchAccess();
    } catch (err) {
      setError(err.message || "Gagal memperbarui peran.");
    }
  };

  // Handle Revoke Access
  const handleRevoke = async (userId, email) => {
    if (!window.confirm(`Yakin ingin mencabut akses untuk ${email}?`)) return;

    setError(null);
    setSuccessMsg(null);
    try {
      await deviceApi.revokeAccess(device.id, userId);
      setSuccessMsg(`Akses untuk ${email} berhasil dicabut.`);
      fetchAccess();
    } catch (err) {
      setError(err.message || "Gagal mencabut akses.");
    }
  };

  // Handle Update Name
  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setUpdatingName(true);
    setError(null);
    try {
      const updated = await deviceApi.updateDevice(device.id, { name: newName.trim() });
      setIsEditingName(false);
      setSuccessMsg("Nama instrumen berhasil diubah.");
      if (onDeviceUpdated) onDeviceUpdated(updated.device);
    } catch (err) {
      setError(err.message || "Gagal mengubah nama instrumen.");
    } finally {
      setUpdatingName(false);
    }
  };

  // Handle Release Device
  const handleRelease = async () => {
    const confirmCode = prompt(
      `Peringatan: Melepas alat akan membuat status alat menjadi UNCLAIMED dan mencabut semua akses pengguna.\n\nKetik '${device.device_code}' untuk mengonfirmasi:`
    );

    if (confirmCode !== device.device_code) {
      if (confirmCode !== null) alert("Kode instrumen tidak cocok. Pembatalan pelepas alat.");
      return;
    }

    setIsReleasing(true);
    try {
      await deviceApi.releaseDevice(device.id);
      if (onDeviceReleased) onDeviceReleased();
    } catch (err) {
      setError(err.message || "Gagal melepas instrumen.");
      setIsReleasing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {error && (
        <div className="p-3 bg-[#C84B31]/10 border border-[#C84B31]/30 rounded text-xs text-[#C84B31] flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-[#3A5F43]/10 border border-[#3A5F43]/30 rounded text-xs text-[#3A5F43] flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. Device Info & Rename Box */}
      <div className="lab-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E0D7] pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded bg-[#3A5F43]/10 text-[#3A5F43] flex items-center justify-center">
              <Edit2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#1A1A1A]">
                Identitas Instrumen
              </h3>
              <p className="text-[11px] text-[#6B6862]">
                Ubah nama instrumen maserasi ini untuk mempermudah identifikasi tim.
              </p>
            </div>
          </div>
        </div>

        {isEditingName ? (
          <form onSubmit={handleUpdateName} className="flex items-center space-x-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="text-xs px-3 py-2 bg-[#F9F8F3] border border-[#E2E0D7] rounded focus:outline-none focus:border-[#3A5F43] flex-1 text-[#1A1A1A]"
            />
            <button
              type="submit"
              disabled={updatingName}
              className="px-3 py-2 bg-[#3A5F43] text-[#F9F8F3] text-xs font-semibold rounded hover:bg-[#2F4E36]"
            >
              {updatingName ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditingName(false)}
              className="px-3 py-2 bg-[#E2E0D7] text-[#1A1A1A] text-xs rounded hover:bg-[#D3D0C3]"
            >
              Batal
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between bg-[#F9F8F3] p-3 rounded border border-[#E2E0D7]">
            <div>
              <div className="font-serif text-base font-bold text-[#1A1A1A]">
                {device.name}
              </div>
              <div className="font-mono text-xs text-[#6B6862]">
                Kode: {device.device_code}
              </div>
            </div>
            <button
              onClick={() => {
                setNewName(device.name);
                setIsEditingName(true);
              }}
              className="px-3 py-1.5 border border-[#E2E0D7] hover:bg-[#E2E0D7] text-xs font-medium rounded transition-colors"
            >
              Ubah Nama
            </button>
          </div>
        )}
      </div>

      {/* 2. Invite User Form & Access List */}
      <div className="lab-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E0D7] pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded bg-[#3A5F43]/10 text-[#3A5F43] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#1A1A1A]">
                Daftar Pengguna Berbagi Akses
              </h3>
              <p className="text-[11px] text-[#6B6862]">
                Kelola siapa saja yang diizinkan memantau (Viewer) atau mengoperasikan (Operator) alat ini.
              </p>
            </div>
          </div>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleShare} className="bg-[#F9F8F3] p-4 rounded border border-[#E2E0D7] space-y-3">
          <div className="text-xs font-semibold text-[#1A1A1A] flex items-center space-x-1.5">
            <UserPlus className="w-4 h-4 text-[#3A5F43]" />
            <span>Bagikan Akses ke Pengguna Lain</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="email"
              required
              placeholder="Email pengguna terdaftar..."
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              className="sm:col-span-2 text-xs px-3 py-2 bg-[#F1F0EA] border border-[#E2E0D7] rounded focus:outline-none focus:border-[#3A5F43] text-[#1A1A1A]"
            />
            <div className="flex items-center space-x-2">
              <select
                value={shareRole}
                onChange={(e) => setShareRole(e.target.value)}
                className="text-xs px-2 py-2 bg-[#F1F0EA] border border-[#E2E0D7] rounded focus:outline-none focus:border-[#3A5F43] font-mono text-[#1A1A1A] flex-1"
              >
                <option value="operator">Operator</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={sharing}
                className="px-3 py-2 bg-[#3A5F43] text-[#F9F8F3] text-xs font-semibold rounded hover:bg-[#2F4E36] shrink-0 disabled:opacity-50"
              >
                {sharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Undang"}
              </button>
            </div>
          </div>
        </form>

        {/* Access List Table */}
        {loading ? (
          <div className="py-6 text-center text-[#6B6862]">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#3A5F43]" />
          </div>
        ) : (
          <div className="space-y-2">
            {accessList.map((acc) => (
              <div
                key={acc.id}
                className="bg-[#F9F8F3] p-3 rounded border border-[#E2E0D7] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-[#1A1A1A]">{acc.name}</div>
                  <div className="font-mono text-[10px] text-[#6B6862]">{acc.email}</div>
                </div>

                <div className="flex items-center space-x-3">
                  {acc.role === "owner" ? (
                    <span className="font-mono text-[10px] font-bold text-[#3A5F43] bg-[#3A5F43]/10 border border-[#3A5F43]/30 px-2 py-0.5 rounded">
                      PEMILIK (OWNER)
                    </span>
                  ) : (
                    <>
                      <select
                        value={acc.role}
                        onChange={(e) => handleRoleChange(acc.user_id, e.target.value)}
                        className="font-mono text-[10px] font-bold px-2 py-1 bg-[#F1F0EA] border border-[#E2E0D7] rounded text-[#1A1A1A]"
                      >
                        <option value="operator">OPERATOR</option>
                        <option value="viewer">VIEWER</option>
                      </select>

                      <button
                        onClick={() => handleRevoke(acc.user_id, acc.email)}
                        className="p-1 text-[#C84B31] hover:bg-[#C84B31]/10 rounded transition-colors"
                        title="Cabut Akses"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Danger Zone (Release Device) */}
      <div className="lab-card p-5 border-[#C84B31]/30 bg-[#C84B31]/5 space-y-3">
        <div className="flex items-center space-x-2 text-[#C84B31]">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-serif text-base font-bold">Zona Bahaya (Danger Zone)</h3>
        </div>
        <p className="text-xs text-[#6B6862]">
          Melepas instrumen akan menghapus klaim kepemilikan Anda dan mencabut semua akses pengguna lain. Alat akan kembali menjadi status <span className="font-mono font-bold">UNCLAIMED</span>.
        </p>
        <button
          onClick={handleRelease}
          disabled={isReleasing}
          className="px-4 py-2 bg-[#C84B31] text-[#F9F8F3] text-xs font-semibold rounded hover:bg-[#A83B23] transition-colors shadow-xs"
        >
          {isReleasing ? "Melepas Alat..." : "Lepas Kepemilikan Instrumen Ini"}
        </button>
      </div>
    </div>
  );
}
