import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Beaker, LogOut, User, ShieldCheck } from "lucide-react";

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
    <header className="bg-[#F1F0EA] border-b border-[#E2E0D7] px-4 py-3 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded bg-[#3A5F43] flex items-center justify-center text-[#F9F8F3] shadow-sm group-hover:bg-[#2F4E36] transition-colors">
            <Beaker className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold tracking-tight text-[#1A1A1A] leading-tight">
              MACERATION<span className="text-[#D97736]">.LAB</span>
            </h1>
            <p className="text-[10px] font-mono text-[#6B6862] tracking-wider uppercase">
              Scientific Extraction Telemetry
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-3">
          {user && (
            <Link
              to="/dashboard"
              className="px-3 py-1.5 rounded text-xs font-mono font-semibold bg-[#3A5F43]/10 text-[#3A5F43] border border-[#3A5F43]/20 hover:bg-[#3A5F43] hover:text-[#F9F8F3] transition-colors"
            >
              DASHBOARD TELEMETRI
            </Link>
          )}
          {user?.global_role === "superadmin" && (
            <Link
              to="/admin"
              className="px-3 py-1.5 rounded text-xs font-mono font-semibold bg-[#D97736]/10 text-[#D97736] border border-[#D97736]/20 hover:bg-[#D97736] hover:text-[#F9F8F3] transition-colors hidden md:inline-block"
            >
              ADMIN PANEL
            </Link>
          )}
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link
                to="/profile"
                className="flex items-center space-x-2 text-xs text-[#6B6862] hover:text-[#1A1A1A] transition-colors group"
              >
                <div className="w-7 h-7 rounded-full bg-[#E2E0D7] flex items-center justify-center text-[#1A1A1A] group-hover:bg-[#3A5F43] group-hover:text-[#F9F8F3] transition-colors font-semibold text-xs">
                  {(user?.name || user?.email || "?")[0].toUpperCase()}
                </div>
                <div className="hidden sm:block text-right">
                  <div className="font-semibold text-[#1A1A1A] text-xs group-hover:text-[#3A5F43] transition-colors">
                    {user.name || user.email}
                  </div>
                  <div className="font-mono text-[10px] text-[#6B6862]">
                    {user.global_role === "superadmin" ? (
                      <span className="text-[#D97736] font-bold flex items-center gap-0.5 justify-end">
                        <ShieldCheck className="w-3 h-3 inline" /> SUPERADMIN
                      </span>
                    ) : (
                      "USER"
                    )}
                  </div>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 text-xs font-medium text-[#6B6862] hover:text-[#C84B31] px-2.5 py-1.5 rounded border border-[#E2E0D7] hover:border-[#C84B31] transition-colors bg-[#F9F8F3]"
                title="Keluar"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2 text-xs">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded text-[#1A1A1A] font-medium hover:bg-[#E2E0D7] transition-colors"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 rounded bg-[#3A5F43] text-[#F9F8F3] font-medium hover:bg-[#2F4E36] transition-colors shadow-sm"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
