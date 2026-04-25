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

import requests
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

limiter = Limiter(key_func=get_remote_address)


def send_recovery_email(email: str, token: str, frontend_url: str) -> bool:
    """Envía email de recuperación de contraseña via Brevo (Sendinblue)"""
    try:
        brevo_api_key = os.getenv("BREVO_API_KEY")
        email_from = os.getenv("EMAIL_FROM", "cjsatlas@hotmail.com")
        
        recovery_link = f"{frontend_url}/reset-password?token={token}"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0ea5e9;">Recuperación de Contraseña - SRF Web</h2>
            <p>Has solicitado recuperar tu contraseña.</p>
            <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
            <a href="{recovery_link}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                Recuperar mi contraseña
            </a>
            <p style="color: #666; font-size: 14px;">Este enlace expira en 1 hora.</p>
            <p style="color: #999; font-size: 12px;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
        </div>
        """
        
        url = "https://api.brevo.com/v3/smtp/email"
        
        payload = {
            "sender": {"name": "SRF Web", "email": email_from},
            "to": [{"email": email}],
            "subject": "Recuperación de tu contraseña - SRF Web",
            "htmlContent": html_content
        }
        
        headers = {
            "api-key": brevo_api_key,
            "content-type": "application/json"
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 201:
            logger.info(f"✅ Email de recuperación enviado a {email}")
            return True
        else:
            logger.error(f"❌ Error enviando email a {email}: {response.status_code} - {response.text}")
            return False
        
    except Exception as e:
        logger.error(f"❌ Error enviando email de recuperación a {email}: {str(e)}")
        return False


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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Error de autenticación")
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

@router.post("/auth/recuperar-password")
@limiter.limit("3/minute")
def solicitar_recuperacion(request: Request, email: str, db: Session = Depends(get_db)):
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
    
    # Detectar frontend URL desde headers
    forwarded_host = request.headers.get("X-Forwarded-Host")
    frontend_url = f"https://{forwarded_host}" if forwarded_host else os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # Enviar email de recuperación real
    send_recovery_email(email, token, frontend_url)
    
    return {"mensaje": "Si el correo existe, recibirás un enlace de recuperación"}

@router.post("/auth/reset-password")
def reset_password(token: str, nueva_password: str, db: Session = Depends(get_db)):
    # Validar fuerza de contraseña
    if len(nueva_password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")
    if not any(c.isupper() for c in nueva_password):
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos una mayúscula")
    if not any(c.islower() for c in nueva_password):
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos una minúscula")
    if not any(c.isdigit() for c in nueva_password):
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos un número")
    
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
        raise HTTPException(status_code=404, detail="Error de validación")
    
    usuario.password = crud.hash_password(nueva_password)
    recuperacion.usado = True
    db.commit()
    
    return {"mensaje": "Contraseña actualizada correctamente"}

@router.get("/auth/sesiones")
def listar_sesiones(email: str, db: Session = Depends(get_db)):
    usuario = crud.get_user_by_email(db, email=email)
    if not usuario:
        raise HTTPException(status_code=404, detail="Error de validación")
    
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
        raise HTTPException(status_code=404, detail="Error de validación")
    
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
        raise HTTPException(status_code=404, detail="Error de validación")
    
    return {
        "id": usuario.id,
        "usuario": usuario.email,
        "nombre": usuario.nombre,
        "rol": usuario.rol,
        "tienda_id": usuario.tienda_id
    }
