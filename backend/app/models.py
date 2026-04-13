from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, JSON
from .database import Base
from datetime import datetime, timedelta

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    usuario = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    rol = Column(String, default="usuario")  # admin, manager, usuario
    tienda_id = Column(Integer, ForeignKey("tiendas.id"), nullable=True, index=True)  # Para managers

class RecuperacionPassword(Base):
    __tablename__ = "recuperacion_password"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, index=True)
    token = Column(String, nullable=False, unique=True)
    usado = Column(Boolean, default=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_expiracion = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(hours=1))

class Sesion(Base):
    __tablename__ = "sesiones"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, nullable=False, index=True)
    token = Column(String, nullable=False)
    dispositivo = Column(String)
    ip = Column(String)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    ultima_actividad = Column(DateTime, default=datetime.utcnow)
    activa = Column(Boolean, default=True)

class Tienda(Base):
    __tablename__ = "tiendas"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    manager_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True, index=True)  # Usuario manager
    nombre = Column(String, nullable=False)
    subdominio = Column(String, unique=True, nullable=False, index=True)
    slug = Column(String, unique=True, nullable=False)
    sector = Column(String, nullable=False)  # comercial, industrial, servicios, oficial, residencial
    descripcion = Column(Text)
    logo = Column(String)
    banner = Column(String)
    color_primario = Column(String, default="#0ea5e9")
    color_secundario = Column(String, default="#1e293b")
    plantilla = Column(String, default="style_1")  # style_1, style_2, style_3, etc.
    telefono = Column(String)
    email = Column(String)
    direccion = Column(Text)
    redes_sociales = Column(JSON)  # {facebook, instagram, whatsapp}
    activa = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

class PlantillaProducto(Base):
    __tablename__ = "plantillas_productos"

    id = Column(Integer, primary_key=True, index=True)
    sector = Column(String, nullable=False, index=True)  # comercial, industrial, servicios, etc.
    nombre = Column(String, nullable=False)
    descripcion = Column(Text)
    categoria = Column(String)
    precio_base = Column(Float)
    imagen = Column(String)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

class MetricaTienda(Base):
    __tablename__ = "metricas_tienda"

    id = Column(Integer, primary_key=True, index=True)
    tienda_id = Column(Integer, ForeignKey("tiendas.id"), nullable=False, index=True)
    tipo = Column(String, nullable=False)  # visita, producto_visto, tiempo_pagina, carrito_agregado
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=True)
    url = Column(String)
    fuente_trafico = Column(String)  # directo, google, social, referral
    duracion_segundos = Column(Integer, default=0)
    fecha = Column(DateTime, default=datetime.utcnow, index=True)

class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    tienda_id = Column(Integer, ForeignKey("tiendas.id"), nullable=False, index=True)
    nombre = Column(String, nullable=False)
    descripcion = Column(Text)
    precio = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    categoria = Column(String)
    imagen = Column(String)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    empresa = Column(String)
    email = Column(String, unique=True, index=True)
    telefono = Column(String)
    direccion = Column(Text)
    notas = Column(Text)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    tienda_id = Column(Integer, ForeignKey("tiendas.id"), nullable=False, index=True)
    cliente_nombre = Column(String, nullable=False)
    cliente_email = Column(String, nullable=False)
    cliente_telefono = Column(String)
    direccion_envio = Column(Text, nullable=False)
    total = Column(Float, nullable=False)
    estado = Column(String, default="pendiente")
    notas = Column(Text)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

class PedidoItem(Base):
    __tablename__ = "pedido_items"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, nullable=False, index=True)
    producto_id = Column(Integer, nullable=False)
    producto_nombre = Column(String, nullable=False)
    precio = Column(Float, nullable=False)
    cantidad = Column(Integer, nullable=False)
