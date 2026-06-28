import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import { useCarrito } from "../context/CarritoContext";
import { useToast } from "../context/ToastContext";
import { HiOutlineShoppingBag, HiOutlinePlus, HiOutlineMenu, HiOutlineX, HiOutlineSearch, HiOutlineBadgeCheck, HiOutlineTruck, HiOutlineSupport, HiOutlineOfficeBuilding, HiOutlinePhone, HiOutlineMail, HiOutlineMap } from "react-icons/hi";
import WhatsAppFloat from "../components/WhatsAppFloat";
import TiendaStyle from "../components/TiendaStyle";
import { SkeletonProductGrid } from "../components/Skeleton";

// Static import - ensures CSS is only loaded for store pages
import "../styles/tienda/style_1.css";

interface Tienda {
  id: number;
  nombre: string;
  subdominio: string;
  sector: string;
  descripcion: string;
  logo: string;
  banner: string;
  color_primario: string;
  color_secundario: string;
  telefono: string;
  email: string;
  direccion: string;
  plantilla: string;
}

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  imagen: string;
}

function useSubdominio(): string | undefined {
  const params = useParams<{ subdominio: string }>();
  const host = window.location.host;
  const dominioBase = import.meta.env.VITE_DOMINIO_BASE || "localhost:5173";
  const dominioClean = dominioBase.split(":")[0];
  const hostClean = host.split(":")[0];
  if (hostClean !== dominioClean && hostClean.includes(dominioClean)) {
    const sub = hostClean.replace(`.${dominioClean}`, "");
    if (sub && sub !== "www") return sub;
  }
  return params.subdominio;
}

export default function TiendaPublica() {
  const subdominio = useSubdominio();

  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);

  const { agregarItem, cantidadTotal, setTiendaActiva, items, stockMaximoAlcanzado } = useCarrito();
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, [subdominio]);

  useEffect(() => {
    if (tienda?.id) {
      setTiendaActiva(tienda.id);
    }
  }, [tienda?.id, setTiendaActiva]);

  const fetchData = async () => {
    if (!subdominio) return;
    try {
      const tiendaRes = await api.get(`/tiendas/por-subdominio/${subdominio}`);
      setTienda(tiendaRes.data);

      const productosRes = await api.get(`/tiendas/${tiendaRes.data.id}/productos`);
      const prods = productosRes.data;
      setProductos(prods);

      const cats = [...new Set(prods.map((p: Producto) => p.categoria).filter(Boolean))];
      setCategorias(cats as string[]);
    } catch (error) {
      console.error("Error fetching tienda:", error);
    } finally {
      setLoading(false);
    }
  };

  const registrarMetrica = async (tipo: string, productoId?: number) => {
    try {
      await api.post("/metricas/visita", {
        tienda_id: tienda?.id,
        tipo,
        producto_id: productoId,
        url: window.location.host + window.location.pathname,
        fuente_trafico: "directo",
      });
    } catch (error) {
      console.error("Error registering metric:", error);
    }
  };

  useEffect(() => {
    if (tienda?.id) {
      registrarMetrica("visita");
    }
  }, [tienda?.id]);

  const productosFiltrados = productos.filter((p) => {
    const coincideBusqueda = busqueda === "" || 
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = !categoriaSeleccionada || p.categoria === categoriaSeleccionada;
    return coincideBusqueda && coincideCategoria && p.stock > 0;
  });

  const handleAddToCart = (producto: Producto) => {
    const enCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;
    if (enCarrito >= producto.stock) return;
    agregarItem({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      stock: producto.stock,
      imagen: producto.imagen,
    });
    registrarMetrica("carrito_agregado", producto.id);
    showToast(`${producto.nombre} agregado al carrito`, "success");
  };

  if (loading) {
    return (
      <div className="st-store-layout store-theme">
        <TiendaStyle 
          colorPrimario={tienda?.color_primario}
          colorSecundario={tienda?.color_secundario}
        />
        <main className="st-products">
          <div className="st-container">
            <div className="st-section-header">
              <h2>Cargando...</h2>
            </div>
            <SkeletonProductGrid count={8} />
          </div>
        </main>
      </div>
    );
  }

  if (!tienda) {
    return (
      <div className="st-store-layout store-theme">
        <div className="st-not-found">
          <h2>Tienda no encontrada</h2>
          <p>La tienda "{subdominio}" no existe o está inactiva.</p>
          <Link to="/">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const plantilla = tienda.plantilla || "style_1";

  return (
    <div className="st-store-layout" data-plantilla={plantilla}>
      <TiendaStyle 
        colorPrimario={tienda.color_primario}
        colorSecundario={tienda.color_secundario}
      />
      
      {/* Header */}
      <header className={`st-header ${menuOpen ? "st-menu-open" : ""}`}>
        <div className="st-container">
          <nav className="st-navbar">
            <div className="st-nav-left">
              <Link to={`/t/${subdominio}`} className="st-logo">
                {tienda.logo ? (
                  <img src={tienda.logo} alt={tienda.nombre} className="st-logo-icon" style={{ width: 40, height: 40, borderRadius: 8 }} />
                ) : (
                  <HiOutlineShoppingBag className="st-logo-icon" size={32} />
                )}
                <span className="st-logo-text">{tienda.nombre}</span>
              </Link>
            </div>
            <div className="st-nav-links">
              <Link to={`/t/${subdominio}`}>Inicio</Link>
              <a href="#productos">Productos</a>
              {tienda.descripcion && <a href="#nosotros">Nosotros</a>}
              <a href="#contacto">Contacto</a>
            </div>
            <div className="st-nav-right">
              <a href="#productos" className="st-nav-btn">
                Ver Productos
              </a>
              <Link to={`/t/${subdominio}/checkout`} className="st-icon-btn">
                <HiOutlineShoppingBag />
                {cantidadTotal > 0 && <span className="st-cart-badge">{cantidadTotal}</span>}
              </Link>
              <button className="st-mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <HiOutlineX /> : <HiOutlineMenu />}
              </button>
            </div>
          </nav>
        </div>
        {/* Mobile Menu - always rendered, transitioned via CSS */}
        <div className="st-mobile-menu">
          <Link to={`/t/${subdominio}`} onClick={() => setMenuOpen(false)}>Inicio</Link>
          <Link to={`/t/${subdominio}#productos`} onClick={() => setMenuOpen(false)}>Productos</Link>
          <a href="#nosotros" onClick={() => setMenuOpen(false)}>Nosotros</a>
          <a href="#contacto" onClick={() => setMenuOpen(false)}>Contacto</a>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="st-hero">
        <div className="st-hero-bg" />
        <div className="st-container">
          <div className="st-hero-content">
            <div className="st-hero-text">
              <span className="st-hero-badge">{tienda.sector}</span>
              <h1>Bienvenido a <span>{tienda.nombre}</span></h1>
              {tienda.descripcion && <p className="st-hero-desc">{tienda.descripcion}</p>}
              <div className="st-hero-cta">
                <a href="#productos" className="st-btn-primary">
                  Ver Productos
                </a>
                {tienda.telefono && (
                  <a href={`tel:${tienda.telefono}`} className="st-btn-secondary">
                    Llamar Ahora
                  </a>
                )}
              </div>
            </div>
            <div className="st-hero-visual">
              <div className="st-hero-glow" />
              <div className="st-hero-shape">
                <HiOutlineShoppingBag size={120} />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Products Section */}
      <section id="productos" className="st-products">
        <div className="st-container">
          <div className="st-section-header">
            <h2>Nuestros <span>Productos</span></h2>
            <p>Explora nuestra selección de productos exclusivos</p>
          </div>
          
          {/* Search */}
          <div className="st-search-container">
            <HiOutlineSearch className="st-search-icon" size={20} />
            <input
              type="text"
              className="st-search-input"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          
          {/* Categories */}
          <div className="st-categories">
            <button 
              className={`st-cat-btn ${!categoriaSeleccionada ? 'active' : ''}`}
              onClick={() => setCategoriaSeleccionada("")}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat}
                className={`st-cat-btn ${categoriaSeleccionada === cat ? 'active' : ''}`}
                onClick={() => setCategoriaSeleccionada(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          
          {/* Products Grid */}
          {productosFiltrados.length > 0 ? (
            <div className="st-products-grid">
              {productosFiltrados.map((producto) => (
                <div key={producto.id} className="st-product-card" onClick={() => setProductoSeleccionado(producto)}>
                  <div className="st-product-image">
                    {producto.imagen ? (
                      <img src={producto.imagen} alt={producto.nombre} />
                    ) : (
                      <div className="st-product-placeholder">
                        <HiOutlineShoppingBag size={32} />
                      </div>
                    )}
                    {producto.stock < 10 && producto.stock > 0 && (
                      <span className="st-product-badge">¡Últimas!</span>
                    )}
                    {producto.stock === 0 && (
                      <span className="st-product-badge">Agotado</span>
                    )}
                  </div>
                  <div className="st-product-info">
                    {producto.categoria && (
                      <span className="st-product-cat">{producto.categoria}</span>
                    )}
                    <h3 className="st-product-name">{producto.nombre}</h3>
                    {producto.descripcion && (
                      <p className="st-product-desc">{producto.descripcion}</p>
                    )}
                    <div className="st-product-footer">
                      <span className="st-product-price">${producto.precio.toFixed(2)}</span>
                      <button 
                        className="st-add-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(producto);
                        }}
                        disabled={producto.stock === 0 || stockMaximoAlcanzado(producto.id)}
                      >
                        <HiOutlinePlus />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="st-no-products">
              <p>No se encontraron productos</p>
              <button onClick={() => {setBusqueda(""); setCategoriaSeleccionada("");}}>
                Ver todos los productos
              </button>
            </div>
          )}
        </div>
      </section>
      
{/* About Section - only render if tienda has a description */}
      {tienda.descripcion && (
      <section id="nosotros" className="st-about">
        <div className="st-container">
          <div className="st-about-grid">
            <div className="st-about-content">
              <h2>Sobre Nosotros</h2>
              <p>{tienda.descripcion}</p>
              <div className="st-about-features">
                <div className="st-about-feature">
                  <div className="st-about-icon">
                    <HiOutlineBadgeCheck size={24} />
                  </div>
                  <div>
                    <h4>Calidad Premium</h4>
                    <p>Productos seleccionados cuidadosamente</p>
                  </div>
                </div>
                <div className="st-about-feature">
                  <div className="st-about-icon">
                    <HiOutlineTruck size={24} />
                  </div>
                  <div>
                    <h4>Envío Rápido</h4>
                    <p>Entrega a todo el país</p>
                  </div>
                </div>
                <div className="st-about-feature">
                  <div className="st-about-icon">
                    <HiOutlineSupport size={24} />
                  </div>
                  <div>
                    <h4>Atención Personalizada</h4>
                    <p>Estamos contigo en todo momento</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="st-about-images">
              <div className="st-hero-shape" style={{ maxWidth: 400 }}>
                <HiOutlineOfficeBuilding size={100} />
              </div>
            </div>
          </div>
        </div>
      </section>
      )}
      
      {/* Contact Section */}
      <section id="contacto" className="st-contact">
        <div className="st-container">
          <div className="st-section-header">
            <h2>Contáct<span>anos</span></h2>
            <p>Estamos disponibles para atenderte</p>
          </div>
          <div className="st-contact-grid">
            {tienda.telefono && (
              <a href={`tel:${tienda.telefono}`} className="st-contact-item">
                <div className="st-contact-icon">
                  <HiOutlinePhone size={22} />
                </div>
                <div>
                  <p className="st-contact-label">Teléfono</p>
                  <p className="st-contact-value">{tienda.telefono}</p>
                </div>
              </a>
            )}
            {tienda.email && (
              <a href={`mailto:${tienda.email}`} className="st-contact-item">
                <div className="st-contact-icon">
                  <HiOutlineMail size={22} />
                </div>
                <div>
                  <p className="st-contact-label">Email</p>
                  <p className="st-contact-value">{tienda.email}</p>
                </div>
              </a>
            )}
            {tienda.direccion && (
              <div className="st-contact-item">
                <div className="st-contact-icon">
                  <HiOutlineMap size={22} />
                </div>
                <div>
                  <p className="st-contact-label">Dirección</p>
                  <p className="st-contact-value">{tienda.direccion}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="st-footer">
        <div className="st-container">
          <div className="st-footer-content">
            <div className="st-footer-brand">
              <div className="st-footer-logo">
                {tienda.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4>{tienda.nombre}</h4>
                <p>{tienda.sector}</p>
              </div>
            </div>
            <div className="st-footer-links">
              <div className="st-footer-col">
                <h5>Enlaces</h5>
                <Link to={`/t/${subdominio}`}>Inicio</Link>
                <Link to={`/t/${subdominio}#productos`}>Productos</Link>
                <Link to={`/t/${subdominio}#contacto`}>Contacto</Link>
              </div>
            </div>
          </div>
          <div className="st-footer-bottom">
            <p>© 2024 {tienda.nombre}. Todos los derechos reservados.</p>
            <p>Powered by <strong>SRF</strong></p>
          </div>
        </div>
      </footer>
      
      {/* Product Detail Modal */}
      {productoSeleccionado && (
        <div className="st-product-modal-overlay" onClick={() => setProductoSeleccionado(null)}>
          <div className="st-product-modal" onClick={(e) => e.stopPropagation()}>
            <button className="st-modal-close" onClick={() => setProductoSeleccionado(null)}>
              <HiOutlineX />
            </button>
            <div className="st-modal-content">
              <div className="st-modal-details">
                {productoSeleccionado.categoria && (
                  <span className="st-modal-category">{productoSeleccionado.categoria}</span>
                )}
                <h2 className="st-modal-title">{productoSeleccionado.nombre}</h2>
                <p className="st-modal-description">{productoSeleccionado.descripcion || "Sin descripción disponible."}</p>
                <div className="st-modal-info">
                  <div className="st-modal-price">${productoSeleccionado.precio.toFixed(2)}</div>
                  <div className="st-modal-stock">
                    <span className={`st-stock-badge ${productoSeleccionado.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                      {productoSeleccionado.stock > 0 ? `Stock: ${productoSeleccionado.stock} unidades` : "Agotado"}
                    </span>
                  </div>
                </div>
                <button 
                  className="st-modal-add-btn"
                  onClick={() => {
                    handleAddToCart(productoSeleccionado);
                    setProductoSeleccionado(null);
                  }}
                  disabled={productoSeleccionado.stock === 0 || stockMaximoAlcanzado(productoSeleccionado.id)}
                >
                  <HiOutlinePlus /> Agregar al Carrito
                </button>
              </div>
              <div className="st-modal-image">
                {productoSeleccionado.imagen ? (
                  <img src={productoSeleccionado.imagen} alt={productoSeleccionado.nombre} />
                ) : (
                  <div className="st-modal-placeholder">
                    <HiOutlineShoppingBag size={48} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* WhatsApp Float */}
      {tienda.telefono && <WhatsAppFloat telefono={tienda.telefono} />}
    </div>
  );
}
