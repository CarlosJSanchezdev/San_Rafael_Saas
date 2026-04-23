import { useState, useEffect } from "react";
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
import { HiOutlineUsers, HiOutlineCube, HiOutlineCurrencyDollar, HiOutlineShoppingCart, HiOutlineExclamation, HiOutlineUser } from "react-icons/hi";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import "./Dashboard.css";

interface Stats {
  usuarios: number;
  productos: number;
  clientes: number;
  productos_bajo_stock: number;
  valor_inventario: number;
}

interface ChartData {
  name: string;
  ventas: number;
  gastos: number;
}

interface CategoryData {
  name: string;
  value: number;
}

// Colores más sobrios y profesionales
const COLORS = ["#1E40AF", "#F59E0B", "#059669", "#7C3AED", "#DC2626", "#EC4899"];

// Animaciones sutiles
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { y: 10, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.3 } },
};

export default function Dashboard() {
  const { usuario } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<Stats>({
    usuarios: 0,
    productos: 0,
    clientes: 0,
    productos_bajo_stock: 0,
    valor_inventario: 0,
  });
  const [ventasData, setVentasData] = useState<ChartData[]>([]);
  const [categoriaData, setCategoriaData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, ventasRes, catRes] = await Promise.all([
        api.get("/stats/dashboard"),
        api.get("/stats/ventas-mensuales"),
        api.get("/stats/categorias"),
      ]);

      setStats(statsRes.data);
      setVentasData(ventasRes.data);
      setCategoriaData(catRes.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setVentasData([
        { name: "Ene", ventas: 4000, gastos: 2400 },
        { name: "Feb", ventas: 3000, gastos: 1398 },
        { name: "Mar", ventas: 2000, gastos: 9800 },
        { name: "Abr", ventas: 2780, gastos: 3908 },
        { name: "May", ventas: 1890, gastos: 4800 },
        { name: "Jun", ventas: 2390, gastos: 3800 },
        { name: "Jul", ventas: 3490, gastos: 4300 },
      ]);
      setCategoriaData([
        { name: "Electrónica", value: 35 },
        { name: "Ropa", value: 25 },
        { name: "Alimentos", value: 20 },
        { name: "Otros", value: 20 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    { label: "Usuarios", value: stats.usuarios, icon: HiOutlineUsers, color: "blue", change: "+12%" },
    { label: "Productos", value: stats.productos, icon: HiOutlineCube, color: "green", change: "+8%" },
    { label: "Clientes", value: stats.clientes, icon: HiOutlineShoppingCart, color: "purple", change: "+15%" },
    { label: "Inventario", value: `$${stats.valor_inventario.toLocaleString()}`, icon: HiOutlineCurrencyDollar, color: "orange", change: "+23%" },
  ];

  return (
    <Layout>
      <motion.div
        className="dashboard"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <div className="page-header">
          <div className="header-left">
            <motion.h1 variants={item}>Dashboard</motion.h1>
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
                {usuario?.nombre || usuario?.email || "Usuario"}
              </span>
            </motion.div>
          </div>
        </div>

        {stats.productos_bajo_stock > 0 && (
          <motion.div
            className="alert-stock"
            variants={item}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <HiOutlineExclamation />
            <span>
              <strong>{stats.productos_bajo_stock}</strong> productos con stock bajo
            </span>
          </motion.div>
        )}

        <motion.div className="dashboard-grid" variants={item}>
          {statsCards.map((stat) => (
            <motion.div
              key={stat.label}
              className="stat-card"
              variants={item}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`stat-icon ${stat.color}`}>
                <stat.icon />
              </div>
              <div className="stat-info">
                <h3>{stat.label}</h3>
                <p>{loading ? "..." : stat.value}</p>
                <span className="change positive">{stat.change}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="charts-section" variants={item}>
          <motion.div className="glass-card" variants={item}>
            <h2>Ventas vs Gastos</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ventasData}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      fontSize: "0.8125rem",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="ventas"
                    stroke="#0284c7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVentas)"
                  />
                  <Area
                    type="monotone"
                    dataKey="gastos"
                    stroke="#ea580c"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorGastos)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div className="glass-card" variants={item}>
            <h2>Por Categoría</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoriaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {categoriaData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      fontSize: "0.8125rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="legend">
              {categoriaData.map((entry, index) => (
                <div key={entry.name} className="legend-item">
                  <span className="dot" style={{ background: COLORS[index % COLORS.length] }} />
                  <span>{entry.name}</span>
                  <span className="percent">{entry.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <motion.div className="glass-card" variants={item} style={{ marginTop: "1rem" }}>
          <h2>Ventas Mensuales</h2>
          <div className="chart-container" style={{ height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    fontSize: "0.8125rem",
                  }}
                />
                <Bar dataKey="ventas" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
