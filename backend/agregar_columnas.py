#!/usr/bin/env python3
"""
Script para agregar las nuevas columnas a la base de datos existente.
Ejecutar: python agregar_columnas.py
"""
import sys
import os

# Get absolute path to db folder
backend_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(backend_dir, "db", "usuarios.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"

print(f"DB Path: {db_path}")
print(f"DB URL: {SQLALCHEMY_DATABASE_URL}")

from sqlalchemy import create_engine, text

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

def agregar_columnas():
    with engine.connect() as conn:
        # Verificar si la columna ya existe
        result = conn.execute(text("PRAGMA table_info(usuarios)"))
        columnas = [row[1] for row in result]
        
        if "tienda_id" not in columnas:
            print("Agregando columna 'tienda_id' a tabla 'usuarios'...")
            conn.execute(text("ALTER TABLE usuarios ADD COLUMN tienda_id INTEGER REFERENCES tiendas(id)"))
            conn.commit()
            print("✓ Columna 'tienda_id' agregada a 'usuarios'")
        else:
            print("✓ Columna 'tienda_id' ya existe en 'usuarios'")
        
        # Verificar tiendas
        result = conn.execute(text("PRAGMA table_info(tiendas)"))
        columnas_tiendas = [row[1] for row in result]
        
        if "manager_id" not in columnas_tiendas:
            print("Agregando columna 'manager_id' a tabla 'tiendas'...")
            conn.execute(text("ALTER TABLE tiendas ADD COLUMN manager_id INTEGER REFERENCES usuarios(id)"))
            conn.commit()
            print("✓ Columna 'manager_id' agregada a 'tiendas'")
        else:
            print("✓ Columna 'manager_id' ya existe en 'tiendas'")
        
        print("\n✓ Proceso completado exitosamente!")

if __name__ == "__main__":
    agregar_columnas()
