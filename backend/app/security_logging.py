import logging
import json
from datetime import datetime
from typing import Optional
from fastapi import Request
from sqlalchemy.orm import Session
from . import models

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('security.log'),
        logging.StreamHandler()
    ]
)

security_logger = logging.getLogger("security")


class SecurityEventType:
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILED = "LOGIN_FAILED"
    LOGOUT = "LOGOUT"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    ACCESS_DENIED = "ACCESS_DENIED"
    RESOURCE_ACCESS = "RESOURCE_ACCESS"
    DATA_CHANGE = "DATA_CHANGE"
    RATE_LIMIT = "RATE_LIMIT"
    SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY"


def log_security_event(
    event_type: str,
    user_id: Optional[int] = None,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    resource: Optional[str] = None,
    action: Optional[str] = None,
    details: Optional[dict] = None,
    db: Optional[Session] = None
):
    """Registra un evento de seguridad."""
    
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": user_id,
        "user_email": user_email,
        "ip_address": ip_address,
        "user_agent": user_agent,
        "resource": resource,
        "action": action,
        "details": details or {}
    }
    
    security_logger.info(json.dumps(log_entry))
    
    if db and user_id:
        try:
            log_entry_model = models.AuditLog(
                usuario_id=user_id,
                accion=event_type,
                detalle=json.dumps(log_entry),
                ip_address=ip_address or "unknown"
            )
            db.add(log_entry_model)
            db.commit()
        except Exception:
            pass


def log_login_success(request: Request, user_id: int, user_email: str, db: Session = None):
    log_security_event(
        event_type=SecurityEventType.LOGIN_SUCCESS,
        user_id=user_id,
        user_email=user_email,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        db=db
    )


def log_login_failed(request: Request, user_email: str, reason: str, db: Session = None):
    log_security_event(
        event_type=SecurityEventType.LOGIN_FAILED,
        user_email=user_email,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        details={"reason": reason},
        db=db
    )


def log_logout(request: Request, user_id: int, db: Session = None):
    log_security_event(
        event_type=SecurityEventType.LOGOUT,
        user_id=user_id,
        ip_address=request.client.host if request.client else None,
        db=db
    )


def log_access_denied(request: Request, user_id: int, resource: str, reason: str, db: Session = None):
    log_security_event(
        event_type=SecurityEventType.ACCESS_DENIED,
        user_id=user_id,
        ip_address=request.client.host if request.client else None,
        resource=resource,
        action="ACCESS_DENIED",
        details={"reason": reason},
        db=db
    )


def log_rate_limit(request: Request, endpoint: str, db: Session = None):
    log_security_event(
        event_type=SecurityEventType.RATE_LIMIT,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        resource=endpoint,
        details={"reason": "Rate limit exceeded"}
    )