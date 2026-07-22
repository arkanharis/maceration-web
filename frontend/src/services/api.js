const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

/**
 * Base fetch wrapper for backend REST API.
 * Automatically attaches Authorization header if token exists in localStorage.
 * Handles JSON parsing and error response extraction.
 */
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed (${response.status})`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ── Auth Endpoints ────────────────────────────────────────────────────────────
export const authApi = {
  login: (credentials) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  register: (userData) =>
    apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  getMe: () => apiFetch("/auth/me"),

  updateMe: (data) =>
    apiFetch("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ── Device Endpoints ──────────────────────────────────────────────────────────
export const deviceApi = {
  getDevices: () => apiFetch("/devices"),

  getDevice: (id) => apiFetch(`/devices/${id}`),

  claimDevice: (deviceCode, deviceSecret) =>
    apiFetch("/devices/claim", {
      method: "POST",
      body: JSON.stringify({ device_code: deviceCode, device_secret: deviceSecret }),
    }),

  updateDevice: (id, data) =>
    apiFetch(`/devices/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  releaseDevice: (id) =>
    apiFetch(`/devices/${id}`, {
      method: "DELETE",
    }),

  sendCommand: (id, command) =>
    apiFetch(`/devices/${id}/command`, {
      method: "POST",
      body: JSON.stringify(command),
    }),

  getHistory: (id, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/devices/${id}/history${query ? `?${query}` : ""}`);
  },

  getEvents: (id, limit = 100) => apiFetch(`/devices/${id}/events?limit=${limit}`),

  getAccessList: (id) => apiFetch(`/devices/${id}/access`),

  grantAccess: (id, data) =>
    apiFetch(`/devices/${id}/access`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateAccessRole: (id, userId, role) =>
    apiFetch(`/devices/${id}/access/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  revokeAccess: (id, userId) =>
    apiFetch(`/devices/${id}/access/${userId}`, {
      method: "DELETE",
    }),
};

// ── Admin Endpoints ───────────────────────────────────────────────────────────
export const adminApi = {
  getDevices: (search = "") =>
    apiFetch(`/admin/devices${search ? `?search=${encodeURIComponent(search)}` : ""}`),

  generateDevice: (data) =>
    apiFetch("/admin/devices", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  unclaimDevice: (id) =>
    apiFetch(`/admin/devices/${id}/claim`, { method: "DELETE" }),

  deleteDevice: (id) =>
    apiFetch(`/admin/devices/${id}`, { method: "DELETE" }),

  getUsers: (search = "") =>
    apiFetch(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ""}`),

  editUser: (id, data) =>
    apiFetch(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteUser: (id) =>
    apiFetch(`/admin/users/${id}`, { method: "DELETE" }),
};

export const userApi = {
  getUserById: (id) => apiFetch(`/users/${id}`),
};
