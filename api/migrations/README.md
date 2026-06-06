# Migraciones de Base de Datos — Tienda de Camisetas MVP

## Sprint 01: Fundación

### Orden de Ejecución

Las migraciones deben ejecutarse en el siguiente orden para respetar las dependencias:

| # | Archivo | Contenido |
|---|---------|-----------|
| 1 | `001_enums.sql` | Tipos ENUM para catálogos cerrados |
| 2 | `002_tables.sql` | Creación de las 14 tablas con constraints e índices |
| 3 | `003_views.sql` | Vistas de catálogo público |
| 4 | `004_seed.sql` | Datos semilla para desarrollo |

### Ejecución con psql

```bash
psql -h <host> -U <user> -d <database> -f api/migrations/001_enums.sql
psql -h <host> -U <user> -d <database> -f api/migrations/002_tables.sql
psql -h <host> -U <user> -d <database> -f api/migrations/003_views.sql
psql -h <host> -U <user> -d <database> -f api/migrations/004_seed.sql
```

### Ejecución con Supabase CLI

```bash
supabase db push
```

O mediante la UI de Supabase en **SQL Editor**, ejecutando cada archivo en orden.

---

## Resumen del Esquema

### Tablas (14 totales)

| # | Tabla | Descripción | Dependencias |
|---|-------|-------------|--------------|
| 1 | `categories` | Categorías de productos | — |
| 2 | `roles` | Catálogo de roles del sistema | — |
| 3 | `profiles` | Perfiles de usuario (1:1 con auth.users) | — |
| 4 | `products` | Productos del catálogo | `categories` |
| 5 | `product_variants` | Variantes (talla, color, SKU, precio, stock) | `products` |
| 6 | `product_images` | Imágenes de producto | `products`, `product_variants` |
| 7 | `user_roles` | Asignación de roles a perfiles (M:N) | `profiles`, `roles` |
| 8 | `customer_addresses` | Direcciones de envío | `profiles` |
| 9 | `orders` | Órdenes de compra | `profiles` |
| 10 | `order_items` | Líneas de orden (snapshot) | `orders`, `products`, `product_variants` |
| 11 | `payments` | Pagos asociados a órdenes | `orders`, `profiles` |
| 12 | `payment_events` | Historial de eventos de pago | `payments`, `profiles` |
| 13 | `stock_adjustments` | Trazabilidad de inventario | `product_variants`, `orders`, `profiles` |
| 14 | `order_status_history` | Auditoría de cambios de estado | `orders`, `profiles` |

### Vistas (3)

| # | Vista | Descripción |
|---|-------|-------------|
| 1 | `v_active_products` | Productos activos visibles al público |
| 2 | `v_active_variants` | Variantes activas con stock disponible |
| 3 | `v_product_gallery` | Galería de imágenes ordenada |

### Datos Semilla

| Entidad | Cantidad | Detalle |
|---------|----------|---------|
| Roles | 2 | `admin`, `customer` |
| Perfiles | 1 | Admin con `auth_user_id` fijo para desarrollo |
| User Roles | 1 | Admin asignado al perfil admin |
| Categorías | 1 | "Camisetas" (`slug: camisetas`) |
| Productos | 2 | Camiseta Negra Básica, Camiseta Blanca con Logo |
| Variantes | 8 | 4 tallas por cada producto |
| Imágenes | 3 | 2 para Camiseta Negra, 1 para Camiseta Blanca |

### Convenciones del Esquema

- **Claves primarias**: `UUID` generadas con `gen_random_uuid()`
- **Fechas**: `TIMESTAMPTZ` (UTC)
- **Montos**: `INTEGER` en centavos (ej: S/39.90 = 3990)
- **Moneda**: `PEN` por defecto
- **Soft delete**: `deleted_at` en tablas de catálogo y perfiles
- **Integridad transaccional**: `ON DELETE RESTRICT` en `order_items`, `payments`, `payment_events`, `stock_adjustments`, `order_status_history`
- **Índices**: Creados para columnas usadas en filtros frecuentes (`slug`, `status`, `is_active`, FKs)

### ENUM Types (5)

| ENUM | Valores |
|------|---------|
| `order_status` | `pendiente_pago`, `pagado`, `en_preparacion`, `listo_para_entrega`, `entregado`, `cancelado`, `reembolsado` |
| `payment_status_type` | `pendiente`, `confirmado`, `fallido`, `cancelado`, `reembolsado` |
| `fulfillment_type` | `shipping`, `pickup` |
| `payment_provider_type` | `manual`, `simulated` |
| `stock_reason_type` | `creacion_pedido`, `cancelacion_pedido`, `reembolso_con_reingreso`, `ajuste_manual_admin` |
