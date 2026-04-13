import { Link } from "react-router-dom";
import { HiOutlineShoppingCart, HiOutlineUser, HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import { useState } from "react";
import { useCarrito } from "../context/CarritoContext";
import "./PublicNavbar.css";

export default function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { toggleCarrito, cantidadTotal } = useCarrito();

  return (
    <nav className="public-navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-text">SRF</span>
          <span className="logo-subtitle">Tienda</span>
        </Link>

        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Inicio</Link>
          <Link to="/tienda" onClick={() => setMenuOpen(false)}>Tienda</Link>
          <Link to="/nosotros" onClick={() => setMenuOpen(false)}>Nosotros</Link>
          <Link to="/contacto" onClick={() => setMenuOpen(false)}>Contacto</Link>
        </div>

        <div className="navbar-actions">
          <Link to="/admin" className="navbar-icon admin-link" title="Panel de Administración">
            <HiOutlineUser />
          </Link>
          <button className="navbar-icon carrito-btn" onClick={toggleCarrito}>
            <HiOutlineShoppingCart />
            {cantidadTotal > 0 && (
              <span className="carrito-contador">{cantidadTotal}</span>
            )}
          </button>
        </div>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <HiOutlineX /> : <HiOutlineMenu />}
        </button>
      </div>
    </nav>
  );
}
