from sqlalchemy.orm import Session
from . import models, schemas
import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def get_user_by_email(db: Session, email: str):
    return db.query(models.Usuario).filter(models.Usuario.email == email).first()

def crear_usuario(db: Session, usuario: schemas.UsuarioCrear):
    hashed_password = hash_password(usuario.password)
    db_usuario = models.Usuario(
        nombre=usuario.nombre,
        usuario=usuario.usuario,
        email=usuario.email,
        password=hashed_password,
        rol=usuario.rol
    )
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario
