import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { HiOutlineUserAdd, HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlineExclamation } from "react-icons/hi";
import Layout from "../components/Layout";
import { useToast } from "../context/ToastContext";
import "./Productos.css";

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
}


const categorias = ["Electrónica", "Ropa", "Alimentos", "Hogar", "Deportes", "Otros"];

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    stock: "",
    categoria: "Otros",
  });

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      const response = await api.get("/productos");
      setProductos(response.data);
    } catch (error) {
      console.error("Error fetching productos:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock),
        categoria: formData.categoria,
      };
      
      if (editando) {
        await api.put(`/productos/${editando.id}`, data);
        showToast("Producto actualizado correctamente", "success");
      } else {
        await api.post("/productos", data);
        showToast("Producto creado correctamente", "success");
      }
      fetchProductos();
      cerrarModal();
    } catch (error) {
      showToast("Error al guardar producto", "error");
    }
  };

  const eliminarProducto = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      await api.delete(`/productos/${id}`);
      showToast("Producto eliminado correctamente", "success");
      fetchProductos();
    } catch (error) {
      showToast("Error al eliminar producto", "error");
    }
  };

  const abrirEditar = (producto: Producto) => {
    setEditando(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || "",
      precio: producto.precio.toString(),
      stock: producto.stock.toString(),
      categoria: producto.categoria || "Otros",
    });
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setEditando(null);
    setFormData({ nombre: "", descripcion: "", precio: "", stock: "", categoria: "Otros" });
  };

  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = !filtroCategoria || p.categoria === filtroCategoria;
    return coincideBusqueda && coincideCategoria;
  });

  return (
    <Layout>
      <div className="productos-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="page-header"
        >
          <h1>Gestión de Productos</h1>
          <button className="btn-primary" onClick={() => setMostrarModal(true)}>
            <HiOutlineUserAdd /> Nuevo Producto
          </button>
        </motion.div>

        <motion.div
          className="filtros glass-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="busqueda-input"
          />
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="categoria-select"
          >
            <option value="">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </motion.div>

        <motion.div
          className="productos-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {productosFiltrados.map((producto) => (
            <motion.div
              key={producto.id}
              className="producto-card glass-card"
              whileHover={{ scale: 1.02 }}
            >
              <div className="producto-header">
                <h3>{producto.nombre}</h3>
                <div className="producto-actions">
                  <button className="btn-edit" onClick={() => abrirEditar(producto)}>
                    <HiOutlinePencil />
                  </button>
                  <button className="btn-delete" onClick={() => eliminarProducto(producto.id)}>
                    <HiOutlineTrash />
                  </button>
                </div>
              </div>
              <p className="producto-descripcion">{producto.descripcion || "Sin descripción"}</p>
              <div className="producto-detalles">
                <span className="producto-precio">${producto.precio.toFixed(2)}</span>
                <span className={`producto-stock ${producto.stock < 10 ? "bajo" : ""}`}>
                  {producto.stock < 10 && <HiOutlineExclamation />}
                  Stock: {producto.stock}
                </span>
              </div>
              <span className="producto-categoria">{producto.categoria}</span>
            </motion.div>
          ))}
        </motion.div>

        <AnimatePresence>
          {mostrarModal && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cerrarModal}
            >
              <motion.div
                className="modal glass-card"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>{editando ? "Editar Producto" : "Nuevo Producto"}</h2>
                  <button className="btn-close" onClick={cerrarModal}>
                    <HiOutlineX />
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Nombre</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Descripción</label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Precio</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.precio}
                        onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Stock</label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Categoría</label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    >
                      {categorias.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={cerrarModal}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-save">
                      {editando ? "Actualizar" : "Crear"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
