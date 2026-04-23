from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime

class UsuarioBase(BaseModel):
    nombre: str
    usuario: str
    email: str
    rol: str = "usuario"
    tienda_id: Optional[int] = None

class UsuarioCrear(UsuarioBase):
    password: str

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    usuario: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    rol: Optional[str] = None
    tienda_id: Optional[int] = None

class UsuarioOut(UsuarioBase):
    id: int

    class Config:
        from_attributes = True

class TiendaBase(BaseModel):
    nombre: str
    subdominio: str
    slug: str
    sector: str  # comercial, industrial, servicios, oficial, residencial
    descripcion: Optional[str] = None
    logo: Optional[str] = None
    banner: Optional[str] = None
    color_primario: str = "#0ea5e9"
    color_secundario: str = "#1e293b"
    plantilla: str = "style_1"  # style_1, style_2, style_3, etc.
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    manager_id: Optional[int] = None  # Usuario manager de la tienda
    wompi_public_key: Optional[str] = None
    wompi_integrity_secret: Optional[str] = None
    wompi_activo: bool = False

class TiendaCrear(BaseModel):
    nombre: str
    subdominio: str
    slug: str
    sector: str
    descripcion: Optional[str] = None
    logo: Optional[str] = None
    banner: Optional[str] = None
    color_primario: str = "#0ea5e9"
    color_secundario: str = "#1e293b"
    plantilla: str = "style_1"
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    cliente_id: Optional[int] = None
    manager_id: Optional[int] = None
    wompi_public_key: Optional[str] = None
    wompi_integrity_secret: Optional[str] = None
    wompi_activo: bool = False

class TiendaUpdate(BaseModel):
    nombre: Optional[str] = None
    subdominio: Optional[str] = None
    slug: Optional[str] = None
    sector: Optional[str] = None
    descripcion: Optional[str] = None
    logo: Optional[str] = None
    banner: Optional[str] = None
    color_primario: Optional[str] = None
    color_secundario: Optional[str] = None
    plantilla: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    activa: Optional[bool] = None
    wompi_public_key: Optional[str] = None
    wompi_integrity_secret: Optional[str] = None
    wompi_activo: Optional[bool] = None

class TiendaOut(TiendaBase):
    id: int
    activa: bool
    fecha_creacion: datetime
    wompi_public_key: Optional[str] = None
    wompi_integrity_secret: Optional[str] = None
    wompi_activo: bool = False

    class Config:
        from_attributes = True

class TiendaPublicaOut(BaseModel):
    id: int
    nombre: str
    subdominio: str
    sector: str
    descripcion: Optional[str]
    logo: Optional[str]
    banner: Optional[str]
    color_primario: str
    color_secundario: str
    plantilla: str
    telefono: Optional[str]
    email: Optional[str]
    direccion: Optional[str]
    wompi_public_key: Optional[str] = None
    wompi_activo: bool = False

    class Config:
        from_attributes = True

class PlantillaProductoBase(BaseModel):
    sector: str
    nombre: str
    descripcion: Optional[str] = None
    categoria: Optional[str] = None
    precio_base: Optional[float] = None
    imagen: Optional[str] = None

class PlantillaProductoCrear(PlantillaProductoBase):
    pass

class PlantillaProductoOut(PlantillaProductoBase):
    id: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True

class MetricaTiendaBase(BaseModel):
    tienda_id: int
    tipo: str  # visita, producto_visto, tiempo_pagina, carrito_agregado
    producto_id: Optional[int] = None
    url: Optional[str] = None
    fuente_trafico: Optional[str] = None
    duracion_segundos: int = 0

class MetricaTiendaCrear(MetricaTiendaBase):
    pass

class MetricaTiendaOut(MetricaTiendaBase):
    id: int
    fecha: datetime

    class Config:
        from_attributes = True

class MetricaResumen(BaseModel):
    total_visitas: int
    visitantes_unicos: int
    productos_mas_vistos: list
    tiempo_promedio_segundos: float
    fuentes_trafico: dict

class ProductoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    stock: int = 0
    categoria: Optional[str] = None
    imagen: Optional[str] = None
    activo: bool = True

class ProductoCrear(ProductoBase):
    tienda_id: int

class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    stock: Optional[int] = None
    categoria: Optional[str] = None
    imagen: Optional[str] = None
    activo: Optional[bool] = None

class ProductoOut(ProductoBase):
    id: int
    tienda_id: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True

class ClienteBase(BaseModel):
    nombre: str
    empresa: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    notas: Optional[str] = None

class ClienteConTienda(BaseModel):
    nombre: str
    empresa: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    notas: Optional[str] = None
    tienda: Optional[TiendaCrear] = None

class ClienteCrear(ClienteBase):
    pass

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    empresa: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    notas: Optional[str] = None

class ClienteOut(ClienteBase):
    id: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True

class PedidoItemSchema(BaseModel):
    producto_id: int
    cantidad: int
    precio: float
    producto_nombre: Optional[str] = None  # El backend lo completará desde la BD

class PedidoCrear(BaseModel):
    tienda_id: int
    cliente_nombre: str
    cliente_email: EmailStr
    cliente_telefono: Optional[str] = None
    direccion_envio: str
    notas: Optional[str] = None
    items: list[PedidoItemSchema]
    
    @validator("items")
    def validate_items_not_empty(cls, v):
        if not v:
            raise ValueError("Debe incluir al menos un producto")
        return v

class PedidoItemOut(PedidoItemSchema):
    id: int

    class Config:
        from_attributes = True

class PedidoOut(BaseModel):
    id: int
    tienda_id: int
    cliente_nombre: str
    cliente_email: str
    cliente_telefono: Optional[str]
    direccion_envio: str
    total: float
    estado: str
    estado_pago: str = "pendiente"
    notas: Optional[str]
    fecha_creacion: datetime
    items: list[PedidoItemOut] = []

    class Config:
        from_attributes = True
