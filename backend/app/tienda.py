from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .database import get_db
from . import models
from typing import List

router = APIRouter()

# NOTA: Los endpoints globales de productos (/tienda/productos, /tienda/categorias)
# han sido eliminados para evitar la exposición de productos entre tiendas.
# Cada tienda es accesible únicamente mediante su ruta pública: /t/:subdominio
