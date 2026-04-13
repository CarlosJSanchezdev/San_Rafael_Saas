/**
 * Cliente HTTP centralizado para el frontend.
 * - La baseURL se toma de la variable de entorno VITE_API_URL (configurable por entorno).
 * - Un interceptor añade automáticamente el token de sesión como query param
 *   en todas las peticiones salientes (el backend lo espera como ?token=...).
 */
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
});

// ── Interceptor de petición: adjunta el token si existe ──────────────────────
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("userToken");
  if (token) {
    config.params = { ...config.params, token };
  }
  return config;
});

// ── Interceptor de respuesta: redirige al login si el token expiró ───────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Limpiar sesión y redirigir
      sessionStorage.removeItem("userToken");
      sessionStorage.removeItem("userEmail");
      // Evitar bucle si ya estamos en /login
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
