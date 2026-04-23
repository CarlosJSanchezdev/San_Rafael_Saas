import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import HomeNavbar from "../components/HomeNavbar";
import "./Registro.css";

export default function Registro() {
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("usuario");
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/auth/registro", {
        nombre,
        usuario,
        email,
        password,
        rol
      });
      showToast("Usuario registrado con éxito", "success");
      navigate("/login");
    } catch (err) {
      showToast("Error al registrar usuario", "error");
    }
  };

  return (
    <div className="registro-container">
      <HomeNavbar />
      <div className="registro-box">
        <h2>Crear Cuenta</h2>
        <p>Regístrate para comenzar</p>
        <form onSubmit={handleSubmit} className="formulario-registro">
          <input
            type="text"
            placeholder="Nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
          />
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
          <select value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="usuario">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
          <button type="submit">Registrarse</button>
        </form>
        <p className="switch-link">
          ¿Ya tienes cuenta?
          <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
