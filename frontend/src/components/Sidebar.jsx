import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Cpu, Share2, Shield, Activity } from "lucide-react";

export default function Sidebar({ user }) {
  const location = useLocation();
  const isSuperadmin = user?.global_role === "superadmin";

  const navItems = [
    {
      to: "/",
      label: "Dashboard Utama",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      to: { pathname: "/devices", search: "?filter=owned" },
      label: "Alat Saya (Owner)",
      icon: Cpu,
    },
    {
      to: { pathname: "/devices", search: "?filter=shared" },
      label: "Dibagikan ke Saya",
      icon: Share2,
    },
  ];

  const isActiveItem = (item) => {
    if (typeof item.to === "string") {
      if (item.to === "/") {
        return (
          location.pathname === "/" ||
          (location.pathname === "/devices" && (location.search === "" || location.search === "?filter=all"))
        );
      }
      return location.pathname === item.to;
    }
    return location.pathname === item.to.pathname && location.search === item.to.search;
  };

  return (
    <aside className="w-64 bg-[#F1F0EA] border-r border-[#E2E0D7] p-4 flex flex-col justify-between min-h-[calc(100vh-61px)]">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div>
          <div className="text-[10px] font-mono text-[#6B6862] uppercase tracking-wider mb-2 px-3">
            Navigasi Lab
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActiveItem(item);
              return (
                <NavLink
                  key={typeof item.to === "string" ? item.to : `${item.to.pathname}${item.to.search}`}
                  to={item.to}
                  end={item.exact}
                  className={() =>
                    `flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                      active
                        ? "bg-[#3A5F43] text-[#F9F8F3] shadow-sm font-semibold"
                        : "text-[#1A1A1A] hover:bg-[#E2E0D7] hover:text-[#1A1A1A]"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Superadmin Section */}
        {isSuperadmin && (
          <div>
            <div className="text-[10px] font-mono text-[#D97736] font-bold uppercase tracking-wider mb-2 px-3">
              Administrasi System
            </div>
            <nav className="space-y-1">
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#D97736] text-[#F9F8F3] shadow-sm font-semibold"
                      : "text-[#1A1A1A] hover:bg-[#E2E0D7]"
                  }`
                }
              >
                <Shield className="w-4 h-4 shrink-0" />
                <span>Panel Superadmin</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* System Status Footer */}
      <div className="border-t border-[#E2E0D7] pt-3 text-[11px] text-[#6B6862]">
        <div className="flex items-center space-x-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#3A5F43] animate-pulse-live" />
          <span className="font-mono text-[10px]">MQTT Broker: Connected</span>
        </div>
        <div className="font-mono text-[9px] text-[#6B6862]">
          v1.0.0 &bull; Scientific Engine
        </div>
      </div>
    </aside>
  );
}
