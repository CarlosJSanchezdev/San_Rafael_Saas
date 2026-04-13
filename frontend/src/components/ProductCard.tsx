import { motion } from "framer-motion";
import { HiOutlinePlus, HiOutlineShoppingBag } from "react-icons/hi";
import { useCarrito } from "../context/CarritoContext";
import { useToast } from "../context/ToastContext";

interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria?: string;
  imagen?: string;
}

interface ProductCardProps {
  producto: Producto;
  colorPrimario: string;
  onAddToCart?: () => void;
}

export default function ProductCard({ producto, colorPrimario, onAddToCart }: ProductCardProps) {
  const { agregarItem } = useCarrito();
  const { showToast } = useToast();

  const handleAddToCart = () => {
    agregarItem({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen,
    });
    showToast(`${producto.nombre} agregado al carrito`, "success");
    onAddToCart?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-700">
        {producto.imagen ? (
          <motion.img
            src={producto.imagen}
            alt={producto.nombre}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.4 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <HiOutlineShoppingBag 
              className="text-6xl opacity-30" 
              style={{ color: colorPrimario }} 
            />
          </div>
        )}

        {/* Overlay on Hover */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-black/40 flex items-center justify-center"
        >
          <motion.button
            onClick={handleAddToCart}
            style={{ backgroundColor: colorPrimario }}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold text-sm"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <HiOutlinePlus className="text-lg" />
            Agregar
          </motion.button>
        </motion.div>

        {/* Stock Badge */}
        {producto.stock < 10 && producto.stock > 0 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            ¡Últimas unidades!
          </span>
        )}

        {/* Out of Stock Badge */}
        {producto.stock === 0 && (
          <span className="absolute top-3 left-3 bg-slate-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            Agotado
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        {producto.categoria && (
          <span 
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: colorPrimario }}
          >
            {producto.categoria}
          </span>
        )}

        {/* Name */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 line-clamp-2">
          {producto.nombre}
        </h3>

        {/* Description */}
        {producto.descripcion && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            {producto.descripcion}
          </p>
        )}

        {/* Price & Add Button */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              ${producto.precio.toFixed(2)}
            </span>
          </div>
          
          <motion.button
            onClick={handleAddToCart}
            disabled={producto.stock === 0}
            style={{ 
              backgroundColor: producto.stock > 0 ? colorPrimario : '#94a3b8' 
            }}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white transition-colors disabled:cursor-not-allowed"
            whileHover={producto.stock > 0 ? { scale: 1.1 } : {}}
            whileTap={producto.stock > 0 ? { scale: 0.95 } : {}}
          >
            <HiOutlinePlus className="text-xl" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
