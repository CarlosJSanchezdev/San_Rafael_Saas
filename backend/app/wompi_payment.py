import os
import hashlib
import uuid
import json
from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from .database import get_db
from . import models, schemas
from typing import Optional
from pydantic import BaseModel
import html
import re

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
                detail=f"Producto {item.producto_id} no encontrado en esta tienda"
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
        "redirectUrl": f"/t/{tienda.subdominio}/checkout"
    }


class WompiWebhookData(BaseModel):
    event: str
    data: dict


@router.post("/webhooks/wompi")
async def webhook_wompi(request: Request, db: Session = Depends(get_db)):
    """
    Webhook que Wompi llama para notificar eventos de pago.
    """
    try:
        payload = await request.json()
    except Exception:
        return {"status": "error", "message": "Payload inválido"}

    event = payload.get("event")
    transaction_data = payload.get("data", {})
    transaction_id = transaction_data.get("id")
    reference = transaction_data.get("reference")
    status = transaction_data.get("status")

    print(f"Wompi webhook recibido: event={event}, transaction_id={transaction_id}, reference={reference}, status={status}")

    if event == "transaction.updated" and status == "APPROVED":
        metadata = transaction_data.get("metadata", {})
        tienda_id = metadata.get("tienda_id")
        
        if not tienda_id:
            return {"status": "error", "message": "tienda_id no encontrado en metadata"}

        cliente_nombre = metadata.get("cliente_nombre", "Cliente")
        cliente_email = metadata.get("cliente_email", "")
        cliente_telefono = metadata.get("cliente_telefono", "")
        direccion_envio = metadata.get("direccion_envio", "")
        
        items_data = metadata.get("items", "[]")
        if isinstance(items_data, str):
            try:
                items_data = json.loads(items_data)
            except:
                items_data = []

        items_validados = []
        total = 0

        for item in items_data:
            producto = db.query(models.Producto).filter(
                models.Producto.id == item.get("producto_id"),
                models.Producto.tienda_id == tienda_id
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

        db_pedido = models.Pedido(
            tienda_id=tienda_id,
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

        db.commit()
        print(f"Pedido creado exitosamente: {db_pedido.id}")

    return {"status": "ok"}


@router.get("/check-transaction/{transaction_id}")
def verificar_transaccion(transaction_id: str, db: Session = Depends(get_db)):
    """
    Verifica el estado de una transacción de Wompi.
    El frontend puede usar esto para polling si el webhook falla.
    """
    return {
        "transactionId": transaction_id,
        "status": "pending",
        "message": "Usa el webhook para confirmar pagos"
    }