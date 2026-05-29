import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { HiOutlineCube, HiOutlineShoppingCart, HiOutlineChartBar, HiOutlineLockClosed, HiOutlineStar, HiOutlineShoppingBag, HiOutlineOfficeBuilding, HiOutlineCog, HiOutlineHome, HiOutlineArrowRight } from "react-icons/hi";
import HomeNavbar from "../components/HomeNavbar";
import "./Home.css";

const testimonials = [
  {
    name: "María González",
    role: "Dueña de boutique online",
    text: "SRF transformó mi negocio. Pasé de vender por redes sociales a tener mi propia tienda con pasarela de pagos integrada. Las ventas aumentaron un 300%.",
    initials: "MG"
  },
  {
    name: "Carlos Mendoza",
    role: "Propietario Ferretería El Tornillo",
    text: "La gestión de inventario es ahora muy sencilla. Puedo actualizar precios y stock desde el celular. El soporte técnico siempre está disponible.",
    initials: "CM"
  },
  {
    name: "Ana Lucía Herrera",
    role: "Fundadora de marca de cosméticos",
    text: "El diseño de mi tienda refleja perfectamente mi marca. Los clientes nos encuentran en Google y el checkout es súper intuitivo.",
    initials: "AH"
  }
];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="home-page">
      <HomeNavbar />

      <section className="home-hero" ref={heroRef}>
        <motion.div className="floating-orb orb-1" style={{ y }} />
        <motion.div className="floating-orb orb-2" style={{ y }} />
        <motion.div className="floating-orb orb-3" style={{ y }} />
        <div className="home-hero-bg" style={{ opacity }} />
        <motion.div className="home-hero-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Impulsa tu negocio con una{" "}
            <span className="gradient-text">tienda online propia</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Creamos y gestionamos tu tienda digital con tecnología de vanguardia.
            Sin complicaciones, sin código, sin límites.
          </motion.p>
          <motion.div
            className="home-hero-buttons"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link to="/contacto" className="btn-primary">
              <span>Crear mi Tienda</span>
              <HiOutlineArrowRight />
            </Link>
            <a href="#servicios" className="btn-secondary">Conocer Más</a>
          </motion.div>
        </motion.div>
      </section>

      <section id="servicios" className="servicios-section">
        <div className="section-header">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            ¿Qué ofrecemos?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Soluciones completas para tu negocio digital
          </motion.p>
        </div>
        <div className="servicios-grid">
          <motion.div
            className="servicio-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
          >
            <div className="servicio-icon"><HiOutlineShoppingBag /></div>
            <h3>Tienda Online Personalizada</h3>
            <p>Tu tienda con tu marca, tus colores y tu estilo único</p>
          </motion.div>
          <motion.div
            className="servicio-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -8 }}
          >
            <div className="servicio-icon"><HiOutlineCube /></div>
            <h3>Gestión de Productos</h3>
            <p>Administra tu inventario, precios y categorías fácilmente</p>
          </motion.div>
          <motion.div
            className="servicio-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -8 }}
          >
            <div className="servicio-icon"><HiOutlineShoppingCart /></div>
            <h3>Pedidos y Checkout</h3>
            <p>Proceso de compra optimizado con notificaciones en tiempo real</p>
          </motion.div>
          <motion.div
            className="servicio-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -8 }}
          >
            <div className="servicio-icon"><HiOutlineChartBar /></div>
            <h3>Analíticas y Reportes</h3>
            <p>Mide visitas, productos populares y conversiones</p>
          </motion.div>
          <motion.div
            className="servicio-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -8 }}
          >
            <div className="servicio-icon"><HiOutlineLockClosed /></div>
            <h3>Seguridad y Confianza</h3>
            <p>Protección de datos y transacciones seguras</p>
          </motion.div>
          <motion.div
            className="servicio-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            whileHover={{ y: -8 }}
          >
            <div className="servicio-icon"><HiOutlineStar /></div>
            <h3>Escalabilidad</h3>
            <p>Tu tienda crece contigo, sin límites de productos o ventas</p>
          </motion.div>
        </div>
      </section>

      <section id="testimonios" className="testimonios-section">
        <div className="section-header">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Lo que dicen nuestros clientes
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Historias de éxito de negocios como el tuyo
          </motion.p>
        </div>
        <div className="testimonios-grid">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="testimonio-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="testimonio-avatar">{t.initials}</div>
              <p className="testimonio-text">"{t.text}"</p>
              <p className="testimonio-autor">{t.name}</p>
              <p className="testimonioRol">{t.role}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="sectores" className="sectores-section">
        <div className="section-header">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Para todo tipo de negocios
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Soluciones adaptadas a tu industria
          </motion.p>
        </div>
        <div className="sectores-grid">
          <motion.div
            className="sector-card"
            whileHover={{ y: -4 }}
          >
            <HiOutlineOfficeBuilding /> Comercial
          </motion.div>
          <motion.div
            className="sector-card"
            whileHover={{ y: -4 }}
          >
            <HiOutlineCog /> Industrial
          </motion.div>
          <motion.div
            className="sector-card"
            whileHover={{ y: -4 }}
          >
            <HiOutlineCube /> Servicios
          </motion.div>
          <motion.div
            className="sector-card"
            whileHover={{ y: -4 }}
          >
            <HiOutlineHome /> Residencial
          </motion.div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            ¿Listo para empezar?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Contáctanos y crea tu tienda online hoy mismo
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link to="/contacto" className="btn-primary">
              <span>Crear mi Tienda</span>
              <HiOutlineArrowRight />
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="logo-text">SRF</span>
            <p>Empresa de desarrollo de soluciones digitales</p>
          </div>
          <div className="footer-links">
            <h4>Enlaces</h4>
            <Link to="/contacto">Contacto</Link>
            <a href="#servicios">Servicios</a>
          </div>
          <div className="footer-contact">
            <h4>Contacto</h4>
            <p>ContactoSanrafaeldesarrollo@srf.com</p>
            <p>+57 3176913321</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 SRF. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
