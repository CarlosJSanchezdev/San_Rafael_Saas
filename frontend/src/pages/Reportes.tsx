import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../api";
import { 
  HiOutlineDocumentDownload, 
  HiOutlineUsers, 
  HiOutlineCube, 
  HiOutlineUserGroup
} from "react-icons/hi";
import Layout from "../components/Layout";
import "./Reportes.css";

interface ReportData {
  tipo: string;
  data: any[];
}


export default function Reportes() {
  const [reportes, setReportes] = useState<ReportData[]>([
    { tipo: "usuarios", data: [] },
    { tipo: "productos", data: [] },
    { tipo: "clientes", data: [] },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportes();
  }, []);

  const fetchReportes = async () => {
    try {
      const [statsRes] = await Promise.all([
        api.get("/stats/dashboard"),
      ]);

      const stats = statsRes.data;

      setReportes([
        { 
          tipo: "usuarios", 
          data: [
            { name: "Total", value: stats.usuarios },
            { name: "Admin", value: 1 },
            { name: "Managers", value: Math.max(0, stats.usuarios - 2) },
          ] 
        },
        { 
          tipo: "productos", 
          data: [
            { name: "Total", value: stats.productos },
            { name: "Bajo Stock", value: stats.productos_bajo_stock },
            { name: "Valor", value: stats.valor_inventario },
          ] 
        },
        { 
          tipo: "clientes", 
          data: [
            { name: "Total", value: stats.clientes },
          ] 
        },
      ]);
    } catch (error) {
      console.error("Error fetching reportes:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportarCSV = (tipo: string) => {
    let data: any[] = [];
    let filename = "";

    switch (tipo) {
      case "usuarios":
        api.get("/usuarios").then(res => {
          data = res.data;
          filename = "usuarios.csv";
          downloadCSV(data, filename, ["id", "nombre", "usuario", "email", "rol"]);
        });
        break;
      case "productos":
        api.get("/productos").then(res => {
          data = res.data;
          filename = "productos.csv";
          downloadCSV(data, filename, ["id", "nombre", "descripcion", "precio", "stock", "categoria"]);
        });
        break;
      case "clientes":
        api.get("/clientes").then(res => {
          data = res.data;
          filename = "clientes.csv";
          downloadCSV(data, filename, ["id", "nombre", "empresa", "email", "telefono", "direccion"]);
        });
        break;
    }
  };

  const downloadCSV = (data: any[], filename: string, columns: string[]) => {
    const headers = columns.join(",");
    const rows = data.map(row => 
      columns.map(col => `"${row[col] || ''}"`).join(",")
    );
    const csv = [headers, ...rows].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const reportTypes = [
    {
      id: "usuarios",
      title: "Reporte de Usuarios",
      icon: HiOutlineUsers,
      description: "Exporta todos los usuarios registrados en el sistema",
    },
    {
      id: "productos",
      title: "Reporte de Productos",
      icon: HiOutlineCube,
      description: "Exporta el inventario completo de productos",
    },
    {
      id: "clientes",
      title: "Reporte de Clientes",
      icon: HiOutlineUserGroup,
      description: "Exporta la base de datos de clientes",
    },
  ];

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="page-header">
          <h1>Reportes y Analytics</h1>
        </div>

        <div className="reportes-grid">
          {reportTypes.map((report) => (
            <motion.div
              key={report.id}
              className="reporte-card glass-card"
              whileHover={{ scale: 1.02 }}
            >
              <div className="reporte-icon">
                <report.icon />
              </div>
              <div className="reporte-info">
                <h3>{report.title}</h3>
                <p>{report.description}</p>
              </div>
              <button 
                className="btn-export"
                onClick={() => exportarCSV(report.id)}
                disabled={loading}
              >
                <HiOutlineDocumentDownload />
                Exportar CSV
              </button>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="resumen-reportes glass-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2>Resumen del Sistema</h2>
          {loading ? (
            <p>Cargando...</p>
          ) : (
            <div className="resumen-grid">
              {reportes.map((reporte) => (
                <div key={reporte.tipo} className="resumen-item">
                  <h4>{reporte.tipo.charAt(0).toUpperCase() + reporte.tipo.slice(1)}</h4>
                  <p className="resumen-valor">
                    {reporte.data[0]?.value || 0}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </Layout>
  );
}
