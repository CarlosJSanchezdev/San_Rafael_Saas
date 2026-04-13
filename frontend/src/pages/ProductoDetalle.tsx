import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import { useCarrito } from "../context/CarritoContext";
import { useToast } from "../context/ToastContext";
import { HiOutlineShoppingBag, HiOutlinePlus, HiOutlineMinus } from "react-icons/hi";
import TiendaStyle from "../components/TiendaStyle";

import "../styles/tienda/style_1.css";

interface Tienda {
  id: number;
  nombre: string;
  subdominio: string;
  color_primario: string;
  color_secundario: string;
  telefono: string;
  email: string;
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

export default function ProductoDetalle() {
  const { subdominio, id } = useParams<{ subdominio: string; id: string }>();
  
  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(true);
  
  const { agregarItem, cantidadTotal, setTiendaActiva } = useCarrito();
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, [subdominio, id]);

  useEffect(() => {
    if (tienda?.id) {
      setTiendaActiva(tienda.id);
    }
  }, [tienda?.id, setTiendaActiva]);

  const fetchData = async () => {
    try {
      const tiendaRes = await api.get(`/tiendas/por-subdominio/${subdominio}`);
      setTienda(tiendaRes.data);
      
      const productoRes = await api.get(`/tiendas/${tiendaRes.data.id}/productos/${id}`);
      setProducto(productoRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast("Producto no encontrado", "error");
    } finally {
      setLoading(false);
    }
  };

  const agregarAlCarrito = () => {
    if (!producto) return;

    agregarItem({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen,
    }, cantidad);
    
    showToast(`${producto.nombre} agregado al carrito`, "success");
  };

  const actualizarCantidad = (delta: number) => {
    const nuevaCantidad = cantidad + delta;
    if (nuevaCantidad >= 1 && nuevaCantidad <= (producto?.stock || 1)) {
      setCantidad(nuevaCantidad);
    }
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

  if (!producto || !tienda) {
    return (
      <div className="st-store-layout">
        <div className="st-not-found">
          <h2>Producto no encontrado</h2>
          <p>El producto que buscas no existe o no está disponible.</p>
          <Link to={`/t/${subdominio}`}>Volver a la tienda</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="st-store-layout">
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
                <span className="material-symbols-outlined st-logo-icon">shopping_bag</span>
                <span className="st-logo-text">{tienda.nombre}</span>
              </Link>
            </div>
            <div className="st-nav-right">
              <Link to={`/t/${subdominio}/checkout`} className="st-icon-btn">
                <HiOutlineShoppingBag />
                {cantidadTotal > 0 && <span className="st-cart-badge">{cantidadTotal}</span>}
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Product Detail */}
      <main className="st-product-detail">
        <div className="st-container">
          <Link to={`/t/${subdominio}`} className="st-back-link">
            <span className="material-symbols-outlined">arrow_back</span>
            Volver a la tienda
          </Link>
          
          <div className="st-product-detail-grid">
            {/* Gallery */}
            <div className="st-product-gallery">
              <div className="st-product-main-image">
                {producto.imagen ? (
                  <img src={producto.imagen} alt={producto.nombre} />
                ) : (
                  <div className="st-product-placeholder">
                    <span className="material-symbols-outlined">shopping_bag</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Info */}
            <div className="st-product-detail-info">
              {producto.categoria && (
                <span className="st-product-detail-cat">{producto.categoria}</span>
              )}
              <h1>{producto.nombre}</h1>
              <div className="st-product-detail-price">
                ${producto.precio.toFixed(2)}
              </div>
              
              {producto.descripcion && (
                <p className="st-product-detail-desc">{producto.descripcion}</p>
              )}
              
              <div className="st-product-detail-actions">
                <div className="st-qty-selector">
                  <button 
                    className="st-qty-btn"
                    onClick={() => actualizarCantidad(-1)}
                    disabled={cantidad <= 1}
                  >
                    <HiOutlineMinus />
                  </button>
                  <span className="st-qty-value">{cantidad}</span>
                  <button 
                    className="st-qty-btn"
                    onClick={() => actualizarCantidad(1)}
                    disabled={cantidad >= producto.stock}
                  >
                    <HiOutlinePlus />
                  </button>
                </div>
                
                <button 
                  className="st-add-to-cart-btn"
                  onClick={agregarAlCarrito}
                  disabled={producto.stock === 0}
                >
                  <span className="material-symbols-outlined">add_shopping_cart</span>
                  {producto.stock === 0 ? 'Agotado' : 'Agregar al Carrito'}
                </button>
              </div>
              
              {producto.stock > 0 && producto.stock < 10 && (
                <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  ¡Solo quedan {producto.stock} unidades!
                </p>
              )}
              
              <div className="st-product-meta">
                <div className="st-product-meta-item">
                  <span className="material-symbols-outlined st-product-meta-icon">local_shipping</span>
                  <span className="st-product-meta-text">Envío a todo el país</span>
                </div>
                <div className="st-product-meta-item">
                  <span className="material-symbols-outlined st-product-meta-icon">verified</span>
                  <span className="st-product-meta-text">Producto de calidad garantizada</span>
                </div>
                <div className="st-product-meta-item">
                  <span className="material-symbols-outlined st-product-meta-icon">support_agent</span>
                  <span className="st-product-meta-text">Atención personalizada</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
