#!/usr/bin/env bash
# =============================================================================
# init-db.sh — Inicializa la base de datos ejecutando migraciones en orden
# =============================================================================
# Uso: ./scripts/init-db.sh [container_name]
#   container_name: nombre del contenedor PostgreSQL (default: tienda_mvp_db)
#
# Requisitos: Docker corriendo con el servicio db iniciado.
# =============================================================================

set -euo pipefail

DB_CONTAINER="${1:-tienda_mvp_db}"
MIGRATIONS_DIR="$(dirname "$0")/../api/migrations"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-tienda_mvp}"

echo "=============================================="
echo "  Tienda de Camisetas MVP — Inicializando BD  "
echo "=============================================="
echo ""

# -----------------------------------------------------------------------------
# 1. Esperar a que PostgreSQL esté listo
# -----------------------------------------------------------------------------
echo "[1/3] Esperando a que PostgreSQL esté listo..."
until docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" -q 2>/dev/null; do
    echo "  Esperando... (reintentando en 3s)"
    sleep 3
done
echo "  ✓ PostgreSQL está listo."
echo ""

# -----------------------------------------------------------------------------
# 2. Ejecutar migraciones en orden
# -----------------------------------------------------------------------------
echo "[2/3] Ejecutando migraciones..."

MIGRATIONS=(
    "001_enums.sql"
    "002_tables.sql"
    "003_views.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    migration_path="$MIGRATIONS_DIR/$migration"
    if [ -f "$migration_path" ]; then
        echo "  → Ejecutando $migration..."
        docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -q -f - < "$migration_path"
        echo "    ✓ $migration completado."
    else
        echo "  ⚠ ADVERTENCIA: No se encontró $migration_path — saltando."
    fi
done
echo ""

# -----------------------------------------------------------------------------
# 3. Verificar tablas creadas
# -----------------------------------------------------------------------------
echo "[3/3] Verificando tablas creadas..."
TABLE_COUNT=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -A -c \
    "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "  ✓ $TABLE_COUNT tablas encontradas en el esquema 'public'."
echo ""

echo "=============================================="
echo "  ✓ Base de datos inicializada exitosamente   "
echo "=============================================="
