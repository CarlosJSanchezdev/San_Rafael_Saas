from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from .database import get_db
from .auth import get_current_user
from . import models, schemas
from typing import List

router_publico = APIRouter(tags=["tiendas-publico"])
router_admin = APIRouter(tags=["tiendas-admin"])

router = router_publico


def require_admin(current_user: models.Usuario = Depends(get_current_user)):
    if current_user.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de administrador"
        )
    return current_user


SECTORES = ["comercial", "industrial", "servicios", "oficial", "residencial"]

# ─── Rutas ADMIN (protegidas) ─────────────────────────────────────────────────

@router_admin.get("/admin/tiendas", response_model=List[schemas.TiendaOut])
def listar_tiendas(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    admin: models.Usuario = Depends(require_admin)
):
    tiendas = db.query(models.Tienda).filter(models.Tienda.activa == True).offset(skip).limit(limit).all()
    return tiendas


@router_admin.post("/admin/tiendas", response_model=schemas.TiendaOut, status_code=status.HTTP_201_CREATED)
def crear_tienda(
    tienda: schemas.TiendaCrear, 
    db: Session = Depends(get_db),
    admin: models.Usuario = Depends(require_admin)
):
    existente = db.query(models.Tienda).filter(
        (models.Tienda.subdominio == tienda.subdominio) |
        (models.Tienda.slug == tienda.slug)
    ).first()
    if existente:
        raise HTTPException(status_code=400, detail="El subdominio o slug ya existe")

    if tienda.sector not in SECTORES:
        raise HTTPException(status_code=400, detail=f"Sector inválido. Opciones: {SECTORES}")

    tienda_data = tienda.model_dump()
    manager_id = tienda_data.pop("manager_id", None)
    
    db_tienda = models.Tienda(**tienda_data)
    db.add(db_tienda)
    db.commit()
    db.refresh(db_tienda)
    
    if manager_id:
        db_tienda.manager_id = manager_id
        manager = db.query(models.Usuario).filter(models.Usuario.id == manager_id).first()
        if manager:
            manager.tienda_id = db_tienda.id
        db.commit()
        db.refresh(db_tienda)
    
    return db_tienda


@router_admin.get("/admin/tiendas/{tienda_id}", response_model=schemas.TiendaOut)
def obtener_tienda(
    tienda_id: int, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    if current_user.rol != "admin":
        if current_user.tienda_id != tienda_id:
            raise HTTPException(
                status_code=403, 
                detail="No tienes acceso a esta tienda"
            )
    
    tienda = db.query(models.Tienda).filter(models.Tienda.id == tienda_id).first()
    if not tienda:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
    return tienda


@router_admin.put("/admin/tiendas/{tienda_id}", response_model=schemas.TiendaOut)
def actualizar_tienda(
    tienda_id: int, 
    tienda: schemas.TiendaUpdate, 
    db: Session = Depends(get_db),
    admin: models.Usuario = Depends(require_admin)
):
    db_tienda = db.query(models.Tienda).filter(models.Tienda.id == tienda_id).first()
    if not db_tienda:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")

    tienda_data = tienda.model_dump(exclude_unset=True)
    nuevo_manager_id = tienda_data.pop("manager_id", None)
    
    for key, value in tienda_data.items():
        setattr(db_tienda, key, value)
    
    if nuevo_manager_id is not None:
        db_tienda.manager_id = nuevo_manager_id
        
        if nuevo_manager_id:
            manager = db.query(models.Usuario).filter(models.Usuario.id == nuevo_manager_id).first()
            if manager:
                manager.tienda_id = tienda_id
        else:
            old_manager = db.query(models.Usuario).filter(
                models.Usuario.tienda_id == tienda_id,
                models.Usuario.rol == "manager"
            ).first()
            if old_manager:
                old_manager.tienda_id = None

    db.commit()
    db.refresh(db_tienda)
    return db_tienda


@router_admin.delete("/admin/tiendas/{tienda_id}")
def eliminar_tienda(
    tienda_id: int, 
    db: Session = Depends(get_db),
    admin: models.Usuario = Depends(require_admin)
):
    db_tienda = db.query(models.Tienda).filter(models.Tienda.id == tienda_id).first()
    if not db_tienda:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")

    db_tienda.activa = False
    db.commit()
    return {"mensaje": "Tienda desactivada correctamente"}


# ─── Rutas PÚBLICAS ───────────────────────────────────────────────────────────

@router_publico.get("/tiendas/por-subdominio/{subdominio}", response_model=schemas.TiendaPublicaOut)
def obtener_tienda_por_subdominio(subdominio: str, db: Session = Depends(get_db)):
    tienda = db.query(models.Tienda).filter(
        models.Tienda.subdominio == subdominio,
        models.Tienda.activa == True
    ).first()
    if not tienda:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
    return tienda


@router_publico.get("/tiendas/por-slug/{slug}", response_model=schemas.TiendaPublicaOut)
def obtener_tienda_por_slug(slug: str, db: Session = Depends(get_db)):
    tienda = db.query(models.Tienda).filter(
        models.Tienda.slug == slug,
        models.Tienda.activa == True
    ).first()
    if not tienda:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
    return tienda


@router_publico.get("/tiendas/{tienda_id}/productos", response_model=List[schemas.ProductoOut])
def listar_productos_tienda(tienda_id: int, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    productos = db.query(models.Producto).filter(
        models.Producto.tienda_id == tienda_id,
        models.Producto.activo == True,
        models.Producto.stock > 0
    ).offset(skip).limit(limit).all()
    return productos


@router_publico.get("/sectores")
def listar_sectores():
    return SECTORES
