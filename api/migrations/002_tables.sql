-- =============================================================================
-- 002_tables.sql — Creación de las 14 tablas del esquema
-- Sprint 01: Fundación — Tienda de Camisetas MVP
-- =============================================================================

-- =============================================================================
-- 1. TABLAS INDEPENDIENTES (sin foreign keys)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- categories — Categorías de productos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255)  NOT NULL,
    slug            VARCHAR(255)  NOT NULL UNIQUE,
    description     TEXT,
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    sort_order      INTEGER       NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_categories_slug      ON categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active  ON categories (is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories (deleted_at);

-- -----------------------------------------------------------------------------
-- roles — Catálogo de roles del sistema
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code       VARCHAR(100) NOT NULL UNIQUE,
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roles_code ON roles (code);

-- -----------------------------------------------------------------------------
-- profiles — Perfiles de usuario (1:1 con auth.users de Supabase)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id    UUID         NOT NULL UNIQUE,
    full_name       VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    phone           VARCHAR(50),
    hashed_password VARCHAR(255),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email         ON profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active      ON profiles (is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at     ON profiles (deleted_at);

-- =============================================================================
-- 2. TABLAS CON DEPENDENCIAS NIVEL 1 (FK a tablas independientes)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- products — Productos del catálogo
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     UUID         REFERENCES categories(id) ON DELETE SET NULL,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL UNIQUE,
    description     TEXT,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    material        VARCHAR(255),
    brand           VARCHAR(255),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_products_category_id  ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug         ON products (slug);
CREATE INDEX IF NOT EXISTS idx_products_is_active     ON products (is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_deleted_at    ON products (deleted_at);
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products (category_id, is_active) WHERE is_active = TRUE;

-- =============================================================================
-- 3. TABLAS CON DEPENDENCIAS NIVEL 2 (FK a productos)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- product_variants — Variantes de producto (talla, color, SKU, precio, stock)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_variants (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id       UUID         NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku              VARCHAR(100) NOT NULL UNIQUE,
    size             VARCHAR(50)  NOT NULL,
    color            VARCHAR(100),
    price_amount     INTEGER      NOT NULL CHECK (price_amount > 0),
    currency_code    VARCHAR(10)  NOT NULL DEFAULT 'PEN',
    stock_quantity   INTEGER      NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at       TIMESTAMPTZ,

    CONSTRAINT unique_product_size_color UNIQUE (product_id, size, color)
);

CREATE INDEX IF NOT EXISTS idx_variants_product_id   ON product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku           ON product_variants (sku);
CREATE INDEX IF NOT EXISTS idx_variants_is_active      ON product_variants (is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_variants_stock_active   ON product_variants (stock_quantity, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_variants_deleted_at     ON product_variants (deleted_at);

-- -----------------------------------------------------------------------------
-- product_images — Imágenes asociadas a productos y opcionalmente a variantes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_images (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID         NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id  UUID         REFERENCES product_variants(id) ON DELETE SET NULL,
    image_url   TEXT         NOT NULL,
    alt_text    VARCHAR(255),
    is_primary  BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order  INTEGER      NOT NULL DEFAULT 0,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id  ON product_images (product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_variant_id  ON product_images (variant_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_active    ON product_images (is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_product_images_sort         ON product_images (product_id, sort_order);

-- =============================================================================
-- 4. TABLAS DE RELACIÓN MUCHOS-A-MUCHOS Y DIRECCIONES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- user_roles — Asignación de roles a perfiles (M:N)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id     UUID        NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_profile_role UNIQUE (profile_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_profile_id ON user_roles (profile_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id    ON user_roles (role_id);

-- -----------------------------------------------------------------------------
-- customer_addresses — Direcciones de envío de clientes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_addresses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id      UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    label           VARCHAR(255),
    recipient_name  VARCHAR(255) NOT NULL,
    phone           VARCHAR(50)  NOT NULL,
    country         VARCHAR(10)  NOT NULL DEFAULT 'PE',
    region          VARCHAR(100),
    city            VARCHAR(100) NOT NULL,
    address_line_1  VARCHAR(255) NOT NULL,
    address_line_2  VARCHAR(255),
    reference_notes TEXT,
    postal_code     VARCHAR(20),
    is_default      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_addresses_profile_id  ON customer_addresses (profile_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default  ON customer_addresses (profile_id, is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_addresses_deleted_at   ON customer_addresses (deleted_at);

-- =============================================================================
-- 5. TABLAS TRANSACCIONALES (protegidas — ON DELETE RESTRICT / NO ACTION)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- orders — Órdenes de compra (núcleo transaccional)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number          VARCHAR(50)   NOT NULL UNIQUE,
    customer_profile_id   UUID          REFERENCES profiles(id) ON DELETE SET NULL,
    customer_email        VARCHAR(255)  NOT NULL,
    customer_full_name    VARCHAR(255)  NOT NULL,
    customer_phone        VARCHAR(50)   NOT NULL,
    status                order_status  NOT NULL DEFAULT 'pendiente_pago',
    payment_status        payment_status_type NOT NULL DEFAULT 'pendiente',
    fulfillment_type      fulfillment_type NOT NULL,
    shipping_address_json JSONB,
    pickup_notes          TEXT,
    currency_code         VARCHAR(10)   NOT NULL DEFAULT 'PEN',
    items_subtotal_amount INTEGER       NOT NULL DEFAULT 0 CHECK (items_subtotal_amount >= 0),
    shipping_amount       INTEGER       NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
    discount_amount       INTEGER       NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount          INTEGER       NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    customer_notes        TEXT,
    placed_at             TIMESTAMPTZ   NOT NULL DEFAULT now(),
    cancelled_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
    deleted_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number         ON orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_profile_id   ON orders (customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_status                ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status        ON orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_placed_at             ON orders (placed_at);
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at            ON orders (deleted_at);
CREATE INDEX IF NOT EXISTS idx_orders_status_placed         ON orders (status, placed_at);

-- -----------------------------------------------------------------------------
-- order_items — Líneas de cada orden (snapshot de producto/variante al momento de compra)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id              UUID         NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    product_id            UUID         REFERENCES products(id) ON DELETE SET NULL,
    variant_id            UUID         REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name_snapshot VARCHAR(255) NOT NULL,
    variant_label_snapshot VARCHAR(255) NOT NULL,
    sku_snapshot          VARCHAR(100) NOT NULL,
    unit_price_amount     INTEGER      NOT NULL CHECK (unit_price_amount > 0),
    quantity              INTEGER      NOT NULL CHECK (quantity > 0),
    line_subtotal_amount  INTEGER      NOT NULL CHECK (line_subtotal_amount >= 0),
    currency_code         VARCHAR(10)  NOT NULL DEFAULT 'PEN',
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items (variant_id);

-- -----------------------------------------------------------------------------
-- payments — Pagos asociados a órdenes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id               UUID                  NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    provider               payment_provider_type NOT NULL,
    provider_reference     VARCHAR(255),
    method_type            VARCHAR(100),
    status                 payment_status_type   NOT NULL DEFAULT 'pendiente',
    amount                 INTEGER               NOT NULL CHECK (amount > 0),
    currency_code          VARCHAR(10)           NOT NULL DEFAULT 'PEN',
    paid_at                TIMESTAMPTZ,
    confirmed_by_profile_id UUID                 REFERENCES profiles(id) ON DELETE SET NULL,
    notes                  TEXT,
    created_at             TIMESTAMPTZ           NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ           NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id           ON payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status             ON payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_provider           ON payments (provider);
CREATE INDEX IF NOT EXISTS idx_payments_confirmed_by       ON payments (confirmed_by_profile_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_status       ON payments (order_id, status);

-- -----------------------------------------------------------------------------
-- payment_events — Historial de eventos de cada pago
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_events (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id           UUID         NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    event_type           VARCHAR(100) NOT NULL,
    event_status         VARCHAR(100),
    provider_event_id    VARCHAR(255),
    payload_snapshot     JSONB,
    created_by_profile_id UUID        REFERENCES profiles(id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_payment_id    ON payment_events (payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_event_type     ON payment_events (event_type);
CREATE INDEX IF NOT EXISTS idx_payment_events_created_at     ON payment_events (created_at);
CREATE INDEX IF NOT EXISTS idx_payment_events_created_by     ON payment_events (created_by_profile_id);

-- -----------------------------------------------------------------------------
-- stock_adjustments — Trazabilidad de cambios en inventario
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id             UUID               NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    order_id               UUID               REFERENCES orders(id) ON DELETE SET NULL,
    reason_type            stock_reason_type  NOT NULL,
    delta_quantity         INTEGER            NOT NULL CHECK (delta_quantity != 0),
    previous_stock_quantity INTEGER            NOT NULL,
    new_stock_quantity     INTEGER            NOT NULL CHECK (new_stock_quantity >= 0),
    notes                  TEXT,
    created_by_profile_id  UUID               REFERENCES profiles(id) ON DELETE SET NULL,
    created_at             TIMESTAMPTZ        NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_adjustments_variant_id   ON stock_adjustments (variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_order_id     ON stock_adjustments (order_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_reason_type  ON stock_adjustments (reason_type);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_created_at   ON stock_adjustments (created_at);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_created_by   ON stock_adjustments (created_by_profile_id);

-- -----------------------------------------------------------------------------
-- order_status_history — Auditoría de cambios de estado en órdenes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_status_history (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id             UUID         NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    from_status          VARCHAR(100),
    to_status            VARCHAR(100) NOT NULL,
    changed_by_profile_id UUID        REFERENCES profiles(id) ON DELETE SET NULL,
    change_reason        TEXT,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id   ON order_status_history (order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history (created_at);
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_by ON order_status_history (changed_by_profile_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_time  ON order_status_history (order_id, created_at);
