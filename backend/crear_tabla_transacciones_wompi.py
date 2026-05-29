"""
Migración para crear tabla transacciones_wompi
Ejecutar: python crear_tabla_transacciones_wompi.py
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "db", "usuarios.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Crear tabla transacciones_wompi
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transacciones_wompi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reference TEXT UNIQUE NOT NULL,
            tienda_id INTEGER NOT NULL,
            estado TEXT DEFAULT 'pendiente',
            datos_cliente TEXT,
            items_json TEXT,
            total INTEGER NOT NULL,
            pedido_id INTEGER,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (tienda_id) REFERENCES tiendas(id),
            FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
        )
    """)
    
    # Crear índice en reference para búsquedas rápidas
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_transacciones_reference 
        ON transacciones_wompi(reference)
    """)
    
    # Crear índice en tienda_id
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_transacciones_tienda 
        ON transacciones_wompi(tienda_id)
    """)
    
    conn.commit()
    conn.close()
    print("Tabla transacciones_wompi creada exitosamente")

if __name__ == "__main__":
    migrate()
