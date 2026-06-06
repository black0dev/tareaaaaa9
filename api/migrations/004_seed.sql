-- =============================================================================
-- 004_seed.sql — Datos semilla para desarrollo
-- Sprint 01: Fundación — Tienda de Camisetas MVP
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Catálogo de roles
-- -----------------------------------------------------------------------------
INSERT INTO roles (id, code, name) VALUES
    ('10000000-0000-0000-0000-000000000001', 'admin', 'Administrador'),
    ('10000000-0000-0000-0000-000000000002', 'customer', 'Cliente')
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Perfil administrador (auth_user_id fijo para desarrollo)
-- -----------------------------------------------------------------------------
INSERT INTO profiles (id, auth_user_id, full_name, email, phone, is_active) VALUES
    (
        '20000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        'Admin Principal',
        'admin@tiendacamisetas.pe',
        '+51999999999',
        TRUE
    )
ON CONFLICT (auth_user_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. Asignación de rol admin al perfil administrador
-- -----------------------------------------------------------------------------
INSERT INTO user_roles (profile_id, role_id) VALUES
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001')
ON CONFLICT (profile_id, role_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. Categoría: Camisetas
-- -----------------------------------------------------------------------------
INSERT INTO categories (id, name, slug, description, is_active, sort_order) VALUES
    (
        '30000000-0000-0000-0000-000000000001',
        'Camisetas',
        'camisetas',
        'Camisetas de algodón de alta calidad con diseños exclusivos',
        TRUE,
        1
    )
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. Productos
-- -----------------------------------------------------------------------------

-- Producto 1: Camiseta Negra Básica
INSERT INTO products (id, category_id, name, slug, description, is_active, material, brand) VALUES
    (
        '40000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        'Camiseta Negra Básica',
        'camiseta-negra-basica',
        'Camiseta 100% algodón peinado de color negro. Corte clásico, cuello redondo. Ideal para uso diario.',
        TRUE,
        '100% Algodón Peinado',
        'Plan2Ship Basics'
    )
ON CONFLICT (slug) DO NOTHING;

-- Producto 2: Camiseta Blanca con Logo
INSERT INTO products (id, category_id, name, slug, description, is_active, material, brand) VALUES
    (
        '40000000-0000-0000-0000-000000000002',
        '30000000-0000-0000-0000-000000000001',
        'Camiseta Blanca con Logo',
        'camiseta-blanca-con-logo',
        'Camiseta blanca 100% algodón con logo estampado al frente. Corte moderno y cómodo.',
        TRUE,
        '100% Algodón',
        'Plan2Ship'
    )
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6. Variantes de producto
-- -----------------------------------------------------------------------------

-- Variantes de Camiseta Negra Básica
INSERT INTO product_variants (id, product_id, sku, size, color, price_amount, currency_code, stock_quantity, is_active) VALUES
    ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'CNB-S-NEG', 'S',  'Negro', 3990, 'PEN', 25, TRUE),
    ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'CNB-M-NEG', 'M',  'Negro', 3990, 'PEN', 40, TRUE),
    ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 'CNB-L-NEG', 'L',  'Negro', 3990, 'PEN', 30, TRUE),
    ('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000001', 'CNB-XL-NEG', 'XL', 'Negro', 3990, 'PEN', 15, TRUE)
ON CONFLICT (sku) DO NOTHING;

-- Variantes de Camiseta Blanca con Logo
INSERT INTO product_variants (id, product_id, sku, size, color, price_amount, currency_code, stock_quantity, is_active) VALUES
    ('50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000002', 'CBL-S-BCO', 'S',  'Blanco', 4490, 'PEN', 20, TRUE),
    ('50000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000002', 'CBL-M-BCO', 'M',  'Blanco', 4490, 'PEN', 35, TRUE),
    ('50000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000002', 'CBL-L-BCO', 'L',  'Blanco', 4490, 'PEN', 25, TRUE),
    ('50000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000002', 'CBL-XL-BCO', 'XL', 'Blanco', 4490, 'PEN', 10, TRUE)
ON CONFLICT (sku) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7. Imágenes de producto (al menos 1 por producto)
-- -----------------------------------------------------------------------------

-- Imágenes de Camiseta Negra Básica
INSERT INTO product_images (id, product_id, variant_id, image_url, alt_text, is_primary, sort_order, is_active) VALUES
    (
        '60000000-0000-0000-0000-000000000001',
        '40000000-0000-0000-0000-000000000001',
        NULL,
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
        'Camiseta Negra Básica - Vista Frontal',
        TRUE,
        1,
        TRUE
    ),
    (
        '60000000-0000-0000-0000-000000000002',
        '40000000-0000-0000-0000-000000000001',
        NULL,
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600',
        'Camiseta Negra Básica - Vista Posterior',
        FALSE,
        2,
        TRUE
    );

-- Imágenes de Camiseta Blanca con Logo
INSERT INTO product_images (id, product_id, variant_id, image_url, alt_text, is_primary, sort_order, is_active) VALUES
    (
        '60000000-0000-0000-0000-000000000003',
        '40000000-0000-0000-0000-000000000002',
        NULL,
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
        'Camiseta Blanca con Logo - Vista Frontal',
        TRUE,
        1,
        TRUE
    );
