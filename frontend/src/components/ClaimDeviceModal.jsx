import React, { useState } from "react";
import { deviceApi } from "../services/api.js";
import { X, Cpu, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function ClaimDeviceModal({ isOpen, onClose, onSuccess }) {
  const [deviceCode, setDeviceCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedCode = deviceCode.trim().toUpperCase();
    if (!trimmedCode) {
      setError("Kode alat wajib diisi (contoh: MC-0001)");
      return;
    }

    setLoading(true);
    try {
      const res = await deviceApi.claimDevice(trimmedCode);
      setSuccessMsg(`Berhasil mengklaim instrumen ${res.device.device_code}!`);
      setDeviceCode("");
      setTimeout(() => {
        onSuccess(res.device);
        onClose();
        setSuccessMsg(null);
      }, 1200);
    } catch (err) {
      setError(err.message || "Gagal mengklaim alat. Periksa kembali kode alat.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#F1F0EA] border border-[#E2E0D7] rounded-sm w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E0D7] bg-[#F9F8F3]">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded bg-[#3A5F43]/10 text-[#3A5F43] flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
              Klaim Instrumen Baru
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-[#6B6862] hover:text-[#1A1A1A] p-1 rounded hover:bg-[#E2E0D7] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-[#6B6862]">
            Masukkan <span className="font-mono font-bold text-[#1A1A1A]">Device Code</span> yang tertera pada stiker instrumen maserasi fisik untuk menghubungkannya dengan akun Anda.
          </p>

          {error && (
            <div className="p-3 bg-[#C84B31]/10 border border-[#C84B31]/30 rounded text-xs text-[#C84B31] flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-[#3A5F43]/10 border border-[#3A5F43]/30 rounded text-xs text-[#3A5F43] flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-[#6B6862] uppercase tracking-wider mb-1">
              Kode Alat (Device Code)
            </label>
            <input
              type="text"
              required
              value={deviceCode}
              onChange={(e) => setDeviceCode(e.target.value.toUpperCase())}
              placeholder="MC-0001"
              disabled={loading}
              className="w-full font-mono text-sm px-3 py-2 bg-[#F9F8F3] border border-[#E2E0D7] rounded focus:outline-none focus:border-[#3A5F43] uppercase tracking-widest text-[#1A1A1A]"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E2E0D7]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-2 text-xs font-medium text-[#6B6862] hover:text-[#1A1A1A] hover:bg-[#E2E0D7] rounded transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#3A5F43] text-[#F9F8F3] text-xs font-semibold rounded hover:bg-[#2F4E36] transition-colors flex items-center space-x-1.5 disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengklaim...</span>
                </>
              ) : (
                <span>Klaim Alat</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
