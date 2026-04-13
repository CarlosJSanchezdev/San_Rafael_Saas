#!/bin/bash

# ============================================================================
# SRF - Script de Pruebas de Seguridad
# Uso: bash security_test.sh
# ============================================================================

BASE_URL="http://localhost:8000"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "SRF - Pruebas de Seguridad"
echo "========================================"

# Colores para resultados
PASS() { echo -e "${GREEN}[PASS]${NC} $1"; }
FAIL() { echo -e "${RED}[FAIL]${NC} $1"; }
WARN() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

# Obtener token de prueba (ajustar credenciales)
echo ""
echo "=== OBTENIENDO TOKEN DE PRUEBA ==="

# Intentar login
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@srf.com&password=admin123")

echo "Response: $LOGIN_RESPONSE"

# Extraer token (ajustar según respuesta)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  WARN "No se pudo obtener token automático"
  echo "Por favor, proporciona un token válido:"
  read -p "Token: " TOKEN
fi

echo "Token: ${TOKEN:0:20}..."

# ============================================================================
# PRUEBA 1: SQL Injection en Login
# ============================================================================
echo ""
echo "=== TC-AUTH-001: SQL Injection en Login ==="

RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin'--&password=wrong")

if echo "$RESPONSE" | grep -qi "sql\|syntax\|error"; then
  FAIL "Posible SQL Injection detectada"
else
  PASS "Login protegido contra SQL Injection básica"
fi

# ============================================================================
# PRUEBA 2: Enumeración de Usuarios
# ============================================================================
echo ""
echo "=== TC-AUTH-002: Enumeración de Usuarios ==="

RESPONSE1=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=noexiste@test.com&password=wrong")

RESPONSE2=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@srf.com&password=wrong")

if [ "$RESPONSE1" = "$RESPONSE2" ]; then
  PASS "Mensajes de error genéricos (no revela usuarios)"
else
  FAIL "Mensajes de error diferentes (puede revelar usuarios)"
fi

# ============================================================================
# PRUEBA 3: Verificar que /pedidos requiere autenticación
# ============================================================================
echo ""
echo "=== TC-API-001: Acceso sin Autenticación ==="

RESPONSE=$(curl -s -X GET "$BASE_URL/pedidos")

if echo "$RESPONSE" | grep -qi "detail\|unauthorized\|401"; then
  PASS "Endpoints protegidos correctamente"
else
  FAIL "Posible acceso sin autenticación"
fi

# ============================================================================
# PRUEBA 4: Verificar Aislamiento de Tiendas
# ============================================================================
echo ""
echo "=== TC-IDOR-001: Aislamiento de Tiendas ==="

# Intentar acceder a productos sin filtro de tienda
RESPONSE=$(curl -s -X GET "$BASE_URL/productos" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -qi "tienda_id"; then
  WARN "La respuesta puede incluir tienda_id - verificar aislamiento"
else
  PASS "Respuesta no revela tienda_id explícitamente"
fi

# ============================================================================
# PRUEBA 5: SQL Injection en Productos
# ============================================================================
echo ""
echo "=== TC-SQLI-001: SQL Injection en Productos ==="

RESPONSE=$(curl -s -X GET "$BASE_URL/productos?tienda_id=1' OR '1'='1" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -qi "sql\|syntax\|error\|500"; then
  FAIL "Posible SQL Injection en productos"
else
  PASS "Productos protegido contra SQL Injection básica"
fi

# ============================================================================
# PRUEBA 6: XSS en Búsqueda
# ============================================================================
echo ""
echo "=== TC-XSS-001: XSS en Búsqueda ==="

RESPONSE=$(curl -s -X GET "$BASE_URL/productos?busqueda=<script>alert(1)</script>" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -qi "<script>"; then
  FAIL "Posible XSS en búsqueda"
else
  PASS "Búsqueda protegida contra XSS básica"
fi

# ============================================================================
# PRUEBA 7: Verificar Headers de Seguridad
# ============================================================================
echo ""
echo "=== TC-SEC-001: Headers de Seguridad ==="

RESPONSE=$(curl -s -I "$BASE_URL/docs")

if echo "$RESPONSE" | grep -qi "X-Frame-Options"; then
  PASS "Header X-Frame-Options presente"
else
  WARN "Header X-Frame-Options no encontrado"
fi

if echo "$RESPONSE" | grep -qi "X-Content-Type-Options"; then
  PASS "Header X-Content-Type-Options presente"
else
  WARN "Header X-Content-Type-Options no encontrado"
fi

# ============================================================================
# PRUEBA 8: Rate Limiting
# ============================================================================
echo ""
echo "=== TC-API-002: Rate Limiting ==="

COUNT=0
for i in {1..20}; do
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/productos")
  if [ "$RESPONSE" = "200" ]; then
    COUNT=$((COUNT+1))
  fi
done

if [ $COUNT -eq 20 ]; then
  WARN "No se detectó rate limiting (20 requests exitosos)"
else
  PASS "Rate limiting activo (solo $COUNT/20 requests exitosos)"
fi

# ============================================================================
# PRUEBA 9: Verificar que usuarios no puedan crear otros usuarios
# ============================================================================
echo ""
echo "=== TC-AUTH-003: Creación de Usuarios sin Permiso ==="

RESPONSE=$(curl -s -X POST "$BASE_URL/usuarios" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"nombre": "Hacker", "email": "hacker@test.com", "password": "hack123", "rol": "admin"}')

if echo "$RESPONSE" | grep -qi "403\|unauthorized\|forbidden"; then
  PASS "Creación de usuarios protegida"
else
  WARN "Permisos de creación de usuarios deben verificarse"
fi

# ============================================================================
# RESUMEN
# ============================================================================
echo ""
echo "========================================"
echo "RESUMEN DE PRUEBAS"
echo "========================================"
echo ""
echo "Las pruebasabove son básicas. Para pruebas"
echo "más exhaustivas, usar OWASP ZAP o Burp Suite."
echo ""
echo "Documentación completa: SECURITY_TESTS.md"
echo ""

# ============================================================================
# INSTRUCCIONES PARA PRUEBAS MANUALES
# ============================================================================

cat << 'EOF'

═══════════════════════════════════════════════════════════════════════════════
                           PRUEBAS MANUALES ADICIONALES
═══════════════════════════════════════════════════════════════════════════════

1. PRICE MANIPULATION (Manipulación de Precio)
   - Interceptar request POST /pedidos
   - Modificar "precio" a 0.01
   - Verificar que el servidor rechaza o usa precio de BD

2. CROSS-TENANT ACCESS (Acceso Multi-tenant)
   - Login como usuario de tienda 1
   - Intentar crear/ver pedidos de tienda 2
   - Debe retornar 403 Forbidden

3. RACE CONDITION (Condición de Carrera)
   - Producto con stock: 1
   - Enviar 10 requests simultáneos
   - Solo 1 debe ser exitoso

4. PAYMENT SECURITY (Cuando se implemente)
   - Verificar firmas de webhooks
   - Probar replay attacks
   - Validar merchant_id

═══════════════════════════════════════════════════════════════════════════════

EOF
