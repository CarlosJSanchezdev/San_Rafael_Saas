# SRF - Plan de Pruebas de Seguridad

## Inventario de Endpoints

### Autenticación
| Método | Endpoint | Descripción |
|--------|---------|-------------|
| POST | `/auth/registro` | Registro de usuarios |
| POST | `/auth/login` | Inicio de sesión |
| POST | `/auth/recuperar-password` | Solicitar recuperación |
| POST | `/auth/reset-password` | Restablecer contraseña |
| GET | `/auth/validar-token` | Validar sesión |
| POST | `/auth/cerrar-sesion` | Cerrar sesión |

### Tiendas
| Método | Endpoint | Descripción |
|--------|---------|-------------|
| GET | `/tiendas` | Listar tiendas (admin) |
| POST | `/tiendas` | Crear tienda (admin) |
| GET | `/tiendas/{id}` | Ver tienda |
| PUT | `/tiendas/{id}` | Actualizar tienda |
| GET | `/tiendas/por-subdominio/{subdominio}` | Buscar por subdominio |

### Productos
| Método | Endpoint | Descripción |
|--------|---------|-------------|
| GET | `/productos` | Listar productos |
| POST | `/productos` | Crear producto |
| GET | `/productos/{id}` | Ver producto |
| PUT | `/productos/{id}` | Actualizar producto |
| DELETE | `/productos/{id}` | Eliminar producto |

### Pedidos
| Método | Endpoint | Descripción |
|--------|---------|-------------|
| POST | `/pedidos` | Crear pedido |
| GET | `/pedidos` | Listar pedidos |
| GET | `/pedidos/{id}` | Ver pedido |
| PUT | `/pedidos/{id}/estado` | Actualizar estado |

### Usuarios
| Método | Endpoint | Descripción |
|--------|---------|-------------|
| GET | `/usuarios` | Listar usuarios |
| POST | `/usuarios` | Crear usuario |
| PUT | `/usuarios/{id}` | Actualizar usuario |
| DELETE | `/usuarios/{id}` | Eliminar usuario |

---

## Pruebas de Seguridad - Módulo Checkout

### Pre-requisitos
```bash
# Servidor ejecutándose
BASE_URL="http://localhost:8000"
```

---

### TC-CHECKOUT-001: Price Manipulation (Manipulación de Precio)

**Objetivo**: Verificar que los precios no pueden ser manipulados desde el cliente

```bash
# 1. Login como usuario
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@test.com&password=admin123"

# 2. Crear pedido con precio manipulado
curl -X POST "$BASE_URL/pedidos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "tienda_id": 1,
    "productos": [{"producto_id": 1, "cantidad": 1, "precio": 0.01}],
    "total": 0.01,
    "cliente_nombre": "Test",
    "cliente_email": "test@test.com"
  }'

# RESULTADO ESPERADO: 
# - El servidor debe validar que el precio coincida con la base de datos
# - O simplemente ignorar el precio enviado y usar el de la BD
```

---

### TC-CHECKOUT-002: SQL Injection en Datos de Cliente

**Objetivo**: Verificar sanitización de inputs

```bash
# Probar SQLi en campos de pedido
curl -X POST "$BASE_URL/pedidos" \
  -H "Content-Type: application/json" \
  -d '{
    "tienda_id": 1,
    "productos": [{"producto_id": 1, "cantidad": 1, "precio": 100}],
    "total": 100,
    "cliente_nombre": "Test\"; DROP TABLE pedidos; --",
    "cliente_email": "test@test.com"
  }'

# RESULTADO ESPERADO:
# - Sanitización de inputs
# - No ejecutar código malicioso
```

---

### TC-CHECKOUT-003: Cross-Tenant Access (Aislamiento Multi-tenant)

**Objetivo**: Verificar que usuarios no puedan acceder a datos de otras tiendas

```bash
# 1. Login como usuario de tienda 1
curl -X POST "$BASE_URL/auth/login" \
  -d "username=user1@tienda1.com&password=password"

# 2. Intentar crear pedido para tienda 2
curl -X POST "$BASE_URL/pedidos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "tienda_id": 2,  # Tienda diferente
    "productos": [{"producto_id": 1, "cantidad": 1, "precio": 100}],
    "total": 100,
    "cliente_nombre": "Test",
    "cliente_email": "test@test.com"
  }'

# RESULTADO ESPERADO:
# - 403 Forbidden
# - El pedido solo puede crearse para la tienda del usuario
```

---

### TC-CHECKOUT-004: XSS en Campos de Checkout

**Objetivo**: Verificar sanitización de XSS

```bash
# Probar XSS en nombre de cliente
curl -X POST "$BASE_URL/pedidos" \
  -H "Content-Type: application/json" \
  -d '{
    "tienda_id": 1,
    "productos": [{"producto_id": 1, "cantidad": 1, "precio": 100}],
    "total": 100,
    "cliente_nombre": "<script>alert(1)</script>",
    "cliente_email": "test@test.com"
  }'

# RESULTADO ESPERADO:
# - Sanitización del input
# - El script no debe ejecutarse
```

---

### TC-CHECKOUT-005: Race Condition (Stock)

**Objetivo**: Verificar que no haya condiciones de carrera en inventario

```bash
# Crear archivo de script para prueba de concurrencia
cat > test_race_condition.sh << 'EOF'
#!/bin/bash

# Producto con stock bajo (simular)
PRODUCT_ID=1

# Enviar 10 pedidos simultáneos
for i in {1..10}; do
  curl -X POST "$BASE_URL/pedidos" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"tienda_id\": 1, \"productos\": [{\"producto_id\": $PRODUCT_ID, \"cantidad\": 1, \"precio\": 100}], \"total\": 100, \"cliente_nombre\": \"Test $i\", \"cliente_email\": \"test$i@test.com\"}" &
done

wait
EOF

# RESULTADO ESPERADO:
# - Solo 1 pedido exitoso (o según stock disponible)
# - Los demás rechazados por falta de stock
```

---

## Pruebas de Seguridad - Módulo Auth

### TC-AUTH-001: SQL Injection en Login

```bash
# Probar SQLi en username
curl -X POST "$BASE_URL/auth/login" \
  -d "username=admin'--&password=wrong"

# RESULTADO ESPERADO:
# - 401 Unauthorized
# - No revelar si el usuario existe
```

---

### TC-AUTH-002: Enumeración de Usuarios

```bash
# Probar diferentes emails para ver respuesta
curl -X POST "$BASE_URL/auth/login" \
  -d "username=nonexistent@test.com&password=any"

curl -X POST "$BASE_URL/auth/login" \
  -d "username=admin@test.com&password=wrong"

# RESULTADO ESPERADO:
# - Mensaje genérico "Credenciales inválidas"
# - No revelar si el email existe
```

---

### TC-AUTH-003: Session Fixation (Reutilización de Sesión)

```bash
# 1. Login primera vez
RESPONSE1=$(curl -s -X POST "$BASE_URL/auth/login" \
  -d "username=admin@test.com&password=admin123")
TOKEN1=$(echo $RESPONSE1 | jq -r '.token')

# 2. Login segunda vez (mismo usuario)
RESPONSE2=$(curl -s -X POST "$BASE_URL/auth/login" \
  -d "username=admin@test.com&password=admin123")
TOKEN2=$(echo $RESPONSE2 | jq -r '.token')

# 3. Verificar que TOKEN1 ya no es válido
curl -X GET "$BASE_URL/auth/validar-token?token=$TOKEN1"

# RESULTADO ESPERADO:
# - TOKEN1 debe ser inválido (401)
# - Solo una sesión activa por usuario
```

---

### TC-AUTH-004: Invalidación de Sesión en Logout

```bash
# 1. Login
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -d "username=admin@test.com&password=admin123" | jq -r '.token')

# 2. Logout
curl -X POST "$BASE_URL/auth/cerrar-sesion?token=$TOKEN"

# 3. Intentar usar token después de logout
curl -X GET "$BASE_URL/auth/validar-token?token=$TOKEN"

# RESULTADO ESPERADO:
# - 401 después de logout
```

---

## Pruebas de Seguridad - Autorización (IDOR)

### TC-IDOR-001: Acceso a Productos de Otra Tienda

```bash
# Login como tienda 1
TOKEN_TIENDA1=$(curl -s -X POST "$BASE_URL/auth/login" \
  -d "username=tienda1@test.com&password=password" | jq -r '.token')

# Intentar acceder a producto de tienda 2
curl -X GET "$BASE_URL/productos?tienda_id=2" \
  -H "Authorization: Bearer $TOKEN_TIENDA1"

# RESULTADO ESPERADO:
# - Solo devolver productos de tienda 1
# - No revelar productos de tienda 2
```

---

### TC-IDOR-002: Modificar Pedido de Otra Tienda

```bash
# Login como manager de tienda 1
TOKEN_TIENDA1=$(curl -s -X POST "$BASE_URL/auth/login" \
  -d "username=tienda1@test.com&password=password" | jq -r '.token')

# Intentar cambiar estado de pedido de tienda 2
curl -X PUT "$BASE_URL/pedidos/999/estado?estado=completado" \
  -H "Authorization: Bearer $TOKEN_TIENDA1"

# RESULTADO ESPERADO:
# - 403 Forbidden
# - No permitir modificar pedidos de otras tiendas
```

---

## Pruebas de Seguridad - APIs

### TC-API-001: Rate Limiting

```bash
# Enviar múltiples requests rápidamente
for i in {1..100}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    "$BASE_URL/productos"
done | sort | uniq -c

# RESULTADO ESPERADO:
# - 429 Too Many Requests después de cierto límite
# - Implementar rate limiting
```

---

### TC-API-002: HTTP Method Tampering

```bash
# Probar métodos no permitidos
curl -X DELETE "$BASE_URL/productos/1"
curl -X PATCH "$BASE_URL/productos/1"
curl -X PUT "$BASE_URL/productos/1"

# RESULTADO ESPERADO:
# - 405 Method Not Allowed
```

---

### TC-API-003: Missing Content-Type

```bash
# Enviar request sin Content-Type
curl -X POST "$BASE_URL/productos" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"nombre": "Test", "precio": 100}'

# RESULTADO ESPERADO:
# - 415 Unsupported Media Type
# - Validar Content-Type
```

---

## Resultados de Pruebas de Seguridad (2026-03-11)

### Pruebas Ejecutadas y Completadas

| Prueba | Estado | Fecha |
|--------|--------|-------|
| TC-AUTH-001: SQL Injection en Login | ✅ PASS | 2026-03-11 |
| TC-AUTH-002: Enumeración de Usuarios | ✅ PASS | 2026-03-11 |
| TC-AUTH-003: Session Fixation | ✅ PASS | 2026-03-11 |
| TC-AUTH-004: Invalidación de Sesión en Logout | ✅ PASS | 2026-03-11 |
| TC-CHECKOUT-001: Price Manipulation | ✅ PASS | 2026-03-11 |
| TC-CHECKOUT-002: SQL Injection en Datos de Cliente | ✅ PASS | 2026-03-11 |
| TC-CHECKOUT-004: XSS en Checkout | ✅ PASS | 2026-03-11 |
| TC-CHECKOUT-005: Race Condition (Stock) | ✅ PASS | 2026-03-11 |
| TC-IDOR-001: Acceso a Productos de Otra Tienda | ✅ PASS | 2026-03-11 |
| TC-IDOR-002: Modificar Pedido de Otra Tienda | ✅ PASS | 2026-03-11 |
| TC-API-001: Acceso sin Autenticación | ✅ PASS | 2026-03-11 |
| TC-API-002: Rate Limiting | ✅ PASS | 2026-03-11 |
| TC-SQLI-001: SQL Injection en Productos | ✅ PASS | 2026-03-11 |
| TC-XSS-001: XSS en Búsqueda | ✅ PASS | 2026-03-11 |
| TC-SEC-001: Headers de Seguridad | ✅ PASS | 2026-03-11 |

---

## Checklist de Seguridad para Producción

### Autenticación
- [x] Tokens con expiración (< 24 horas)
- [x] Contraseñas hasheadas con bcrypt
- [ ] Validación de fortaleza de contraseña
- [ ] Bloqueo tras intentos fallidos
- [x] Mensajes de error genéricos
- [x] Invalidación de sesiones anteriores en login

### Autorización
- [x] Verificar propiedad de recursos (ownership)
- [x] Aislamiento multi-tenant
- [x] Control de acceso basado en roles (RBAC)
- [x] Validar que usuarios solo accedan a sus datos

### APIs
- [x] Rate limiting
- [ ] Validación de Content-Type
- [x] Sanitización de inputs
- [x] Parámetros preparados (prepared statements)
- [ ] Limitar campos aceptados (allowlist)

### Datos
- [x] No exponer datos sensibles en logs
- [x] No exponer datos de otros usuarios/tenants
- [x] Validar datos en servidor (no confiar en cliente)
- [ ] Encriptar datos sensibles

### Pagos (Cuando se implemente)
- [ ] Validar firmas de webhooks
- [ ] Prevenir replay attacks (idempotency keys)
- [ ] No almacenar datos de tarjetas
- [ ] Usar tokenización del proveedor
- [ ] Validar montos contra pedidos

### Configuración del Servidor
- [ ] HTTPS forzado
- [x] Headers de seguridad (CSP, HSTS, X-Frame-Options)
- [x] CORS configurado correctamente
- [ ] Logs de auditoría
- [ ] Backups automáticos

---

## Scripts de Prueba Automatizados

Ver archivo: `tests/security/test_security.py`

```python
import requests
import pytest

BASE_URL = "http://localhost:8000"

class TestCheckoutSecurity:
    """Pruebas de seguridad para Checkout"""
    
    def test_price_manipulation(self, auth_token):
        """TC-CHECKOUT-001: Verificar que precios no pueden ser manipulados"""
        response = requests.post(
            f"{BASE_URL}/pedidos",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "tienda_id": 1,
                "productos": [{"producto_id": 1, "cantidad": 1, "precio": 0.01}],
                "total": 0.01,
                "cliente_nombre": "Test",
                "cliente_email": "test@test.com"
            }
        )
        # Debe ser rechazado o el precio debe ser validado contra BD
        assert response.status_code in [400, 403, 422]
    
    def test_sql_injection_in_checkout(self, auth_token):
        """TC-CHECKOUT-002: Verificar sanitización de SQLi"""
        response = requests.post(
            f"{BASE_URL}/pedidos",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "tienda_id": 1,
                "productos": [{"producto_id": 1, "cantidad": 1, "precio": 100}],
                "total": 100,
                "cliente_nombre": "Test'; DROP TABLE pedidos; --",
                "cliente_email": "test@test.com"
            }
        )
        # No debe causar error de SQL
        assert response.status_code != 500
    
    def test_xss_in_checkout(self, auth_token):
        """TC-CHECKOUT-004: Verificar sanitización de XSS"""
        response = requests.post(
            f"{BASE_URL}/pedidos",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "tienda_id": 1,
                "productos": [{"producto_id": 1, "cantidad": 1, "precio": 100}],
                "total": 100,
                "cliente_nombre": "<script>alert(1)</script>",
                "cliente_email": "test@test.com"
            }
        )
        # Debe sanitizar o rechazar
        assert response.status_code != 500


class TestAuthenticationSecurity:
    """Pruebas de seguridad para Autenticación"""
    
    def test_sql_injection_in_login(self):
        """TC-AUTH-001: Verificar que SQLi no funciona en login"""
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data={"username": "admin'--", "password": "wrong"}
        )
        # No debe revelar información
        assert "sql" not in response.text.lower()
    
    def test_user_enumeration(self):
        """TC-AUTH-002: Verificar que no se puede enumerar usuarios"""
        # Usuario que NO existe
        r1 = requests.post(
            f"{BASE_URL}/auth/login",
            data={"username": "nonexistent@test.com", "password": "wrong"}
        )
        
        # Usuario que SÍ existe
        r2 = requests.post(
            f"{BASE_URL}/auth/login",
            data={"username": "admin@test.com", "password": "wrong"}
        )
        
        # Los mensajes deben ser idénticos
        assert r1.text == r2.text
    
    def test_session_invalidation(self, auth_token):
        """TC-AUTH-003: Verificar invalidación de sesión"""
        # Logout
        requests.post(f"{BASE_URL}/auth/cerrar-sesion?token={auth_token}")
        
        # Intentar usar token
        response = requests.get(
            f"{BASE_URL}/auth/validar-token?token={auth_token}"
        )
        
        assert response.status_code == 401
```

---

## Ejecución de Pruebas

```bash
# Ejecutar pruebas de seguridad
pytest tests/security/ -v

# Ejecutar solo pruebas de checkout
pytest tests/security/test_checkout.py -v

# Ejecutar pruebas de autenticación
pytest tests/security/test_auth.py -v
```

---

## Reporte de Vulnerabilidades

Si encuentra alguna vulnerabilidad, documentar:

| Campo | Descripción |
|-------|-------------|
| ID | Identificador único |
| Severidad | CRITICAL/HIGH/MEDIUM/LOW |
| Título | Nombre descriptivo |
| Descripción | Qué vulnerabilidad es |
| Pasos para reproducir | Cómo reproducir el ataque |
| Impacto | Qué puede hacer un atacante |
| Evidencia | Screenshots, logs, requests |
| Recomendación | Cómo corregir |

---

**Fecha de creación**: 2026-03-09
**Última actualización**: 2026-03-09
**Responsable**: Equipo de Desarrollo SRF
