import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import api from "../api";
import PublicNavbar from "../components/PublicNavbar";
import { useCarrito } from "../context/CarritoContext";
import { useToast } from "../context/ToastContext";
import { HiOutlineShoppingCart, HiOutlineEye, HiOutlinePlus } from "react-icons/hi";
import "./Tienda.css";

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  imagen: string;
  tienda_id: number;
}


export default function Tienda() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const { agregarItem, setTiendaActiva } = useCarrito();
  const { showToast } = useToast();

  useEffect(() => {
    setTiendaActiva(1); // Tienda principal por defecto
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get("/tienda/productos"),
        api.get("/tienda/categorias"),
      ]);
      setProductos(prodRes.data);
      setCategorias(catRes.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const productosFiltrados = productos.filter((p) => {
    const coincideBusqueda =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = !categoriaSeleccionada || p.categoria === categoriaSeleccionada;
    return coincideBusqueda && coincideCategoria;
  });

  return (
    <div className="tienda-page">
      <PublicNavbar />

      <section className="hero">
        <div className="hero-content">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Bienvenido a <span className="gradient-text">SRF Tienda</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Descubre nuestros productos exclusivos con la mejor calidad
          </motion.p>
          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <a href="#productos" className="btn-primary">Ver Productos</a>
            <Link to="/contacto" className="btn-secondary">Contactarnos</Link>
          </motion.div>
        </div>
        <div className="hero-bg"></div>
      </section>

      <section id="productos" className="productos-section">
        <div className="section-header">
          <h2>Nuestros Productos</h2>
          <p>Explora nuestro catálogo completo</p>
        </div>

        <div className="filtros-tienda">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="busqueda-tienda"
          />
          <div className="categorias-filtro">
            <button
              className={`categoria-btn ${!categoriaSeleccionada ? "active" : ""}`}
              onClick={() => setCategoriaSeleccionada("")}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat}
                className={`categoria-btn ${categoriaSeleccionada === cat ? "active" : ""}`}
                onClick={() => setCategoriaSeleccionada(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading">Cargando productos...</div>
        ) : (
          <div className="productos-grid">
            {productosFiltrados.map((producto, index) => (
              <motion.div
                key={producto.id}
                className="producto-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -10 }}
              >
                <div className="producto-imagen">
                  {producto.imagen ? (
                    <img src={producto.imagen} alt={producto.nombre} />
                  ) : (
                    <div className="placeholder-imagen">
                      <HiOutlineShoppingCart />
                    </div>
                  )}
                  <div className="producto-overlay">
                    <Link to={`/tienda/producto/${producto.id}`} className="btn-ver">
                      <HiOutlineEye /> Ver Detalle
                    </Link>
                  </div>
                </div>
                <div className="producto-info">
                  <span className="producto-categoria">{producto.categoria}</span>
                  <h3>{producto.nombre}</h3>
                  <p className="producto-desc">{producto.descripcion?.slice(0, 60)}...</p>
                  <div className="producto-footer">
                    <span className="producto-precio">${producto.precio.toFixed(2)}</span>
                    <button
                      className="btn-agregar-card"
                      onClick={() => {
                        agregarItem({
                          id: producto.id,
                          nombre: producto.nombre,
                          precio: producto.precio,
                          imagen: producto.imagen,
                        }, 1);
                        showToast(`${producto.nombre} agregado`, "success");
                      }}
                    >
                      <HiOutlinePlus />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {productosFiltrados.length === 0 && !loading && (
          <div className="sin-productos">
            <p>No se encontraron productos</p>
          </div>
        )}
      </section>

      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🚚</div>
            <h3>Envío Rápido</h3>
            <p>Entrega a todo el país en 24-48 horas</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Compra Segura</h3>
            <p>Tu información está protegida</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⭐</div>
            <h3>Calidad Garantizada</h3>
            <p>Productos de primera calidad</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Soporte 24/7</h3>
            <p>Estamos siempre disponibles</p>
          </div>
        </div>
      </section>

      <footer className="public-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="logo-text">SRF</span>
            <p>Tu tienda de confianza</p>
          </div>
          <div className="footer-links">
            <h4>Enlaces</h4>
            <Link to="/">Inicio</Link>
            <Link to="/tienda">Tienda</Link>
            <Link to="/contacto">Contacto</Link>
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
