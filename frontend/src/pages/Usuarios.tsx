import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { HiOutlineUserAdd, HiOutlinePencil, HiOutlineTrash, HiOutlineX } from "react-icons/hi";
import Layout from "../components/Layout";
import { useToast } from "../context/ToastContext";
import "./Usuarios.css";

interface Usuario {
  id: number;
  nombre: string;
  usuario: string;
  email: string;
  rol: string;
  tienda_id: number | null;
}

interface Tienda {
  id: number;
  nombre: string;
  subdominio: string;
  manager_id: number | null;
}


export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    nombre: "",
    usuario: "",
    email: "",
    password: "",
    rol: "usuario",
    tienda_id: null as number | null,
  });

  useEffect(() => {
    fetchUsuarios();
    fetchTiendas();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await api.get("/usuarios");
      setUsuarios(response.data);
    } catch (error) {
      console.error("Error fetching usuarios:", error);
    }
  };

  const fetchTiendas = async () => {
    try {
      const response = await api.get("/admin/tiendas");
      setTiendas(response.data);
    } catch (error) {
      console.error("Error fetching tiendas:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editando) {
        const data: any = {};
        if (formData.nombre) data.nombre = formData.nombre;
        if (formData.usuario) data.usuario = formData.usuario;
        if (formData.email) data.email = formData.email;
        if (formData.rol) data.rol = formData.rol;
        if (formData.password) data.password = formData.password;
        if (formData.rol === "manager" && formData.tienda_id) {
          data.tienda_id = formData.tienda_id;
        }
        
        await api.put(`/usuarios/${editando.id}`, data);
        
        if (formData.rol === "manager" && formData.tienda_id) {
          await api.put(`/admin/tiendas/${formData.tienda_id}`, { manager_id: editando.id });
        }
        
        showToast("Usuario actualizado correctamente", "success");
      } else {
        const response = await api.post("/usuarios", formData);
        const nuevoUsuarioId = response.data.id;
        
        if (formData.rol === "manager" && formData.tienda_id) {
          await api.put(`/admin/tiendas/${formData.tienda_id}`, { manager_id: nuevoUsuarioId });
        }
        
        showToast("Usuario creado correctamente", "success");
      }
      fetchUsuarios();
      fetchTiendas();
      cerrarModal();
    } catch (error) {
      showToast("Error al guardar usuario", "error");
    }
  };

  const eliminarUsuario = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
    try {
      await api.delete(`/usuarios/${id}`);
      showToast("Usuario eliminado correctamente", "success");
      fetchUsuarios();
    } catch (error) {
      showToast("Error al eliminar usuario", "error");
    }
  };

  const abrirEditar = (usuario: Usuario) => {
    setEditando(usuario);
    setFormData({
      nombre: usuario.nombre,
      usuario: usuario.usuario,
      email: usuario.email,
      password: "",
      rol: usuario.rol,
      tienda_id: usuario.tienda_id || null,
    });
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setEditando(null);
    setFormData({ nombre: "", usuario: "", email: "", password: "", rol: "usuario", tienda_id: null });
  };

  return (
    <Layout>
      <div className="usuarios-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="page-header"
        >
          <h1>Gestión de Usuarios</h1>
          <button className="btn-primary" onClick={() => setMostrarModal(true)}>
            <HiOutlineUserAdd /> Nuevo Usuario
          </button>
        </motion.div>

        <motion.div
          className="usuarios-table glass-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <motion.tr
                  key={usuario.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ backgroundColor: "var(--bg-glass-hover)" }}
                >
                  <td>{usuario.id}</td>
                  <td>{usuario.nombre}</td>
                  <td>{usuario.usuario}</td>
                  <td>{usuario.email}</td>
                  <td>
                    <span className={`badge ${usuario.rol}`}>{usuario.rol}</span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn-edit" onClick={() => abrirEditar(usuario)}>
                        <HiOutlinePencil />
                      </button>
                      <button className="btn-delete" onClick={() => eliminarUsuario(usuario.id)}>
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
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
                  <h2>{editando ? "Editar Usuario" : "Nuevo Usuario"}</h2>
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
                    <label>Usuario</label>
                    <input
                      type="text"
                      value={formData.usuario}
                      onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Contraseña {editando && "(opcional)"}</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editando}
                    />
                  </div>
                  <div className="form-group">
                    <label>Rol</label>
                    <select
                      value={formData.rol}
                      onChange={(e) => setFormData({ ...formData, rol: e.target.value, tienda_id: e.target.value !== "manager" ? null : formData.tienda_id })}
                    >
                      <option value="usuario">Usuario</option>
                      <option value="admin">Administrador</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                  {formData.rol === "manager" && (
                    <div className="form-group">
                      <label>Tienda Asignada</label>
                      <select
                        value={formData.tienda_id || ""}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          tienda_id: e.target.value ? parseInt(e.target.value) : null 
                        })}
                      >
                        <option value="">Seleccionar tienda</option>
                        {tiendas.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.nombre} ({t.subdominio}.srf.com)
                          </option>
                        ))}
                      </select>
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
