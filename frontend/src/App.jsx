import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import DeviceDetailPage from "./pages/DeviceDetailPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

export default function App() {
  // Temporary state for testing Task 4.1 routing & layout.
  // Real Auth Context will be added in Task 4.3.
  const [user, setUser] = useState({
    id: "sample-id",
    name: "Dr. Arkan Haris",
    email: "arkan@example.com",
    global_role: "superadmin",
  });

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout user={user} onLogout={handleLogout} />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/devices" element={<DashboardPage />} />
          <Route path="/devices/:id" element={<DeviceDetailPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
