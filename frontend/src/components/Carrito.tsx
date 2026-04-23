import { motion, AnimatePresence } from "framer-motion";
import { useCarrito } from "../context/CarritoContext";
import { HiOutlineX, HiOutlineTrash, HiOutlineMinus, HiOutlinePlus, HiOutlineCube } from "react-icons/hi";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import "./Carrito.css";

export default function Carrito() {
  const { items, eliminarItem, actualizarCantidad, vaciarCarrito, total, isOpen, toggleCarrito } = useCarrito();
  const navigate = useNavigate();
  const location = useLocation();
  const [subdominioTienda, setSubdominioTienda] = useState<string | null>(null);
  const [colorTienda, setColorTienda] = useState<string>("#0ea5e9");

  useEffect(() => {
    const pathMatch = location.pathname.match(/^\/t\/([^/]+)/);
    if (pathMatch) {
      setSubdominioTienda(pathMatch[1]);
      // Fetch store color by subdomain
      api.get(`/tiendas/por-subdominio/${pathMatch[1]}`)
        .then(res => {
          if (res.data.color_primario) {
            setColorTienda(res.data.color_primario);
          }
        })
        .catch(() => {});
    } else {
      setSubdominioTienda(null);
    }
  }, [location.pathname]);

  // Fetch color based on tienda_id when cart is opened (fallback for non-store routes)
  useEffect(() => {
    if (isOpen && !subdominioTienda) {
      const tiendaId = items.length > 0 ? items[0].tienda_id : null;
      if (tiendaId) {
        api.get(`/tiendas/${tiendaId}`)
          .then(res => {
            if (res.data.color_primario) setColorTienda(res.data.color_primario);
          })
          .catch(() => {});
      }
    }
  }, [isOpen, subdominioTienda, items]);

  const handleCheckout = () => {
    toggleCarrito();
    if (subdominioTienda) {
      navigate(`/t/${subdominioTienda}/checkout`);
    } else {
      navigate("/checkout");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="carrito-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCarrito}
          />
          <motion.div
            className="carrito-sidebar"
            style={{ "--carrito-primary": colorTienda } as React.CSSProperties}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
          >
            <div className="carrito-header">
              <h2>Tu Carrito</h2>
              <button className="btn-cerrar" onClick={toggleCarrito}>
                <HiOutlineX />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="carrito-vacio">
                <p>Tu carrito está vacío</p>
                <Link 
                  to={subdominioTienda ? `/t/${subdominioTienda}` : "/tienda"} 
                  onClick={toggleCarrito} 
                  className="btn-seguir"
                >
                  Ver Productos
                </Link>
              </div>
            ) : (
              <>
                <div className="carrito-items">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      className="carrito-item"
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                    >
                      <div className="item-imagen">
                        {item.imagen ? (
                          <img src={item.imagen} alt={item.nombre} />
                        ) : (
                          <div className="placeholder"><HiOutlineCube /></div>
                        )}
                      </div>
                      <div className="item-info">
                        <h4>{item.nombre}</h4>
                        <p className="item-precio">${item.precio.toFixed(2)}</p>
                        <div className="item-cantidad">
                          <button onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}>
                            <HiOutlineMinus />
                          </button>
                          <span>{item.cantidad}</span>
                          <button onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}>
                            <HiOutlinePlus />
                          </button>
                        </div>
                      </div>
                      <button className="btn-eliminar" onClick={() => eliminarItem(item.id)}>
                        <HiOutlineTrash />
                      </button>
                    </motion.div>
                  ))}
                </div>

                <div className="carrito-footer">
                  <div className="carrito-total">
                    <span>Total:</span>
                    <strong>${total.toFixed(2)}</strong>
                  </div>
                  <button className="btn-vaciar" onClick={vaciarCarrito}>
                    Vaciar Carrito
                  </button>
                  <button className="btn-checkout" onClick={handleCheckout}>
                    Proceder al Pago
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
