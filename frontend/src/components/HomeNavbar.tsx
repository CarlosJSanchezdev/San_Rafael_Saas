import { Link } from "react-router-dom";
import { HiOutlineMenu, HiOutlineX, HiOutlineUser } from "react-icons/hi";
import { useState } from "react";
import "./HomeNavbar.css";

export default function HomeNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="home-navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-text">SRF</span>
          <span className="logo-subtitle">Desarrollo</span>
        </Link>

        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <a href="#servicios" onClick={() => setMenuOpen(false)}>Servicios</a>
          <a href="#sectores" onClick={() => setMenuOpen(false)}>Sectores</a>
          <Link to="/contacto" onClick={() => setMenuOpen(false)}>Contacto</Link>
        </div>

        <div className="navbar-actions">
          <Link to="/admin" className="navbar-icon admin-link" title="Panel de Administración">
            <HiOutlineUser />
          </Link>
          <Link to="/contacto" className="btn-crear-tienda">Crear mi Tienda</Link>
        </div>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <HiOutlineX /> : <HiOutlineMenu />}
        </button>
      </div>
    </nav>
  );
}
