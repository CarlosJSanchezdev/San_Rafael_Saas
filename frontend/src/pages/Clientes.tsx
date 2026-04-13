import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { HiOutlineUserAdd, HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlineMail, HiOutlinePhone, HiOutlineOfficeBuilding, HiOutlineShoppingBag } from "react-icons/hi";
import Layout from "../components/Layout";
import { useToast } from "../context/ToastContext";
import "./Clientes.css";

interface Cliente {
  id: number;
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  direccion: string;
  notas: string;
}

interface TiendaForm {
  nombre: string;
  subdominio: string;
  slug: string;
  sector: string;
  descripcion: string;
  color_primario: string;
  color_secundario: string;
  telefono: string;
  email: string;
  direccion: string;
}

const SECTORES = ["comercial", "industrial", "servicios", "oficial", "residencial"];

const COLORES_PRESET = [
  "#0ea5e9", "#0284c7", "#0369a1",
  "#f59e0b", "#d97706", "#b45309",
  "#10b981", "#059669", "#047857",
  "#8b5cf6", "#7c3aed", "#6d28d9",
  "#ef4444", "#dc2626", "#b91c1c",
  "#ec4899", "#db2777", "#be185d",
];


export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [crearTienda, setCrearTienda] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    nombre: "",
    empresa: "",
    email: "",
    telefono: "",
    direccion: "",
    notas: "",
  });
  const [tiendaData, setTiendaData] = useState<TiendaForm>({
    nombre: "",
    subdominio: "",
    slug: "",
    sector: "comercial",
    descripcion: "",
    color_primario: "#0ea5e9",
    color_secundario: "#1e293b",
    telefono: "",
    email: "",
    direccion: "",
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const response = await api.get("/clientes");
      setClientes(response.data);
    } catch (error) {
      console.error("Error fetching clientes:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let clienteId: number;
      
      if (editando) {
        const data: any = {};
        Object.keys(formData).forEach(key => {
          if (formData[key as keyof typeof formData]) {
            data[key] = formData[key as keyof typeof formData];
          }
        });
        await api.put(`/clientes/${editando.id}`, data);
        clienteId = editando.id;
        showToast("Cliente actualizado correctamente", "success");
      } else {
        const res = await api.post("/clientes", formData);
        clienteId = res.data.id;
        showToast("Cliente creado correctamente", "success");
      }

      if (crearTienda && !editando) {
        await api.post("/admin/tiendas", {
          ...tiendaData,
          cliente_id: clienteId,
        });
        showToast("Tienda creada correctamente", "success");
      }

      fetchClientes();
      cerrarModal();
    } catch (error: any) {
      showToast(error.response?.data?.detail || "Error al guardar cliente", "error");
    }
  };

  const eliminarCliente = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este cliente?")) return;
    try {
      await api.delete(`/clientes/${id}`);
      showToast("Cliente eliminado correctamente", "success");
      fetchClientes();
    } catch (error) {
      showToast("Error al eliminar cliente", "error");
    }
  };

  const abrirEditar = (cliente: Cliente) => {
    setEditando(cliente);
    setFormData({
      nombre: cliente.nombre,
      empresa: cliente.empresa || "",
      email: cliente.email || "",
      telefono: cliente.telefono || "",
      direccion: cliente.direccion || "",
      notas: cliente.notas || "",
    });
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setEditando(null);
    setCrearTienda(false);
    setFormData({ nombre: "", empresa: "", email: "", telefono: "", direccion: "", notas: "" });
    setTiendaData({
      nombre: "",
      subdominio: "",
      slug: "",
      sector: "comercial",
      descripcion: "",
      color_primario: "#0ea5e9",
      color_secundario: "#1e293b",
      telefono: "",
      email: "",
      direccion: "",
    });
  };

  const generarSlug = (nombre: string) => {
    return nombre.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  };

  const handleNombreTiendaChange = (nombre: string) => {
    const slug = generarSlug(nombre);
    const subdominio = slug;
    setTiendaData({
      ...tiendaData,
      nombre,
      slug,
      subdominio,
    });
  };

  const clientesFiltrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.empresa?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <Layout>
      <div className="clientes-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="page-header"
        >
          <h1>Clientes (CRM)</h1>
          <button className="btn-primary" onClick={() => setMostrarModal(true)}>
            <HiOutlineUserAdd /> Nuevo Cliente
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
            placeholder="Buscar cliente por nombre, empresa o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="busqueda-input"
          />
        </motion.div>

        <motion.div
          className="clientes-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {clientesFiltrados.map((cliente) => (
            <motion.div
              key={cliente.id}
              className="cliente-card glass-card"
              whileHover={{ scale: 1.02 }}
            >
              <div className="cliente-header">
                <div className="cliente-avatar">
                  {cliente.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="cliente-info">
                  <h3>{cliente.nombre}</h3>
                  {cliente.empresa && (
                    <span className="cliente-empresa">
                      <HiOutlineOfficeBuilding />
                      {cliente.empresa}
                    </span>
                  )}
                </div>
                <div className="cliente-actions">
                  <button className="btn-edit" onClick={() => abrirEditar(cliente)}>
                    <HiOutlinePencil />
                  </button>
                  <button className="btn-delete" onClick={() => eliminarCliente(cliente.id)}>
                    <HiOutlineTrash />
                  </button>
                </div>
              </div>
              
              <div className="cliente-contacto">
                {cliente.email && (
                  <span><HiOutlineMail /> {cliente.email}</span>
                )}
                {cliente.telefono && (
                  <span><HiOutlinePhone /> {cliente.telefono}</span>
                )}
              </div>

              {cliente.notas && (
                <p className="cliente-notas">{cliente.notas}</p>
              )}
            </motion.div>
          ))}
        </motion.div>

        {clientesFiltrados.length === 0 && (
          <div className="sin-resultados">
            <p>No se encontraron clientes</p>
          </div>
        )}

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
                  <h2>{editando ? "Editar Cliente" : "Nuevo Cliente"}</h2>
                  <button className="btn-close" onClick={cerrarModal}>
                    <HiOutlineX />
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="form-section">
                    <h3>Datos del Cliente</h3>
                    <div className="form-group">
                      <label>Nombre *</label>
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Empresa</label>
                      <input
                        type="text"
                        value={formData.empresa}
                        onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Teléfono</label>
                        <input
                          type="tel"
                          value={formData.telefono}
                          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Dirección</label>
                      <input
                        type="text"
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Notas</label>
                      <textarea
                        value={formData.notas}
                        onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>

                  {!editando && (
                    <div className="form-section">
                      <div className="toggle-tienda">
                        <label className="toggle-label">
                          <input
                            type="checkbox"
                            checked={crearTienda}
                            onChange={(e) => setCrearTienda(e.target.checked)}
                          />
                          <span className="toggle-switch"></span>
                          <HiOutlineShoppingBag />
                          <span>Crear tienda para este cliente (SaaS)</span>
                        </label>
                      </div>

                      {crearTienda && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="tienda-form"
                        >
                          <h3>Datos de la Tienda</h3>
                          
                          <div className="form-group">
                            <label>Nombre de la Tienda *</label>
                            <input
                              type="text"
                              value={tiendaData.nombre}
                              onChange={(e) => handleNombreTiendaChange(e.target.value)}
                              placeholder="Mi Tienda"
                              required
                            />
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label>Subdominio *</label>
                              <div className="input-with-suffix">
                                <input
                                  type="text"
                                  value={tiendaData.subdominio}
                                  onChange={(e) => setTiendaData({ ...tiendaData, subdominio: generarSlug(e.target.value), slug: generarSlug(e.target.value) })}
                                  placeholder="mi-tienda"
                                  required
                                />
                                <span className="suffix">.srf.com</span>
                              </div>
                            </div>
                            <div className="form-group">
                              <label>Sector *</label>
                              <select
                                value={tiendaData.sector}
                                onChange={(e) => setTiendaData({ ...tiendaData, sector: e.target.value })}
                                required
                              >
                                {SECTORES.map(s => (
                                  <option key={s} value={s}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="form-group">
                            <label>Descripción</label>
                            <textarea
                              value={tiendaData.descripcion}
                              onChange={(e) => setTiendaData({ ...tiendaData, descripcion: e.target.value })}
                              placeholder="Descripción de tu negocio..."
                              rows={3}
                            />
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label>Teléfono</label>
                              <input
                                type="tel"
                                value={tiendaData.telefono}
                                onChange={(e) => setTiendaData({ ...tiendaData, telefono: e.target.value })}
                              />
                            </div>
                            <div className="form-group">
                              <label>Email</label>
                              <input
                                type="email"
                                value={tiendaData.email}
                                onChange={(e) => setTiendaData({ ...tiendaData, email: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label>Dirección</label>
                            <input
                              type="text"
                              value={tiendaData.direccion}
                              onChange={(e) => setTiendaData({ ...tiendaData, direccion: e.target.value })}
                            />
                          </div>

                          <div className="colores-tienda">
                            <label>Colores de la Tienda</label>
                            <div className="color-pickers">
                              <div className="color-picker">
                                <input
                                  type="color"
                                  value={tiendaData.color_primario}
                                  onChange={(e) => setTiendaData({ ...tiendaData, color_primario: e.target.value })}
                                />
                                <span>Primario</span>
                              </div>
                              <div className="color-picker">
                                <input
                                  type="color"
                                  value={tiendaData.color_secundario}
                                  onChange={(e) => setTiendaData({ ...tiendaData, color_secundario: e.target.value })}
                                />
                                <span>Secundario</span>
                              </div>
                            </div>
                            <div className="color-presets">
                              {COLORES_PRESET.map(color => (
                                <button
                                  key={color}
                                  type="button"
                                  className={`preset ${tiendaData.color_primario === color ? 'active' : ''}`}
                                  style={{ backgroundColor: color }}
                                  onClick={() => setTiendaData({ ...tiendaData, color_primario: color })}
                                />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

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
