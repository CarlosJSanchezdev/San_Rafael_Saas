import os
from fastapi import FastAPI, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from .auth import router as auth_router, get_current_user
from .usuarios import router as usuarios_router
from .productos import router as productos_router
from .clientes import router as clientes_router
from .stats import router as stats_router
from .tienda import router as tienda_router
from .tiendas import router as tiendas_router, router_admin as tiendas_admin_router
from .metricas import router as metricas_router, router_admin as metricas_admin_router
from .plantillas import router as plantillas_router
from .pedidos import router as pedidos_router
from .database import engine, Base

app = FastAPI(title="SRF Web API", version="1.0.0")


# ---------------------------------------------------------------------------
# Security Headers Middleware
# ---------------------------------------------------------------------------
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # Prevent MIME-type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # XSS Protection (legacy but still useful)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https:; "
            "frame-ancestors 'none';"
        )
        
        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions Policy
        response.headers["Permissions-Policy"] = (
            "geolocation=(), "
            "magnetic-field=(), "
            "accelerometer=(), "
            "gyroscope=(), "
            "local-fonts=(), "
            "microphone=(), "
            "camera=(), "
            "payment=(), "
            "usb=()"
        )
        
        return response


app.add_middleware(SecurityHeadersMiddleware)


# ---------------------------------------------------------------------------
# CORS — nunca usar "*" junto con allow_credentials=True
# ---------------------------------------------------------------------------
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:4173"
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers públicos (sin autenticación requerida)
# ---------------------------------------------------------------------------
app.include_router(auth_router)
app.include_router(tienda_router)      # /tienda (demo/home, pública)
app.include_router(tiendas_router)    # /tiendas/*, /sectores (públicos)
app.include_router(metricas_router)   # POST /metricas/visita (público)

# ---------------------------------------------------------------------------
# Routers protegidos — todas las rutas requieren token válido
# Las rutas /admin/* dentro de cada router ya tienen ese prefijo;
# añadimos el dependency a nivel de include_router para protegerlas globalmente.
# ---------------------------------------------------------------------------
_auth_dep = [Depends(get_current_user)]

app.include_router(usuarios_router,      dependencies=_auth_dep)
app.include_router(productos_router,     dependencies=_auth_dep)
app.include_router(clientes_router,      dependencies=_auth_dep)
app.include_router(stats_router,         dependencies=_auth_dep)
app.include_router(plantillas_router,    dependencies=_auth_dep)
app.include_router(pedidos_router)
app.include_router(tiendas_admin_router, dependencies=_auth_dep)  # /admin/tiendas/*
app.include_router(metricas_admin_router, dependencies=_auth_dep) # /admin/.../metricas

Base.metadata.create_all(bind=engine)

