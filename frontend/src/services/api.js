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
};
