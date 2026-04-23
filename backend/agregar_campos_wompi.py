"""
Script para agregar columnas de Wompi a la tabla tiendas.
Ejecutar: python agregar_campos_wompi.py
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "db", "usuarios.db")

def agregar_columnas_wompi():
    if not os.path.exists(DB_PATH):
        print(f"❌ Base de datos no encontrada: {DB_PATH}")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Verificar columnas existentes
    cursor.execute("PRAGMA table_info(tiendas)")
    columns = [col[1] for col in cursor.fetchall()]
    
    nuevos_campos = []
    
    if "wompi_public_key" not in columns:
        cursor.execute("ALTER TABLE tiendas ADD COLUMN wompi_public_key TEXT")
        nuevos_campos.append("wompi_public_key")
        print("✅ Columna wompi_public_key agregada")
    else:
        print("ℹ️  Columna wompi_public_key ya existe")
    
    if "wompi_integrity_secret" not in columns:
        cursor.execute("ALTER TABLE tiendas ADD COLUMN wompi_integrity_secret TEXT")
        nuevos_campos.append("wompi_integrity_secret")
        print("✅ Columna wompi_integrity_secret agregada")
    else:
        print("ℹ️  Columna wompi_integrity_secret ya existe")
    
    if "wompi_activo" not in columns:
        cursor.execute("ALTER TABLE tiendas ADD COLUMN wompi_activo INTEGER DEFAULT 0")
        nuevos_campos.append("wompi_activo")
        print("✅ Columna wompi_activo agregada")
    else:
        print("ℹ️  Columna wompi_activo ya existe")
    
    conn.commit()
    conn.close()
    
    if nuevos_campos:
        print(f"\n✅ Columnas agregadas: {', '.join(nuevos_campos)}")
    else:
        print("\nℹ️  No se agregaron columnas - ya existen")

if __name__ == "__main__":
    agregar_columnas_wompi()