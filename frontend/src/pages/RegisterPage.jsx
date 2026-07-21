import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { UserPlus, AlertCircle, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password) {
      setError("Semua bidang formulir wajib diisi");
      return;
    }

    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter");
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password });
      navigate("/");
    } catch (err) {
      setError(err.message || "Gagal mendaftarkan akun baru.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12">
      <div className="lab-card p-6 shadow-sm space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#D97736]/10 text-[#D97736] flex items-center justify-center mx-auto">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">
            Daftar Akun Baru
          </h2>
          <p className="text-xs text-[#6B6862]">
            Buat akun untuk memantau dan mengontrol instrumen maserasi.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-[#C84B31]/10 border border-[#C84B31]/30 rounded text-xs text-[#C84B31] flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. Arkan Haris"
              disabled={loading}
              className="w-full text-xs px-3 py-2 bg-[#F9F8F3] border border-[#E2E0D7] rounded focus:outline-none focus:border-[#3A5F43] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
              Alamat Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={loading}
              className="w-full text-xs px-3 py-2 bg-[#F9F8F3] border border-[#E2E0D7] rounded focus:outline-none focus:border-[#3A5F43] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
              Kata Sandi (Min 6 karakter)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full text-xs px-3 py-2 bg-[#F9F8F3] border border-[#E2E0D7] rounded focus:outline-none focus:border-[#3A5F43] disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#3A5F43] text-[#F9F8F3] text-xs font-semibold rounded hover:bg-[#2F4E36] transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mendaftarkan...</span>
              </>
            ) : (
              <span>Daftarkan Akun</span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-[#E2E0D7] text-xs text-[#6B6862]">
          Sudah memiliki akun?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#3A5F43] hover:underline"
          >
            Masuk di sini
          </Link>
        </div>

      </div>
    </div>
  );
}
