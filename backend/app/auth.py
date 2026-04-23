from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from . import schemas, crud, models
from .database import get_db, SessionLocal
import bcrypt
import secrets
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

router = APIRouter()

limiter = Limiter(key_func=get_remote_address)


class CookieTokenResponse(BaseModel):
    mensaje: str
    usuario: str
    token: str


def get_token_from_request(request: Request, token_param: Optional[str] = None) -> Optional[str]:
    """Obtiene el token desde cookie HttpOnly o query param."""
    # Prioridad 1: Query param (backwards compatibility)
    if token_param:
        return token_param
    
    # Prioridad 2: Cookie HttpOnly
    cookie_token = request.cookies.get("session_token")
    if cookie_token:
        return cookie_token
    
    # Prioridad 3: Authorization header Bearer
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]
    
    return None



def get_current_user(
    request: Request,
    token: Optional[str] = Query(None, description="Token de sesión activo"),
    db: Session = Depends(get_db),
) -> models.Usuario:
    """Dependency reutilizable: valida el token (de cookie, query param o header) y devuelve el usuario autenticado."""
    # Obtener token de múltiples fuentes
    auth_token = get_token_from_request(request, token)
    
    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no proporcionado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    sesion = (
        db.query(models.Sesion)
        .filter(models.Sesion.token == auth_token, models.Sesion.activa == True)
        .first()
    )
    if not sesion:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o sesión expirada",
            headers={"WWW-Authenticate": "Bearer"},
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
@limiter.limit("3/minute")
def registro(request: Request, usuario: schemas.UsuarioCrear, db: Session = Depends(get_db)):
    db_usuario = crud.get_user_by_email(db, email=usuario.email)
    if db_usuario:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    return crud.crear_usuario(db, usuario)

@router.post("/auth/login")
@limiter.limit("5/minute")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
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
        dispositivo=request.headers.get("user-agent", "Desconocido")[:100] if request else "Desconocido",
        ip=request.client.host if request and request.client else "0.0.0.0"
    )
    db.add(sesion)
    db.commit()
    
    response = JSONResponse(
        content={"mensaje": "Inicio de sesión exitoso", "usuario": user.email, "token": token}
    )
    
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/"
    )
    
    return response

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
def cerrar_sesion_actual(
    request: Request,
    token: Optional[str] = Query(None, description="Token de sesión"),
    db: Session = Depends(get_db)
):
    auth_token = get_token_from_request(request, token)
    
    if auth_token:
        sesion = db.query(models.Sesion).filter(
            models.Sesion.token == auth_token,
            models.Sesion.activa == True
        ).first()
        
        if sesion:
            sesion.activa = False
            db.commit()
    
    response = JSONResponse(content={"mensaje": "Sesión cerrada correctamente"})
    response.delete_cookie(key="session_token", path="/")
    
    return response

@router.get("/auth/validar-token")
def validar_token(request: Request, token: Optional[str] = Query(None), db: Session = Depends(get_db)):
    auth_token = get_token_from_request(request, token)
    
    if not auth_token:
        raise HTTPException(status_code=401, detail="Token no proporcionado")
    
    sesion = db.query(models.Sesion).filter(
        models.Sesion.token == auth_token,
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
