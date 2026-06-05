from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from .database import get_db
from . import models, schemas
from .auth import get_current_user

router = APIRouter(prefix="/admin/tienda", tags=["Inventario"])


class EntradaSalidaSchema(BaseModel):
    producto_id: Optional[int] = None
    cantidad: int
    motivo: str


@router.get("/{tienda_id}/inventario/stock")
def get_stock(
    tienda_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    """Obtiene el stock actual de todos los productos de la tienda"""
    if current_user.tienda_id != tienda_id and current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="No tienes acceso a esta tienda")

    productos = db.query(models.Producto).filter(
        models.Producto.tienda_id == tienda_id,
        models.Producto.activo == True
    ).all()

    result = []
    for producto in productos:
        entrada_count = db.query(models.MovimientoInventario).filter(
            models.MovimientoInventario.producto_id == producto.id,
            models.MovimientoInventario.tipo == "entrada"
        ).count()

        salida_count = db.query(models.MovimientoInventario).filter(
            models.MovimientoInventario.producto_id == producto.id,
            models.MovimientoInventario.tipo == "salida"
        ).count()

        result.append({
            "producto_id": producto.id,
            "nombre": producto.nombre,
            "categoria": producto.categoria,
            "precio": producto.precio,
            "stock": producto.stock,
            "movimientos_entrada": entrada_count,
            "movimientos_salida": salida_count
        })

    return result


@router.get("/{tienda_id}/inventario/movimientos")
def get_movimientos(
    tienda_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    """Obtiene el historial de movimientos de inventario"""
    if current_user.tienda_id != tienda_id and current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="No tienes acceso a esta tienda")

    movimientos = db.query(models.MovimientoInventario).filter(
        models.MovimientoInventario.tienda_id == tienda_id
    ).order_by(models.MovimientoInventario.fecha_creacion.desc()).limit(limit).all()

    result = []
    for m in movimientos:
        producto_nombre = None
        if m.producto_id:
            producto = db.query(models.Producto).filter(models.Producto.id == m.producto_id).first()
            if producto:
                producto_nombre = producto.nombre

        result.append({
            "id": m.id,
            "producto_id": m.producto_id,
            "producto_nombre": producto_nombre,
            "tipo": m.tipo,
            "cantidad": m.cantidad,
            "motivo": m.motivo,
            "referencia_id": m.referencia_id,
            "fecha_creacion": m.fecha_creacion.isoformat() if m.fecha_creacion else None
        })

    return result


@router.post("/{tienda_id}/inventario/entrada")
def crear_entrada(
    tienda_id: int,
    data: EntradaSalidaSchema,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    """Registra una entrada de inventario (aumenta stock)"""
    if current_user.tienda_id != tienda_id and current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="No tienes acceso a esta tienda")

    if data.cantidad <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")

    producto = None
    if data.producto_id:
        producto = db.query(models.Producto).filter(
            models.Producto.id == data.producto_id,
            models.Producto.tienda_id == tienda_id
        ).first()
        if producto:
            producto.stock += data.cantidad

    movimiento = models.MovimientoInventario(
        tienda_id=tienda_id,
        producto_id=data.producto_id,
        tipo="entrada",
        cantidad=data.cantidad,
        motivo=data.motivo,
        usuario_id=current_user.id
    )
    db.add(movimiento)
    db.commit()

    return {"status": "success", "message": f"Entrada de {data.cantidad} unidades registrada"}


@router.post("/{tienda_id}/inventario/salida")
def crear_salida(
    tienda_id: int,
    data: EntradaSalidaSchema,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    """Registra una salida de inventario (disminuye stock)"""
    if current_user.tienda_id != tienda_id and current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="No tienes acceso a esta tienda")

    if data.cantidad <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")

    producto = None
    if data.producto_id:
        producto = db.query(models.Producto).filter(
            models.Producto.id == data.producto_id,
            models.Producto.tienda_id == tienda_id
        ).first()
        if producto:
            if producto.stock < data.cantidad:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stock insuficiente. Stock actual: {producto.stock}"
                )
            producto.stock -= data.cantidad
        else:
            raise HTTPException(status_code=404, detail="Producto no encontrado")

    movimiento = models.MovimientoInventario(
        tienda_id=tienda_id,
        producto_id=data.producto_id,
        tipo="salida",
        cantidad=data.cantidad,
        motivo=data.motivo,
        usuario_id=current_user.id
    )
    db.add(movimiento)
    db.commit()

    return {"status": "success", "message": f"Salida de {data.cantidad} unidades registrada"}