#!/usr/bin/env python3
"""
Script para asignar usuario como manager de tienda
"""
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(backend_dir, "db", "usuarios.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"

from sqlalchemy import create_engine, text

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

def asignar_manager():
    with engine.connect() as conn:
        # Buscar usuario
        result = conn.execute(text("SELECT id, nombre, email, rol, tienda_id FROM usuarios WHERE email = 'usuario@usuariotest.com'"))
        usuario = result.fetchone()
        
        if usuario:
            print(f"Usuario encontrado: ID={usuario[0]}, Email={usuario[2]}, Rol={usuario[3]}, Tienda_ID={usuario[4]}")
        else:
            print("Usuario NO encontrado")
            
        # Buscar tienda 5
        result = conn.execute(text("SELECT id, nombre, subdominio, manager_id FROM tiendas WHERE id = 5"))
        tienda = result.fetchone()
        
        if tienda:
            print(f"Tienda encontrada: ID={tienda[0]}, Nombre={tienda[1]}, Manager_ID={tienda[3]}")
        else:
            print("Tienda NO encontrada")
            
        # Asignar usuario como manager de tienda 5
        if usuario and tienda:
            conn.execute(text(f"UPDATE usuarios SET tienda_id = 5, rol = 'manager' WHERE id = {usuario[0]}"))
            conn.execute(text(f"UPDATE tiendas SET manager_id = {usuario[0]} WHERE id = 5"))
            conn.commit()
            print(f"\n✓ Usuario {usuario[2]} asignado como manager de tienda 5")
            
            # Verificar asignación
            result = conn.execute(text(f"SELECT id, nombre, email, rol, tienda_id FROM usuarios WHERE id = {usuario[0]}"))
            usuario_actualizado = result.fetchone()
            print(f"\nUsuario actualizado: {usuario_actualizado}")
            
            result = conn.execute(text("SELECT id, nombre, subdominio, manager_id FROM tiendas WHERE id = 5"))
            tienda_actualizada = result.fetchone()
            print(f"Tienda actualizada: {tienda_actualizada}")
        else:
            print("\nNo se pudo completar la asignación")

if __name__ == "__main__":
    asignar_manager()
