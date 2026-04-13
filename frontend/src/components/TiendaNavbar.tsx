import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCarrito } from "../context/CarritoContext";
import { HiOutlineMenu, HiOutlineX, HiOutlineShoppingBag } from "react-icons/hi";

interface Tienda {
  id: number;
  nombre: string;
  subdominio: string;
  color_primario: string;
  color_secundario: string;
  telefono?: string;
}

interface TiendaNavbarProps {
  tienda: Tienda;
  categorias?: string[];
  busqueda?: string;
  onBusquedaChange?: (valor: string) => void;
}

export default function TiendaNavbar({ 
  tienda, 
  categorias = [], 
  busqueda = "",
  onBusquedaChange 
}: TiendaNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { cantidadTotal } = useCarrito();

  const subdominio = tienda.subdominio;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (busqueda.trim()) {
      navigate(`/t/${subdominio}?busqueda=${encodeURIComponent(busqueda)}`);
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-primary/10 shadow-sm" 
          : "bg-transparent"
      }`}
      style={{ 
        "--primary": tienda.color_primario 
      } as React.CSSProperties}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link 
            to={`/t/${subdominio}`} 
            className="flex items-center gap-3"
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: tienda.color_primario }}
            >
              {tienda.nombre.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {tienda.nombre}
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to={`/t/${subdominio}`}
              className={`text-sm font-semibold hover:text-primary transition-colors ${
                location.pathname === `/t/${subdominio}` 
                  ? "text-primary" 
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              Inicio
            </Link>
            {categorias.length > 0 && (
              <div className="relative group">
                <button className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors flex items-center gap-1">
                  Categorías
                  <span className="material-symbols-outlined text-lg">expand_more</span>
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-left">
                  {categorias.map((cat) => (
                    <Link
                      key={cat}
                      to={`/t/${subdominio}?categoria=${encodeURIComponent(cat)}`}
                      className="block px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary first:rounded-t-xl last:rounded-b-xl"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <Link 
              to={`/t/${subdominio}#contacto`}
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
            >
              Contacto
            </Link>
          </nav>

          {/* Search & Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden sm:block">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={busqueda}
                  onChange={(e) => onBusquedaChange?.(e.target.value)}
                  className="w-48 lg:w-64 pl-10 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 border-none rounded-full focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </form>

            {/* Cart */}
            <motion.button
              onClick={() => navigate(`/t/${subdominio}/checkout`)}
              className="relative p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <HiOutlineShoppingBag className="text-xl text-slate-600 dark:text-slate-300" />
              {cantidadTotal > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                  style={{ backgroundColor: tienda.color_primario }}
                >
                  {cantidadTotal}
                </motion.span>
              )}
            </motion.button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {menuOpen ? (
                <HiOutlineX className="text-xl text-slate-600 dark:text-slate-300" />
              ) : (
                <HiOutlineMenu className="text-xl text-slate-600 dark:text-slate-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800"
          >
            <div className="px-4 py-4 space-y-3">
              <form onSubmit={handleSearch} className="sm:hidden">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={busqueda}
                    onChange={(e) => onBusquedaChange?.(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary"
                  />
                </div>
              </form>
              
              <Link
                to={`/t/${subdominio}`}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary rounded-xl"
              >
                Inicio
              </Link>
              
              {categorias.map((cat) => (
                <Link
                  key={cat}
                  to={`/t/${subdominio}?categoria=${encodeURIComponent(cat)}`}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary rounded-xl"
                >
                  {cat}
                </Link>
              ))}
              
              <Link
                to={`/t/${subdominio}#contacto`}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary rounded-xl"
              >
                Contacto
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
