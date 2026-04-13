from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .database import get_db
from . import models
from typing import List

router = APIRouter()


@router.get("/tienda/productos")
def listar_productos_publicos(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    productos = db.query(models.Producto).filter(models.Producto.stock > 0).offset(skip).limit(limit).all()
    return [
        {
            "id": p.id,
            "nombre": p.nombre,
            "descripcion": p.descripcion,
            "precio": p.precio,
            "stock": p.stock,
            "categoria": p.categoria,
            "imagen": p.imagen,
            "tienda_id": p.tienda_id
        }
        for p in productos
    ]

@router.get("/tienda/productos/{producto_id}")
def obtener_producto_publico(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(models.Producto).filter(
        models.Producto.id == producto_id,
        models.Producto.stock > 0
    ).first()
    if not producto:
        return {"error": "Producto no encontrado"}
    return {
        "id": producto.id,
        "nombre": producto.nombre,
        "descripcion": producto.descripcion,
        "precio": producto.precio,
        "stock": producto.stock,
        "categoria": producto.categoria,
        "imagen": producto.imagen,
        "tienda_id": producto.tienda_id
    }

@router.get("/tienda/categorias")
def listar_categorias(db: Session = Depends(get_db)):
    productos = db.query(models.Producto).filter(models.Producto.stock > 0).all()
    categorias = list(set([p.categoria for p in productos if p.categoria]))
    return categorias
