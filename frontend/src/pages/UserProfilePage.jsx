import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { userApi } from "../services/api.js";
import { Loader2, ArrowLeft, User, Mail, ShieldCheck, AlertCircle } from "lucide-react";

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await userApi.getUserById(id);
        setUser(data.user);
      } catch (err) {
        setError(err.message || "Pengguna tidak ditemukan.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#3A5F43] animate-spin" />
        <span className="font-mono text-xs text-[#6B6862]">Memuat profil pengguna…</span>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-md mx-auto my-12 lab-card p-6 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-[#C84B31] mx-auto" />
        <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Profil Tidak Ditemukan</h3>
        <p className="text-xs text-[#6B6862]">{error || "Pengguna tidak ditemukan."}</p>
        <button
          onClick={() => navigate(-1)}
          className="inline-block px-4 py-2 bg-[#3A5F43] text-[#F9F8F3] text-xs font-semibold rounded"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs text-[#6B6862] hover:text-[#1A1A1A] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      <div className="lab-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-[#3A5F43] flex items-center justify-center text-[#F9F8F3] text-3xl font-serif font-bold">
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#1A1A1A]">{user.name}</h1>
            <p className="text-sm text-[#6B6862]">{user.email}</p>
            <div className="mt-2 inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest px-3 py-1 rounded border border-[#D3D0C3] bg-[#F1F0EA] text-[#1A1A1A]">
              {user.global_role === "superadmin" ? (
                <><ShieldCheck className="w-3.5 h-3.5" /> Superadmin</>
              ) : (
                <>User</>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="lab-card p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#6B6862] mb-2">Tentang</div>
            <p className="text-sm text-[#1A1A1A]">Informasi profil pengguna yang terhubung dengan perangkat.</p>
          </div>
          <div className="lab-card p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#6B6862] mb-2">Metadata</div>
            <div className="space-y-2 text-sm text-[#1A1A1A]">
              <div><strong>Nama:</strong> {user.name}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Peran Global:</strong> {user.global_role}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
