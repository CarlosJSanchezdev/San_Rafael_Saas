import { useState, useEffect } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "../api";
import { 
  HiOutlineHome, 
  HiOutlineShoppingCart, 
  HiOutlineCube, 
  HiOutlineChartBar, 
  HiOutlineArrowLeft, 
  HiOutlinePlus, 
  HiOutlinePencil, 
  HiOutlineTrash, 
  HiOutlineEye, 
  HiOutlineLogout,
  HiOutlineUsers,
  HiOutlineCurrencyDollar,
  HiOutlineExclamation,
  HiOutlineClock,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineUser
} from "react-icons/hi";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import "./TiendaAdmin.css";

interface Tienda {
  id: number;
  nombre: string;
  subdominio: string;
  sector: string;
  descripcion: string;
  color_primario: string;
  color_secundario: string;
}

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
  imagen?: string;
}

interface Pedido {
  id: number;
  tienda_id?: number;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono?: string;
  direccion_envio: string;
  total: number;
  estado: string;
  estado_pago?: string;
  notas?: string;
  fecha_creacion: string;
  items?: {
    producto_id: number;
    producto_nombre: string;
    cantidad: number;
    precio: number;
  }[];
}

interface Metricas {
  total_visitas: number;
  visitantes_unicos: number;
  tiempo_promedio_segundos: number;
}

interface ChartData {
  name: string;
  value: number;
}

const COLORS = ["#0ea5e9", "#f59e0b", "#0284c7", "#d97706", "#60a5fa", "#fbbf24"];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};


export default function TiendaAdmin() {
  const { tiendaId } = useParams<{ tiendaId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  if (!tiendaId) {
    return (
      <div className="tienda-admin-container" style={{ padding: "2rem", textAlign: "center" }}>
        <p>Cargando...</p>
      </div>
    );
  }

  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState(false);
  const [imagenPreview, setImagenPreview] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [categoriaData, setCategoriaData] = useState<ChartData[]>([]);
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [guardandoPagos, setGuardandoPagos] = useState(false);
  const [pagosForm, setPagosForm] = useState({
    wompi_public_key: "",
    wompi_integrity_secret: "",
    wompi_activo: false
  });
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const { showToast } = useToast();
  const { logout, usuario: usuarioActual } = useAuth();

  const puedeEditar = usuarioActual?.rol === "admin" || usuarioActual?.tienda_id === parseInt(tiendaId || "0");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const cerrarSidebar = () => setSidebarAbierto(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const cambiarEstado = async (pedidoId: number, nuevoEstado: string) => {
    console.log("Cambiando estado:", pedidoId, nuevoEstado);
    try {
      const response = await api.put(`/pedidos/${pedidoId}/estado?estado=${nuevoEstado}`);
      console.log("Response:", response.data);
      showToast(`Pedido #${pedidoId} actualizado a ${nuevoEstado}`, "success");
      fetchData();
    } catch (error: any) {
      console.error("Error completo:", error);
      console.error("Response data:", error.response?.data);
      showToast(error.response?.data?.detail || "Error al actualizar estado", "error");
    }
  };

  const pathParts = location.pathname.split("/");
  const currentView = pathParts[pathParts.length - 1];

  useEffect(() => {
    if (tiendaId) {
      fetchData();
    }
  }, [tiendaId, currentView]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSidebarAbierto(false);
  }, [location.pathname]);

  useEffect(() => {
    if (productos.length > 0) {
      const categorias = productos.reduce((acc: Record<string, number>, p) => {
        const cat = p.categoria || "Sin categoría";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});
      const data = Object.entries(categorias).map(([name, value]) => ({ name, value }));
      setCategoriaData(data);
    }
  }, [productos]);

  const fetchData = async () => {
    try {
      const [tiendaRes] = await Promise.all([
        api.get(`/admin/tiendas/${tiendaId}`),
      ]);
      setTienda(tiendaRes.data);

      if (currentView === "dashboard" || currentView === tiendaId) {
        const [pedidosRes, metricasRes, productosRes] = await Promise.all([
          api.get(`/pedidos?tienda_id=${tiendaId}&limit=10`),
          api.get(`/admin/tiendas/${tiendaId}/metricas`),
          api.get(`/productos?tienda_id=${tiendaId}`),
        ]);
        setPedidos(pedidosRes.data);
        setMetricas(metricasRes.data);
        setProductos(productosRes.data);
      } else if (currentView === "productos") {
        const productosRes = await api.get(`/productos?tienda_id=${tiendaId}`);
        setProductos(productosRes.data);
      } else if (currentView === "pedidos") {
        const pedidosRes = await api.get(`/pedidos?tienda_id=${tiendaId}`);
        setPedidos(pedidosRes.data);
      } else if (currentView === "metricas") {
        const metricasRes = await api.get(`/admin/tiendas/${tiendaId}/metricas`);
        setMetricas(metricasRes.data);
      } else if (currentView === "pagos") {
        const tiendaRes = await api.get(`/admin/tiendas/${tiendaId}`);
        setTienda(tiendaRes.data);
        setPagosForm({
          wompi_public_key: tiendaRes.data.wompi_public_key || "",
          wompi_integrity_secret: tiendaRes.data.wompi_integrity_secret || "",
          wompi_activo: tiendaRes.data.wompi_activo || false
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { to: `/admin/tiendas/${tiendaId}/dashboard`, icon: HiOutlineHome, label: "Dashboard" },
    { to: `/admin/tiendas/${tiendaId}/preview`, icon: HiOutlineEye, label: "Vista Previa", isPreview: true },
    { to: `/admin/tiendas/${tiendaId}/productos`, icon: HiOutlineCube, label: "Productos" },
    { to: `/admin/tiendas/${tiendaId}/pedidos`, icon: HiOutlineShoppingCart, label: "Pedidos" },
    { to: `/admin/tiendas/${tiendaId}/metricas`, icon: HiOutlineChartBar, label: "Métricas" },
    { to: `/admin/tiendas/${tiendaId}/pagos`, icon: HiOutlineCurrencyDollar, label: "Pagos" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    let imagenEnviar = imagenPreview;
    if (editando && !imagenPreview) {
      imagenEnviar = editando.imagen || "";
    }
    
    const data = {
      nombre: formData.get("nombre"),
      descripcion: formData.get("descripcion"),
      precio: parseFloat(formData.get("precio") as string),
      stock: parseInt(formData.get("stock") as string),
      categoria: formData.get("categoria"),
      imagen: imagenEnviar,
      tienda_id: parseInt(tiendaId!),
    };

    try {
      if (editando) {
        await api.put(`/productos/${editando.id}`, data);
        showToast("Producto actualizado", "success");
      } else {
        await api.post("/productos", data);
        showToast("Producto creado", "success");
      }
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.detail || "Error al guardar", "error");
    }
  };

  const handleCloseModal = () => {
    setMostrarModal(false);
    setEditando(null);
    setImagenPreview("");
  };

  const eliminarProducto = async (id: number) => {
    if (!confirm("¿Eliminar este producto?")) return;
    try {
      await api.delete(`/productos/${id}`);
      showToast("Producto eliminado", "success");
      fetchData();
    } catch (error) {
      showToast("Error al eliminar", "error");
    }
  };

  const guardarConfiguracionPagos = async () => {
    setGuardandoPagos(true);
    try {
      await api.put(`/admin/tiendas/${tiendaId}`, {
        wompi_public_key: pagosForm.wompi_public_key,
        wompi_integrity_secret: pagosForm.wompi_integrity_secret,
        wompi_activo: pagosForm.wompi_activo
      });
      showToast("Configuración de pagos guardada", "success");
    } catch (error) {
      showToast("Error al guardar configuración", "error");
    } finally {
      setGuardandoPagos(false);
    }
  };

  const verDetallePedido = (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
  };

  const cerrarDetallePedido = () => {
    setPedidoSeleccionado(null);
  };

  if (loading) {
    return (
      <div className="tienda-admin-loading">
        <div className="spinner"></div>
        <p>Cargando tienda...</p>
      </div>
    );
  }

  return (
    <div className="tienda-admin" style={{ "--primary": tienda?.color_primario || "#0ea5e9" } as React.CSSProperties}>
      {/* Botón menú móvil */}
      <button 
        className="menu-toggle-btn"
        onClick={() => setSidebarAbierto(!sidebarAbierto)}
      >
        {sidebarAbierto ? <HiOutlineX /> : <HiOutlineMenu />}
      </button>

      {/* Overlay para móvil */}
      {sidebarAbierto && (
        <div className="sidebar-overlay" onClick={cerrarSidebar} />
      )}

      <aside className={`tienda-sidebar ${sidebarAbierto ? "abierto" : ""}`}>
        <div className="tienda-logo">
          <Link to="/admin/tiendas" className="back-link" onClick={cerrarSidebar}>
            <HiOutlineArrowLeft />
          </Link>
          <div 
            className="logo-icon"
            style={{ backgroundColor: tienda?.color_primario }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'white' }}>
              storefront
            </span>
          </div>
          <div className="logo-text">
            <h3>{tienda?.nombre}</h3>
            <span>{tienda?.subdominio}.srf.com</span>
          </div>
        </div>

        <nav className="tienda-nav">
          {navItems.map((item) => (
            item.isPreview ? (
              <button
                key={item.to}
                className={`tienda-nav-item ${vistaPrevia ? "active" : ""}`}
                onClick={() => {
                  setVistaPrevia(!vistaPrevia);
                  cerrarSidebar();
                  if (!vistaPrevia) {
                    window.history.pushState({}, "", item.to);
                  }
                }}
              >
                <item.icon />
                <span>{item.label}</span>
              </button>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className={`tienda-nav-item ${location.pathname === item.to && !vistaPrevia ? "active" : ""}`}
                onClick={() => {
                  setVistaPrevia(false);
                  cerrarSidebar();
                }}
              >
                <item.icon />
                <span>{item.label}</span>
              </Link>
            )
          ))}
        </nav>

        <div className="tienda-footer">
          <a 
            href={`/t/${tienda?.subdominio}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="ver-tienda-btn"
          >
            <HiOutlineEye />
            Ver tienda pública
          </a>
          <button onClick={handleLogout} className="logout-tienda-btn">
            <HiOutlineLogout />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="tienda-main">
        {vistaPrevia && (
          <div className="preview-view">
            <div className="preview-header">
              <h2>Vista Previa: {tienda?.nombre}</h2>
              <a 
                href={`/t/${tienda?.subdominio}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Abrir en nueva pestaña
              </a>
            </div>
            <div className="preview-frame-container">
              <iframe 
                src={`/t/${tienda?.subdominio}`}
                title={`Vista previa de ${tienda?.nombre}`}
                className="preview-frame"
              />
            </div>
          </div>
        )}

        {!vistaPrevia && (currentView === "dashboard" || currentView === tiendaId) && (
          <motion.div
            className="dashboard-view"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <div className="page-header">
              <div className="header-left">
                <motion.h1 variants={item}>Dashboard: {tienda?.nombre}</motion.h1>
              </div>
              <div className="header-right">
                <motion.div variants={item} className="header-info">
                  <span className="header-date">
                    {currentTime.toLocaleDateString("es-ES", { 
                      weekday: "long", 
                      year: "numeric", 
                      month: "long", 
                      day: "numeric" 
                    })}
                  </span>
                  <span className="header-separator">|</span>
                  <span className="header-time">
                    {currentTime.toLocaleTimeString("es-ES", { 
                      hour: "2-digit", 
                      minute: "2-digit", 
                      second: "2-digit",
                      hour12: false 
                    })}
                  </span>
                  <span className="header-separator">|</span>
                  <span className="header-user">
                    <HiOutlineUser />
                    {usuarioActual?.nombre || usuarioActual?.email || "Usuario"}
                  </span>
                </motion.div>
              </div>
            </div>

            {productos.filter(p => p.stock < 5).length > 0 && (
              <motion.div 
                className="alert-stock glass-card"
                variants={item}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <HiOutlineExclamation />
                <span>
                  <strong>{productos.filter(p => p.stock < 5).length}</strong> productos con stock bajo
                </span>
              </motion.div>
            )}

            <motion.div className="dashboard-grid" variants={item}>
              {[
                { icon: HiOutlineChartBar, label: "Visitas", value: metricas?.total_visitas || 0, color: "blue" },
                { icon: HiOutlineUsers, label: "Visitantes", value: metricas?.visitantes_unicos || 0, color: "amber" },
                { icon: HiOutlineShoppingCart, label: "Pedidos", value: pedidos.length, color: "cyan" },
                { icon: HiOutlineClock, label: "Tiempo", value: `${metricas?.tiempo_promedio_segundos || 0}s`, color: "purple" },
                { icon: HiOutlineCurrencyDollar, label: "Ingresos", value: `$${pedidos.reduce((sum, p) => sum + p.total, 0).toFixed(2)}`, color: "green" },
                { icon: HiOutlineCube, label: "Productos", value: productos.length, color: "orange" },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  className="glass-card stat-card"
                  variants={item}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className={`stat-icon ${stat.color}`}>
                    <stat.icon />
                  </div>
                  <div className="stat-info">
                    <h3>{stat.label}</h3>
                    <p>{loading ? "..." : stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div className="charts-section" variants={item}>
              <motion.div className="glass-card" variants={item}>
                <h2>Visitas (30 días)</h2>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={[
                      { name: "Ene", visitas: 120 },
                      { name: "Feb", visitas: 180 },
                      { name: "Mar", visitas: 150 },
                      { name: "Abr", visitas: 220 },
                      { name: "May", visitas: 280 },
                      { name: "Jun", visits: metricas?.total_visitas || 0 },
                    ]}>
                      <defs>
                        <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#f1f5f9' }}
                      />
                      <Area type="monotone" dataKey="visitas" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorVisitas)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div className="glass-card" variants={item}>
                <h2>Pedidos por Estado</h2>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      { name: "Pendiente", value: pedidos.filter(p => p.estado === "pendiente").length },
                      { name: "Procesando", value: pedidos.filter(p => p.estado === "procesando").length },
                      { name: "Enviado", value: pedidos.filter(p => p.estado === "enviado").length },
                      { name: "Completado", value: pedidos.filter(p => p.estado === "completado").length },
                      { name: "Cancelado", value: pedidos.filter(p => p.estado === "cancelado").length },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#f1f5f9' }}
                      />
                      <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div className="glass-card" variants={item}>
                <h2>Productos por Categoría</h2>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoriaData.length > 0 ? categoriaData : [{ name: "Sin datos", value: 1 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {(categoriaData.length > 0 ? categoriaData : [{ name: "Sin datos", value: 1 }]).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#f1f5f9' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div className="glass-card recent-orders" variants={item}>
                <h2>Pedidos Recientes</h2>
                {pedidos.length > 0 ? (
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidos.slice(0, 5).map((pedido) => (
                        <tr key={pedido.id}>
                          <td>#{pedido.id}</td>
                          <td>{pedido.cliente_nombre}</td>
                          <td>${pedido.total.toFixed(2)}</td>
                          <td>
                            {puedeEditar ? (
                              <select 
                                className={`estado-select ${pedido.estado}`}
                                value={pedido.estado}
                                onChange={(e) => cambiarEstado(pedido.id, e.target.value)}
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="procesando">Procesando</option>
                                <option value="enviado">Enviado</option>
                                <option value="completado">Completado</option>
                                <option value="cancelado">Cancelado</option>
                              </select>
                            ) : (
                              <span className={`estado ${pedido.estado}`}>
                                {pedido.estado}
                              </span>
                            )}
                          </td>
                          <td>{new Date(pedido.fecha_creacion).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-data">No hay pedidos aún</p>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {!vistaPrevia && currentView === "productos" && (
          <div className="productos-view">
            <div className="view-header">
              <h2>Productos de {tienda?.nombre}</h2>
              <button className="btn-primary" onClick={() => setMostrarModal(true)}>
                <HiOutlinePlus /> Nuevo Producto
              </button>
            </div>

            <div className="productos-list">
              {productos.map((producto) => (
                <motion.div
                  key={producto.id}
                  className="producto-item"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="producto-info">
                    <h4>{producto.nombre}</h4>
                    <span className="producto-categoria">{producto.categoria}</span>
                  </div>
                  <div className="producto-stock">
                    <span className={producto.stock < 10 ? "bajo-stock" : ""}>
                      Stock: {producto.stock}
                    </span>
                  </div>
                  <div className="producto-precio">
                    ${producto.precio.toFixed(2)}
                  </div>
                  <div className="producto-actions">
                    <button 
                      className="btn-edit"
                      onClick={() => {
                        setEditando(producto);
                        setImagenPreview(producto.imagen || "");
                        setMostrarModal(true);
                      }}
                    >
                      <HiOutlinePencil />
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => eliminarProducto(producto.id)}
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>
                </motion.div>
              ))}
              {productos.length === 0 && (
                <p className="no-data">No hay productos. ¡Crea el primero!</p>
              )}
            </div>
          </div>
        )}

        {!vistaPrevia && currentView === "pedidos" && (
          <div className="pedidos-view">
            <h2>Pedidos de {tienda?.nombre}</h2>
            {pedidos.length > 0 ? (
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((pedido) => (
                    <tr key={pedido.id} className="pedido-row" onClick={() => verDetallePedido(pedido)}>
                      <td>
                        <div className="pedido-id-cell">
                          <HiOutlineEye className="eye-icon" />
                          #{pedido.id}
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>{pedido.cliente_nombre}</strong>
                        </div>
                      </td>
                      <td>${pedido.total.toFixed(2)}</td>
                      <td>
                        {puedeEditar ? (
                          <select 
                            className={`estado-select ${pedido.estado}`}
                            value={pedido.estado}
                            onChange={(e) => {
                              e.stopPropagation();
                              cambiarEstado(pedido.id, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="procesando">Procesando</option>
                            <option value="enviado">Enviado</option>
                            <option value="completado">Completado</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        ) : (
                          <span className={`estado ${pedido.estado}`}>
                            {pedido.estado}
                          </span>
                        )}
                      </td>
                      <td>{new Date(pedido.fecha_creacion).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">No hay pedidos aún</p>
            )}

            {pedidoSeleccionado && (
              <div className="modal-detalle-overlay" onClick={cerrarDetallePedido}>
                <div 
                  className="modal-detalle-pedido" 
                  onClick={(e) => e.stopPropagation()}
                  style={{ "--primary": tienda?.color_primario || "#0ea5e9" } as React.CSSProperties}
                >
                  <div className="modal-detalle-header">
                    <h2>Pedido #{pedidoSeleccionado.id}</h2>
                    <button className="btn-cerrar-detalle" onClick={cerrarDetallePedido}>
                      <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>

                  <div className="detalle-seccion">
                    <span className={`badge-estado ${pedidoSeleccionado.estado}`}>
                      {pedidoSeleccionado.estado}
                    </span>
                    <span className={`badge-pago ${pedidoSeleccionado.estado_pago || 'pendiente'}`}>
                      {pedidoSeleccionado.estado_pago === 'pagado' ? 'Pagado' : 'Pago Pendiente'}
                    </span>
                  </div>

                  <div className="detalle-seccion">
                    <h3>Cliente</h3>
                    <p><strong>Nombre:</strong> {pedidoSeleccionado.cliente_nombre}</p>
                    <p><strong>Email:</strong> {pedidoSeleccionado.cliente_email}</p>
                    <p><strong>Teléfono:</strong> {pedidoSeleccionado.cliente_telefono || 'No registrado'}</p>
                  </div>

                  <div className="detalle-seccion">
                    <h3>Dirección de Envío</h3>
                    <p>{pedidoSeleccionado.direccion_envio || 'No especificada'}</p>
                  </div>

                  <div className="detalle-seccion">
                    <h3>Productos</h3>
                    <div className="items-list">
                      {pedidoSeleccionado.items && pedidoSeleccionado.items.length > 0 ? (
                        pedidoSeleccionado.items.map((item, idx) => (
                          <div key={idx} className="item-pedido">
                            <span>{item.producto_nombre} x{item.cantidad}</span>
                            <span>${(item.precio * item.cantidad).toFixed(2)}</span>
                          </div>
                        ))
                      ) : (
                        <p className="no-items">No hay productos registrados</p>
                      )}
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

                  <div className="detalle-fecha">
                    <p>Fecha: {new Date(pedidoSeleccionado.fecha_creacion).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!vistaPrevia && currentView === "metricas" && (
          <div className="metricas-view">
            <h2>Métricas de {tienda?.nombre}</h2>
            
            <div className="metricas-grid">
              <div className="metrica-card">
                <span className="metrica-value">{metricas?.total_visitas || 0}</span>
                <span className="metrica-label">Total Visitas</span>
              </div>
              <div className="metrica-card">
                <span className="metrica-value">{metricas?.visitantes_unicos || 0}</span>
                <span className="metrica-label">Visitantes Únicos</span>
              </div>
              <div className="metrica-card">
                <span className="metrica-value">{metricas?.tiempo_promedio_segundos || 0}s</span>
                <span className="metrica-label">Tiempo Promedio</span>
              </div>
            </div>
          </div>
        )}

        {!vistaPrevia && currentView === "pagos" && (
          <div className="pagos-view">
            <h2>Configuración de Pagos - Wompi</h2>
            
            <div className="pagos-info-box">
              <p>⚠️ <strong>Importante:</strong> Para habilitar pagos en tu tienda, necesitas configurar las credenciales de Wompi.</p>
              <p>Obtén tus credenciales en <a href="https://comercios.wompi.co" target="_blank" rel="noopener noreferrer">comercios.wompi.co</a></p>
            </div>

            <div className="pagos-form">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={pagosForm.wompi_activo}
                    onChange={(e) => setPagosForm({ ...pagosForm, wompi_activo: e.target.checked })}
                  />
                  Activar Wompi para esta tienda
                </label>
              </div>

              <div className="form-group">
                <label>Wompi Public Key</label>
                <input
                  type="text"
                  value={pagosForm.wompi_public_key}
                  onChange={(e) => setPagosForm({ ...pagosForm, wompi_public_key: e.target.value })}
                  placeholder="pub_test_XXXXX"
                />
                <small>Ejemplo: pub_test_XXXXXXXXXXXX</small>
              </div>

              <div className="form-group">
                <label>Wompi Integrity Secret</label>
                <input
                  type="password"
                  value={pagosForm.wompi_integrity_secret}
                  onChange={(e) => setPagosForm({ ...pagosForm, wompi_integrity_secret: e.target.value })}
                  placeholder="prod_integrity_XXXXX"
                />
                <small>Secreto de integridad del dashboard de Wompi</small>
              </div>

              <button
                type="button"
                className="save-btn"
                onClick={guardarConfiguracionPagos}
                disabled={guardandoPagos}
              >
                {guardandoPagos ? "Guardando..." : "💾 Guardar Configuración"}
              </button>

              {pagosForm.wompi_activo && (
                <div className="pagos-status-active">
                  ✅ Wompi está activo - Los clientes podrán pagar en tu tienda
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {mostrarModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editando ? "Editar Producto" : "Nuevo Producto"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Imagen del producto</label>
                <div className="image-upload-container">
                  {imagenPreview || editando?.imagen ? (
                    <div className="image-preview">
                      <img src={imagenPreview || editando?.imagen} alt="Preview" />
                      <button 
                        type="button" 
                        className="remove-image"
                        onClick={() => setImagenPreview("")}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="image-placeholder">
                      <span className="material-symbols-outlined">shopping_bag</span>
                      <span>Agregar imagen</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="image-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Nombre</label>
                <input 
                  name="nombre" 
                  defaultValue={editando?.nombre} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea name="descripcion" defaultValue={""} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Precio</label>
                  <input 
                    name="precio" 
                    type="number" 
                    step="0.01" 
                    defaultValue={editando?.precio || 0} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Stock</label>
                  <input 
                    name="stock" 
                    type="number" 
                    defaultValue={editando?.stock || 0} 
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <input 
                  name="categoria" 
                  defaultValue={editando?.categoria || ""} 
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {editando ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
