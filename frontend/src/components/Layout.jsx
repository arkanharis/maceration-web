import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";

export default function Layout({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col font-sans text-[#1A1A1A]">
      <Navbar user={user} onLogout={onLogout} />

      <div className="flex flex-1">
        {/* Render Sidebar only when user is logged in */}
        {user && <Sidebar user={user} />}

        {/* Main Content Viewport */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
