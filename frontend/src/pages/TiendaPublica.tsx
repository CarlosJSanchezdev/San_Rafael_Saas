import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import { useCarrito } from "../context/CarritoContext";
import { HiOutlineShoppingBag, HiOutlinePlus, HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import WhatsAppFloat from "../components/WhatsAppFloat";
import TiendaStyle from "../components/TiendaStyle";

// Import styles - we'll use a simpler approach
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

export default function TiendaPublica() {
  const { subdominio } = useParams<{ subdominio: string }>();
  
  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  
  const { agregarItem, cantidadTotal, setTiendaActiva } = useCarrito();

  useEffect(() => {
    fetchData();
  }, [subdominio]);

  useEffect(() => {
    if (tienda?.id) {
      setTiendaActiva(tienda.id);
    }
  }, [tienda?.id, setTiendaActiva]);

  const fetchData = async () => {
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
        url: window.location.pathname,
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
    agregarItem({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen,
    });
    registrarMetrica("carrito_agregado", producto.id);
  };

  if (loading) {
    return (
      <div className="st-store-layout">
        <TiendaStyle 
          colorPrimario={tienda?.color_primario}
          colorSecundario={tienda?.color_secundario}
        />
        <div className="st-loading">
          <div className="st-spinner" />
        </div>
      </div>
    );
  }

  if (!tienda) {
    return (
      <div className="st-store-layout">
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
      <header className="st-header">
        <div className="st-container">
          <nav className="st-navbar">
            <div className="st-nav-left">
              <Link to={`/t/${subdominio}`} className="st-logo">
                {tienda.logo ? (
                  <img src={tienda.logo} alt={tienda.nombre} className="st-logo-icon" style={{ width: 40, height: 40, borderRadius: 8 }} />
                ) : (
                  <span className="material-symbols-outlined st-logo-icon">shopping_bag</span>
                )}
                <span className="st-logo-text">{tienda.nombre}</span>
              </Link>
              
              <div className="st-nav-links">
                <Link to={`/t/${subdominio}`} className="st-nav-link">Inicio</Link>
                <Link to={`/t/${subdominio}#productos`} className="st-nav-link">Productos</Link>
                <Link to={`/t/${subdominio}#nosotros`} className="st-nav-link">Nosotros</Link>
                <Link to={`/t/${subdominio}#contacto`} className="st-nav-link">Contacto</Link>
              </div>
            </div>
            
            <div className="st-nav-right">
              <button className="st-nav-btn">
                Ver Catálogo
              </button>
              
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
        
        {/* Mobile Menu */}
        {menuOpen && (
          <div className="st-mobile-menu">
            <Link to={`/t/${subdominio}`} onClick={() => setMenuOpen(false)}>Inicio</Link>
            <Link to={`/t/${subdominio}#productos`} onClick={() => setMenuOpen(false)}>Productos</Link>
            <Link to={`/t/${subdominio}#nosotros`} onClick={() => setMenuOpen(false)}>Nosotros</Link>
            <Link to={`/t/${subdominio}#contacto`} onClick={() => setMenuOpen(false)}>Contacto</Link>
          </div>
        )}
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
                <span className="material-symbols-outlined" style={{ fontSize: 120 }}>shopping_bag</span>
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
            <span className="material-symbols-outlined st-search-icon">search</span>
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
                        <span className="material-symbols-outlined">shopping_bag</span>
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
                        disabled={producto.stock === 0}
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
      
      {/* About Section */}
      <section id="nosotros" className="st-about">
        <div className="st-container">
          <div className="st-about-grid">
            <div className="st-about-content">
              <h2>Sobre Nosotros</h2>
              <p>
                En {tienda.nombre}, nos dedicamos a ofrecerte los mejores productos 
                con la mejor calidad. Cada artículo es seleccionado cuidadosamente 
                para garantizar tu satisfacción.
              </p>
              <div className="st-about-features">
                <div className="st-about-feature">
                  <div className="st-about-icon">
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                  <div>
                    <h4>Calidad Premium</h4>
                    <p>Productos seleccionados cuidadosamente</p>
                  </div>
                </div>
                <div className="st-about-feature">
                  <div className="st-about-icon">
                    <span className="material-symbols-outlined">local_shipping</span>
                  </div>
                  <div>
                    <h4>Envío Rápido</h4>
                    <p>Entrega a todo el país</p>
                  </div>
                </div>
                <div className="st-about-feature">
                  <div className="st-about-icon">
                    <span className="material-symbols-outlined">support_agent</span>
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
                <span className="material-symbols-outlined" style={{ fontSize: 100 }}>storefront</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="st-testimonials">
        <div className="st-container">
          <div className="st-section-header">
            <h2>Lo que dicen <span>nuestros clientes</span></h2>
          </div>
          <div className="st-testimonials-grid">
            <div className="st-testimonial-card">
              <span className="material-symbols-outlined st-testimonial-quote">format_quote</span>
              <p className="st-testimonial-text">
                "Excelente atención y productos de muy buena calidad. Totally recomendado!"
              </p>
              <div className="st-testimonial-author">
                <div className="st-author-avatar">JD</div>
                <div>
                  <p className="st-author-name">Juan Díaz</p>
                  <p className="st-author-role">Cliente Verificado</p>
                </div>
              </div>
            </div>
            <div className="st-testimonial-card">
              <span className="material-symbols-outlined st-testimonial-quote">format_quote</span>
              <p className="st-testimonial-text">
                "Me encantó la experiencia de compra. El envío fue muy rápido."
              </p>
              <div className="st-testimonial-author">
                <div className="st-author-avatar">MR</div>
                <div>
                  <p className="st-author-name">María Rodríguez</p>
                  <p className="st-author-role">Cliente Verificado</p>
                </div>
              </div>
            </div>
            <div className="st-testimonial-card">
              <span className="material-symbols-outlined st-testimonial-quote">format_quote</span>
              <p className="st-testimonial-text">
                "Productos de excelente calidad. Siempre vuelvo a comprar."
              </p>
              <div className="st-testimonial-author">
                <div className="st-author-avatar">CP</div>
                <div>
                  <p className="st-author-name">Carlos Pérez</p>
                  <p className="st-author-role">Cliente Verificado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
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
                  <span className="material-symbols-outlined">phone</span>
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
                  <span className="material-symbols-outlined">email</span>
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
                  <span className="material-symbols-outlined">location_on</span>
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
                  disabled={productoSeleccionado.stock === 0}
                >
                  <HiOutlinePlus /> Agregar al Carrito
                </button>
              </div>
              <div className="st-modal-image">
                {productoSeleccionado.imagen ? (
                  <img src={productoSeleccionado.imagen} alt={productoSeleccionado.nombre} />
                ) : (
                  <div className="st-modal-placeholder">
                    <span className="material-symbols-outlined">shopping_bag</span>
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
