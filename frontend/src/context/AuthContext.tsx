import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "../api";

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  tienda_id: number | null;  // Para managers
}

interface AuthContextType {
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, token: string) => Promise<boolean>;
  logout: () => void;
  validarSesion: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const validarSesion = async (): Promise<boolean> => {
    const token = sessionStorage.getItem("userToken");
    const email = sessionStorage.getItem("userEmail");

    if (!token || !email) {
      setUsuario(null);
      setLoading(false);
      return false;
    }

    try {
      // El interceptor de api.ts adjuntará ?token=... automáticamente
      const response = await api.get("/auth/validar-token");
      setUsuario(response.data);
      setLoading(false);
      return true;
    } catch (error) {
      sessionStorage.removeItem("userToken");
      sessionStorage.removeItem("userEmail");
      setUsuario(null);
      setLoading(false);
      return false;
    }
  };

  const login = async (email: string, token: string): Promise<boolean> => {
    sessionStorage.setItem("userEmail", email);
    sessionStorage.setItem("userToken", token);
    return await validarSesion();
  };

  const logout = async () => {
    try {
      // El interceptor adjunta el token automáticamente
      await api.post("/auth/cerrar-sesion");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
    sessionStorage.removeItem("userToken");
    sessionStorage.removeItem("userEmail");
    setUsuario(null);
  };

  useEffect(() => {
    validarSesion();
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout, validarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
