import os
import re
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address


def extraer_subdominio(host: str, dominio_base: str):
    """Extrae el subdominio del Host header, excluyendo www y dominio base."""
    if not host:
        return None
    host_clean = host.split(":")[0]
    dominio_clean = dominio_base.split(":")[0]
    if not host_clean.endswith(dominio_clean):
        return None
    prefix = host_clean[: -len(dominio_clean)].rstrip(".")
    if not prefix or prefix == "www":
        return None
    if not re.match(r"^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$", prefix):
        return None
    return prefix


class SubdomainMiddleware(BaseHTTPMiddleware):
    """Middleware que detecta el subdominio del Host y lo inyecta en request.state."""

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        # Rutas que no requieren resolver tienda por subdominio
        if (
            path.startswith(
                (
                    "/admin",
                    "/auth",
                    "/docs",
                    "/openapi.json",
                    "/redoc",
                    "/metricas",
                    "/productos",
                    "/pedidos",
                    "/usuarios",
                    "/clientes",
                    "/wompi",
                    "/stats",
                    "/tienda",
                )
            )
            or path == "/"
            or path.startswith("/tiendas/por-")
            or path.startswith("/tiendas/sectores")
            or path.startswith("/tiendas/")
            or path == "/tiendas"
        ):
            return await call_next(request)
        host = request.headers.get("X-Forwarded-Host") or request.headers.get(
            "host", ""
        )
        dominio_base = os.getenv("DOMINIO_BASE", "localhost:5173")
        sub = extraer_subdominio(host, dominio_base)
        if sub:
            request.state.subdominio = sub
        return await call_next(request)


# Load .env file
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
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
from .wompi_payment import router as wompi_router
from .inventario import router as inventario_router
from .finanzas import router as finanzas_router
from .database import engine, Base

app = FastAPI(title="SRF Web API", version="1.0.0")

# ---------------------------------------------------------------------------
# Rate Limiting
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter


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
            "accelerometer=(), "
            "gyroscope=(), "
            "local-fonts=(), "
            "microphone=(), "
            "camera=(), "
            "payment=(), "
            "usb=()"
        )

        # HSTS - HTTP Strict Transport Security (solo en producción)
        # Descomentar en producción:
        # response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        return response


app.add_middleware(SecurityHeadersMiddleware)


# ---------------------------------------------------------------------------
# Subdomain Middleware - detecta subdominio del Host y lo inyecta en request.state
# Debe registrarse ANTES de CORS para que request.state.subdominio esté disponible
# ---------------------------------------------------------------------------
app.add_middleware(SubdomainMiddleware)


# ---------------------------------------------------------------------------
# Request Size Limit Middleware
# ---------------------------------------------------------------------------
MAX_REQUEST_SIZE = 10 * 1024 * 1024  # 10MB


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_REQUEST_SIZE:
            return Response(
                content="Request too large",
                status_code=413,
                headers={"Content-Type": "text/plain"},
            )
        response = await call_next(request)
        return response


app.add_middleware(RequestSizeLimitMiddleware)


# ---------------------------------------------------------------------------
# CORS — nunca usar "*" junto con allow_credentials=True
# ---------------------------------------------------------------------------
# SECURITY NOTE: Wildcard domains (*.ngrok-free.dev, *.ngrok.io, *.localtunnel.me)
# are allowed because ngrok URLs change frequently. In production, replace with
# exact domain list for better security.
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:4173"
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

# Wildcards necesarios para túneles temporales (ngrok, localtunnel)
# En producción, usar solo dominios exactos
ALLOWED_ORIGINS.extend(
    [
        "https://*.ngrok-free.dev",
        "https://*.ngrok.io",
        "https://*.localtunnel.me",
    ]
)

# Wildcards para subdominios de tiendas (dev y prod)
_DOMINIO_BASE = os.getenv("DOMINIO_BASE", "localhost:5173")
_DOMINIO_BASE_PROD = os.getenv("DOMINIO_BASE_PROD", "sanrafaeldesarrollo.com")
ALLOWED_ORIGINS.extend(
    [
        f"http://*.{_DOMINIO_BASE}",
        f"https://*.{_DOMINIO_BASE}",
        f"http://*.{_DOMINIO_BASE_PROD}",
        f"https://*.{_DOMINIO_BASE_PROD}",
    ]
)

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
app.include_router(tienda_router)  # /tienda (demo/home, pública)
app.include_router(tiendas_router)  # /tiendas/*, /sectores (públicos)
app.include_router(metricas_router)  # POST /metricas/visita (público)
app.include_router(
    wompi_router, prefix="/pedidos"
)  # /pedidos/create-wompi-transaction, /webhooks/wompi

# ---------------------------------------------------------------------------
# Routers protegidos — todas las rutas requieren token válido
# Las rutas /admin/* dentro de cada router ya tienen ese prefijo;
# añadimos el dependency a nivel de include_router para protegerlas globalmente.
# ---------------------------------------------------------------------------
_auth_dep = [Depends(get_current_user)]

app.include_router(usuarios_router, dependencies=_auth_dep)
app.include_router(productos_router, dependencies=_auth_dep)
app.include_router(clientes_router, dependencies=_auth_dep)
app.include_router(stats_router, dependencies=_auth_dep)
app.include_router(plantillas_router, dependencies=_auth_dep)
app.include_router(pedidos_router)
app.include_router(tiendas_admin_router, dependencies=_auth_dep)  # /admin/tiendas/*
app.include_router(metricas_admin_router, dependencies=_auth_dep)  # /admin/.../metricas
app.include_router(
    inventario_router, dependencies=_auth_dep
)  # /admin/tienda/{id}/inventario/*
app.include_router(
    finanzas_router, dependencies=_auth_dep
)  # /admin/tienda/{id}/finanzas/*

Base.metadata.create_all(bind=engine)
