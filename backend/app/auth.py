from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from . import schemas, crud, models
from .database import get_db, SessionLocal
import bcrypt
import secrets
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime
from typing import Optional

router = APIRouter()



def get_current_user(
    token: str = Query(..., description="Token de sesión activo"),
    db: Session = Depends(get_db),
) -> models.Usuario:
    """Dependency reutilizable: valida el token y devuelve el usuario autenticado."""
    sesion = (
        db.query(models.Sesion)
        .filter(models.Sesion.token == token, models.Sesion.activa == True)
        .first()
    )
    if not sesion:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o sesión expirada",
        )
    usuario = db.query(models.Usuario).filter(models.Usuario.id == sesion.usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    # Actualizar última actividad
    sesion.ultima_actividad = datetime.utcnow()
    db.commit()
    return usuario


def get_current_user_optional(
    token: Optional[str] = Query(None, description="Token de sesión (opcional)"),
    db: Session = Depends(get_db),
) -> Optional[models.Usuario]:
    """Retorna usuario si token es válido, o None si no hay token (cliente anónimo)."""
    if not token:
        return None
    
    sesion = db.query(models.Sesion).filter(
        models.Sesion.token == token,
        models.Sesion.activa == True
    ).first()
    
    if not sesion:
        return None
    
    usuario = db.query(models.Usuario).filter(models.Usuario.id == sesion.usuario_id).first()
    if usuario:
        sesion.ultima_actividad = datetime.utcnow()
        db.commit()
    return usuario

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))



@router.post("/auth/registro", response_model=schemas.UsuarioOut)
def registro(usuario: schemas.UsuarioCrear, db: Session = Depends(get_db)):
    db_usuario = crud.get_user_by_email(db, email=usuario.email)
    if db_usuario:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    return crud.crear_usuario(db, usuario)

@router.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db), request: Request = None):
    user = crud.get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")
    
    sesiones_anteriores = db.query(models.Sesion).filter(
        models.Sesion.usuario_id == user.id,
        models.Sesion.activa == True
    ).all()
    for sesion in sesiones_anteriores:
        sesion.activa = False
    db.commit()
    
    token = secrets.token_urlsafe(32)
    
    sesion = models.Sesion(
        usuario_id=user.id,
        token=token,
        dispositivo=request.headers.get("user-agent", "Desconocido")[:100],
        ip=request.client.host if request.client else "0.0.0.0"
    )
    db.add(sesion)
    db.commit()
    
    return {"mensaje": "Inicio de sesión exitoso", "usuario": user.email, "token": token}

@router.post("/auth/recuperar-password")
def solicitar_recuperacion(email: str, db: Session = Depends(get_db)):
    usuario = crud.get_user_by_email(db, email=email)
    if not usuario:
        return {"mensaje": "Si el correo existe, recibirás un enlace de recuperación"}
    
    token = secrets.token_urlsafe(32)
    
    recuperacion = models.RecuperacionPassword(
        email=email,
        token=token
    )
    db.add(recuperacion)
    db.commit()
    
    # NOTA: En producción, enviar el token al email del usuario,
    # nunca devolverlo en la respuesta HTTP.
    # Ejemplo: send_recovery_email(email, token)
    print(f"=== TOKEN DE RECUPERACIÓN (solo en desarrollo) ===")
    print(f"Email: {email}")
    print(f"Token: {token}")
    print(f"===================================================")
    return {"mensaje": "Si el correo existe, recibirás un enlace de recuperación"}

@router.post("/auth/reset-password")
def reset_password(token: str, nueva_password: str, db: Session = Depends(get_db)):
    recuperacion = db.query(models.RecuperacionPassword).filter(
        models.RecuperacionPassword.token == token,
        models.RecuperacionPassword.usado == False
    ).first()
    
    if not recuperacion:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
    
    if datetime.utcnow() > recuperacion.fecha_expiracion:
        raise HTTPException(status_code=400, detail="Token expirado")
    
    usuario = crud.get_user_by_email(db, email=recuperacion.email)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    usuario.password = crud.hash_password(nueva_password)
    recuperacion.usado = True
    db.commit()
    
    return {"mensaje": "Contraseña actualizada correctamente"}

@router.get("/auth/sesiones")
def listar_sesiones(email: str, db: Session = Depends(get_db)):
    usuario = crud.get_user_by_email(db, email=email)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    sesiones = db.query(models.Sesion).filter(
        models.Sesion.usuario_id == usuario.id,
        models.Sesion.activa == True
    ).all()
    
    return [
        {
            "id": s.id,
            "dispositivo": s.dispositivo,
            "ip": s.ip,
            "fecha_creacion": s.fecha_creacion.isoformat(),
            "ultima_actividad": s.ultima_actividad.isoformat()
        }
        for s in sesiones
    ]

@router.post("/auth/sesiones/{sesion_id}/cerrar")
def cerrar_sesion(sesion_id: int, db: Session = Depends(get_db)):
    sesion = db.query(models.Sesion).filter(models.Sesion.id == sesion_id).first()
    if not sesion:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    sesion.activa = False
    db.commit()
    
    return {"mensaje": "Sesión cerrada correctamente"}

@router.post("/auth/cerrar-sesion")
def cerrar_sesion_actual(token: str, db: Session = Depends(get_db)):
    sesion = db.query(models.Sesion).filter(
        models.Sesion.token == token,
        models.Sesion.activa == True
    ).first()
    
    if sesion:
        sesion.activa = False
        db.commit()
    
    return {"mensaje": "Sesión cerrada correctamente"}

@router.get("/auth/validar-token")
def validar_token(token: str, db: Session = Depends(get_db)):
    sesion = db.query(models.Sesion).filter(
        models.Sesion.token == token,
        models.Sesion.activa == True
    ).first()
    
    if not sesion:
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada")
    
    usuario = db.query(models.Usuario).filter(models.Usuario.id == sesion.usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return {
        "id": usuario.id,
        "usuario": usuario.email,
        "nombre": usuario.nombre,
        "rol": usuario.rol,
        "tienda_id": usuario.tienda_id
    }
