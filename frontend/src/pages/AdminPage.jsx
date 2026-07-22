import React, { useState, useEffect, useCallback } from "react";
import { adminApi } from "../services/api.js";
import {
  Shield, Plus, Cpu, Users, Copy, Check, AlertCircle, Loader2,
  Key, Pencil, Trash2, X, Search, Unlink, CheckCircle,
} from "lucide-react";

// ── Small helpers ─────────────────────────────────────────────────────────────
function Alert({ type = "error", msg }) {
  if (!msg) return null;
  const isOk = type === "success";
  return (
    <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded border ${
      isOk ? "bg-[#edf5ef] border-[#3A5F43] text-[#3A5F43]"
            : "bg-[#fdf0ee] border-[#C84B31] text-[#C84B31]"
    }`}>
      {isOk ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
      {msg}
    </div>
  );
}

function ConfirmModal({ open, title, description, confirmLabel = "Hapus", onConfirm, onClose, danger = true }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/50 flex items-center justify-center p-4">
      <div className="bg-[#F1F0EA] border border-[#E2E0D7] rounded-sm w-full max-w-sm shadow-xl p-5 space-y-4">
        <h3 className="font-serif text-base font-bold text-[#1A1A1A]">{title}</h3>
        <p className="text-xs text-[#6B6862]">{description}</p>
        <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E0D7]">
          <button onClick={onClose} className="px-3 py-2 text-xs text-[#6B6862] hover:text-[#1A1A1A]">Batal</button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold rounded text-[#F9F8F3] ${
              danger ? "bg-[#C84B31] hover:bg-[#a83827]" : "bg-[#3A5F43] hover:bg-[#2F4E36]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [devices, setDevices]               = useState([]);
  const [users, setUsers]                   = useState([]);
  const [devSearch, setDevSearch]           = useState("");
  const [userSearch, setUserSearch]         = useState("");
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [loadingUsers, setLoadingUsers]     = useState(true);
  const [error, setError]                   = useState(null);

  // Generate Device Modal
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [customName, setCustomName]         = useState("");
  const [generating, setGenerating]         = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [copied, setCopied]                 = useState(false);

  // Edit User Modal
  const [editUser, setEditUser]     = useState(null); // user object being edited
  const [editForm, setEditForm]     = useState({ name: "", email: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editAlert, setEditAlert]   = useState(null);

  // Confirm modals
  const [confirm, setConfirm] = useState(null); // { type, target, label }

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchDevices = useCallback(async (q = devSearch) => {
    setLoadingDevices(true);
    try {
      const res = await adminApi.getDevices(q);
      setDevices(res.devices || []);
    } catch (e) { setError(e.message); }
    finally { setLoadingDevices(false); }
  }, [devSearch]);

  const fetchUsers = useCallback(async (q = userSearch) => {
    setLoadingUsers(true);
    try {
      const res = await adminApi.getUsers(q);
      setUsers(res.users || []);
    } catch (e) { setError(e.message); }
    finally { setLoadingUsers(false); }
  }, [userSearch]);

  useEffect(() => { fetchDevices(""); fetchUsers(""); }, []);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchDevices(devSearch), 350);
    return () => clearTimeout(t);
  }, [devSearch]);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(userSearch), 350);
    return () => clearTimeout(t);
  }, [userSearch]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleGenerateDevice(e) {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await adminApi.generateDevice({ name: customName.trim() || undefined });
      setGeneratedResult(res);
      setCustomName("");
      fetchDevices(devSearch);
    } catch (err) {
      setError(err.message);
    } finally { setGenerating(false); }
  }

  async function handleUnclaimDevice(deviceId) {
    try {
      await adminApi.unclaimDevice(deviceId);
      fetchDevices(devSearch);
    } catch (err) { setError(err.message); }
    finally { setConfirm(null); }
  }

  async function handleDeleteDevice(deviceId) {
    try {
      await adminApi.deleteDevice(deviceId);
      fetchDevices(devSearch);
    } catch (err) { setError(err.message); }
    finally { setConfirm(null); }
  }

  function openEditUser(usr) {
    setEditUser(usr);
    setEditForm({ name: usr.name, email: usr.email });
    setEditAlert(null);
  }

  async function handleEditUserSave(e) {
    e.preventDefault();
    setEditSaving(true);
    setEditAlert(null);
    try {
      await adminApi.editUser(editUser.id, { name: editForm.name, email: editForm.email });
      setEditAlert({ type: "success", msg: "User berhasil diperbarui." });
      fetchUsers(userSearch);
      setTimeout(() => { setEditUser(null); setEditAlert(null); }, 1200);
    } catch (err) {
      setEditAlert({ type: "error", msg: err.message });
    } finally { setEditSaving(false); }
  }

  async function handleDeleteUser(userId) {
    try {
      await adminApi.deleteUser(userId);
      fetchUsers(userSearch);
    } catch (err) { setError(err.message); }
    finally { setConfirm(null); }
  }

  const copyCredentials = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(
      `DEVICE_CODE: ${generatedResult.device_code}\nDEVICE_SECRET: ${generatedResult.device_secret}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputCls = "w-full px-3 py-2 text-xs bg-[#F9F8F3] border border-[#E2E0D7] rounded focus:outline-none focus:border-[#3A5F43] focus:ring-1 focus:ring-[#3A5F43] font-sans text-[#1A1A1A]";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E0D7] pb-4">
        <div>
          <span className="badge-lab bg-[#D97736] text-[#F9F8F3]">SUPERADMIN CONTROL PANEL</span>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mt-1">Administrasi System Maceration</h2>
          <p className="text-xs text-[#6B6862]">Provisioning instrumen, manajemen pengguna, &amp; konfigurasi sistem.</p>
        </div>
        <button
          onClick={() => { setGeneratedResult(null); setIsGenerateOpen(true); }}
          className="px-4 py-2 bg-[#D97736] text-[#F9F8F3] text-xs font-semibold rounded hover:bg-[#B85F24] transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Generate Device Baru
        </button>
      </div>

      {error && (
        <div className="p-3 bg-[#C84B31]/10 border border-[#C84B31]/30 rounded text-xs text-[#C84B31] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ── Devices Table ────────────────────────────────────────────────── */}
      <div className="lab-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E0D7] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#3A5F43]/10 text-[#3A5F43] flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#1A1A1A]">Seluruh Instrumen ({devices.length})</h3>
              <p className="text-[11px] text-[#6B6862]">Claimed &amp; Unclaimed.</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B6862]" />
            <input
              className="pl-8 pr-3 py-1.5 text-xs bg-[#F9F8F3] border border-[#E2E0D7] rounded focus:outline-none focus:border-[#3A5F43] w-48"
              placeholder="Cari kode, nama, pemilik..."
              value={devSearch}
              onChange={(e) => setDevSearch(e.target.value)}
            />
          </div>
        </div>

        {loadingDevices ? (
          <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D97736]" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2E0D7] text-[10px] font-mono text-[#6B6862] uppercase tracking-wider bg-[#F9F8F3]">
                  <th className="py-2.5 px-3">Kode Device</th>
                  <th className="py-2.5 px-3">Nama</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Koneksi</th>
                  <th className="py-2.5 px-3">Pemilik</th>
                  <th className="py-2.5 px-3">Dibuat</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E0D7]">
                {devices.length === 0 ? (
                  <tr><td colSpan={7} className="py-6 text-center text-[#6B6862] italic">Tidak ada data</td></tr>
                ) : devices.map((dev) => (
                  <tr key={dev.id} className="hover:bg-[#F9F8F3] transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#1A1A1A] text-[11px]">{dev.device_code}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#1A1A1A]">{dev.name}</td>
                    <td className="py-2.5 px-3">
                      {dev.status === "claimed" ? (
                        <span className="font-mono text-[10px] font-bold text-[#3A5F43] bg-[#3A5F43]/10 px-2 py-0.5 rounded border border-[#3A5F43]/20">CLAIMED</span>
                      ) : (
                        <span className="font-mono text-[10px] font-bold text-[#D97736] bg-[#D97736]/10 px-2 py-0.5 rounded border border-[#D97736]/20">UNCLAIMED</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px]">
                      {dev.connection_status === "online"
                        ? <span className="text-[#3A5F43] font-bold">ONLINE</span>
                        : <span className="text-[#6B6862]">OFFLINE</span>}
                    </td>
                    <td className="py-2.5 px-3 text-[#6B6862]">
                      {dev.owner_name ? `${dev.owner_name}` : <span className="italic">—</span>}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-[#6B6862]">
                      {new Date(dev.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {dev.status === "claimed" && (
                          <button
                            onClick={() => setConfirm({ type: "unclaim", id: dev.id, label: dev.name })}
                            title="Unclaim"
                            className="p-1 rounded hover:bg-[#D97736]/10 text-[#D97736] transition-colors"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setConfirm({ type: "deleteDevice", id: dev.id, label: dev.name })}
                          title="Hapus Permanen"
                          className="p-1 rounded hover:bg-[#C84B31]/10 text-[#C84B31] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Users Table ──────────────────────────────────────────────────── */}
      <div className="lab-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E0D7] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#3A5F43]/10 text-[#3A5F43] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#1A1A1A]">Kelola Pengguna ({users.length})</h3>
              <p className="text-[11px] text-[#6B6862]">Edit data &amp; hapus akun pengguna.</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B6862]" />
            <input
              className="pl-8 pr-3 py-1.5 text-xs bg-[#F9F8F3] border border-[#E2E0D7] rounded focus:outline-none focus:border-[#3A5F43] w-48"
              placeholder="Cari nama atau email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>
        </div>

        {loadingUsers ? (
          <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#3A5F43]" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2E0D7] text-[10px] font-mono text-[#6B6862] uppercase tracking-wider bg-[#F9F8F3]">
                  <th className="py-2.5 px-3">Nama</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Alat Dimiliki</th>
                  <th className="py-2.5 px-3">Terdaftar</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E0D7]">
                {users.length === 0 ? (
                  <tr><td colSpan={6} className="py-6 text-center text-[#6B6862] italic">Tidak ada data</td></tr>
                ) : users.map((usr) => (
                  <tr key={usr.id} className="hover:bg-[#F9F8F3] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#1A1A1A]">{usr.name}</td>
                    <td className="py-2.5 px-3 font-mono text-[#6B6862]">{usr.email}</td>
                    <td className="py-2.5 px-3">
                      {usr.global_role === "superadmin" ? (
                        <span className="font-mono text-[10px] font-bold text-[#D97736] bg-[#D97736]/10 px-2 py-0.5 rounded border border-[#D97736]/20">SUPERADMIN</span>
                      ) : (
                        <span className="font-mono text-[10px] text-[#6B6862] bg-[#E2E0D7]/50 px-2 py-0.5 rounded border border-[#E2E0D7]">USER</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[#1A1A1A]">{usr.owned_device_count}</td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-[#6B6862]">
                      {new Date(usr.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditUser(usr)}
                          title="Edit User"
                          className="p-1 rounded hover:bg-[#3A5F43]/10 text-[#3A5F43] transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirm({ type: "deleteUser", id: usr.id, label: usr.email })}
                          title="Hapus User"
                          className="p-1 rounded hover:bg-[#C84B31]/10 text-[#C84B31] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Generate Device Modal ─────────────────────────────────────────── */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 bg-[#1A1A1A]/40 flex items-center justify-center p-4">
          <div className="bg-[#F1F0EA] border border-[#E2E0D7] rounded-sm w-full max-w-md shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E0D7] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Generate Instrumen Baru</h3>
              <button onClick={() => setIsGenerateOpen(false)} className="text-[#6B6862] hover:text-[#1A1A1A]"><X className="w-4 h-4" /></button>
            </div>

            {!generatedResult ? (
              <form onSubmit={handleGenerateDevice} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[#6B6862] uppercase mb-1">Nama Instrumen (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Maceration Tank 4"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#F9F8F3] border border-[#E2E0D7] rounded font-sans"
                  />
                  <p className="text-[10px] text-[#6B6862] mt-1">Device code otomatis digenerate secara acak (contoh: MC-a3f82c1b).</p>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E0D7]">
                  <button type="button" onClick={() => setIsGenerateOpen(false)} className="px-3 py-2 text-xs text-[#6B6862]">Batal</button>
                  <button type="submit" disabled={generating} className="px-4 py-2 bg-[#D97736] text-[#F9F8F3] text-xs font-semibold rounded hover:bg-[#B85F24] disabled:opacity-50">
                    {generating ? "Membuat..." : "Generate"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-[#D97736]/10 border border-[#D97736]/30 rounded text-xs text-[#D97736] flex items-start gap-2">
                  <Key className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold mb-0.5">PERINGATAN PENTING!</div>
                    <p>Catat <span className="font-bold">DEVICE_SECRET</span> ini sekarang. <span className="underline font-bold">TIDAK AKAN DITAMPILKAN LAGI.</span></p>
                  </div>
                </div>
                <div className="bg-[#F9F8F3] p-4 rounded border border-[#E2E0D7] font-mono text-xs space-y-2">
                  <div><span className="text-[#6B6862]">DEVICE_CODE: </span><span className="font-bold text-[#1A1A1A] select-all">{generatedResult.device_code}</span></div>
                  <div><span className="text-[#6B6862]">DEVICE_SECRET: </span><span className="font-bold text-[#D97736] select-all bg-[#D97736]/10 px-1 rounded">{generatedResult.device_secret}</span></div>
                </div>
                <div className="flex justify-between pt-2">
                  <button onClick={copyCredentials} className="px-3 py-2 bg-[#E2E0D7] text-[#1A1A1A] text-xs font-medium rounded hover:bg-[#D3D0C3] flex items-center gap-1.5">
                    {copied ? <Check className="w-4 h-4 text-[#3A5F43]" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Tersalin!" : "Salin Kredensial"}
                  </button>
                  <button onClick={() => { setIsGenerateOpen(false); setGeneratedResult(null); }} className="px-4 py-2 bg-[#3A5F43] text-[#F9F8F3] text-xs font-semibold rounded hover:bg-[#2F4E36]">
                    Selesai &amp; Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Edit User Modal ────────────────────────────────────────────────── */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-[#1A1A1A]/40 flex items-center justify-center p-4">
          <div className="bg-[#F1F0EA] border border-[#E2E0D7] rounded-sm w-full max-w-sm shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E0D7] pb-3">
              <h3 className="font-serif text-base font-bold text-[#1A1A1A]">Edit Pengguna</h3>
              <button onClick={() => setEditUser(null)} className="text-[#6B6862] hover:text-[#1A1A1A]"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleEditUserSave} className="space-y-3">
              <div>
                <label className="block text-xs text-[#6B6862] mb-1 font-medium">Nama</label>
                <input className={inputCls} value={editForm.name} onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-[#6B6862] mb-1 font-medium">Email</label>
                <input className={inputCls} type="email" value={editForm.email} onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <Alert type={editAlert?.type} msg={editAlert?.msg} />
              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E0D7]">
                <button type="button" onClick={() => setEditUser(null)} className="px-3 py-2 text-xs text-[#6B6862]">Batal</button>
                <button type="submit" disabled={editSaving} className="px-4 py-2 bg-[#3A5F43] text-[#F9F8F3] text-xs font-semibold rounded hover:bg-[#2F4E36] disabled:opacity-50">
                  {editSaving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Modals ─────────────────────────────────────────────────── */}
      <ConfirmModal
        open={confirm?.type === "unclaim"}
        title="Unclaim Device"
        description={`Apakah yakin ingin unclaim "${confirm?.label}"? Device akan kembali ke status unclaimed dan semua akses pengguna akan dihapus.`}
        confirmLabel="Unclaim"
        danger={false}
        onConfirm={() => handleUnclaimDevice(confirm.id)}
        onClose={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm?.type === "deleteDevice"}
        title="Hapus Device Permanen"
        description={`Apakah yakin ingin MENGHAPUS PERMANEN "${confirm?.label}"? Semua data riwayat dan akses akan ikut terhapus.`}
        confirmLabel="Hapus Permanen"
        onConfirm={() => handleDeleteDevice(confirm.id)}
        onClose={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm?.type === "deleteUser"}
        title="Hapus User"
        description={`Apakah yakin ingin menghapus akun "${confirm?.label}"? Device yang mereka miliki akan menjadi unclaimed.`}
        confirmLabel="Hapus User"
        onConfirm={() => handleDeleteUser(confirm.id)}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
