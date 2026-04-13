import { ReactNode, useMemo, useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineCube,
  HiOutlineUserGroup,
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineShoppingCart,
  HiOutlineGlobe,
  HiOutlineMenu,
  HiOutlineX,
} from "react-icons/hi";
import "./Layout.css";

interface LayoutProps {
  children: ReactNode;
}

const adminNavItems = [
  { to: "/admin", icon: HiOutlineHome, label: "Dashboard" },
  { to: "/admin/tiendas", icon: HiOutlineGlobe, label: "Tiendas SaaS" },
  { to: "/admin/pedidos", icon: HiOutlineShoppingCart, label: "Pedidos" },
  { to: "/admin/usuarios", icon: HiOutlineUsers, label: "Usuarios" },
  { to: "/admin/productos", icon: HiOutlineCube, label: "Productos" },
  { to: "/admin/clientes", icon: HiOutlineUserGroup, label: "Clientes" },
  { to: "/admin/reportes", icon: HiOutlineChartBar, label: "Reportes" },
  { to: "/admin/configuracion", icon: HiOutlineCog, label: "Configuración" },
];

const managerNavItems = (tiendaId: number) => [
  { to: `/admin/tiendas/${tiendaId}/dashboard`, icon: HiOutlineHome, label: "Dashboard" },
  { to: `/admin/tiendas/${tiendaId}/productos`, icon: HiOutlineCube, label: "Productos" },
  { to: `/admin/tiendas/${tiendaId}/pedidos`, icon: HiOutlineShoppingCart, label: "Pedidos" },
  { to: `/admin/tiendas/${tiendaId}/metricas`, icon: HiOutlineChartBar, label: "Métricas" },
];

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout } = useAuth();
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  // Cerrar sidebar al navegar
  useEffect(() => {
    setSidebarAbierto(false);
  }, [location.pathname]);

  const navItems = useMemo(() => {
    if (!usuario) return [];
    if (usuario.rol === "manager" && usuario.tienda_id) {
      return managerNavItems(usuario.tienda_id);
    }
    return adminNavItems;
  }, [usuario]);

  const isManager = usuario?.rol === "manager" && usuario.tienda_id;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const cerrarSidebar = () => setSidebarAbierto(false);

  return (
    <div className="layout">
      {/* Botón menú móvil */}
      <button 
        className="menu-toggle-btn"
        onClick={() => setSidebarAbierto(!sidebarAbierto)}
      >
        {sidebarAbierto ? <HiOutlineX /> : <HiOutlineMenu />}
      </button>

      {/* Overlay para móvil */}
      <AnimatePresence>
        {sidebarAbierto && (
          <motion.div 
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cerrarSidebar}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`sidebar ${sidebarAbierto ? "abierto" : ""}`}
      >
        <div className="logo">
          <h2>SRF</h2>
          <span>{isManager ? "Mi Tienda" : "Gestión"}</span>
        </div>

        <nav className="nav-menu">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              onClick={cerrarSidebar}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="nav-link"
              >
                <item.icon className="nav-icon" />
                <span>{item.label}</span>
              </motion.div>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <HiOutlineLogout />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </motion.aside>

      <main className="main-content">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
