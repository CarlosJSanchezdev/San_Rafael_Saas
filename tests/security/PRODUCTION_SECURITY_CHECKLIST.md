# SRF - Checklist de Seguridad para Producción

## Fase 1: Autenticación y Sesión

| # | Requisito | Estado | Notas |
|---|-----------|--------|-------|
| 1.1 | Tokens con expiración (< 24h) | ⬜ | |
| 1.2 | Contraseñas hasheadas con bcrypt | ⬜ | |
| 1.3 | Validación de fortaleza de contraseña | ⬜ | Mínimo 8 caracteres |
| 1.4 | Bloqueo tras intentos fallidos | ⬜ | 5 intentos = 15 min bloqueo |
| 1.5 | Mensajes de error genéricos | ⬜ | No revelar usuarios |
| 1.6 | Invalidación de sesiones anteriores | ⬜ | Una sesión por usuario |
| 1.7 | HTTPS obligatorio para login | ⬜ | |
| 1.8 | Token refresh seguro | ⬜ | |

## Fase 2: Autorización y Control de Acceso

| # | Requisito | Estado | Notas |
|---|-----------|--------|-------|
| 2.1 | Verificar ownership de recursos | ⬜ | |
| 2.2 | Aislamiento multi-tenant | ⬜ | |
| 2.3 | RBAC implementado | ⬜ | admin/manager/usuario |
| 2.4 | Acceso a datos solo del propio tenant | ⬜ | |
| 2.5 | Verificar permisos en cada endpoint | ⬜ | |

## Fase 3: Validación de Datos

| # | Requisito | Estado | Notas |
|---|-----------|--------|-------|
| 3.1 | Sanitización de inputs (SQLi) | ⬜ | |
| 3.2 | Sanitización de inputs (XSS) | ⬜ | |
| 3.3 | Validación en servidor (no confiar en cliente) | ⬜ | |
| 3.4 | Parámetros preparados (SQL) | ⬜ | |
| 3.5 | Allowlist de campos aceptados | ⬜ | |
| 3.6 | Validación de tipos de datos | ⬜ | |

## Fase 4: APIs

| # | Requisito | Estado | Notas |
|---|-----------|--------|-------|
| 4.1 | Rate limiting implementado | ⬜ | |
| 4.2 | Limit por IP y por usuario | ⬜ | |
| 4.3 | Timeout en requests largos | ⬜ | |
| 4.4 | Validar Content-Type | ⬜ | |
| 4.5 | CORS configurado correctamente | ⬜ | |
| 4.6 | Limit de tamaño de request | ⬜ | |
| 4.7 | Headers de seguridad | ⬜ | CSP, HSTS, etc. |

## Fase 5: Datos

| # | Requisito | Estado | Notas |
|---|-----------|--------|-------|
| 5.1 | No exponer datos sensibles en logs | ⬜ | |
| 5.2 | No exponer datos de otros tenants | ⬜ | |
| 5.3 | Datos sensibles encriptados en BD | ⬜ | |
| 5.4 | Backups encriptados | ⬜ | |
| 5.5 | Conexiones BD encriptadas | ⬜ | |

## Fase 6: Módulo de Pagos (Cuando se implemente)

| # | Requisito | Estado | Notas |
|---|-----------|--------|-------|
| 6.1 | Validación de firmas de webhooks | ⬜ | |
| 6.2 | Prevenir replay attacks | ⬜ | |
| 6.3 | No almacenar datos de tarjetas | ⬜ | |
| 6.4 | Usar tokenización del proveedor | ⬜ | |
| 6.5 | Validar merchant_id en requests | ⬜ | |
| 6.6 | Validar monto contra pedido | ⬜ | |
| 6.7 | Idempotency keys | ⬜ | |
| 6.8 | Webhooks sobre HTTPS | ⬜ | |

## Fase 7: Configuración del Servidor

| # | Requisito | Estado | Notas |
|---|-----------|--------|-------|
| 7.1 | HTTPS forzado | ⬜ | |
| 7.2 | HSTS implementado | ⬜ | |
| 7.3 | X-Frame-Options: DENY | ⬜ | |
| 7.4 | X-Content-Type-Options: nosniff | ⬜ | |
| 7.5 | Content-Security-Policy | ⬜ | |
| 7.6 | X-XSS-Protection | ⬜ | |
| 7.7 | Logs de auditoría | ⬜ | |
| 7.8 | Backups automáticos | ⬜ | |
| 7.9 | Firewall configurado | ⬜ | |
| 7.10 | Actualizaciones de seguridad | ⬜ | |

## Fase 8: Upload de Archivos (Si aplica)

| # | Requisito | Estado | Notas |
|---|-----------|--------|-------|
| 8.1 | Validar tipo MIME | ⬜ | |
| 8.2 | Validar extensión de archivo | ⬜ | |
| 8.3 | Limitar tamaño de archivo | ⬜ | |
| 8.4 | Almacenar fuera de webroot | ⬜ | |
| 8.5 | Renombrar archivos subidos | ⬜ | |
| 8.6 | Escanear en busca de malware | ⬜ | |

---

## Checklist de testing antes de producción

### Pruebas de Penetración
- [ ] OWASP ZAP Baseline Scan
- [ ] Manual testing de inyección
- [ ] Testing de autenticación
- [ ] Testing de autorización
- [ ] Testing de APIs rest
- [ ] Testing de configuración

### Documentación
- [ ] Política de seguridad
- [ ] Procedimiento de respuesta a incidentes
- [ ] Registro de vulnerabilidades
- [ ] Manual de seguridad para devs

---

## Notas de Seguridad Críticas

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    IMPLEMENTAR ANTES DE PRODUCCIÓN                    ║
╠══════════════════════════════════════════════════════════════════════════╣
║ 1. Rate Limiting en todas las APIs                                    ║
║ 2. Validación de precios en servidor (NO confiar en cliente)          ║
║ 3. Aislamiento multi-tenant (CRÍTICO)                                 ║
║ 4. Sanitización de todos los inputs                                   ║
║ 5. HTTPS obligatorio                                                   ║
║ 6. Headers de seguridad                                               ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

**Fecha de creación**: 2026-03-09
**Última actualización**: 2026-03-09
**Responsable**: Equipo de Desarrollo SRF
