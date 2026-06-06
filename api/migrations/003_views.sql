-- =============================================================================
-- 003_views.sql — Vistas de catálogo público
-- Sprint 01: Fundación — Tienda de Camisetas MVP
-- =============================================================================

-- -----------------------------------------------------------------------------
-- v_active_products — Productos activos visibles al público
-- Filtra: is_active = true AND deleted_at IS NULL
-- Expone: categoría, nombre, slug, descripción
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_active_products AS
SELECT
    p.id,
    p.category_id,
    c.name  AS category_name,
    c.slug  AS category_slug,
    p.name,
    p.slug,
    p.description,
    p.material,
    p.brand,
    p.is_active,
    p.created_at,
    p.updated_at
FROM products p
LEFT JOIN categories c ON c.id = p.category_id AND c.is_active = TRUE AND c.deleted_at IS NULL
WHERE p.is_active = TRUE
  AND p.deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- v_active_variants — Variantes activas con producto activo y stock > 0
-- Filtra: variante activa, producto activo, stock > 0, no eliminados
-- Expone: precio, talla, color, SKU
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_active_variants AS
SELECT
    pv.id,
    pv.product_id,
    p.name         AS product_name,
    p.slug         AS product_slug,
    pv.sku,
    pv.size,
    pv.color,
    pv.price_amount,
    pv.currency_code,
    pv.stock_quantity,
    pv.is_active,
    pv.created_at,
    pv.updated_at
FROM product_variants pv
INNER JOIN products p ON p.id = pv.product_id
WHERE pv.is_active = TRUE
  AND pv.deleted_at IS NULL
  AND pv.stock_quantity > 0
  AND p.is_active = TRUE
  AND p.deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- v_product_gallery — Imágenes activas de productos activos, ordenadas por sort_order
-- Filtra: imagen activa, producto activo, no eliminados
-- Orden: por producto y sort_order ascendente
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_product_gallery AS
SELECT
    pi.id,
    pi.product_id,
    p.name        AS product_name,
    p.slug        AS product_slug,
    pi.variant_id,
    pi.image_url,
    pi.alt_text,
    pi.is_primary,
    pi.sort_order,
    pi.is_active,
    pi.created_at
FROM product_images pi
INNER JOIN products p ON p.id = pi.product_id
WHERE pi.is_active = TRUE
  AND p.is_active = TRUE
  AND p.deleted_at IS NULL
ORDER BY pi.product_id, pi.sort_order ASC;
