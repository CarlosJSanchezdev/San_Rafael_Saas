from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, date
from pydantic import BaseModel
import json

from .database import get_db
from . import models, schemas
from .auth import get_current_user

router = APIRouter(prefix="/admin/tienda", tags=["Finanzas"])


class IngresoCreateSchema(BaseModel):
    monto: float
    descripcion: str


class EgresoCreateSchema(BaseModel):
    tipo: str  # devolucion, alquiler, servicios, insumos
    monto: float
    descripcion: str


@router.get("/{tienda_id}/finanzas/ingresos")
def get_ingresos(
    tienda_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    """Obtiene lista de ingresos"""
    if current_user.tienda_id != tienda_id and current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="No tienes acceso a esta tienda")

    ingresos = db.query(models.Ingreso).filter(
        models.Ingreso.tienda_id == tienda_id
    ).order_by(models.Ingreso.fecha_creacion.desc()).limit(limit).all()

    return [
        {
            "id": i.id,
            "tipo": i.tipo,
            "pedido_id": i.pedido_id,
            "monto": i.monto,
            "descripcion": i.descripcion,
            "fecha_creacion": i.fecha_creacion.isoformat() if i.fecha_creacion else None
        }
        for i in ingresos
    ]


@router.post("/{tienda_id}/finanzas/ingreso")
def crear_ingreso_manual(
    tienda_id: int,
    data: IngresoCreateSchema,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    """Crea un ingreso manual"""
    if current_user.tienda_id != tienda_id and current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="No tienes acceso a esta tienda")

    if data.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0")

    ingreso = models.Ingreso(
        tienda_id=tienda_id,
        tipo="manual",
        monto=data.monto,
        descripcion=data.descripcion
    )
    db.add(ingreso)
    db.commit()

    return {"status": "success", "message": f"Ingreso de ${data.monto} registrado"}


@router.get("/{tienda_id}/finanzas/egresos")
def get_egresos(
    tienda_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    """Obtiene lista de egresos"""
    if current_user.tienda_id != tienda_id and current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="No tienes acceso a esta tienda")

    egresos = db.query(models.Egreso).filter(
        models.Egreso.tienda_id == tienda_id
    ).order_by(models.Egreso.fecha_creacion.desc()).limit(limit).all()

    return [
        {
            "id": e.id,
            "tipo": e.tipo,
            "monto": e.monto,
            "descripcion": e.descripcion,
            "fecha_creacion": e.fecha_creacion.isoformat() if e.fecha_creacion else None
        }
        for e in egresos
    ]


@router.post("/{tienda_id}/finanzas/egreso")
def crear_egreso(
    tienda_id: int,
    data: EgresoCreateSchema,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    """Crea un egreso"""
    if current_user.tienda_id != tienda_id and current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="No tienes acceso a esta tienda")

    if data.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0")

    tipos_validos = ["devolucion", "alquiler", "servicios", "insumos"]
    if data.tipo not in tipos_validos:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo inválido. Use: {', '.join(tipos_validos)}"
        )

    egreso = models.Egreso(
        tienda_id=tienda_id,
        tipo=data.tipo,
        monto=data.monto,
        descripcion=data.descripcion
    )
    db.add(egreso)
    db.commit()

    return {"status": "success", "message": f"Egreso de ${data.monto} ({data.tipo}) registrado"}


@router.get("/{tienda_id}/finanzas/balance")
def get_balance_semanal(
    tienda_id: int,
    semanas: int = 4,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    """Obtiene balance semanal de las últimas N semanas"""
    if current_user.tienda_id != tienda_id and current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="No tienes acceso a esta tienda")

    tienda = db.query(models.Tienda).filter(models.Tienda.id == tienda_id).first()
    if not tienda:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")

    today = datetime.utcnow()
    result = []

    for week in range(semanas):
        week_start = today - timedelta(weeks=week, days=today.weekday())
        week_end = week_start + timedelta(days=7)

        # Get year and week number for label
        year, week_num = week_start.isocalendar()[:2]
        week_label = f"{year}-W{week_num:02d}"

        # Calculate totals for this week
        ingresos_total = 0
        egresos_total = 0

        ingresos = db.query(models.Ingreso).filter(
            models.Ingreso.tienda_id == tienda_id,
            models.Ingreso.fecha_creacion >= week_start,
            models.Ingreso.fecha_creacion < week_end
        ).all()
        for i in ingresos:
            ingresos_total += i.monto

        egresos = db.query(models.Egreso).filter(
            models.Egreso.tienda_id == tienda_id,
            models.Egreso.fecha_creacion >= week_start,
            models.Egreso.fecha_creacion < week_end
        ).all()
        for e in egresos:
            egresos_total += e.monto

        result.append({
            "semana": week_label,
            "ingresos": round(ingresos_total, 2),
            "egresos": round(egresos_total, 2),
            "balance": round(ingresos_total - egresos_total, 2),
            "detalle_ingresos": len(ingresos),
            "detalle_egresos": len(egresos)
        })

    return result


@router.get("/{tienda_id}/finanzas/resumen")
def get_resumen(
    tienda_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    """Obtiene resumen general de finanzas"""
    if current_user.tienda_id != tienda_id and current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="No tienes acceso a esta tienda")

    # Total histórico
    ingresos_total = db.query(models.Ingreso).filter(
        models.Ingreso.tienda_id == tienda_id
    ).all()
    total_ingresos = sum(i.monto for i in ingresos_total)

    egresos_total = db.query(models.Egreso).filter(
        models.Egreso.tienda_id == tienda_id
    ).all()
    total_egresos = sum(e.monto for e in egresos_total)

    # Totales por tipo de ingreso
    ingresos_por_tipo = {}
    for i in ingresos_total:
        key = i.tipo
        ingresos_por_tipo[key] = ingresos_por_tipo.get(key, 0) + i.monto

    # Totales por tipo de egreso
    egresos_por_tipo = {}
    for e in egresos_total:
        key = e.tipo
        egresos_por_tipo[key] = egresos_por_tipo.get(key, 0) + e.monto

    # Count movimientos recientes (último mes)
    mes_passado = datetime.utcnow() - timedelta(days=30)
    
    ingresos_mes = db.query(models.Ingreso).filter(
        models.Ingreso.tienda_id == tienda_id,
        models.Ingreso.fecha_creacion >= mes_passado
    ).all()
    
    egresos_mes = db.query(models.Egreso).filter(
        models.Egreso.tienda_id == tienda_id,
        models.Egreso.fecha_creacion >= mes_passado
    ).all()

    return {
        "totales": {
            "ingresos": round(total_ingresos, 2),
            "egresos": round(total_egresos, 2),
            "balance_neto": round(total_ingresos - total_egresos, 2)
        },
        "ingresos_por_tipo": {k: round(v, 2) for k, v in ingresos_por_tipo.items()},
        "egresos_por_tipo": {k: round(v, 2) for k, v in egresos_por_tipo.items()},
        "ultimo_mes": {
            "ingresos": round(sum(i.monto for i in ingresos_mes), 2),
            "egresos": round(sum(e.monto for e in egresos_mes), 2),
            "balance": round(sum(i.monto for i in ingresos_mes) - sum(e.monto for e in egresos_mes), 2)
        }
    }