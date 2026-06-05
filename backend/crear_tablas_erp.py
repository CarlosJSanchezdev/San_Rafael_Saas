"""
Migration: Create Inventario and Finanzas tables
Tables: movimientos_inventario, ingresos, egresos
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "db", "usuarios.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    # Create movimientos_inventario table
    if "movimientos_inventario" not in tables:
        cursor.execute("""
            CREATE TABLE movimientos_inventario (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tienda_id INTEGER NOT NULL,
                producto_id INTEGER,
                tipo TEXT NOT NULL CHECK(tipo IN ('entrada', 'salida')),
                cantidad INTEGER NOT NULL,
                motivo TEXT NOT NULL,
                referencia_id INTEGER,
                usuario_id INTEGER,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tienda_id) REFERENCES tiendas(id),
                FOREIGN KEY (producto_id) REFERENCES productos(id),
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
            )
        """)
        cursor.execute("CREATE INDEX idx_mov_inv_tienda ON movimientos_inventario(tienda_id)")
        cursor.execute("CREATE INDEX idx_mov_inv_producto ON movimientos_inventario(producto_id)")
        cursor.execute("CREATE INDEX idx_mov_inv_fecha ON movimientos_inventario(fecha_creacion)")
        print("✅ Created movimientos_inventario table")
    else:
        print("⚠️ movimientos_inventario already exists")
    
    # Create ingresos table
    if "ingresos" not in tables:
        cursor.execute("""
            CREATE TABLE ingresos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tienda_id INTEGER NOT NULL,
                tipo TEXT NOT NULL CHECK(tipo IN ('venta', 'manual')),
                pedido_id INTEGER,
                monto REAL NOT NULL,
                descripcion TEXT NOT NULL,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tienda_id) REFERENCES tiendas(id),
                FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
            )
        """)
        cursor.execute("CREATE INDEX idx_ingresos_tienda ON ingresos(tienda_id)")
        cursor.execute("CREATE INDEX idx_ingresos_fecha ON ingresos(fecha_creacion)")
        print("✅ Created ingresos table")
    else:
        print("⚠️ ingresos already exists")
    
    # Create egresos table
    if "egresos" not in tables:
        cursor.execute("""
            CREATE TABLE egresos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tienda_id INTEGER NOT NULL,
                tipo TEXT NOT NULL CHECK(tipo IN ('devolucion', 'alquiler', 'servicios', 'insumos')),
                monto REAL NOT NULL,
                descripcion TEXT NOT NULL,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tienda_id) REFERENCES tiendas(id)
            )
        """)
        cursor.execute("CREATE INDEX idx_egresos_tienda ON egresos(tienda_id)")
        cursor.execute("CREATE INDEX idx_egresos_fecha ON egresos(fecha_creacion)")
        print("✅ Created egresos table")
    else:
        print("⚠️ egresos already exists")
    
    conn.commit()
    conn.close()
    print("\n✅ Migration completed successfully!")

if __name__ == "__main__":
    migrate()