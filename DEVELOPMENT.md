# SRF-web - Guía de Desarrollo

## Requisitos Previos

| Herramienta | Versión |
|-------------|---------|
| Python | 3.12+ |
| Node.js | 18+ |
| npm | 9+ |
| SQLite | Incluido con Python |

## Instalación Inicial

### Backend

`bash
# Crear virtualenv (solo primera vez)
python3 -m venv venv

# Activar
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## Comandos de Inicio

### Backend (puerto 8000)

```bash
# Opción 1: Con venv activado
cd backend
source ../venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Opción 2: Sin activar venv (ruta directa)
cd backend
../venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (puerto 5173)

```bash
cd frontend
npm run dev
```

### Acceso

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Docs API: http://localhost:8000/docs

## Comandos de Verificación

### TypeScript (typecheck)

```bash
cd frontend
npx tsc --noEmit --skipLibCheck
```

### Build completo

```bash
cd frontend
npm run build
```

### Linter

```bash
cd frontend
npm run lint
```

### Verificar backend sin arrancar servidor

```bash
../venv/bin/python -c "from app.main import app; print('OK')"
```

## Estructura del Proyecto

```
Srf-web/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry, middleware, routers
│   │   ├── auth.py              # Autenticación, get_current_user
│   │   ├── database.py          # SQLAlchemy engine, Base
│   │   ├── models.py            # Modelos DB (Usuario, Tienda, Producto, Pedido, ERP)
│   │   ├── schemas.py           # Esquemas Pydantic
│   │   ├── inventario.py        # /admin/tienda/{id}/inventario/*
│   │   ├── finanzas.py          # /admin/tienda/{id}/finanzas/*
│   │   ├── pedidos.py           # Pedidos
│   │   ├── productos.py         # CRUD productos
│   │   ├── tiendas.py           # CRUD tiendas + admin router
│   │   ├── metricas.py          # Métricas público + admin
│   │   ├── wompi_payment.py     # Integración Wompi
│   │   └── ...
│   ├── db/usuarios.db           # SQLite database
│   └── crear_tablas_erp.py      # Migration ERP tablas
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── TiendaAdmin.tsx  # Admin de tienda con módulos ERP
│   │   │   ├── TiendaAdmin.css  # Estilos admin
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Tiendas.tsx
│   │   │   └── ...
│   │   ├── api.ts               # Cliente axios
│   │   ├── context/             # Auth, Toast, Carrito contexts
│   │   └── components/          # Componentes UI reutilizables
│   └── package.json
├── venv/                        # Virtualenv Python
├── requirements.txt             # Dependencias backend
└── AGENTS.md                    # Instrucciones para agentes IA
```

## Módulo ERP

### Rutas Backend

#### Inventario

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/admin/tienda/{id}/inventario/stock` | Stock actual por producto | Requerida |
| GET | `/admin/tienda/{id}/inventario/movimientos` | Historial de movimientos | Requerida |
| POST | `/admin/tienda/{id}/inventario/entrada` | Registrar entrada | Requerida |
| POST | `/admin/tienda/{id}/inventario/salida` | Registrar salida | Requerida |

#### Finanzas

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/admin/tienda/{id}/finanzas/resumen` | Totales históricos y del mes | Requerida |
| GET | `/admin/tienda/{id}/finanzas/balance` | Balance semanal (8 semanas) | Requerida |
| GET | `/admin/tienda/{id}/finanzas/ingresos` | Lista de ingresos | Requerida |
| POST | `/admin/tienda/{id}/finanzas/ingreso` | Ingreso manual | Requerida |
| GET | `/admin/tienda/{id}/finanzas/egresos` | Lista de egresos | Requerida |
| POST | `/admin/tienda/{id}/finanzas/egreso` | Crear egreso | Requerida |

### Rutas Frontend

| Ruta | Vista | Descripción |
|------|-------|-------------|
| `/admin/tiendas/{id}/dashboard` | Dashboard | Stats ERP + ventas + métricas |
| `/admin/tiendas/{id}/inventario` | Inventario | Stock, entradas/salidas, historial |
| `/admin/tiendas/{id}/finanzas` | Finanzas | Balance, ingresos, egresos, PDF |
| `/admin/tiendas/{id}/productos` | Productos | CRUD productos |
| `/admin/tiendas/{id}/pedidos` | Pedidos | Gestión de pedidos |
| `/admin/tiendas/{id}/metricas` | Métricas | Visitas, visitantes |
| `/admin/tiendas/{id}/pagos` | Pagos | Config Wompi |

### Modelos de Datos ERP

#### MovimientoInventario

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Integer | PK |
| tienda_id | Integer | FK a tiendas |
| producto_id | Integer | FK a productos (nullable) |
| tipo | String | "entrada" o "salida" |
| cantidad | Integer | Cantidad movida |
| motivo | String | Justificación |
| referencia_id | Integer | pedido_id si es automático |
| usuario_id | Integer | FK a usuarios |
| fecha_creacion | DateTime | Timestamp |

#### Ingreso

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Integer | PK |
| tienda_id | Integer | FK a tiendas |
| tipo | String | "venta" o "manual" |
| pedido_id | Integer | FK a pedidos (nullable) |
| monto | Float | Monto del ingreso |
| descripcion | String | Descripción |
| fecha_creacion | DateTime | Timestamp |

#### Egreso

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Integer | PK |
| tienda_id | Integer | FK a tiendas |
| tipo | String | "devolucion", "alquiler", "servicios", "insumos" |
| monto | Float | Monto del egreso |
| descripcion | String | Descripción |
| fecha_creacion | DateTime | Timestamp |

## Flujo de Testing Manual

### 1. Iniciar servidores

```bash
# Terminal 1 - Backend
cd backend && ../venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 2. Login

- URL: http://localhost:5173/login
- Acceder con credenciales admin

### 3. Probar Inventario

1. Ir a `/admin/tiendas/{id}/inventario`
2. Click "Entrada" → seleccionar producto, cantidad, motivo
3. Verificar stock aumenta
4. Click "Salida" → cantidad menor a stock
5. Verificar stock disminuye
6. Intentar salida mayor a stock → debe dar error
7. Ver historial de movimientos en la parte inferior

### 4. Probar Finanzas

1. Ir a `/admin/tiendas/{id}/finanzas`
2. Click "Ingreso" → monto + descripción
3. Click "Egreso" → tipo + monto + descripción
4. Verificar balance cards se actualizan
5. Ver tabla de balance semanal
6. Click "Exportar PDF" → descargar reporte

### 5. Verificar Dashboard

1. Ir a `/admin/tiendas/{id}/dashboard`
2. Verificar que muestra:
   - Ingresos ERP (mes actual)
   - Egresos ERP (mes actual)
   - Balance (mes actual)
   - Alerta de stock bajo

## Reglas de Negocio

- Stock negativo NO permitido (validación en backend)
- Justificación/motivo obligatorio en movimientos
- Montos deben ser mayores a 0
- Tipos de egreso: devolucion, alquiler, servicios, insumos
- Solo admin o manager de la tienda pueden acceder

## Solución de Problemas

### venv roto (Python version mismatch)

```bash
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Error: ModuleNotFoundError: No module named 'uvicorn'

```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Error: No module named 'slowapi'

```bash
pip install slowapi
```

### Rutas no encontradas en frontend

```bash
cd frontend && npm run build
```

### Puerto en uso

```bash
# Backend
lsof -i :8000
kill -9 <PID>

# Frontend
lsof -i :5173
kill -9 <PID>
```

### Errores de TypeScript

```bash
cd frontend
npx tsc --noEmit --skipLibCheck
```
