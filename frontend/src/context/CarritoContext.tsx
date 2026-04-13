import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CarritoItem {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
  tienda_id: number;
}

interface CarritoData {
  [tiendaId: string]: CarritoItem[];
}

interface CarritoContextType {
  items: CarritoItem[];
  agregarItem: (item: Omit<CarritoItem, "cantidad" | "tienda_id">, cantidad?: number) => void;
  eliminarItem: (id: number) => void;
  actualizarCantidad: (id: number, cantidad: number) => void;
  vaciarCarrito: () => void;
  total: number;
  cantidadTotal: number;
  toggleCarrito: () => void;
  isOpen: boolean;
  setTiendaActiva: (tiendaId: number) => void;
}

const CarritoContext = createContext<CarritoContextType | undefined>(undefined);

const STORAGE_KEY = "carrito_por_tienda";

function loadCarritoData(): { data: CarritoData; tiendaActiva: number | null } {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        data: parsed.tiendas || {},
        tiendaActiva: parsed.tiendaActiva || null
      };
    } catch {
      return { data: {}, tiendaActiva: null };
    }
  }
  return { data: {}, tiendaActiva: null };
}

export function CarritoProvider({ children }: { children: ReactNode }) {
  const [carritoData, setCarritoData] = useState<CarritoData>(() => loadCarritoData().data);
  const [tiendaActiva, setTiendaActivaState] = useState<number | null>(() => loadCarritoData().tiendaActiva);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const data = { tiendas: carritoData, tiendaActiva };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [carritoData, tiendaActiva]);

  const toggleCarrito = () => setIsOpen(!isOpen);

  const setTiendaActiva = (tiendaId: number) => {
    setTiendaActivaState(tiendaId);
  };

  const getItemsActuales = (): CarritoItem[] => {
    if (!tiendaActiva) return [];
    return carritoData[tiendaActiva.toString()] || [];
  };

  const agregarItem = (item: Omit<CarritoItem, "cantidad" | "tienda_id">, cantidad: number = 1) => {
    if (!tiendaActiva) return;
    
    setCarritoData(prev => {
      const tiendaKey = tiendaActiva.toString();
      const itemsTienda = prev[tiendaKey] || [];
      
      const existente = itemsTienda.find(i => i.id === item.id);
      let nuevosItems: CarritoItem[];
      
      if (existente) {
        nuevosItems = itemsTienda.map(i =>
          i.id === item.id ? { ...i, cantidad: i.cantidad + cantidad } : i
        );
      } else {
        nuevosItems = [...itemsTienda, { ...item, cantidad, tienda_id: tiendaActiva }];
      }
      
      return { ...prev, [tiendaKey]: nuevosItems };
    });
    setIsOpen(true);
  };

  const eliminarItem = (id: number) => {
    if (!tiendaActiva) return;
    
    setCarritoData(prev => {
      const tiendaKey = tiendaActiva.toString();
      const itemsTienda = prev[tiendaKey] || [];
      return { ...prev, [tiendaKey]: itemsTienda.filter(i => i.id !== id) };
    });
  };

  const actualizarCantidad = (id: number, cantidad: number) => {
    if (!tiendaActiva) return;
    
    if (cantidad <= 0) {
      eliminarItem(id);
      return;
    }
    
    setCarritoData(prev => {
      const tiendaKey = tiendaActiva.toString();
      const itemsTienda = prev[tiendaKey] || [];
      return {
        ...prev,
        [tiendaKey]: itemsTienda.map(i => i.id === id ? { ...i, cantidad } : i)
      };
    });
  };

  const vaciarCarrito = () => {
    if (!tiendaActiva) return;
    
    setCarritoData(prev => {
      const tiendaKey = tiendaActiva.toString();
      return { ...prev, [tiendaKey]: [] };
    });
  };

  const items = getItemsActuales();
  const total = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const cantidadTotal = items.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <CarritoContext.Provider
      value={{
        items,
        agregarItem,
        eliminarItem,
        actualizarCantidad,
        vaciarCarrito,
        total,
        cantidadTotal,
        toggleCarrito,
        isOpen,
        setTiendaActiva,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
}

export function useCarrito() {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error("useCarrito must be used within CarritoProvider");
  }
  return context;
}
