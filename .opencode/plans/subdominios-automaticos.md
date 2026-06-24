# Plan: Subdominios automáticos para tiendas (1% AWS Amplify-like)

## Objetivo
Cuando se cree una tienda con subdominio `mitienda`, debe quedar accesible en `https://mitienda.sanrafaeldesarrollo.com`, manteniendo el fallback `/t/mitienda`.

## Dominio base
- Producción: `sanrafaeldesarrollo.com`
- Desarrollo: `localhost:5173` (con `*.localhost`)

## Alcance (Fases 1-2)
- Backend: middleware + validación + endpoint
- Frontend: routing por host + Vite config
- No incluye: DNS wildcard, Nginx, SSL wildcard, dominio propio por tienda

---

## Cambios Backend (Fase 1)

### Archivo 1: `backend/.env`
Agregar al inicio:
```
# Dominio base para resolución de subdominios de tiendas
DOMINIO_BASE=localhost:5173
DOMINIO_BASE_PROD=sanrafaeldesarrollo.com
```

### Archivo 2: `backend/app/schemas.py`
Agregar validator de formato al modelo `TiendaCrear`:

```python
from pydantic import validator

class TiendaCrear(BaseModel):
    # ... campos existentes ...
    subdominio: str
    slug: str

    @validator("subdominio", "slug")
    def validar_subdominio(cls, v):
        if not v:
            raise ValueError("El subdominio es obligatorio")
        v = v.lower().strip()
        import re
        if not re.match(r'^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$', v):
            raise ValueError("Subdominio inválido: usar solo minúsculas, números y guiones (3-32 chars, sin empezar/terminar en guion)")
        return v
```

### Archivo 3: `backend/app/main.py`
Nuevo middleware + CORS dinámico:

```python
import re

def extraer_subdominio(host: str, dominio_base: str) -> str | None:
    """Extrae el subdominio del Host header, excluyendo www y dominio base."""
    if not host:
        return None
    # Quitar puerto si existe
    host_clean = host.split(":")[0]
    # Si el host no termina con el dominio base, no es nuestro
    if not host_clean.endswith(dominio_base):
        return None
    # Quitar el dominio base del final
    prefix = host_clean[:-len(dominio_base)].rstrip(".")
    if not prefix or prefix == "www":
        return None
    # Validar formato subdominio
    if not re.match(r'^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$', prefix):
        return None
    return prefix


class SubdomainMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        # Rutas que NO requieren resolver tienda
        if path.startswith((
            "/admin", "/auth", "/docs", "/openapi.json",
            "/tiendas", "/metricas", "/productos", "/pedidos",
            "/usuarios", "/clientes", "/wompi", "/stats", "/tienda", "/"
        )):
            return await call_next(request)
        # Extraer subdominio de Host o X-Forwarded-Host
        host = request.headers.get("X-Forwarded-Host") or request.headers.get("host", "")
        dominio_base = os.getenv("DOMINIO_BASE", "localhost:5173")
        sub = extraer_subdominio(host, dominio_base)
        if sub:
            request.state.subdominio = sub
        return await call_next(request)


# Registrar primero que CORS
app.add_middleware(SubdomainMiddleware)

# CORS dinámico
DOMINIO_BASE = os.getenv("DOMINIO_BASE", "localhost:5173")
ALLOWED_ORIGINS.extend([
    f"http://*.{DOMINIO_BASE}",
    f"https://*.{DOMINIO_BASE}",
])
```

### Archivo 4: `backend/app/tiendas.py`
Nuevo endpoint público:

```python
from fastapi import Request

@router_publico.get("/tiendas/actual")
def obtener_tienda_actual(
    request: Request,
    subdominio: str = None,
    db: Session = Depends(get_db)
):
    """Obtiene la tienda actual basada en el subdominio del Host o query param."""
    sub = getattr(request.state, "subdominio", None) or subdominio
    if not sub:
        raise HTTPException(status_code=400, detail="Subdominio no detectado")
    tienda = db.query(models.Tienda).filter(
        models.Tienda.subdominio == sub,
        models.Tienda.activa == True
    ).first()
    if not tienda:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
    return tienda
```

---

## Cambios Frontend (Fase 2)

### Archivo 5: `frontend/.env` (NUEVO)
```
VITE_DOMINIO_BASE=localhost:5173
```

### Archivo 6: `frontend/src/App.tsx`
Agregar función wrapper que detecta subdominio del host:

```tsx
function obtenerSubdominioDeHost(): string | null {
  const host = window.location.host;
  const dominioBase = import.meta.env.VITE_DOMINIO_BASE || "localhost:5173";
  if (host === dominioBase || !host.includes(dominioBase)) return null;
  const sub = host.replace(`.${dominioBase}`, "");
  if (!sub || sub === "www") return null;
  return sub;
}
```

Modificar `<Routes>` para que:
- Si `obtenerSubdominioDeHost()` retorna un subdominio → renderizar rutas de tienda pública sin prefix `/t/`
- Si no → flujo admin normal con rutas actuales

Implementación:
```tsx
const subdominioHost = obtenerSubdominioDeHost();

if (subdominioHost) {
  // Modo tienda pública por subdominio
  return (
    <ToastProvider>
      <AuthProvider>
        <CarritoProvider>
          <Router>
            <Carrito />
            <Routes>
              <Route path="/" element={<TiendaPublica />} />
              <Route path="/checkout" element={<CheckoutTienda />} />
              <Route path="/producto/:id" element={<ProductoDetalle />} />
              <Route path="/sobre-nosotros" element={<TiendaPublica />} />
            </Routes>
          </Router>
        </CarritoProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
// else: flujo normal (admin + /t/{subdominio} fallback)

// Hook en TiendaPublica para obtener subdominio de host o de useParams
```

### Archivo 7: `frontend/src/pages/TiendaPublica.tsx`
Agregar hook para resolver subdominio desde host o params:

```tsx
function useSubdominio(): string | undefined {
  const params = useParams<{ subdominio: string }>();
  const host = window.location.host;
  const dominioBase = import.meta.env.VITE_DOMINIO_BASE || "localhost:5173";
  if (host !== dominioBase && host.includes(dominioBase)) {
    const sub = host.replace(`.${dominioBase}`, "");
    if (sub && sub !== "www") return sub;
  }
  return params.subdominio;
}

// Reemplazar:
// const { subdominio } = useParams<{ subdominio: string }>();
// Con:
const subdominio = useSubdominio();
```

Actualizar `registrarMetrica` para enviar el host:
```tsx
await api.post("/metricas/visita", {
  ...
  url: window.location.host + window.location.pathname,
});
```

### Archivo 8: `frontend/vite.config.ts`
Agregar `.localhost` a allowedHosts:

```typescript
server: {
  allowedHosts: ['.localhost', '.ngrok-free.dev', '.ngrok.io', '.localtunnel.me'],
  // ... resto igual
}
```

---

## Archivos resumen

| # | Archivo | Acción | Líneas estimadas |
|---|---------|--------|------------------|
| 1 | `backend/.env` | Edit | +3 |
| 2 | `backend/app/schemas.py` | Edit | +15 |
| 3 | `backend/app/main.py` | Edit | +35 |
| 4 | `backend/app/tiendas.py` | Edit | +15 |
| 5 | `frontend/.env` | New | +1 |
| 6 | `frontend/src/App.tsx` | Edit | +30 |
| 7 | `frontend/src/pages/TiendaPublica.tsx` | Edit | +15 |
| 8 | `frontend/vite.config.ts` | Edit | +1 |

---

## Testing en desarrollo

### 1. Arrancar servidores
```bash
cd backend && ../venv/bin/uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev
```

### 2. Agregar entradas en /etc/hosts
```
127.0.0.1   cafe-test.localhost
127.0.0.1   otro-test.localhost
```

### 3. Probar
- `http://localhost:5173/t/cafe-test` (fallback path) ✅ debe funcionar
- `http://cafe-test.localhost:5173/` (subdominio real) ✅ NUEVO
- `http://localhost:5173/admin` (admin) ✅ sigue funcionando

### 4. Verificar backend
```bash
curl -H "Host: cafe-test.localhost" http://localhost:8000/tiendas/actual
# Debe devolver datos de la tienda cafe-test
```

---

## Fases futuras (no incluidas ahora)

### Fase 3 — Producción
- DNS wildcard `*.sanrafaeldesarrollo.com` A record → IP servidor
- Nginx config con `server_name *.sanrafaeldesarrollo.com`
- SSL wildcard via certbot:
  ```bash
  certbot certonly --manual --preferred-challenges dns -d "*.sanrafaeldesarrollo.com" -d sanrafaeldesarrollo.com
  ```
- Cambiar `DOMINIO_BASE=sanrafaeldesarrollo.com` en prod

### Fase 4 — Dominio propio (futuro)
- Campo `dominio` en modelo Tienda
- Resolución por Host prioriza dominio propio > subdominio > path
- Validación CNAME

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Break rutas `/t/{subdominio}` existentes | Se mantienen intactas (fallback) |
| Subdominios en BD no validados | Validator aplica solo al crear/editar |
| Vite rechaza subdominios | `allowedHosts: ['.localhost']` |
| CORS demasiado abierto | Solo en dev; prod usa dominio exacto |
| Middleware bloquea rutas erroneamente | Lista de exclusión para /admin, /auth, etc |

---

## Orden de ejecución recomendado

1. Backend Fase 1 completa (archivos 1-4)
2. Verificar backend: `curl -H "Host: test.localhost" http://localhost:8000/tiendas/actual`
3. Frontend Fase 2 completa (archivos 5-8)
4. `npx tsc --noEmit --skipLibCheck` + `npm run lint`
5. Test dev con `/etc/hosts`
6. Commit a rama `srfmanage`