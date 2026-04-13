import { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "../context/ToastContext";
import { 
  HiOutlineUser, 
  HiOutlineBell,
  HiOutlineGlobe,
  HiOutlineSave
} from "react-icons/hi";
import Layout from "../components/Layout";
import "./Configuracion.css";

export default function Configuracion() {
  const { showToast } = useToast();
  const [perfil, setPerfil] = useState({
    nombre: sessionStorage.getItem("userEmail")?.split("@")[0] || "Usuario",
    email: sessionStorage.getItem("userEmail") || "",
  });
  const [config, setConfig] = useState({
    notificaciones: true,
    idioma: "es",
    zona_horaria: "America/Bogota",
  });
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = () => {
    setGuardando(true);
    setTimeout(() => {
      setGuardando(false);
      showToast("Configuración guardada correctamente", "success");
    }, 1000);
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="page-header">
          <h1>Configuración</h1>
        </div>

        <div className="config-grid">
          <motion.div 
            className="config-section glass-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="config-header">
              <HiOutlineUser />
              <h2>Perfil de Usuario</h2>
            </div>
            <div className="config-form">
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  value={perfil.nombre}
                  onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={perfil.email}
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Nueva Contraseña</label>
                <input
                  type="password"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="config-section glass-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="config-header">
              <HiOutlineBell />
              <h2>Notificaciones</h2>
            </div>
            <div className="config-form">
              <div className="form-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={config.notificaciones}
                    onChange={(e) => setConfig({ ...config, notificaciones: e.target.checked })}
                  />
                  <span className="toggle-switch"></span>
                  <span>Recibir notificaciones por email</span>
                </label>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="config-section glass-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="config-header">
              <HiOutlineGlobe />
              <h2>Regional</h2>
            </div>
            <div className="config-form">
              <div className="form-group">
                <label>Idioma</label>
                <select
                  value={config.idioma}
                  onChange={(e) => setConfig({ ...config, idioma: e.target.value })}
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                </select>
              </div>
              <div className="form-group">
                <label>Zona Horaria</label>
                <select
                  value={config.zona_horaria}
                  onChange={(e) => setConfig({ ...config, zona_horaria: e.target.value })}
                >
                  <option value="America/Bogota">Bogotá (GMT-5)</option>
                  <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                  <option value="America/Buenos_Aires">Buenos Aires (GMT-3)</option>
                  <option value="Europe/Madrid">Madrid (GMT+1)</option>
                </select>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div 
          className="guardar-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button 
            className="btn-guardar"
            onClick={handleGuardar}
            disabled={guardando}
          >
            <HiOutlineSave />
            {guardando ? "Guardando..." : "Guardar Cambios"}
          </button>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
