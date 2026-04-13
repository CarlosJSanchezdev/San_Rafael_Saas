from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from .database import get_db
from .auth import get_current_user
from . import models, schemas
from typing import List, Optional
from datetime import datetime, timedelta

router_publico = APIRouter(tags=["metricas-publico"])
router_admin = APIRouter(tags=["metricas-admin"])

router = router_publico


@router_publico.post("/metricas/visita", status_code=201)
def registrar_visita(metrica: schemas.MetricaTiendaCrear, db: Session = Depends(get_db)):
    db_metrica = models.MetricaTienda(**metrica.model_dump())
    db.add(db_metrica)
    db.commit()
    return {"mensaje": "Visita registrada"}

@router_admin.get("/admin/tiendas/{tienda_id}/metricas", response_model=schemas.MetricaResumen)
def obtener_metricas_tienda(
    tienda_id: int, 
    dias: int = 30,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    if current_user.rol != "admin":
        if current_user.tienda_id != tienda_id:
            raise HTTPException(
                status_code=403, 
                detail="No tienes acceso a esta tienda"
            )
    
    fecha_inicio = datetime.utcnow() - timedelta(days=dias)
    
    metricas = db.query(models.MetricaTienda).filter(
        models.MetricaTienda.tienda_id == tienda_id,
        models.MetricaTienda.fecha >= fecha_inicio
    ).all()
    
    total_visitas = len(metricas)
    
    visitantes_unicos = db.query(func.count(func.distinct(models.MetricaTienda.url))).filter(
        models.MetricaTienda.tienda_id == tienda_id,
        models.MetricaTienda.fecha >= fecha_inicio,
        models.MetricaTienda.tipo == "visita"
    ).scalar() or 0
    
    productos_vistos = db.query(
        models.MetricaTienda.producto_id,
        func.count(models.MetricaTienda.id).label("count")
    ).filter(
        models.MetricaTienda.tienda_id == tienda_id,
        models.MetricaTienda.fecha >= fecha_inicio,
        models.MetricaTienda.tipo == "producto_visto",
        models.MetricaTienda.producto_id.isnot(None)
    ).group_by(models.MetricaTienda.producto_id).order_by(func.count(models.MetricaTienda.id).desc()).limit(5).all()
    
    productos_mas_vistos = [
        {"producto_id": p[0], "vistas": p[1]} for p in productos_vistos
    ]
    
    tiempo_promedio = 0
    tiempos = [m.duracion_segundos for m in metricas if m.duracion_segundos > 0]
    if tiempos:
        tiempo_promedio = sum(tiempos) / len(tiempos)
    
    fuentes = {}
    for m in metricas:
        if m.fuente_trafico:
            fuentes[m.fuente_trafico] = fuentes.get(m.fuente_trafico, 0) + 1
    
    return schemas.MetricaResumen(
        total_visitas=total_visitas,
        visitantes_unicos=visitantes_unicos,
        productos_mas_vistos=productos_mas_vistos,
        tiempo_promedio_segundos=round(tiempo_promedio, 2),
        fuentes_trafico=fuentes
    )

@router_admin.get("/admin/tiendas/{tienda_id}/metricas/detalladas")
def obtener_metricas_detalladas(
    tienda_id: int,
    tipo: Optional[str] = None,
    dias: int = 30,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    if current_user.rol != "admin":
        if current_user.tienda_id != tienda_id:
            raise HTTPException(
                status_code=403, 
                detail="No tienes acceso a esta tienda"
            )
    
    fecha_inicio = datetime.utcnow() - timedelta(days=dias)
    
    query = db.query(models.MetricaTienda).filter(
        models.MetricaTienda.tienda_id == tienda_id,
        models.MetricaTienda.fecha >= fecha_inicio
    )
    
    if tipo:
        query = query.filter(models.MetricaTienda.tipo == tipo)
    
    metricas = query.order_by(models.MetricaTienda.fecha.desc()).offset(skip).limit(limit).all()
    return metricas
