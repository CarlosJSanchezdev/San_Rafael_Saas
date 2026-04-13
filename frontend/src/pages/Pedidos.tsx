import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { HiOutlineEye, HiOutlineCheck, HiOutlineTruck, HiOutlineX, HiOutlineClock } from "react-icons/hi";
import Layout from "../components/Layout";
import { useToast } from "../context/ToastContext";
import "./Pedidos.css";

interface Pedido {
  id: number;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono: string;
  direccion_envio: string;
  total: number;
  estado: string;
  notas: string;
  fecha_creacion: string;
  items: PedidoItem[];
}

interface PedidoItem {
  id: number;
  producto_nombre: string;
  precio: number;
  cantidad: number;
}


const estados = ["pendiente", "procesando", "enviado", "completado", "cancelado"];

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    try {
      const response = await api.get("/pedidos");
      setPedidos(response.data);
    } catch (error) {
      console.error("Error fetching pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (pedidoId: number, nuevoEstado: string) => {
    try {
      await api.put(`/pedidos/${pedidoId}/estado?estado=${nuevoEstado}`);
      showToast(`Pedido #${pedidoId} actualizado a ${nuevoEstado}`, "success");
      fetchPedidos();
    } catch (error) {
      showToast("Error al actualizar estado", "error");
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pendiente": return "warning";
      case "procesando": return "info";
      case "enviado": return "primary";
      case "completado": return "success";
      case "cancelado": return "danger";
      default: return "";
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "pendiente": return <HiOutlineClock />;
      case "procesando": return <HiOutlineClock />;
      case "enviado": return <HiOutlineTruck />;
      case "completado": return <HiOutlineCheck />;
      case "cancelado": return <HiOutlineX />;
      default: return <HiOutlineClock />;
    }
  };

  return (
    <Layout>
      <div className="pedidos-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Gestión de Pedidos</h1>

          {loading ? (
            <p>Cargando...</p>
          ) : (
            <div className="pedidos-table glass-card">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((pedido) => (
                    <motion.tr
                      key={pedido.id}
                      whileHover={{ backgroundColor: "var(--bg-glass-hover)" }}
                    >
                      <td>#{pedido.id}</td>
                      <td>
                        <div className="cliente-info">
                          <strong>{pedido.cliente_nombre}</strong>
                          <span>{pedido.cliente_email}</span>
                        </div>
                      </td>
                      <td className="total">${pedido.total.toFixed(2)}</td>
                      <td>
                        <div className="estado-container">
                          <span className={`estado-icono ${getEstadoColor(pedido.estado)}`}>
                            {getEstadoIcon(pedido.estado)}
                          </span>
                          <select
                            className={`estado-select ${getEstadoColor(pedido.estado)}`}
                            value={pedido.estado}
                            onChange={(e) => cambiarEstado(pedido.id, e.target.value)}
                          >
                            {estados.map((e) => (
                              <option key={e} value={e}>
                                {e.charAt(0).toUpperCase() + e.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td>{new Date(pedido.fecha_creacion).toLocaleDateString("es-CO")}</td>
                      <td>
                        <button
                          className="btn-ver"
                          onClick={() => setPedidoSeleccionado(pedido)}
                        >
                          <HiOutlineEye />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pedidos.length === 0 && !loading && (
            <div className="sin-pedidos">
              <p>No hay pedidos aún</p>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {pedidoSeleccionado && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPedidoSeleccionado(null)}
            >
              <motion.div
                className="modal-detalle glass-card"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>Pedido #{pedidoSeleccionado.id}</h2>
                  <button
                    className="btn-cerrar"
                    onClick={() => setPedidoSeleccionado(null)}
                  >
                    <HiOutlineX />
                  </button>
                </div>

                <div className="detalle-seccion">
                  <h3>Cliente</h3>
                  <p><strong>Nombre:</strong> {pedidoSeleccionado.cliente_nombre}</p>
                  <p><strong>Email:</strong> {pedidoSeleccionado.cliente_email}</p>
                  <p><strong>Teléfono:</strong> {pedidoSeleccionado.cliente_telefono || "No especificado"}</p>
                </div>

                <div className="detalle-seccion">
                  <h3>Dirección de Envío</h3>
                  <p>{pedidoSeleccionado.direccion_envio}</p>
                </div>

                <div className="detalle-seccion">
                  <h3>Productos</h3>
                  <div className="items-list">
                    {pedidoSeleccionado.items?.map((item) => (
                      <div key={item.id} className="item-pedido">
                        <span>{item.producto_nombre} x{item.cantidad}</span>
                        <span>${(item.precio * item.cantidad).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="detalle-total">
                  <strong>Total: ${pedidoSeleccionado.total.toFixed(2)}</strong>
                </div>

                {pedidoSeleccionado.notas && (
                  <div className="detalle-seccion">
                    <h3>Notas</h3>
                    <p>{pedidoSeleccionado.notas}</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
