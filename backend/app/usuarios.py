from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from .database import get_db
from .auth import get_current_user
from . import models, schemas
from .crud import hash_password
from typing import List, Optional

router = APIRouter()


def require_admin(current_user: models.Usuario = Depends(get_current_user)):
    if current_user.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de administrador"
        )
    return current_user


@router.get("/usuarios", response_model=List[schemas.UsuarioOut])
def listar_usuarios(
    skip: int = 0, 
    limit: int = 100, 
    rol: Optional[str] = Query(None, description="Filtrar por rol"),
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    query = db.query(models.Usuario)
    
    if current_user.rol != "admin":
        if current_user.tienda_id:
            query = query.filter(models.Usuario.tienda_id == current_user.tienda_id)
        else:
            query = query.filter(models.Usuario.id == current_user.id)
    
    if rol:
        query = query.filter(models.Usuario.rol == rol)
    usuarios = query.offset(skip).limit(limit).all()
    return usuarios


@router.get("/usuarios/{usuario_id}", response_model=schemas.UsuarioOut)
def obtener_usuario(
    usuario_id: int, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    if current_user.rol != "admin" and current_user.id != usuario_id:
        if current_user.tienda_id:
            usuario = db.query(models.Usuario).filter(
                models.Usuario.id == usuario_id,
                models.Usuario.tienda_id == current_user.tienda_id
            ).first()
        else:
            usuario = None
        if not usuario:
            raise HTTPException(status_code=404, detail="Error de validación")
        return usuario
    
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Error de validación")
    return usuario


@router.post("/usuarios", response_model=schemas.UsuarioOut)
def crear_usuario(
    usuario: schemas.UsuarioCrear, 
    db: Session = Depends(get_db),
    admin: models.Usuario = Depends(require_admin)
):
    existente = db.query(models.Usuario).filter(
        (models.Usuario.email == usuario.email) | 
        (models.Usuario.usuario == usuario.usuario)
    ).first()
    if existente:
        raise HTTPException(status_code=400, detail="El recurso ya existe")
    
    nuevo_usuario = models.Usuario(
        nombre=usuario.nombre,
        usuario=usuario.usuario,
        email=usuario.email,
        password=hash_password(usuario.password),
        rol=usuario.rol,
        tienda_id=usuario.tienda_id
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    
    if nuevo_usuario.rol == "manager" and nuevo_usuario.tienda_id:
        tienda = db.query(models.Tienda).filter(models.Tienda.id == nuevo_usuario.tienda_id).first()
        if tienda:
            tienda.manager_id = nuevo_usuario.id
            db.commit()
    
    return nuevo_usuario


@router.put("/usuarios/{usuario_id}", response_model=schemas.UsuarioOut)
def actualizar_usuario(
    usuario_id: int, 
    usuario: schemas.UsuarioUpdate, 
    db: Session = Depends(get_db),
    admin: models.Usuario = Depends(require_admin)
):
    db_usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Error de validación")
    
    if usuario.nombre:
        db_usuario.nombre = usuario.nombre
    if usuario.usuario:
        db_usuario.usuario = usuario.usuario
    if usuario.email:
        db_usuario.email = usuario.email
    if usuario.rol:
        db_usuario.rol = usuario.rol
    if usuario.password:
        db_usuario.password = hash_password(usuario.password)
    if usuario.tienda_id is not None:
        old_tienda_id = db_usuario.tienda_id
        db_usuario.tienda_id = usuario.tienda_id
        
        if usuario.tienda_id and old_tienda_id != usuario.tienda_id:
            old_tienda = db.query(models.Tienda).filter(models.Tienda.id == old_tienda_id).first()
            if old_tienda:
                old_tienda.manager_id = None
            
            nueva_tienda = db.query(models.Tienda).filter(models.Tienda.id == usuario.tienda_id).first()
            if nueva_tienda:
                nueva_tienda.manager_id = usuario_id
    
    db.commit()
    db.refresh(db_usuario)
    return db_usuario


@router.delete("/usuarios/{usuario_id}")
def eliminar_usuario(
    usuario_id: int, 
    db: Session = Depends(get_db),
    admin: models.Usuario = Depends(require_admin)
):
    db_usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Error de validación")
    
    db.delete(db_usuario)
    db.commit()
    return {"mensaje": "Usuario eliminado correctamente"}
