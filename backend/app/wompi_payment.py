import os
import hashlib
import hmac
import uuid
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from .database import get_db
from . import models, schemas
from typing import Optional
from pydantic import BaseModel
import html
import re

logger = logging.getLogger(__name__)

router = APIRouter()

limiter = Limiter(key_func=get_remote_address)


def sanitize_input(text_input: str) -> str:
    if not text_input:
        return text_input
    text_input = html.escape(text_input)
    text_input = re.sub(r'[<>]', '', text_input)
    return text_input.strip()


def generate_wompi_signature(reference: str, amount_in_cents: int, currency: str, integrity_secret: str) -> str:
    """Genera la firma SHA256 para Wompi"""
    concatenated = f"{reference}{amount_in_cents}{currency}{integrity_secret}"
    return hashlib.sha256(concatenated.encode()).hexdigest()


def generate_reference() -> str:
    """Genera una referencia única para la transacción"""
    return f"WOMPI-{uuid.uuid4().hex[:12].upper()}"


def verify_wompi_signature(payload: bytes, signature_header: str) -> bool:
    """
    Valida la firma HMAC-SHA256 del webhook de Wompi.
    Returns True si la firma es válida, False si no.
    Si WOMPI_EVENTS_KEY no está configurada, retorna False (fail-safe).
    """
    events_key = os.getenv("WOMPI_EVENTS_KEY")
    if not events_key or events_key == "tu_wompi_events_key_aqui":
        logger.warning("WOMPI_EVENTS_KEY no configurada - webhook signature validation deshabilitada")
        return False

    expected_signature = hmac.new(
        events_key.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected_signature, signature_header)


@router.post("/create-wompi-transaction")
@limiter.limit("30/minute")
def crear_transaccion_wompi(request: Request, pedido_data: schemas.PedidoCrear, db: Session = Depends(get_db)):
    """
    Crea una transacción de Wompi y retorna los datos necesarios para el widget.
    """
    tienda = db.query(models.Tienda).filter(models.Tienda.id == pedido_data.tienda_id).first()
    if not tienda:
        raise HTTPException(status_code=400, detail="Tienda no encontrada")
    
    if not tienda.wompi_activo:
        raise HTTPException(status_code=400, detail="Wompi no está activo para esta tienda")
    
    if not tienda.wompi_public_key or not tienda.wompi_integrity_secret:
        raise HTTPException(status_code=400, detail="Credenciales de Wompi no configuradas")

    total = 0
    items_detalle = []

    for item in pedido_data.items:
        producto = db.query(models.Producto).filter(
            models.Producto.id == item.producto_id,
            models.Producto.tienda_id == pedido_data.tienda_id
        ).first()

        if not producto:
            raise HTTPException(
                status_code=400,
                detail="Error al procesar el pago"
            )

        if abs(producto.precio - item.precio) > 0.01:
            raise HTTPException(
                status_code=400,
                detail="El precio del producto ha sido modificado"
            )

        if producto.stock < item.cantidad:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para {producto.nombre}. Stock: {producto.stock}"
            )

        total += producto.precio * item.cantidad
        items_detalle.append({
            "producto_id": producto.id,
            "producto_nombre": producto.nombre,
            "precio": producto.precio,
            "cantidad": item.cantidad
        })

    amount_in_cents = int(total * 100)
    reference = generate_reference()
    signature = generate_wompi_signature(
        reference=reference,
        amount_in_cents=amount_in_cents,
        currency="COP",
        integrity_secret=tienda.wompi_integrity_secret
    )

    # Guardar transacción en BD para idempotencia del webhook
    datos_cliente = {
        "email": sanitize_input(pedido_data.cliente_email),
        "nombre": sanitize_input(pedido_data.cliente_nombre),
        "telefono": sanitize_input(pedido_data.cliente_telefono or ""),
        "direccion": sanitize_input(pedido_data.direccion_envio or "")
    }
    
    db_transaccion = models.TransaccionWompi(
        reference=reference,
        tienda_id=tienda.id,
        estado="pendiente",
        datos_cliente=datos_cliente,
        items_json=items_detalle,
        total=amount_in_cents
    )
    db.add(db_transaccion)
    db.commit()

    return {
        "publicKey": tienda.wompi_public_key,
        "reference": reference,
        "signature": signature,
        "amountInCents": amount_in_cents,
        "currency": "COP",
        "tiendaId": tienda.id,
        "items": items_detalle,
        "customerData": {
            "email": sanitize_input(pedido_data.cliente_email),
            "fullName": sanitize_input(pedido_data.cliente_nombre),
            "phoneNumber": sanitize_input(pedido_data.cliente_telefono or ""),
            "phoneNumberPrefix": "+57"
        },
        "redirectUrl": f"/t/{tienda.subdominio}/checkout",
        "metadata": {
            "tienda_id": tienda.id,
            "reference": reference
        }
    }


class WompiWebhookData(BaseModel):
    event: str
    data: dict


@router.post("/webhooks/wompi")
async def webhook_wompi(
    request: Request,
    x_wompi_signature: Optional[str] = Header(None, alias="x-wompi-signature"),
    db: Session = Depends(get_db)
):
    """
    Webhook que Wompi llama para notificar eventos de pago.
    Valida firma HMAC-SHA256 si WOMPI_EVENTS_KEY está configurada.
    """
    try:
        payload = await request.body()
    except Exception:
        return {"status": "error", "message": "Payload inválido"}

    # Validar firma HMAC si está configurada
    if x_wompi_signature:
        if not verify_wompi_signature(payload, x_wompi_signature):
            logger.warning(f"Webhook signature validation failed")
            return {"status": "error", "message": "Firma inválida"}

    try:
        payload_dict = json.loads(payload)
    except Exception:
        return {"status": "error", "message": "Payload JSON inválido"}

    event = payload_dict.get("event")
    transaction_data = payload_dict.get("data", {})
    transaction_id = transaction_data.get("id")
    reference = transaction_data.get("reference")
    status = transaction_data.get("status")

    logger.info(f"Wompi webhook received: event={event}, transaction_id={transaction_id}, reference={reference}, status={status}")

    # Solo procesar eventos de transacciones actualizadas a APPROVED
    if event != "transaction.updated" or status != "APPROVED":
        return {"status": "ignored", "reason": f"event={event}, status={status}"}

    if not reference:
        return {"status": "error", "message": "reference faltante"}

    # Buscar transacción en BD (NO confiar en metadata del payload)
    transaccion = db.query(models.TransaccionWompi).filter(
        models.TransaccionWompi.reference == reference
    ).first()

    if not transaccion:
        return {"status": "error", "message": "Transacción no encontrada"}

    # Idempotencia: no procesar si ya está completada
    if transaccion.estado == "completada":
        return {"status": "already_processed", "pedido_id": transaccion.pedido_id}

    # Obtener tienda desde la transacción guardada
    tienda = db.query(models.Tienda).filter(
        models.Tienda.id == transaccion.tienda_id
    ).first()

    if not tienda:
        return {"status": "error", "message": "Tienda no encontrada"}

    # Usar datos guardados en la transacción (no confiar en metadata del payload)
    datos_cliente = transaccion.datos_cliente or {}
    cliente_nombre = datos_cliente.get("nombre", "Cliente")
    cliente_email = datos_cliente.get("email", "")
    cliente_telefono = datos_cliente.get("telefono", "")
    direccion_envio = datos_cliente.get("direccion", "")
    items_data = transaccion.items_json or []

    # Descontar stock con bloqueo pesimista
    items_validados = []
    total = 0

    for item in items_data:
        producto = db.query(models.Producto).filter(
            models.Producto.id == item.get("producto_id"),
            models.Producto.tienda_id == transaccion.tienda_id
        ).with_for_update().first()

        if not producto:
            continue

        if producto.stock < item.get("cantidad", 1):
            continue

        producto.stock -= item.get("cantidad", 1)
        total += producto.precio * item.get("cantidad", 1)

        items_validados.append({
            "producto_id": item.get("producto_id"),
            "producto_nombre": item.get("producto_nombre"),
            "precio": producto.precio,
            "cantidad": item.get("cantidad", 1)
        })

    # Crear pedido
    db_pedido = models.Pedido(
        tienda_id=transaccion.tienda_id,
        cliente_nombre=cliente_nombre,
        cliente_email=cliente_email,
        cliente_telefono=cliente_telefono,
        direccion_envio=direccion_envio,
        total=total,
        estado="pendiente",
        estado_pago="pagado",
        notas=f"Wompi Transaction ID: {transaction_id}"
    )
    db.add(db_pedido)
    db.flush()

    for item_val in items_validados:
        db_item = models.PedidoItem(
            pedido_id=db_pedido.id,
            producto_id=item_val["producto_id"],
            producto_nombre=item_val["producto_nombre"],
            precio=item_val["precio"],
            cantidad=item_val["cantidad"]
        )
        db.add(db_item)

    # Actualizar transacción como completada
    transaccion.estado = "completada"
    transaccion.pedido_id = db_pedido.id

    db.commit()

    logger.info(f"Pedido created successfully: {db_pedido.id} (transaction: {reference})")

    return {"status": "success", "pedido_id": db_pedido.id}


@router.get("/check-transaction/{transaction_id}")
def verificar_transaccion(transaction_id: str, db: Session = Depends(get_db)):
    """
    Verifica el estado de una transacción de Wompi.
    NOTE: El frontend DEBE usar el webhook para confirmar pagos. Este endpoint es solo para polling.
    """
    # Buscar transacción por reference (que en Wompi es el transaction_id interno)
    transaccion = db.query(models.TransaccionWompi).filter(
        models.TransaccionWompi.reference == transaction_id
    ).first()

    if not transaccion:
        return {
            "transactionId": transaction_id,
            "status": "not_found",
            "message": "Transacción no encontrada"
        }

    # Mapear estados internos a estados Wompi
    estado_map = {
        "pendiente": "PENDING",
        "completada": "APPROVED",
        "fallida": "DECLINED"
    }

    return {
        "transactionId": transaction_id,
        "status": estado_map.get(transaccion.estado, "UNKNOWN"),
        "pedidoId": transaccion.pedido_id,
        "message": f"Estado: {transaccion.estado}"
    }