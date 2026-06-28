import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import HomeNavbar from "../components/HomeNavbar";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new URLSearchParams();
      data.append("username", email);
      data.append("password", password);

      const response = await api.post("/auth/login", data, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      await login(email, response.data.token || "");
      showToast("Bienvenido!", "success");
      navigate("/admin");
    } catch {
      showToast("Correo o contraseña incorrectos", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <HomeNavbar />
      <div className="login-box">
        <h2>Bienvenido</h2>
        <p>Inicia sesión en tu cuenta</p>
        <form onSubmit={handleSubmit} className="formulario-login">
          <label htmlFor="login-email" className="sr-only">Correo electrónico</label>
          <input
            id="login-email"
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="login-password" className="sr-only">Contraseña</label>
          <input
            id="login-password"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </button>
        </form>
        <p className="switch-link">
          <Link to="/recuperar-password">¿Olvidaste tu contraseña?</Link>
        </p>
        <p className="switch-link">
          ¿No tienes cuenta?
          <Link to="/registro">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
