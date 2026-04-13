from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .database import get_db
from . import models, schemas
from typing import List

router = APIRouter()


@router.get("/clientes", response_model=List[schemas.ClienteOut])
def listar_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    clientes = db.query(models.Cliente).offset(skip).limit(limit).all()
    return clientes

@router.get("/clientes/{cliente_id}", response_model=schemas.ClienteOut)
def obtener_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente

@router.post("/clientes", response_model=schemas.ClienteOut)
def crear_cliente(cliente: schemas.ClienteCrear, db: Session = Depends(get_db)):
    if cliente.email:
        existente = db.query(models.Cliente).filter(models.Cliente.email == cliente.email).first()
        if existente:
            raise HTTPException(status_code=400, detail="Ya existe un cliente con este email")
    
    nuevo_cliente = models.Cliente(**cliente.dict())
    db.add(nuevo_cliente)
    db.commit()
    db.refresh(nuevo_cliente)
    return nuevo_cliente

@router.put("/clientes/{cliente_id}", response_model=schemas.ClienteOut)
def actualizar_cliente(cliente_id: int, cliente: schemas.ClienteUpdate, db: Session = Depends(get_db)):
    db_cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    for key, value in cliente.dict(exclude_unset=True).items():
        setattr(db_cliente, key, value)
    
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

@router.delete("/clientes/{cliente_id}")
def eliminar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    db_cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    db.delete(db_cliente)
    db.commit()
    return {"mensaje": "Cliente eliminado correctamente"}

@router.get("/clientes/stats/resumen")
def stats_clientes(db: Session = Depends(get_db)):
    total = db.query(models.Cliente).count()
    return {"total": total}
