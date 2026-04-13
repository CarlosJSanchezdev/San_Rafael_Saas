import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import api from "../api";
import PublicNavbar from "../components/PublicNavbar";
import { useCarrito } from "../context/CarritoContext";
import { useToast } from "../context/ToastContext";
import { HiOutlineArrowLeft, HiOutlineCheck } from "react-icons/hi";
import "./Checkout.css";


export default function Checkout() {
  const { items, total, vaciarCarrito } = useCarrito();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pedidoCreado, setPedidoCreado] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    notas: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast("Tu carrito está vacío", "error");
      return;
    }

    setLoading(true);
    try {
      const tiendaId = items[0]?.tienda_id || 1; // Fallback a 1 si no hay items (aunque se valida antes)

      const pedido = {
        tienda_id: tiendaId,
        cliente_nombre: formData.nombre,
        cliente_email: formData.email,
        cliente_telefono: formData.telefono,
        direccion_envio: formData.direccion,
        notas: formData.notas,
        items: items.map((item) => ({
          producto_id: item.id,
          producto_nombre: item.nombre,
          precio: item.precio,
          cantidad: item.cantidad,
        })),
      };

      const response = await api.post("/pedidos", pedido);
      setPedidoCreado(response.data.id);
      vaciarCarrito();
      showToast("Pedido creado con éxito", "success");
    } catch (error) {
      showToast("Error al procesar el pedido", "error");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !pedidoCreado) {
    return (
      <div className="checkout-page">
        <PublicNavbar />
        <div className="carrito-vacio-checkout">
          <h2>Tu carrito está vacío</h2>
          <p>Agrega productos para continuar con el checkout</p>
          <Link to="/tienda" className="btn-primary">
            Ver Productos
          </Link>
        </div>
      </div>
    );
  }

  if (pedidoCreado) {
    return (
      <div className="checkout-page">
        <PublicNavbar />
        <motion.div
          className="pedido-exito"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="icono-exito">
            <HiOutlineCheck />
          </div>
          <h2>¡Pedido Confirmado!</h2>
          <p>Tu número de pedido es: <strong>#{pedidoCreado}</strong></p>
          <p className="mensaje">Te hemos enviado un correo de confirmación. Nos contactaremos pronto para coordinar la entrega.</p>
          <div className="acciones-exito">
            <Link to="/tienda" className="btn-primary">
              Seguir Comprando
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <PublicNavbar />

      <div className="checkout-container">
        <Link to="/tienda" className="volver-link">
          <HiOutlineArrowLeft /> Volver a la tienda
        </Link>

        <div className="checkout-grid">
          <motion.div
            className="checkout-form"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2>Información de Envío</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre completo *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="juan@email.com"
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+57 300 123 4567"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Dirección de envío *</label>
                <textarea
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  required
                  placeholder="Calle 123, Ciudad, Barrio..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Notas adicionales</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Instrucciones especiales de entrega..."
                  rows={2}
                />
              </div>

              <button type="submit" className="btn-checkout" disabled={loading}>
                {loading ? "Procesando..." : `Confirmar Pedido - $${total.toFixed(2)}`}
              </button>
            </form>
          </motion.div>

          <motion.div
            className="checkout-resumen"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2>Resumen del Pedido</h2>
            <div className="resumen-items">
              {items.map((item) => (
                <div key={item.id} className="resumen-item">
                  <div className="item-info">
                    <span className="item-nombre">{item.nombre}</span>
                    <span className="item-cantidad">x{item.cantidad}</span>
                  </div>
                  <span className="item-precio">${(item.precio * item.cantidad).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="resumen-totales">
              <div className="total-row">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Envío</span>
                <span>Gratis</span>
              </div>
              <div className="total-row total-final">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
