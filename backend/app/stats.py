from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .database import get_db
from . import models

router = APIRouter()


@router.get("/stats/dashboard")
def stats_dashboard(db: Session = Depends(get_db)):
    total_usuarios = db.query(models.Usuario).count()
    total_productos = db.query(models.Producto).count()
    total_clientes = db.query(models.Cliente).count()
    
    productos_bajo_stock = db.query(models.Producto).filter(models.Producto.stock < 10).count()
    
    productos = db.query(models.Producto).all()
    valor_inventario = sum(p.precio * p.stock for p in productos)
    
    return {
        "usuarios": total_usuarios,
        "productos": total_productos,
        "clientes": total_clientes,
        "productos_bajo_stock": productos_bajo_stock,
        "valor_inventario": round(valor_inventario, 2)
    }

@router.get("/stats/ventas-mensuales")
def ventas_mensuales(db: Session = Depends(get_db)):
    return [
        {"name": "Ene", "ventas": 4000, "gastos": 2400},
        {"name": "Feb", "ventas": 3000, "gastos": 1398},
        {"name": "Mar", "ventas": 2000, "gastos": 9800},
        {"name": "Abr", "ventas": 2780, "gastos": 3908},
        {"name": "May", "ventas": 1890, "gastos": 4800},
        {"name": "Jun", "ventas": 2390, "gastos": 3800},
        {"name": "Jul", "ventas": 3490, "gastos": 4300},
    ]

@router.get("/stats/categorias")
def stats_categorias(db: Session = Depends(get_db)):
    productos = db.query(models.Producto).all()
    categorias = {}
    for p in productos:
        cat = p.categoria or "Otros"
        if cat not in categorias:
            categorias[cat] = 0
        categorias[cat] += 1
    
    total = sum(categorias.values())
    result = []
    for cat, count in categorias.items():
        result.append({"name": cat, "value": round((count / total) * 100) if total > 0 else 0})
    
    if not result:
        result = [
            {"name": "Electrónica", "value": 35},
            {"name": "Ropa", "value": 25},
            {"name": "Alimentos", "value": 20},
            {"name": "Otros", "value": 20},
        ]
    
    return result
