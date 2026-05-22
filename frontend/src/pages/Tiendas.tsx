import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { HiOutlineShoppingBag, HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlineEye, HiOutlineChartBar, HiOutlineGlobe } from "react-icons/hi";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { ConfirmDialog } from "../components/ui";
import TiendaWizard from "../components/tiendas/TiendaWizard";
import { useToast } from "../context/ToastContext";
import "./Tiendas.css";

interface Tienda {
  id: number;
  cliente_id: number;
  manager_id: number | null;
  nombre: string;
  subdominio: string;
  slug: string;
  sector: string;
  descripcion: string;
  logo: string;
  banner: string;
  color_primario: string;
  color_secundario: string;
  plantilla: string;
  telefono: string;
  email: string;
  direccion: string;
  activa: boolean;
  fecha_creacion: string;
}

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  tienda_id: number | null;
}

interface MetricasTienda {
  total_visitas: number;
  visitantes_unicos: number;
  productos_mas_vistos: [];
  tiempo_promedio_segundos: number;
  fuentes_trafico: Record<string, number>;
}

const SECTORES = ["comercial", "industrial", "servicios", "oficial", "residencial"];


export default function Tiendas() {
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [managers, setManagers] = useState<Usuario[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState<Tienda | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState<number | null>(null);
  const [verMetricas, setVerMetricas] = useState<Tienda | null>(null);
  const [metricas, setMetricas] = useState<MetricasTienda | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroSector, setFiltroSector] = useState("");
  const { showToast } = useToast();


  useEffect(() => {
    fetchTiendas();
    fetchManagers();
  }, []);

  const fetchTiendas = async () => {
    try {
      const response = await api.get("/admin/tiendas");
      const data = response.data;
      setTiendas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching tiendas:", error);
      setTiendas([]);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await api.get("/usuarios?rol=manager");
      setManagers(response.data);
    } catch (error) {
      console.error("Error fetching managers:", error);
    }
  };

  const handleWizardSubmit = async (data: Record<string, unknown>, editing: Tienda | null) => {
    try {
      if (editing) {
        await api.put(`/admin/tiendas/${editing.id}`, data);
        showToast("Tienda actualizada correctamente", "success");
      } else {
        await api.post("/admin/tiendas", data);
        showToast("Tienda creada correctamente", "success");
      }
      fetchTiendas();
      cerrarModal();
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string } } };
      showToast(err.response?.data?.detail || "Error al guardar tienda", "error");
      throw error;
    }
  };

  const eliminarTienda = async () => {
    if (!confirmarEliminar) return;
    const id = confirmarEliminar;
    try {
      await api.delete(`/admin/tiendas/${id}`);
      showToast("Tienda desactivada correctamente", "success");
      fetchTiendas();
    } catch {
      showToast("Error al eliminar tienda", "error");
    } finally {
      setConfirmarEliminar(null);
    }
  };

  const abrirEditar = (tienda: Tienda) => {
    setEditando(tienda);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setEditando(null);
  };

  const verMetricasTienda = async (tienda: Tienda) => {
    setVerMetricas(tienda);
    try {
      const response = await api.get(`/admin/tiendas/${tienda.id}/metricas?dias=30`);
      setMetricas(response.data);
    } catch {
      setMetricas(null);
    }
  };

  const tiendasFiltradas = tiendas.filter(t => {
    const coincideBusqueda = t.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.subdominio.toLowerCase().includes(busqueda.toLowerCase());
    const coincideSector = !filtroSector || t.sector === filtroSector;
    return coincideBusqueda && coincideSector;
  });

  const getSectorLabel = (sector: string) => {
    const labels: Record<string, string> = {
      comercial: "Comercial",
      industrial: "Industrial",
      servicios: "Servicios",
      oficial: "Oficial",
      residencial: "Residencial",
    };
    return labels[sector] || sector;
  };

  return (
    <Layout>
      <div className="tiendas-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="page-header"
        >
          <h1>Tiendas SaaS</h1>
          <p className="subtitle">Gestiona las tiendas de tus clientes</p>
          <button className="btn-primary" onClick={() => setMostrarModal(true)}>
            <HiOutlineShoppingBag /> Nueva Tienda
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
            placeholder="Buscar tienda..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="busqueda-input"
          />
          <select
            value={filtroSector}
            onChange={(e) => setFiltroSector(e.target.value)}
            className="sector-filter"
          >
            <option value="">Todos los sectores</option>
            {SECTORES.map(s => (
              <option key={s} value={s}>{getSectorLabel(s)}</option>
            ))}
          </select>
        </motion.div>

        <motion.div
          className="tiendas-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {tiendasFiltradas.map((tienda) => (
            <motion.div
              key={tienda.id}
              className="tienda-card glass-card"
              whileHover={{ scale: 1.02 }}
              style={{ borderTop: `4px solid ${tienda.color_primario}` }}
            >
              <div className="tienda-header">
                <div 
                  className="tienda-logo"
                  style={{ backgroundColor: tienda.color_primario }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'white' }}>
                    storefront
                  </span>
                </div>
                <div className="tienda-info">
                  <h3>{tienda.nombre}</h3>
                  <span className="sector-badge">{getSectorLabel(tienda.sector)}</span>
                </div>
                <span className={`estado-badge ${tienda.activa ? 'activa' : 'inactiva'}`}>
                  {tienda.activa ? "Activa" : "Inactiva"}
                </span>
              </div>

              <div className="tienda-url">
                <HiOutlineGlobe />
                <a 
                  href={`/t/${tienda.subdominio}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="url-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  {tienda.subdominio}.srf.com
                </a>
              </div>

              {tienda.descripcion && (
                <p className="tienda-desc">{tienda.descripcion}</p>
              )}

              <div className="tienda-colores">
                <div 
                  className="color-dot" 
                  style={{ backgroundColor: tienda.color_primario }}
                  title="Color primario"
                />
                <div 
                  className="color-dot" 
                  style={{ backgroundColor: tienda.color_secundario }}
                  title="Color secundario"
                />
              </div>

              <div className="tienda-actions">
                <a 
                  href={`/t/${tienda.subdominio}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-store"
                  title="Ver tienda pública"
                >
                  <HiOutlineGlobe />
                </a>
                <Link 
                  to={`/admin/tiendas/${tienda.id}/dashboard`}
                  className="btn-admin"
                  title="Panel de administración"
                >
                  <HiOutlineEye />
                </Link>
                <button 
                  className="btn-metricas"
                  onClick={() => verMetricasTienda(tienda)}
                  title="Ver métricas"
                >
                  <HiOutlineChartBar />
                </button>
                <button 
                  className="btn-edit"
                  onClick={() => abrirEditar(tienda)}
                >
                  <HiOutlinePencil />
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => setConfirmarEliminar(tienda.id)}
                >
                  <HiOutlineTrash />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {tiendasFiltradas.length === 0 && (
          <div className="sin-resultados">
            <p>No se encontraron tiendas</p>
          </div>
        )}

        <TiendaWizard
          isOpen={mostrarModal}
          onClose={cerrarModal}
          editando={editando}
          managers={managers}
          onSubmit={handleWizardSubmit}
        />

        <AnimatePresence>
          {verMetricas && metricas && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setVerMetricas(null)}
            >
              <motion.div
                className="modal glass-card metricas-modal"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>Métricas: {verMetricas.nombre}</h2>
                  <button className="btn-close" onClick={() => setVerMetricas(null)}>
                    <HiOutlineX />
                  </button>
                </div>
                
                <div className="metricas-grid">
                  <div className="metrica-card">
                    <span className="metrica-valor">{metricas.total_visitas}</span>
                    <span className="metrica-label">Visitas (30 días)</span>
                  </div>
                  <div className="metrica-card">
                    <span className="metrica-valor">{metricas.visitantes_unicos}</span>
                    <span className="metrica-label">Visitantes únicos</span>
                  </div>
                  <div className="metrica-card">
                    <span className="metrica-valor">{metricas.tiempo_promedio_segundos}s</span>
                    <span className="metrica-label">Tiempo promedio</span>
                  </div>
                </div>

                <div className="metricas-section">
                  <h3>Fuentes de Tráfico</h3>
                  <div className="fuentes-trafico">
                    {Object.entries(metricas.fuentes_trafico).map(([fuente, count]) => (
                      <div key={fuente} className="fuente-item">
                        <span className="fuente-nombre">{fuente}</span>
                        <span className="fuente-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="metricas-section">
                  <h3>Productos Más Vistos</h3>
                  {metricas.productos_mas_vistos.length > 0 ? (
                    <div className="productos-vistos">
                      {metricas.productos_mas_vistos.map((p: { producto_id: number; vistas: number }, i: number) => (
                        <div key={i} className="producto-visto-item">
                          <span>Producto #{p.producto_id}</span>
                          <span className="vistas">{p.vistas} vistas</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data">No hay datos de productos vistos</p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <ConfirmDialog
          isOpen={confirmarEliminar !== null}
          onConfirm={eliminarTienda}
          onCancel={() => setConfirmarEliminar(null)}
          title="¿Desactivar tienda?"
          description="Esta acción no se puede deshacer. La tienda y todos sus productos asociados se desactivarán."
          confirmText="Desactivar tienda"
          variant="danger"
        />
      </div>
    </Layout>
  );
}
