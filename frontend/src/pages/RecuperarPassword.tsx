import { useState } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "../context/ToastContext";
import HomeNavbar from "../components/HomeNavbar";
import "./RecuperarPassword.css";

export default function RecuperarPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [step] = useState(token ? "reset" : "request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("http://localhost:8000/auth/recuperar-password", null, {
        params: { email }
      });
      showToast("Si el correo existe, recibirás un enlace de recuperación", "success");
      setTimeout(() => window.location.href = "/login", 3000);
    } catch (error) {
      showToast("Error al solicitar recuperación", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast("Las contraseñas no coinciden", "error");
      return;
    }
    setLoading(true);
    try {
      await axios.post("http://localhost:8000/auth/reset-password", null, {
        params: { token, nueva_password: password }
      });
      showToast("Contraseña actualizada correctamente", "success");
      setTimeout(() => window.location.href = "/login", 2000);
    } catch (error) {
      showToast("Token inválido o expirado", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recuperar-container">
      <HomeNavbar />
      <motion.div 
        className="recuperar-box"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>Recuperar Contraseña</h2>
        <p>
          {step === "request" 
            ? "Ingresa tu correo electrónico para recibir un enlace de recuperación"
            : "Ingresa tu nueva contraseña"
          }
        </p>

        {step === "request" ? (
          <form onSubmit={handleRequest}>
            <div className="form-group">
              <label>Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Enviando..." : "Enviar Enlace"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <div className="form-group">
              <label>Nueva Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirmar Contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Actualizando..." : "Cambiar Contraseña"}
            </button>
          </form>
        )}

        <p className="switch-link">
          ¿Recordaste tu contraseña?
          <Link to="/login">Inicia sesión</Link>
        </p>
      </motion.div>
    </div>
  );
}
