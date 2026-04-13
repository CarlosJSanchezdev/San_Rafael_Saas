from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .database import get_db
from . import models, schemas
from typing import List

router = APIRouter()


SECTORES = ["comercial", "industrial", "servicios", "oficial", "residencial"]

PLANTILLAS_POR_SECTOR = {
    "comercial": [
        {"nombre": "Computador Portátil", "categoria": "Tecnología", "precio_base": 1500000, "descripcion": "Computador portátil de última generación"},
        {"nombre": "Impresora Láser", "categoria": "Oficina", "precio_base": 800000, "descripcion": "Impresora láser a color"},
        {"nombre": "Escritorio Ejecutivo", "categoria": "Muebles", "precio_base": 1200000, "descripcion": "Escritorio ejecutivo en madera"},
        {"nombre": "Silla Ergonomica", "categoria": "Muebles", "precio_base": 600000, "descripcion": "Silla ergonómica con soporte lumbar"},
        {"nombre": "Teléfonos IP", "categoria": "Comunicaciones", "precio_base": 350000, "descripcion": "Teléfono IP empresarial"},
    ],
    "industrial": [
        {"nombre": "Taladro Industrial", "categoria": "Herramientas", "precio_base": 450000, "descripcion": "Taladro de percusión profesional"},
        {"nombre": "Generador Eléctrico", "categoria": "Energía", "precio_base": 2500000, "descripcion": "Generador eléctrico de 5000W"},
        {"nombre": "Soldadora MIG", "categoria": "Soldadura", "precio_base": 1800000, "descripcion": "Soldadora MIG profesional"},
        {"nombre": "Compresor de Aire", "categoria": "Neumática", "precio_base": 1500000, "descripcion": "Compresor de aire industrial"},
        {"nombre": "Montacargas", "categoria": "Logística", "precio_base": 15000000, "descripcion": "Montacargas eléctrico"},
    ],
    "servicios": [
        {"nombre": "Set de Peluquería", "categoria": "Belleza", "precio_base": 250000, "descripcion": "Kit completo de peluquería"},
        {"nombre": "Equipo de Sonido", "categoria": "Eventos", "precio_base": 800000, "descripcion": "Sistema de sonido profesional"},
        {"nombre": "Cámara de Seguridad", "categoria": "Seguridad", "precio_base": 400000, "descripcion": "Cámara IP domo"},
        {"nombre": "Aire Acondicionado", "categoria": "Climatización", "precio_base": 2200000, "descripcion": "Aire acondicionado split"},
        {"nombre": "Horno Industrial", "categoria": "Cocina", "precio_base": 3500000, "descripcion": "Horno convection"},
    ],
    "oficial": [
        {"nombre": "Kit de Papelería", "categoria": "Oficina", "precio_base": 50000, "descripcion": "Kit de papelería básica"},
        {"nombre": "Archivador", "categoria": "Muebles", "precio_base": 180000, "descripcion": "Archivador de 4 gavetas"},
        {"nombre": "Fotocopiadora", "categoria": "Oficina", "precio_base": 5000000, "descripcion": "Fotocopiadora multifuncional"},
        {"nombre": "Pizarra Interactiva", "categoria": "Educación", "precio_base": 3500000, "descripcion": "Pizarra digital interactiva"},
        {"nombre": "Proyector", "categoria": "Presentaciones", "precio_base": 1200000, "descripcion": "Proyector HD"},
    ],
    "residencial": [
        {"nombre": "Juego de Sala", "categoria": "Muebles", "precio_base": 2500000, "descripcion": "Juego de sala de 3 piezas"},
        {"nombre": "Refrigerador", "categoria": "Electrodomésticos", "precio_base": 2800000, "descripcion": "Refrigerador No Frost"},
        {"nombre": "Lavadora", "categoria": "Electrodomésticos", "precio_base": 1800000, "descripcion": "Lavadora automática"},
        {"nombre": "Televisor 55\"", "categoria": "Electrónica", "precio_base": 2200000, "descripcion": "Smart TV 55 pulgadas"},
        {"nombre": "Jardín Horizontal", "categoria": "Jardinería", "precio_base": 350000, "descripcion": "Kit de jardín para apartamento"},
    ]
}

@router.get("/plantillas", response_model=List[schemas.PlantillaProductoOut])
def listar_plantillas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    plantillas = db.query(models.PlantillaProducto).offset(skip).limit(limit).all()
    
    if not plantillas:
        for sector, productos in PLANTILLAS_POR_SECTOR.items():
            for p in productos:
                plantilla = models.PlantillaProducto(
                    sector=sector,
                    nombre=p["nombre"],
                    descripcion=p.get("descripcion"),
                    categoria=p.get("categoria"),
                    precio_base=p.get("precio_base")
                )
                db.add(plantilla)
        db.commit()
        plantillas = db.query(models.PlantillaProducto).offset(skip).limit(limit).all()
    
    return plantillas

@router.get("/plantillas/{sector}", response_model=List[schemas.PlantillaProductoOut])
def listar_plantillas_por_sector(sector: str, db: Session = Depends(get_db)):
    if sector not in SECTORES:
        raise HTTPException(status_code=400, detail=f"Sector inválido. Opciones: {SECTORES}")
    
    plantillas = db.query(models.PlantillaProducto).filter(
        models.PlantillaProducto.sector == sector
    ).all()
    
    if not plantillas:
        productos = PLANTILLAS_POR_SECTOR.get(sector, [])
        for p in productos:
            plantilla = models.PlantillaProducto(
                sector=sector,
                nombre=p["nombre"],
                descripcion=p.get("descripcion"),
                categoria=p.get("categoria"),
                precio_base=p.get("precio_base")
            )
            db.add(plantilla)
        db.commit()
        plantillas = db.query(models.PlantillaProducto).filter(
            models.PlantillaProducto.sector == sector
        ).all()
    
    return plantillas

@router.post("/plantillas", response_model=schemas.PlantillaProductoOut)
def crear_plantilla(plantilla: schemas.PlantillaProductoCrear, db: Session = Depends(get_db)):
    db_plantilla = models.PlantillaProducto(**plantilla.model_dump())
    db.add(db_plantilla)
    db.commit()
    db.refresh(db_plantilla)
    return db_plantilla
