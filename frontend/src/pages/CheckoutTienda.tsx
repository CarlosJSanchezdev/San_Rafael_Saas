import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import { useCarrito } from "../context/CarritoContext";
import { useToast } from "../context/ToastContext";
import { HiOutlineShoppingBag } from "react-icons/hi";
import TiendaStyle from "../components/TiendaStyle";
import WompiCheckout from "../components/WompiCheckout";

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
  wompi_public_key?: string;
  wompi_activo?: boolean;
}

export default function CheckoutTienda() {
  const { subdominio } = useParams<{ subdominio: string }>();
  
  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [pedidoCreado, setPedidoCreado] = useState<number | null>(null);
  
  const { items, total, vaciarCarrito, setTiendaActiva, eliminarItem } = useCarrito();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    notas: "",
  });

  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    fetchTienda();
  }, [subdominio]);

  useEffect(() => {
    if (tienda?.id) {
      setTiendaActiva(tienda.id);
    }
  }, [tienda?.id, setTiendaActiva]);

  const fetchTienda = async () => {
    try {
      const response = await api.get(`/tiendas/por-subdominio/${subdominio}`);
      setTienda(response.data);
    } catch (error) {
      console.error("Error fetching tienda:", error);
      showToast("Tienda no encontrada", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast("El carrito está vacío", "error");
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSuccess = (pedidoId: number) => {
    vaciarCarrito();
    setPedidoCreado(pedidoId);
    showToast("Pago realizado exitosamente", "success");
  };

  const handlePaymentError = (message: string) => {
    showToast(message, "error");
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
          <Link to="/">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  if (pedidoCreado) {
    return (
      <div className="st-store-layout">
        <TiendaStyle 
          colorPrimario={tienda.color_primario}
          colorSecundario={tienda.color_secundario}
        />
        <div className="st-checkout-success">
          <div className="st-success-icon">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <h2>¡Pedido Confirmado!</h2>
          <p>Tu pedido #{pedidoCreado} ha sido creado exitosamente.</p>
          <p>Nos contactaremos contigo pronto para confirmar los detalles.</p>
          <div className="st-success-actions">
            <Link to={`/t/${subdominio}`} className="st-btn-primary">
              Volver a la tienda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="st-store-layout">
        <TiendaStyle 
          colorPrimario={tienda.color_primario}
          colorSecundario={tienda.color_secundario}
        />
        <div className="st-empty-cart">
          <span className="material-symbols-outlined">shopping_cart</span>
          <h2>Tu carrito está vacío</h2>
          <p>Agrega productos para continuar</p>
          <Link to={`/t/${subdominio}`} className="st-btn-primary">
            Ver Productos
          </Link>
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
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Checkout Content */}
      <main className="st-checkout">
        <div className="st-container">
          <div className="st-checkout-header">
            <Link to={`/t/${subdominio}`} className="st-back-link">
              <span className="material-symbols-outlined">arrow_back</span>
              Volver a la tienda
            </Link>
            <h1>Finalizar Compra</h1>
          </div>

          <div className="st-checkout-grid">
            {/* Form */}
            <div className="st-checkout-form">
              <h2>Información de Contacto</h2>
              <form onSubmit={handleContinueToPayment}>
                <div className="st-form-grid">
                  <div className="st-form-group">
                    <label>Nombre completo</label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                      placeholder="Juan Pérez"
                    />
                  </div>
                  <div className="st-form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="juan@email.com"
                    />
                  </div>
                  <div className="st-form-group">
                    <label>Teléfono</label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      required
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                  <div className="st-form-group">
                    <label>Dirección</label>
                    <input
                      type="text"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleChange}
                      required
                      placeholder="Calle 123 #45-67"
                    />
                  </div>
                </div>
                <div className="st-form-group">
                  <label>Notas adicionales (opcional)</label>
                  <textarea
                    name="notas"
                    value={formData.notas}
                    onChange={handleChange}
                    placeholder="Instrucciones especiales para el envío..."
                    rows={3}
                  />
                </div>
              </form>

              {/* Wompi Payment */}
              {showPayment && tienda && (
                tienda.wompi_activo ? (
                  <WompiCheckout
                    items={items}
                    total={total}
                    tiendaId={tienda.id}
                    formData={formData}
                    colorPrimario={tienda.color_primario}
                    onPaymentSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    loadingSubmit={loadingSubmit}
                    setLoadingSubmit={setLoadingSubmit}
                  />
                ) : (
                  <div className="st-payment-unavailable">
                    <p>⚠️ Los pagos no están disponibles en este momento.</p>
                    <p>Por favor, contacta al administrador de la tienda.</p>
                  </div>
                )
              )}

              {!showPayment && (
                <button
                  type="button"
                  className="st-checkout-btn"
                  onClick={handleContinueToPayment}
                  disabled={loadingSubmit}
                  style={{ marginTop: "1rem" }}
                >
                  <span className="material-symbols-outlined">credit_card</span>
                  Continuar al Pago
                </button>
              )}
            </div>

            {/* Cart Summary */}
            <div className="st-checkout-summary">
              <h2>Tu Pedido</h2>
              <div className="st-order-items">
                {items.map((item) => (
                  <div key={item.id} className="st-order-item">
                    <div className="st-order-item-image">
                      {item.imagen ? (
                        <img src={item.imagen} alt={item.nombre} />
                      ) : (
                        <span className="material-symbols-outlined">shopping_bag</span>
                      )}
                    </div>
                    <div className="st-order-item-info">
                      <h4>{item.nombre}</h4>
                      <p className="st-order-item-price">${item.precio.toFixed(2)}</p>
                    </div>
                    <div className="st-order-item-actions">
                      <span className="st-order-item-qty">x{item.cantidad}</span>
                      <button 
                        className="st-remove-btn"
                        onClick={() => eliminarItem(item.id)}
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="st-order-totals">
                <div className="st-order-row">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="st-order-row">
                  <span>Envío</span>
                  <span>Calculado en checkout</span>
                </div>
                <div className="st-order-row st-order-total">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {tienda.telefono && (
                <p className="st-checkout-help">
                  ¿Necesitas ayuda? <a href={`tel:${tienda.telefono}`}>Contáctanos</a>
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
