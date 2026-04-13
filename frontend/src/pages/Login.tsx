import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import HomeNavbar from "../components/HomeNavbar";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = new URLSearchParams();
      data.append("username", email);
      data.append("password", password);

      const response = await axios.post("http://localhost:8000/auth/login", data, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      await login(email, response.data.token || "");
      showToast("Bienvenido!", "success");
      navigate("/admin");
    } catch (error) {
      showToast("Correo o contraseña incorrectos", "error");
    }
  };

  return (
    <div className="login-container">
      <HomeNavbar />
      <div className="login-box">
        <h2>Bienvenido</h2>
        <p>Inicia sesión en tu cuenta</p>
        <form onSubmit={handleSubmit} className="formulario-login">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Iniciar Sesión</button>
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
