/**
 * Cliente HTTP centralizado para el frontend.
 * - Si VITE_API_URL está vacío, usa paths relativos (para proxy de Vite en producción)
 * - El token ahora se envía automáticamente via cookie HttpOnly (configurado en backend).
 * - Mantenemos fallback con sessionStorage para backwards compatibility.
 */
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// ── Interceptor de petición: envía token via header como fallback ──────────────────────
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("userToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Interceptor de respuesta: redirige al login si el token expiró ───────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("userToken");
      sessionStorage.removeItem("userEmail");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
