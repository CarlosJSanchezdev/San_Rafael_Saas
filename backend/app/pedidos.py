from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from .database import get_db
from .auth import get_current_user, get_current_user_optional
from . import models, schemas
from typing import List, Optional
import html
import re

router = APIRouter()


def sanitize_input(text_input: str) -> str:
    if not text_input:
        return text_input
    text_input = html.escape(text_input)
    text_input = re.sub(r'[<>]', '', text_input)
    return text_input.strip()


@router.post("/pedidos", response_model=schemas.PedidoOut)
def crear_pedido(
    pedido: schemas.PedidoCrear, 
    db: Session = Depends(get_db),
    current_user: Optional[models.Usuario] = Depends(get_current_user_optional)
):
    tienda = db.query(models.Tienda).filter(models.Tienda.id == pedido.tienda_id).first()
    if not tienda:
        raise HTTPException(status_code=400, detail="Tienda no encontrada")
    
    # Si hay usuario autenticado, validar acceso a la tienda
    if current_user and current_user.rol != "admin":
        if current_user.tienda_id != pedido.tienda_id:
            raise HTTPException(
                status_code=403, 
                detail="No tienes acceso a esta tienda"
            )
    
    sanitized_nombre = sanitize_input(pedido.cliente_nombre)
    sanitized_email = sanitize_input(pedido.cliente_email)
    sanitized_telefono = sanitize_input(pedido.cliente_telefono or "")
    sanitized_direccion = sanitize_input(pedido.direccion_envio)
    sanitized_notas = sanitize_input(pedido.notas or "")
    
    total = 0
    items_validados = []
    
    for item in pedido.items:
        producto = db.query(models.Producto).filter(
            models.Producto.id == item.producto_id,
            models.Producto.tienda_id == pedido.tienda_id
        ).with_for_update().first()
        
        if not producto:
            raise HTTPException(
                status_code=400, 
                detail=f"Producto {item.producto_id} no encontrado en esta tienda"
            )
        
        precio_real = producto.precio
        
        if abs(precio_real - item.precio) > 0.01:
            raise HTTPException(
                status_code=400, 
                detail="El precio del producto ha sido modificado"
            )
        
        if producto.stock < item.cantidad:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para {producto.nombre}. Stock disponible: {producto.stock}"
            )
        
        producto.stock -= item.cantidad
        
        total += precio_real * item.cantidad
        
        items_validados.append({
            "producto_id": item.producto_id,
            "producto_nombre": producto.nombre,
            "precio": precio_real,
            "cantidad": item.cantidad
        })
    
    db_pedido = models.Pedido(
        tienda_id=pedido.tienda_id,
        cliente_nombre=sanitized_nombre,
        cliente_email=sanitized_email,
        cliente_telefono=sanitized_telefono,
        direccion_envio=sanitized_direccion,
        total=total,
        notas=sanitized_notas
    )
    db.add(db_pedido)
    db.flush()
    
    for item_val in items_validados:
        db_item = models.PedidoItem(
            pedido_id=db_pedido.id,
            producto_id=item_val["producto_id"],
            producto_nombre=item_val["producto_nombre"],
            precio=item_val["precio"],
            cantidad=item_val["cantidad"]
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_pedido)
    
    db_pedido.items = db.query(models.PedidoItem).filter(models.PedidoItem.pedido_id == db_pedido.id).all()
    return db_pedido


@router.get("/pedidos", response_model=List[schemas.PedidoOut])
def listar_pedidos(
    skip: int = 0, 
    limit: int = 100, 
    tienda_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    query = db.query(models.Pedido)
    
    if current_user.rol == "admin":
        if tienda_id:
            query = query.filter(models.Pedido.tienda_id == tienda_id)
    else:
        if current_user.tienda_id:
            query = query.filter(models.Pedido.tienda_id == current_user.tienda_id)
        else:
            query = query.filter(models.Pedido.id == 0)
    
    pedidos = query.order_by(models.Pedido.fecha_creacion.desc()).offset(skip).limit(limit).all()
    for pedido in pedidos:
        pedido.items = db.query(models.PedidoItem).filter(models.PedidoItem.pedido_id == pedido.id).all()
    return pedidos


@router.get("/pedidos/{pedido_id}", response_model=schemas.PedidoOut)
def obtener_pedido(
    pedido_id: int, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    pedido = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    if current_user.rol != "admin":
        if current_user.tienda_id != pedido.tienda_id:
            raise HTTPException(
                status_code=403,
                detail="No tienes acceso a este pedido"
            )
    
    pedido.items = db.query(models.PedidoItem).filter(models.PedidoItem.pedido_id == pedido.id).all()
    return pedido


@router.put("/pedidos/{pedido_id}/estado")
def actualizar_estado_pedido(
    pedido_id: int, 
    estado: str, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    pedido = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    if current_user.rol != "admin":
        if current_user.tienda_id != pedido.tienda_id:
            raise HTTPException(
                status_code=403,
                detail="No tienes acceso a este pedido"
            )
    
    pedido.estado = estado
    db.commit()
    return {"mensaje": "Estado actualizado", "estado": estado}


@router.get("/pedidos/stats/resumen")
def stats_pedidos(
    tienda_id: Optional[int] = None, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    query = db.query(models.Pedido)
    
    if current_user.rol != "admin":
        if current_user.tienda_id:
            query = query.filter(models.Pedido.tienda_id == current_user.tienda_id)
        else:
            return {
                "total": 0,
                "pendiente": 0,
                "completado": 0,
                "total_ingresos": 0
            }
    elif tienda_id:
        query = query.filter(models.Pedido.tienda_id == tienda_id)
    
    total = query.count()
    pendiente = query.filter(models.Pedido.estado == "pendiente").count()
    completado = query.filter(models.Pedido.estado == "completado").count()
    ingresos = query.filter(models.Pedido.estado != "cancelado").all()
    total_ingresos = sum(p.total for p in ingresos)
    return {
        "total": total,
        "pendiente": pendiente,
        "completado": completado,
        "total_ingresos": round(total_ingresos, 2)
    }
