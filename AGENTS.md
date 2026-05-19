# SRF-web - Instrucciones para Agentes

## Inicio Rápido

```bash
# Backend (puerto 8000)
cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (puerto 5173)
cd frontend && npm run dev
```

## Arquitectura

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Backend | FastAPI + Uvicorn |
| DB | SQLite + SQLAlchemy |

- **Rutas `/admin/*`**: Frontend React (protegidas por ProtectedRoute)
- **API del backend**: `/auth/*`, `/usuarios/*`, `/productos/*`, `/clientes/*`, `/pedidos/*`, `/tiendas/*`, `/metricas/*`
- **Rutas públicas**: `/`, `/tienda/*`, `/t/:subdominio/*`, `/contacto/*`

## CSS Theme Isolation

### Regla fundamental
NUNCA uses `:root` junto con clases con alcance en el mismo archivo CSS.

### Estructura actual de temas
- **Admin**: `.admin-theme` → Chocolate Cremoso `#694634` (Layout.css)
- **Tiendas**: `.store-theme` → Colores dinámicos de cada tienda (style_1.css)
- **Default**: `:root` en index.css usa colores del admin (login, registro, etc.)

### Patrón de uso
```css
/* ✅ CORRECTO - archivo scoped */
.admin-theme {
  --primary: #694634;
}

/* ❌ INCORRECTO - mezcla global con scoped */
:root, .admin-theme {
  --primary: #694634;
}
```

## Vite Proxy (vite.config.ts)

### Regla crítica
Las rutas `/admin/*` son del **frontend React**, no del backend.

Cuando agregues nuevas rutas de API del backend, **NO uses** el prefijo `/admin` en el proxy. Usa otros prefijos como `/api/`, `/v1/`, etc.

### Configuración actual
```typescript
proxy: {
  '/auth': { target: 'http://localhost:8000' },
  '/usuarios': { target: 'http://localhost:8000' },
  '/productos': { target: 'http://localhost:8000' },
  '/clientes': { target: 'http://localhost:8000' },
  '/pedidos': { target: 'http://localhost:8000' },
  '/tiendas': { target: 'http://localhost:8000' },
  '/metricas': { target: 'http://localhost:8000' },
  // /admin NO está en el proxy - es ruta del frontend
}
```

## Autenticación

- **Token**: Guardado en `sessionStorage` (clave: `userToken`)
- **Cookie**: Backend configura cookie HttpOnly `session_token`
- **Duración**: 7 días (cookie max_age)
- **Validación**: `api.get("/auth/validar-token")`
- **Logout**: Limpia sessionStorage y cookie

### Protecciones
- **Frontend**: `ProtectedRoute` component en App.tsx
- **Backend**: `Depends(get_current_user)` en FastAPI

## Errores comunes y soluciones

### 1. "tiendas.filter is not a function"
La API puede devolver un objeto en lugar de un array.
```typescript
const data = response.data;
setTiendas(Array.isArray(data) ? data : []);
```

### 2. Rutas admin mostrando JSON
Si el proxy envía requests `/admin/*` al backend, el navegador verá JSON en vez de la UI.
**Solución**: No agregar `/admin` al proxy de Vite.

### 3. Colores púrpura en admin
Si `style_1.css` importa estáticamente en páginas no-tienda, los colores se mezclan.
**Solución**: Solo importar en `TiendaPublica.tsx`, `ProductoDetalle.tsx`, `CheckoutTienda.tsx`.

### 4. "magnetic-field" en Permissions-Policy
Firefox rechaza esta feature no reconocida.
**Solución**: Eliminar `magnetic-field` de `backend/app/main.py`.

## Componentes de Tienda

### Colores dinámicos
El componente `TiendaStyle` inyecta colores vía JavaScript según la tienda.
```typescript
// Si la tienda tiene color_primario="#ffa348", TiendaStyle setea:
root.style.setProperty('--primary', '#ffa348');
```

### Plantillas disponibles
- `style_1`: Clásico Lavanda (usado por defecto)
- `style_2`: Midnight Dark

## Comandos útiles

```bash
# Build frontend
npm run build

# Verificar TypeScript
npx tsc --noEmit --skipLibCheck

# Lint
npm run lint

# Preview build
npm run preview
```

## Estructura de directorios

```
Srf-web/
├── backend/
│   └── app/
│       ├── main.py          # FastAPI entry point
│       ├── auth.py          # Autenticación, sesiones
│       ├── tiendas.py       # CRUD tiendas
│       ├── productos.py     # CRUD productos
│       └── schemas.py       # Modelos Pydantic
├── frontend/
│   └── src/
│       ├── pages/           # Componentes de página
│       ├── components/      # Componentes reutilizables
│       ├── context/         # Contextos (Auth, Carrito, Toast)
│       ├── styles/
│       │   └── tienda/      # style_1.css, style_2.css
│       └── api.ts           # Cliente HTTP (axios)
└── stitch/                  # Archivos de diseño (referencia)
```

## Reglas generales

1. **Nunca hacer commit** hasta que el usuario lo indique
2. **Modo plan** durante diseño, **modo build** solo con confirmación
3. **Responder en español** siempre
4. **Usar `!important`** solo cuando sea estrictamente necesario para sobrescribir CSS
