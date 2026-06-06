#!/usr/bin/env bash
# =============================================================================
# health-check.sh — Verifica el estado de todos los servicios
# =============================================================================
# Uso: ./scripts/health-check.sh [--json]
#   --json: Salida en formato JSON para integracion con herramientas de monitoreo
#
# Servicios verificados:
#   - Web (Next.js) en puerto 3000
#   - API (FastAPI) en puerto 8000 /api/v1/health
#   - BD (PostgreSQL) en contenedor tienda_mvp_db
# =============================================================================

set -euo pipefail

# ─── Configuracion ────────────────────────────────────────────────────────────

WEB_URL="${HEALTH_WEB_URL:-http://localhost:3000}"
API_URL="${HEALTH_API_URL:-http://localhost:8000}"
DB_CONTAINER="${HEALTH_DB_CONTAINER:-tienda_mvp_db}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-tienda_mvp}"
TIMEOUT=10

OUTPUT_JSON=false
if [[ "${1:-}" == "--json" ]]; then
    OUTPUT_JSON=true
fi

# ─── Estados ──────────────────────────────────────────────────────────────────

WEB_STATUS="unknown"
WEB_MESSAGE=""
API_STATUS="unknown"
API_MESSAGE=""
DB_STATUS="unknown"
DB_MESSAGE=""

ALL_OK=true

# ─── Funciones auxiliares ────────────────────────────────────────────────────

check_web() {
    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$WEB_URL" 2>/dev/null || echo "000")
    if [[ "$http_code" == "200" ]] || [[ "$http_code" == "304" ]]; then
        WEB_STATUS="healthy"
        WEB_MESSAGE="HTTP $http_code"
    else
        WEB_STATUS="unhealthy"
        WEB_MESSAGE="HTTP $http_code — no respondio correctamente"
        ALL_OK=false
    fi
}

check_api() {
    local response
    response=$(curl -s --max-time "$TIMEOUT" "$API_URL/api/v1/health" 2>/dev/null || echo "")
    if [[ -z "$response" ]]; then
        API_STATUS="unhealthy"
        API_MESSAGE="Sin respuesta del endpoint /api/v1/health"
        ALL_OK=false
        return
    fi

    local is_healthy
    is_healthy=$(echo "$response" | grep -c '"status":"healthy"' 2>/dev/null || echo "0")
    if [[ "$is_healthy" -gt 0 ]]; then
        API_STATUS="healthy"
        API_MESSAGE="Endpoint /api/v1/health responde ok"
    else
        API_STATUS="unhealthy"
        API_MESSAGE="Endpoint /api/v1/health responde pero no reporta estado healthy"
        ALL_OK=false
    fi
}

check_db() {
    if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${DB_CONTAINER}$"; then
        DB_STATUS="unhealthy"
        DB_MESSAGE="Contenedor $DB_CONTAINER no encontrado o no esta corriendo"
        ALL_OK=false
        return
    fi

    if docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" -q 2>/dev/null; then
        DB_STATUS="healthy"
        DB_MESSAGE="pg_isready reporta conexion aceptada"
    else
        DB_STATUS="unhealthy"
        DB_MESSAGE="pg_isready rechazo la conexion"
        ALL_OK=false
    fi
}

# ─── Ejecutar verificaciones ─────────────────────────────────────────────────

check_web
check_api
check_db

# ─── Salida ───────────────────────────────────────────────────────────────────

if $OUTPUT_JSON; then
    cat <<EOF
{
  "overall": "${ALL_OK:+healthy}${ALL_OK:-unhealthy}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "services": {
    "web": {
      "status": "$WEB_STATUS",
      "message": "$WEB_MESSAGE",
      "url": "$WEB_URL"
    },
    "api": {
      "status": "$API_STATUS",
      "message": "$API_MESSAGE",
      "url": "$API_URL/api/v1/health"
    },
    "db": {
      "status": "$DB_STATUS",
      "message": "$DB_MESSAGE",
      "container": "$DB_CONTAINER"
    }
  }
}
EOF
else
    echo ""
    echo "=============================================="
    echo "  Health Check — Tienda de Camisetas MVP"
    echo "=============================================="
    echo ""

    # Web
    if [[ "$WEB_STATUS" == "healthy" ]]; then
        echo "  [✓] Web (Next.js)   : $WEB_STATUS — $WEB_MESSAGE"
    else
        echo "  [✗] Web (Next.js)   : $WEB_STATUS — $WEB_MESSAGE"
    fi

    # API
    if [[ "$API_STATUS" == "healthy" ]]; then
        echo "  [✓] API (FastAPI)   : $API_STATUS — $API_MESSAGE"
    else
        echo "  [✗] API (FastAPI)   : $API_STATUS — $API_MESSAGE"
    fi

    # DB
    if [[ "$DB_STATUS" == "healthy" ]]; then
        echo "  [✓] DB (PostgreSQL) : $DB_STATUS — $DB_MESSAGE"
    else
        echo "  [✗] DB (PostgreSQL) : $DB_STATUS — $DB_MESSAGE"
    fi

    echo ""
    if $ALL_OK; then
        echo "  Todos los servicios estan saludables."
    else
        echo "  ATENCION: Uno o mas servicios no responden."
    fi
    echo ""
fi

# ─── Codigo de salida ────────────────────────────────────────────────────────

if $ALL_OK; then
    exit 0
else
    exit 1
fi
