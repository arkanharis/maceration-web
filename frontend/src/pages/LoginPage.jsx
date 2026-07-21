import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Beaker, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname || "/";

  // If already logged in, redirect immediately
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email dan kata sandi wajib diisi");
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Gagal masuk. Periksa kembali email & kata sandi Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12">
      <div className="lab-card p-6 shadow-sm space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#3A5F43]/10 text-[#3A5F43] flex items-center justify-center mx-auto">
            <Beaker className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">
            Masuk ke System
          </h2>
          <p className="text-xs text-[#6B6862]">
            Masukkan kredensial Anda untuk mengakses Maceration Controller.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-[#C84B31]/10 border border-[#C84B31]/30 rounded text-xs text-[#C84B31] flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
              Alamat Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              disabled={loading}
              className="w-full text-xs px-3 py-2 bg-[#F9F8F3] border border-[#E2E0D7] rounded focus:outline-none focus:border-[#3A5F43] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
              Kata Sandi
            </label>
            <input
              type="password"
              required
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
                <span>Memproses...</span>
              </>
            ) : (
              <span>Masuk ke Dashboard</span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-[#E2E0D7] text-xs text-[#6B6862]">
          Belum memiliki akun?{" "}
          <Link
            to="/register"
            className="font-semibold text-[#3A5F43] hover:underline"
          >
            Daftar Akun Baru
          </Link>
        </div>

      </div>
    </div>
  );
}
