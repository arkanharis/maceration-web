import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children, requireSuperadmin = false }) {
  const { user, loading, isAuthenticated, isSuperadmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#3A5F43] animate-spin" />
        <span className="font-mono text-xs text-[#6B6862]">Memvalidasi sesi lab...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page, preserving requested location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireSuperadmin && !isSuperadmin) {
    // Non-superadmin trying to access superadmin routes -> redirect to dashboard
    return <Navigate to="/" replace />;
  }

  return children;
}
