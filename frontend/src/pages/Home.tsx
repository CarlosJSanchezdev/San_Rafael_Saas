import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import HomeNavbar from "../components/HomeNavbar";
import "./Home.css";

export default function Home() {
  return (
    <div className="home-page">
      {/* Navbar */}
      <HomeNavbar />

      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-content">
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
            <Link to="/contacto" className="btn-primary">Crear mi Tienda</Link>
            <a href="#servicios" className="btn-secondary">Conocer Más</a>
          </motion.div>
        </div>
        <div className="home-hero-bg"></div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="servicios-section">
        <div className="section-header">
          <h2>¿Qué ofrecemos?</h2>
          <p>Soluciones completas para tu negocio digital</p>
        </div>
        <div className="servicios-grid">
          <motion.div
            className="servicio-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="servicio-icon">🏪</div>
            <h3>Tienda Online Personalizada</h3>
            <p>Tu tienda con tu marca, tus colores y tu estilo único</p>
          </motion.div>
          <motion.div
            className="servicio-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="servicio-icon">📦</div>
            <h3>Gestión de Productos</h3>
            <p>Administra tu inventario, precios y categorías fácilmente</p>
          </motion.div>
          <motion.div
            className="servicio-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="servicio-icon">🛒</div>
            <h3>Pedidos y Checkout</h3>
            <p>Proceso de compra optimizado con notificaciones en tiempo real</p>
          </motion.div>
          <motion.div
            className="servicio-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <div className="servicio-icon">📊</div>
            <h3>Analíticas y Reportes</h3>
            <p>Mide visitas, productos populares y conversiones</p>
          </motion.div>
          <motion.div
            className="servicio-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <div className="servicio-icon">🔒</div>
            <h3>Seguridad y Confianza</h3>
            <p>Protección de datos y transacciones seguras</p>
          </motion.div>
          <motion.div
            className="servicio-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <div className="servicio-icon">🚀</div>
            <h3>Escalabilidad</h3>
            <p>Tu tienda crece contigo, sin límites de productos o ventas</p>
          </motion.div>
        </div>
      </section>

      {/* Sectores */}
      <section className="sectores-section">
        <div className="section-header">
          <h2>Para todo tipo de negocios</h2>
          <p>Soluciones adaptadas a tu industria</p>
        </div>
        <div className="sectores-grid">
          <div className="sector-card">🏬 Comercial</div>
          <div className="sector-card">🏭 Industrial</div>
          <div className="sector-card">🛠️ Servicios</div>
          <div className="sector-card">🏠 Residencial</div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>¿Listo para empezar?</h2>
          <p>Contáctanos y crea tu tienda online hoy mismo</p>
          <Link to="/contacto" className="btn-primary">Crear mi Tienda</Link>
        </div>
      </section>

      {/* Footer */}
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
            <p>contacto@srf.com</p>
            <p>+57 300 123 4567</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 SRF. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
