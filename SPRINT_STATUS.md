# SPRINT_STATUS.md — Tablero de Control

## Proyecto: Tienda de Camisetas MVP

### Estado Global: 🟢 SPRINT 01 COMPLETADO → 🟡 EN PROGRESO (Sprint 02)

| Sprint | Nombre | Estado | DoD Firmado | QA | Review | Merge |
|--------|--------|--------|-------------|-----|--------|-------|
| 01 | Fundación | ✅ COMPLETADO | ✅ | ✅ | ✅ | ✅ |
| 02 | Catálogo | 🔄 EN PROGRESO | ❌ | ❌ | ❌ | ❌ |
| 03 | Carrito y Checkout | ⏳ PENDIENTE | ❌ | ❌ | ❌ | ❌ |
| 04 | Panel Administrativo | ⏳ PENDIENTE | ❌ | ❌ | ❌ | ❌ |
| 05 | Integraciones | ⏳ PENDIENTE | ❌ | ❌ | ❌ | ❌ |
| 06 | Calidad, Seguridad y Despliegue | ⏳ PENDIENTE | ❌ | ❌ | ❌ | ❌ |

### Sprint 01 — Fundación ✅ COMPLETADO

**Objetivo**: Dejar lista la base técnica y de datos del MVP.

**Entregables**:
- 14 tablas PostgreSQL + 5 ENUMs + 3 vistas + datos semilla
- 7 endpoints FastAPI (health, auth, checkout, orders, stock, payments, catalog)
- Next.js con separación pública/admin, AuthGuard, login JWT
- Docker Compose (db + api + web) + scripts de inicialización
- Documentación de desarrollo (DEV_SETUP.md)

**DoD Verificado**:
- [x] Stack base configurado (Next.js + FastAPI + PostgreSQL)
- [x] Migraciones principales creadas (14 tablas)
- [x] Auth admin operativa (JWT con rol admin)
- [x] Rutas /admin protegidas (AuthGuard + get_current_admin)
- [x] Endpoints base creados (6 sensibles + 1 público)
- [x] Storage de imágenes preparado (Supabase Storage)

### Sprint 02 — Catálogo 🔄 EN PROGRESO

**Prioridad**: Iniciar inmediatamente.

### Historial de Cambios
- 2026-06-06 08:51: Sprint 01 inicia BUILD. Tablero creado.
- 2026-06-06 09:15: BUILD completado (4 ramas, 88+ archivos).
- 2026-06-06 09:25: QA encontró 3 bloqueos (modelos, seed, login).
- 2026-06-06 09:35: Los 3 bloqueos corregidos y verificados.
- 2026-06-06 09:40: REVIEW aprobado tras re-revisión.
- 2026-06-06 09:50: MERGE: 4 ramas integradas a master.
- 2026-06-06 09:52: Sprint 01 COMPLETADO. Sprint 02 iniciado.
