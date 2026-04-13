import { Link } from "react-router-dom";
import { HiOutlinePhone, HiOutlineMail, HiOutlineLocationMarker, HiOutlineStar } from "react-icons/hi";

interface Tienda {
  id: number;
  nombre: string;
  subdominio: string;
  color_primario: string;
  color_secundario: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

interface TiendaFooterProps {
  tienda: Tienda;
}

export default function TiendaFooter({ tienda }: TiendaFooterProps) {
  const subdominio = tienda.subdominio;

  return (
    <footer 
      className="bg-slate-900 text-white"
      style={{ 
        "--primary": tienda.color_primario 
      } as React.CSSProperties}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: tienda.color_primario }}
              >
                {tienda.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold">{tienda.nombre}</h3>
                <p className="text-sm text-slate-400">Tu tienda de confianza</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Encuentra los mejores productos con la mejor calidad y precio. 
              Estamos comprometidos con tu satisfacción.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
              Enlaces Rápidos
            </h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to={`/t/${subdominio}`}
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Inicio
                </Link>
              </li>
              <li>
                <Link 
                  to={`/t/${subdominio}?categoria=Todos`}
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Productos
                </Link>
              </li>
              <li>
                <a 
                  href="#nosotros"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Nosotros
                </a>
              </li>
              <li>
                <a 
                  href="#faq"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Preguntas Frecuentes
                </a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
              Horario de Atención
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex justify-between">
                <span>Lunes - Viernes</span>
                <span>9:00 AM - 6:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Sábado</span>
                <span>9:00 AM - 2:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Domingo</span>
                <span>Cerrado</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
              Contáctanos
            </h4>
            <ul className="space-y-4">
              {tienda.telefono && (
                <li>
                  <a 
                    href={`tel:${tienda.telefono}`}
                    className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors"
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${tienda.color_primario}20` }}
                    >
                      <HiOutlinePhone className="text-lg" style={{ color: tienda.color_primario }} />
                    </div>
                    <span className="text-sm">{tienda.telefono}</span>
                  </a>
                </li>
              )}
              {tienda.email && (
                <li>
                  <a 
                    href={`mailto:${tienda.email}`}
                    className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors"
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${tienda.color_primario}20` }}
                    >
                      <HiOutlineMail className="text-lg" style={{ color: tienda.color_primario }} />
                    </div>
                    <span className="text-sm">{tienda.email}</span>
                  </a>
                </li>
              )}
              {tienda.direccion && (
                <li>
                  <div className="flex items-start gap-3 text-slate-400">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${tienda.color_primario}20` }}
                    >
                      <HiOutlineLocationMarker className="text-lg" style={{ color: tienda.color_primario }} />
                    </div>
                    <span className="text-sm">{tienda.direccion}</span>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} {tienda.nombre}. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <HiOutlineStar />
            Powered by 
            <span className="font-bold" style={{ color: tienda.color_primario }}>
              SRF
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
