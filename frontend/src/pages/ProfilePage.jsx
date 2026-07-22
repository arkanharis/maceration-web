import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";
import { User, Lock, Save, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [nameForm, setNameForm] = useState({ name: user?.name || "" });
  const [passForm, setPassForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [nameStatus, setNameStatus] = useState(null); // { type: "success"|"error", msg }
  const [passStatus, setPassStatus] = useState(null);
  const [nameSaving, setNameSaving] = useState(false);
  const [passSaving, setPassSaving] = useState(false);

  async function handleSaveName(e) {
    e.preventDefault();
    if (!nameForm.name.trim()) return;
    setNameSaving(true);
    setNameStatus(null);
    try {
      const res = await authApi.updateMe({ name: nameForm.name.trim() });
      setUser(res.user);
      setNameStatus({ type: "success", msg: "Nama berhasil diperbarui." });
    } catch (err) {
      setNameStatus({ type: "error", msg: err.message });
    } finally {
      setNameSaving(false);
    }
  }

  async function handleSavePassword(e) {
    e.preventDefault();
    if (passForm.new_password !== passForm.confirm) {
      setPassStatus({ type: "error", msg: "Konfirmasi password tidak cocok." });
      return;
    }
    setPassSaving(true);
    setPassStatus(null);
    try {
      await authApi.updateMe({
        current_password: passForm.current_password,
        new_password: passForm.new_password,
      });
      setPassStatus({ type: "success", msg: "Password berhasil diubah." });
      setPassForm({ current_password: "", new_password: "", confirm: "" });
    } catch (err) {
      setPassStatus({ type: "error", msg: err.message });
    } finally {
      setPassSaving(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 text-sm bg-[#F9F8F3] border border-[#E2E0D7] rounded focus:outline-none focus:border-[#3A5F43] focus:ring-1 focus:ring-[#3A5F43] font-sans text-[#1A1A1A] placeholder:text-[#6B6862]";

  const Alert = ({ status }) => {
    if (!status) return null;
    const isOk = status.type === "success";
    return (
      <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded border ${
        isOk ? "bg-[#edf5ef] border-[#3A5F43] text-[#3A5F43]" : "bg-[#fdf0ee] border-[#C84B31] text-[#C84B31]"
      }`}>
        {isOk ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
        {status.msg}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9F8F3] p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded hover:bg-[#E2E0D7] text-[#6B6862] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-serif text-xl font-bold text-[#1A1A1A]">Edit Profil</h1>
            <p className="text-xs text-[#6B6862] font-mono">{user?.email}</p>
          </div>
        </div>

        {/* Avatar + Info */}
        <div className="lab-card p-5 mb-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#3A5F43] flex items-center justify-center text-[#F9F8F3] text-xl font-serif font-bold shrink-0">
            {(user?.name || user?.email || "?")[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-[#1A1A1A] text-sm">{user?.name}</div>
            <div className="text-xs text-[#6B6862]">{user?.email}</div>
            <div className="font-mono text-[10px] mt-0.5">
              {user?.global_role === "superadmin" ? (
                <span className="text-[#D97736] font-bold uppercase">Superadmin</span>
              ) : (
                <span className="text-[#6B6862] uppercase">User</span>
              )}
            </div>
          </div>
        </div>

        {/* Edit Nama */}
        <div className="lab-card p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-[#3A5F43]" />
            <h2 className="font-semibold text-sm text-[#1A1A1A]">Ubah Nama</h2>
          </div>
          <form onSubmit={handleSaveName} className="space-y-3">
            <div>
              <label className="block text-xs text-[#6B6862] mb-1 font-medium">Nama Tampilan</label>
              <input
                className={inputClass}
                value={nameForm.name}
                onChange={(e) => setNameForm({ name: e.target.value })}
                placeholder="Nama lengkap"
              />
            </div>
            <Alert status={nameStatus} />
            <button
              type="submit"
              disabled={nameSaving}
              className="flex items-center gap-2 px-4 py-2 bg-[#3A5F43] text-[#F9F8F3] text-xs font-medium rounded hover:bg-[#2F4E36] transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {nameSaving ? "Menyimpan..." : "Simpan Nama"}
            </button>
          </form>
        </div>

        {/* Ganti Password */}
        <div className="lab-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-[#D97736]" />
            <h2 className="font-semibold text-sm text-[#1A1A1A]">Ganti Password</h2>
          </div>
          <form onSubmit={handleSavePassword} className="space-y-3">
            <div>
              <label className="block text-xs text-[#6B6862] mb-1 font-medium">Password Saat Ini</label>
              <input
                type="password"
                className={inputClass}
                value={passForm.current_password}
                onChange={(e) => setPassForm((p) => ({ ...p, current_password: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs text-[#6B6862] mb-1 font-medium">Password Baru</label>
              <input
                type="password"
                className={inputClass}
                value={passForm.new_password}
                onChange={(e) => setPassForm((p) => ({ ...p, new_password: e.target.value }))}
                placeholder="Min. 8 karakter"
              />
            </div>
            <div>
              <label className="block text-xs text-[#6B6862] mb-1 font-medium">Konfirmasi Password Baru</label>
              <input
                type="password"
                className={inputClass}
                value={passForm.confirm}
                onChange={(e) => setPassForm((p) => ({ ...p, confirm: e.target.value }))}
                placeholder="Ulangi password baru"
              />
            </div>
            <Alert status={passStatus} />
            <button
              type="submit"
              disabled={passSaving}
              className="flex items-center gap-2 px-4 py-2 bg-[#D97736] text-[#F9F8F3] text-xs font-medium rounded hover:bg-[#c06826] transition-colors disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              {passSaving ? "Menyimpan..." : "Ubah Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
