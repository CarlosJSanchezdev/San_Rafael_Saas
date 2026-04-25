import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { CarritoProvider } from './context/CarritoContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Carrito from './components/Carrito';
import Registro from './pages/Registro';
import Login from './pages/Login';
import RecuperarPassword from './pages/RecuperarPassword';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Productos from './pages/Productos';
import Clientes from './pages/Clientes';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';
import Tiendas from './pages/Tiendas';
import TiendaAdmin from './pages/TiendaAdmin';
import TiendaPublica from './pages/TiendaPublica';
import CheckoutTienda from './pages/CheckoutTienda';
import Tienda from './pages/Tienda';
import ProductoDetalle from './pages/ProductoDetalle';
import Checkout from './pages/Checkout';
import Pedidos from './pages/Pedidos';
import Contacto from './pages/Contacto';
import Home from './pages/Home';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { usuario, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando...</div>;
  }
  
  if (!usuario) {
    return <Navigate to="/login" />;
  }
  
  if (usuario.rol === "manager" && usuario.tienda_id) {
    const expectedPath = `/admin/tiendas/${usuario.tienda_id}/`;
    if (!location.pathname.startsWith(expectedPath)) {
      return <Navigate to={`${expectedPath}dashboard`} />;
    }
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CarritoProvider>
          <Router>
            <Carrito />
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tienda" element={<Tienda />} />
            <Route path="/tienda/producto/:id" element={<ProductoDetalle />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/recuperar-password" element={<RecuperarPassword />} />
            <Route path="/reset-password" element={<RecuperarPassword />} />
            
            <Route path="/t/:subdominio" element={<TiendaPublica />} />
            <Route path="/t/:subdominio/checkout" element={<CheckoutTienda />} />
            <Route path="/t/:subdominio/producto/:id" element={<ProductoDetalle />} />
            <Route path="/t/:subdominio/sobre-nosotros" element={<TiendaPublica />} />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/tiendas" 
              element={
                <ProtectedRoute>
                  <Tiendas />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/tiendas/:tiendaId/dashboard" 
              element={
                <ProtectedRoute>
                  <TiendaAdmin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/tiendas/:tiendaId/preview" 
              element={
                <ProtectedRoute>
                  <TiendaAdmin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/tiendas/:tiendaId/productos" 
              element={
                <ProtectedRoute>
                  <TiendaAdmin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/tiendas/:tiendaId/pedidos" 
              element={
                <ProtectedRoute>
                  <TiendaAdmin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/tiendas/:tiendaId/metricas" 
              element={
                <ProtectedRoute>
                  <TiendaAdmin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/tiendas/:tiendaId/pagos" 
              element={
                <ProtectedRoute>
                  <TiendaAdmin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/usuarios" 
              element={
                <ProtectedRoute>
                  <Usuarios />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/productos" 
              element={
                <ProtectedRoute>
                  <Productos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/clientes" 
              element={
                <ProtectedRoute>
                  <Clientes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/pedidos" 
              element={
                <ProtectedRoute>
                  <Pedidos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/reportes" 
              element={
                <ProtectedRoute>
                  <Reportes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/configuracion" 
              element={
                <ProtectedRoute>
                  <Configuracion />
                </ProtectedRoute>
              } 
            />
            <Route path="/home" element={<Navigate to="/admin" />} />
            </Routes>
          </Router>
        </CarritoProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
