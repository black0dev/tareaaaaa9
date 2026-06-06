# =============================================================================
# dev-setup.ps1 — Configuración completa del entorno de desarrollo
# =============================================================================
# Uso: .\scripts\dev-setup.ps1
# =============================================================================

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

Set-Location -LiteralPath $ProjectRoot

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Tienda de Camisetas MVP - Setup Desarrollo   " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------------------------
# 1. Verificar Docker
# -----------------------------------------------------------------------------
Write-Host "[1/6] Verificando Docker..." -ForegroundColor Yellow

$dockerVersion = docker --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  X ERROR: Docker no esta instalado o no esta corriendo." -ForegroundColor Red
    Write-Host "    Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    Write-Host "    O usa el modo alternativo: bash scripts/start-dev.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "  OK $dockerVersion" -ForegroundColor Green

$composeVersion = docker compose version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  X ERROR: Docker Compose no esta disponible." -ForegroundColor Red
    exit 1
}
Write-Host "  OK $composeVersion" -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# 2. Crear .env desde .env.example si no existe
# -----------------------------------------------------------------------------
Write-Host "[2/6] Configurando variables de entorno..." -ForegroundColor Yellow

if (-not (Test-Path -LiteralPath ".env")) {
    Copy-Item -LiteralPath ".env.example" -Destination ".env"
    Write-Host "  OK .env creado desde .env.example" -ForegroundColor Green
    Write-Host "  !! RECUERDA: Cambia SECRET_KEY en .env por un valor seguro." -ForegroundColor Yellow
} else {
    Write-Host "  OK .env ya existe - no se sobreescribe." -ForegroundColor Green
}
Write-Host ""

# -----------------------------------------------------------------------------
# 3. Iniciar contenedor de base de datos
# -----------------------------------------------------------------------------
Write-Host "[3/6] Iniciando PostgreSQL..." -ForegroundColor Yellow
docker compose up -d db
if ($LASTEXITCODE -ne 0) {
    Write-Host "  X ERROR: No se pudo iniciar el contenedor de base de datos." -ForegroundColor Red
    exit 1
}
Write-Host "  OK Contenedor db iniciado." -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# 4. Esperar a que PostgreSQL este healthy
# -----------------------------------------------------------------------------
Write-Host "[4/6] Esperando a que PostgreSQL este listo..." -ForegroundColor Yellow

$maxAttempts = 30
$attempt = 0
$status = ""
do {
    $attempt++
    $status = docker inspect --format='{{.State.Health.Status}}' tienda_mvp_db 2>$null
    if ($status -eq "healthy") {
        break
    }
    Write-Host "  Esperando... (intento $attempt de $maxAttempts)"
    Start-Sleep -Seconds 3
} while ($attempt -lt $maxAttempts)

if ($status -ne "healthy") {
    Write-Host "  X ERROR: PostgreSQL no alcanzo estado healthy despues de $maxAttempts intentos." -ForegroundColor Red
    docker compose logs db
    exit 1
}
Write-Host "  OK PostgreSQL esta healthy." -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# 5. Ejecutar migraciones
# -----------------------------------------------------------------------------
Write-Host "[5/6] Ejecutando migraciones..." -ForegroundColor Yellow

$migrationFiles = @(
    "api/migrations/001_enums.sql",
    "api/migrations/002_tables.sql",
    "api/migrations/003_views.sql",
    "api/migrations/004_seed.sql"
)

foreach ($file in $migrationFiles) {
    if (Test-Path -LiteralPath $file) {
        Write-Host "  Ejecutando $file..."
        Get-Content -LiteralPath $file -Raw | docker exec -i tienda_mvp_db psql -U postgres -d tienda_mvp 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  !! ADVERTENCIA: $file reporto errores (puede ser normal si ya existen objetos)." -ForegroundColor Yellow
        } else {
            Write-Host "  OK $file ejecutado." -ForegroundColor Green
        }
    } else {
        Write-Host "  !! No se encontro $file" -ForegroundColor Yellow
    }
}
Write-Host ""

# -----------------------------------------------------------------------------
# 6. Levantar todos los servicios
# -----------------------------------------------------------------------------
Write-Host "[6/6] Levantando todos los servicios..." -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "  X ERROR: No se pudieron iniciar todos los servicios." -ForegroundColor Red
    exit 1
}
Write-Host "  OK Todos los servicios iniciados." -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# Resumen final
# -----------------------------------------------------------------------------
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  OK Entorno de desarrollo listo               " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Servicios disponibles:" -ForegroundColor White
Write-Host "    - Frontend (Next.js):  http://localhost:3000" -ForegroundColor White
Write-Host "    - Backend  (FastAPI):  http://localhost:8000" -ForegroundColor White
Write-Host "    - API Docs (Swagger):  http://localhost:8000/api/v1/docs" -ForegroundColor White
Write-Host "    - Base de Datos (PG):  localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "  Credenciales de desarrollo:" -ForegroundColor White
Write-Host "    - Admin panel: admin@tienda.com / admin123" -ForegroundColor White
Write-Host "    - Usuario BD: postgres / postgres" -ForegroundColor White
Write-Host "    - Base de datos: tienda_mvp" -ForegroundColor White
Write-Host ""
Write-Host "  Para detener: docker compose down" -ForegroundColor Gray
Write-Host ""
