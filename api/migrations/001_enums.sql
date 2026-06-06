-- =============================================================================
-- 001_enums.sql — Tipos ENUM para catálogos cerrados
-- Sprint 01: Fundación — Tienda de Camisetas MVP
-- =============================================================================

-- Extensión para UUID (si no está habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- ENUM: order_status — Estados del ciclo de vida de una orden
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'pendiente_pago',
        'pagado',
        'en_preparacion',
        'listo_para_entrega',
        'entregado',
        'cancelado',
        'reembolsado'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- ENUM: payment_status_type — Estados de un pago
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE payment_status_type AS ENUM (
        'pendiente',
        'confirmado',
        'fallido',
        'cancelado',
        'reembolsado'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- ENUM: fulfillment_type — Modalidad de entrega de la orden
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE fulfillment_type AS ENUM (
        'shipping',
        'pickup'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- ENUM: payment_provider_type — Proveedores de pago soportados
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE payment_provider_type AS ENUM (
        'manual',
        'simulated'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- ENUM: stock_reason_type — Motivos de ajuste de inventario
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE stock_reason_type AS ENUM (
        'creacion_pedido',
        'cancelacion_pedido',
        'reembolso_con_reingreso',
        'ajuste_manual_admin'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
