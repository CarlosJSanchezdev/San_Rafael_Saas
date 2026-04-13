import { useState } from "react";
import { motion } from "framer-motion";
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineUser, HiOutlineMenuAlt2 } from "react-icons/hi";
import HomeNavbar from "../components/HomeNavbar";
import { useToast } from "../context/ToastContext";
import "./Contacto.css";

export default function Contacto() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    asunto: "",
    mensaje: "",
  });
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    showToast("Mensaje enviado correctamente. Te contactaremos pronto.", "success");
    setFormData({ nombre: "", email: "", telefono: "", asunto: "", mensaje: "" });
    setEnviando(false);
  };

  return (
    <div className="contacto-page">
      <HomeNavbar />
      
      <motion.div 
        className="contacto-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h1>Contáctanos</h1>
        <p>Estamos aquí para ayudarte. Escríbenos y te responderemos pronto.</p>
      </motion.div>

      <div className="contacto-container">
        <motion.div 
          className="contacto-info glass-card"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2>Información de Contacto</h2>
          
          <div className="info-item">
            <div className="info-icon">
              <HiOutlineLocationMarker />
            </div>
            <div className="info-content">
              <h3>Dirección</h3>
              <p>San Rafael, Antioquia</p>
              <p>Colombia</p>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon">
              <HiOutlinePhone />
            </div>
            <div className="info-content">
              <h3>Teléfono</h3>
              <p>+57 300 123 4567</p>
              <p>+57 4 123 4567</p>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon">
              <HiOutlineMail />
            </div>
            <div className="info-content">
              <h3>Email</h3>
              <p>contacto@sanrafael.com</p>
              <p>ventas@sanrafael.com</p>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon">
              <HiOutlineMenuAlt2 />
            </div>
            <div className="info-content">
              <h3>Horario de Atención</h3>
              <p>Lunes a Viernes: 8am - 6pm</p>
              <p>Sábados: 9am - 2pm</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="contacto-form glass-card"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2>Envíanos un Mensaje</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre completo *</label>
                <div className="input-wrapper">
                  <HiOutlineUser className="input-icon" />
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    placeholder="Tu nombre"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <div className="input-wrapper">
                  <HiOutlinePhone className="input-icon" />
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+57 300 123 4567"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Email *</label>
              <div className="input-wrapper">
                <HiOutlineMail className="input-icon" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Asunto *</label>
              <input
                type="text"
                value={formData.asunto}
                onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                required
                placeholder="¿Sobre qué necesitas información?"
              />
            </div>

            <div className="form-group">
              <label>Mensaje *</label>
              <textarea
                value={formData.mensaje}
                onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                required
                placeholder="Escribe tu mensaje aquí..."
                rows={5}
              />
            </div>

            <button type="submit" className="btn-enviar" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar Mensaje"}
            </button>
          </form>
        </motion.div>
      </div>

      <motion.div 
        className="contacto-mapa glass-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2>Nuestra Ubicación</h2>
        <div className="mapa-placeholder">
          <HiOutlineLocationMarker />
          <p>San Rafael, Antioquia, Colombia</p>
        </div>
      </motion.div>
    </div>
  );
}
