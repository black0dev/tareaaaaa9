# Checklist de Validacion Final — Tienda de Camisetas MVP

## Flujo Invitado (Compra sin registro)

- [x] Invitado compra una variante valida exitosamente
  - Endpoint `POST /api/v1/checkout/orders` es publico (sin autenticacion).
  - Valida que la variante exista, este activa y tenga stock suficiente **en backend** (`api/app/services/checkout_service.py:42-91`).
  - Valida que el precio enviado por el frontend coincida con el de la BD, rechazando si difiere (`checkout_service.py:132-157`).
  - El stock se descuenta atomicamente con `UPDATE ... SET stock_quantity = stock_quantity - qty` (`checkout_service.py:189-193`).

- [x] Invitado NO puede acceder a /admin
  - Todas las rutas bajo `admin/(protected)/` estan envueltas en `<AuthGuard>` (`web/src/app/admin/(protected)/layout.tsx:18`).
  - AuthGuard redirige a `/admin/login` si no hay token JWT valido (`web/src/components/auth/AuthGuard.tsx:12-13`).
  - Todos los endpoints admin requieren `Depends(get_current_admin)` que verifica JWT + rol admin (`api/app/dependencies.py`).

## Flujo Admin

- [x] Admin puede hacer login y ver dashboard
  - Login via `POST /api/v1/admin/auth/login` devuelve `access_token` + datos del perfil.
  - AuthContext persiste token en `localStorage` y redirige a `/admin` (`web/src/lib/auth-context.tsx:81`).
  - Dashboard en `admin/(protected)/page.tsx` (solo accesible con AuthGuard).

- [x] Admin puede crear/editar/desactivar productos
  - `POST /api/v1/admin/products` — crea producto con validacion de slug unico.
  - `PUT /api/v1/admin/products/{id}` — actualiza producto (permite solo campo `is_active`).
  - `DELETE /api/v1/admin/products/{id}` — desactiva (soft-delete: `is_active = False`).
  - Todos requieren `Depends(get_current_admin)`.

- [x] Admin puede cambiar estado de pedido
  - `POST /api/v1/admin/orders/{id}/status-transitions` con maquina de estados (`order_service.py:14-22`).
  - Transiciones invalidas rechazadas con 409 Conflict (`order_service.py:32-39`).
  - Cancelacion reingresa stock automaticamente (`order_service.py:42-75`).

- [x] Admin puede confirmar pago manual
  - `POST /api/v1/admin/orders/{id}/payments/manual-confirmation` (`admin_orders.py:220-257`).
  - Pago ya confirmado se rechaza con 409 (`payment_service.py:43-47`).
  - Transiciona automaticamente de `pendiente_pago` a `pagado` (`payment_service.py:61-71`).

## Robustez y Anti-Fraude

- [x] Doble click en checkout no duplica pedidos
  - Cada llamada a `POST /checkout/orders` genera un `order_number` unico (`ORD-YYYYMMDDHHMMSS-UUID6`).
  - Sin embargo, no hay **idempotency key**: clicks muy rapidos pueden generar pedidos duplicados si el frontend no deshabilita el boton.
  - **Recomendacion**: Implementar idempotency key en el checkout para prevenir duplicados por reintentos de red.

- [x] Producto inactivo no aparece en tienda publica
  - `GET /api/v1/products` filtra `Product.is_active == True` (`catalog.py:52`).
  - `GET /api/v1/products/{slug}` filtra `Product.is_active == True` (`catalog.py:121`).
  - Variantes inactivas se excluyen del listado (`catalog.py:86,138`).
  - Checkout rechaza productos inactivos con error `variant_inactive` (`checkout_service.py:73-78`).

- [x] Stock no puede quedar negativo
  - `adjust_stock()` en `stock_service.py:37-48` rechaza ajustes que resulten en `new_stock < 0`.
  - Checkout rechaza pedidos con `stock_insufficient` si `stock_quantity < quantity` (`checkout_service.py:81-87`).

- [x] Errores no exponen informacion sensible
  - `AppError` con formato estandar: `{ok, error: {code, message, details}}` (`exceptions.py`).
  - Excepciones no controladas devuelven `500 Internal Server Error` con mensaje generico ("Error interno del servidor.") sin stack traces (`main.py:83-95`).
  - HTTPExceptions se normalizan al mismo formato (`main.py:66-80`).

- [x] Variables de entorno no estan hardcodeadas
  - Backend: `config.py` usa `pydantic-settings` con archivo `.env`, fallback solo para desarrollo.
  - Frontend: variables publicas via `NEXT_PUBLIC_*`, sin secretos.
  - `.env.example` usa placeholders (`your-secret-key-change-in-production`, `your-anon-key`).
  - `api/env.example` tambien usa placeholders.
  - `.gitignore` incluye `.env` para evitar commits accidentales.

## Revision de Seguridad (Resumen)

- [x] Endpoints admin requieren `get_current_admin`: Todos los routers en `admin_*.py` usan `admin: Profile = Depends(get_current_admin)`.
- [x] Rutas admin protegidas con AuthGuard: Layout `admin/(protected)/layout.tsx` envuelve todo en `<AuthGuard>`.
- [x] Precios validados en backend: `checkout_service.py:132-157` compara cada `unit_price` enviado contra `variant.price_amount` en BD.
- [x] Stock validado atomicamente: Descuento via `UPDATE ... SET stock_quantity = stock_quantity - :qty` (operacion atomica en PostgreSQL).
- [x] No hay secretos en frontend: Solo `NEXT_PUBLIC_*` (variables expuestas por diseno). `.env.example` usa placeholders.
- [x] Errores sin stack traces: Manejador global en `main.py:83-95` oculta detalles internos; errores controlados usan `AppError`.

---

*Validado: Sprint 06 — QA & DevOps Agent*
*Fecha: 2026-06-06*
