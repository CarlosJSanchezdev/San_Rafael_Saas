from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .database import get_db
from .auth import get_current_user
from . import models, schemas
from typing import List, Optional

router = APIRouter()


@router.get("/productos", response_model=List[schemas.ProductoOut])
def listar_productos(
    skip: int = 0, 
    limit: int = 100, 
    tienda_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    # Si es admin, puede ver todas las tiendas
    # Si es manager, solo puede ver su tienda
    if current_user.rol != "admin":
        if current_user.tienda_id is None:
            raise HTTPException(status_code=403, detail="No tienes una tienda asignada")
        
        # Forzar que solo vea su propia tienda
        tienda_id = current_user.tienda_id
    
    # Si el admin especifica tienda_id, validar que existe
    if tienda_id:
        tienda = db.query(models.Tienda).filter(models.Tienda.id == tienda_id).first()
        if not tienda:
            raise HTTPException(status_code=404, detail="Tienda no encontrada")
    
    query = db.query(models.Producto).filter(models.Producto.activo == True)
    if tienda_id:
        query = query.filter(models.Producto.tienda_id == tienda_id)
    productos = query.offset(skip).limit(limit).all()
    return productos

@router.get("/productos/{producto_id}", response_model=schemas.ProductoOut)
def obtener_producto(
    producto_id: int, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Validar acceso cross-tenant
    if current_user.rol != "admin":
        if current_user.tienda_id != producto.tienda_id:
            raise HTTPException(status_code=403, detail="No tienes acceso a este producto")
    
    return producto

@router.post("/productos", response_model=schemas.ProductoOut)
def crear_producto(
    producto: schemas.ProductoCrear, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    # Validar acceso cross-tenant
    if current_user.rol != "admin":
        if current_user.tienda_id != producto.tienda_id:
            raise HTTPException(status_code=403, detail="No tienes acceso a esta tienda")
    
    tienda = db.query(models.Tienda).filter(models.Tienda.id == producto.tienda_id).first()
    if not tienda:
        raise HTTPException(status_code=400, detail="Tienda no encontrada")
    
    nuevo_producto = models.Producto(**producto.model_dump())
    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)
    return nuevo_producto

@router.put("/productos/{producto_id}", response_model=schemas.ProductoOut)
def actualizar_producto(
    producto_id: int, 
    producto: schemas.ProductoUpdate, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    db_producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if not db_producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Validar acceso cross-tenant
    if current_user.rol != "admin":
        if current_user.tienda_id != db_producto.tienda_id:
            raise HTTPException(status_code=403, detail="No tienes acceso a este producto")
    
    for key, value in producto.model_dump(exclude_unset=True).items():
        setattr(db_producto, key, value)
    
    db.commit()
    db.refresh(db_producto)
    return db_producto

@router.delete("/productos/{producto_id}")
def eliminar_producto(
    producto_id: int, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    db_producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if not db_producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Validar acceso cross-tenant
    if current_user.rol != "admin":
        if current_user.tienda_id != db_producto.tienda_id:
            raise HTTPException(status_code=403, detail="No tienes acceso a este producto")
    
    db_producto.activo = False
    db.commit()
    return {"mensaje": "Producto desactivado correctamente"}

@router.get("/productos/stats/resumen")
def stats_productos(
    tienda_id: Optional[int] = None, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    # Validar acceso cross-tenant
    if current_user.rol != "admin":
        tienda_id = current_user.tienda_id
    
    query = db.query(models.Producto)
    if tienda_id:
        query = query.filter(models.Producto.tienda_id == tienda_id)
    
    total = query.count()
    bajo_stock = query.filter(models.Producto.stock < 10).count()
    return {"total": total, "bajo_stock": bajo_stock}
