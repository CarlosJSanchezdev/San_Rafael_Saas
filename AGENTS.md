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
- **API backend pública**: `/auth/*`, `/tienda/*`, `/tiendas/*`, `/pedidos/*`, `/metricas/visita`
- **API backend protegida**: `/usuarios/*`, `/productos/*`, `/clientes/*`, `/admin/tiendas/*`, `/admin/metricas/*`, `/admin/tienda/{id}/inventario/*`, `/admin/tienda/{id}/finanzas/*`
- **Rutas públicas frontend**: `/`, `/tienda/*`, `/t/:subdominio/*`, `/contacto/*`

## Vite Proxy (vite.config.ts)

El proxy `/admin` existe con bypass para HTML (el navegador recibe frontend, las llamadas JSON van al backend). **NO agregar `/admin` como prefijo de API en el frontend**.

```typescript
proxy: {
  '/api':  { target: 'http://localhost:8000', rewrite: (path) => path.replace(/^\/api/, '') },
  '/auth': { target: 'http://localhost:8000' },
  '/stats': { target: 'http://localhost:8000' },
  '/usuarios': { target: 'http://localhost:8000' },
  '/productos': { target: 'http://localhost:8000' },
  '/clientes': { target: 'http://localhost:8000' },
  '/pedidos': { target: 'http://localhost:8000' },
  '/tiendas': { target: 'http://localhost:8000' },
  '/metricas': { target: 'http://localhost:8000' },
  '/tienda': { target: 'http://localhost:8000' },
  '/wompi': { target: 'http://localhost:8000' },
  '^/admin(/.*)?': {
    target: 'http://localhost:8000',
    bypass(req) { return req.headers.accept?.includes('text/html') ? req.url : undefined; }
  },
}
```

## CSS Theme Isolation

NUNCA usar `:root` junto con clases scoped en el mismo archivo CSS.

```css
/* ✅ CORRECTO */
.admin-theme { --primary: #694634; }

/* ❌ INCORRECTO */
:root, .admin-theme { --primary: #694634; }
```

- **Admin**: `.admin-theme` → Chocolate Cremoso `#694634`
- **Tiendas**: `.store-theme` → colores dinámicos de cada tienda
- **Default** (login, registro): `:root` en index.css usa colores del admin
- `style_1.css` solo importar en `TiendaPublica.tsx`, `ProductoDetalle.tsx`, `CheckoutTienda.tsx`

## Autenticación

- **Token**: `sessionStorage` (clave: `userToken`)
- **Cookie**: HttpOnly `session_token`, 7 días
- **Validación**: `api.get("/auth/validar-token")`
- **Logout**: limpia sessionStorage y cookie
- **Frontend**: `ProtectedRoute` en App.tsx
- **Backend**: `Depends(get_current_user)` en cada router protegido

## Errores comunes

1. **"tiendas.filter is not a function"**: la API puede devolver un objeto, no array.
   ```typescript
   setTiendas(Array.isArray(data) ? data : []);
   ```
2. **Colores púrpura en admin**: `style_1.css` importado en páginas no-tienda. Solo en `TiendaPublica`, `ProductoDetalle`, `CheckoutTienda`.
3. **"magnetic-field" en Permissions-Policy**: Firefox lo rechaza. Remover de `main.py`.

## Componentes de Tienda

- `TiendaStyle`: inyecta `--primary` dinámico según la tienda
- Plantillas: `style_1` (Clásico Lavanda), `style_2` (Midnight Dark)

## Comandos

```bash
cd frontend
npm run build        # build + typecheck
npx tsc --noEmit     # solo typecheck
npm run lint         # linter
npm run preview      # preview build
```

## Backend modules (app/)

```
main.py          # FastAPI entry, middleware, routers
auth.py          # autenticación, get_current_user
usuarios.py      # CRUD usuarios
productos.py     # CRUD productos
clientes.py      # CRUD clientes
tiendas.py       # CRUD tiendas + router_admin /admin/tiendas/*
pedidos.py       # pedidos
tienda.py        # /tienda (demo/home pública)
stats.py         # estadísticas
metricas.py      # metricas público + router_admin /admin/.../metricas
plantillas.py    # plantillas de tienda
wompi_payment.py # integración Wompi /pedidos/create-wompi-transaction, /webhooks/wompi
inventario.py    # /admin/tienda/{id}/inventario/*
finanzas.py      # /admin/tienda/{id}/finanzas/*
database.py      # SQLAlchemy engine, Base
models.py        # modelos DB
schemas.py       # esquemas Pydantic
crud.py          # operaciones CRUD genéricas
security_logging.py  # logging de eventos de seguridad (login, access denied, etc.)
```

## Reglas generales

1. **Nunca hacer commit** hasta que el usuario lo indique
2. **Modo plan** durante diseño, **modo build** solo con confirmación
3. **Responder en español** siempre
4. **Usar `!important`** solo cuando sea estrictamente necesario
