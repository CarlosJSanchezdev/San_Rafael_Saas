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
          className="contacto-info"
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
              <p>Santiago de Cali, Valle del Cauca</p>
              <p>Colombia</p>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon">
              <HiOutlinePhone />
            </div>
            <div className="info-content">
              <h3>Teléfono</h3>
              <p>+57 3176913321</p>
              <p>+57 6023231279</p>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon">
              <HiOutlineMail />
            </div>
            <div className="info-content">
              <h3>Email</h3>
              <p>contactodesarrollosanrafael@srf.com</p>
              <p>ventasdesarrollosanrafael@srf.com</p>
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
          className="contacto-form"
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
        className="contacto-mapa"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2>Nuestra Ubicación</h2>
        <div className="mapa-contenedor">
          <iframe
            title="Ubicación en Google Maps"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3982.8!2d-76.5199!3d3.430528!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM8KwMicJzI2LjgiTiA3NsKwMzEnMDYuNiJX!5e0!3m2!1ses!2sco!4v1&hl=es"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="mapa-iframe"
          />
        </div>
      </motion.div>
    </div>
  );
}
