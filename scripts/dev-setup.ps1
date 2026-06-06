# =============================================================================
# dev-setup.ps1 — Configuración completa del entorno de desarrollo
# =============================================================================
# Uso: .\scripts\dev-setup.ps1
#
# Este script:
#   1. Verifica que Docker esté instalado
#   2. Copia .env.example a .env si no existe
#   3. Inicia el contenedor de base de datos
#   4. Espera a que PostgreSQL esté healthy
#   5. Ejecuta las migraciones
#   6. Levanta todos los servicios
# =============================================================================

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

Set-Location -LiteralPath $ProjectRoot

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Tienda de Camisetas MVP — Setup Desarrollo   " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------------------------
# 1. Verificar Docker
# -----------------------------------------------------------------------------
Write-Host "[1/6] Verificando Docker..." -ForegroundColor Yellow

$dockerVersion = docker --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ ERROR: Docker no está instalado o no está en el PATH." -ForegroundColor Red
    Write-Host "    Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ $dockerVersion" -ForegroundColor Green

$composeVersion = docker compose version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ ERROR: Docker Compose no está disponible." -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ $composeVersion" -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# 2. Crear .env desde .env.example si no existe
# -----------------------------------------------------------------------------
Write-Host "[2/6] Configurando variables de entorno..." -ForegroundColor Yellow

if (-not (Test-Path -LiteralPath ".env")) {
    Copy-Item -LiteralPath ".env.example" -Destination ".env"
    Write-Host "  ✓ .env creado desde .env.example" -ForegroundColor Green
    Write-Host "  ⚠ RECUERDA: Cambia SECRET_KEY en .env por un valor seguro." -ForegroundColor Yellow
} else {
    Write-Host "  ✓ .env ya existe — no se sobreescribe." -ForegroundColor Green
}
Write-Host ""

# -----------------------------------------------------------------------------
# 3. Iniciar contenedor de base de datos
# -----------------------------------------------------------------------------
Write-Host "[3/6] Iniciando PostgreSQL..." -ForegroundColor Yellow
docker compose up -d db
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ ERROR: No se pudo iniciar el contenedor de base de datos." -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Contenedor db iniciado." -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# 4. Esperar a que PostgreSQL esté healthy
# -----------------------------------------------------------------------------
Write-Host "[4/6] Esperando a que PostgreSQL esté listo..." -ForegroundColor Yellow

$maxAttempts = 30
$attempt = 0
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
    Write-Host "  ✗ ERROR: PostgreSQL no alcanzó estado healthy después de $maxAttempts intentos." -ForegroundColor Red
    docker compose logs db
    exit 1
}
Write-Host "  ✓ PostgreSQL está healthy." -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# 5. Ejecutar migraciones
# -----------------------------------------------------------------------------
Write-Host "[5/6] Ejecutando migraciones..." -ForegroundColor Yellow

if (Test-Path -LiteralPath "scripts\init-db.sh") {
    # En Windows, usar bash (Git Bash, WSL, o el bash incluido en Git)
    $bashPath = $null
    $possibleBashPaths = @(
        "C:\Program Files\Git\bin\bash.exe",
        "C:\Program Files (x86)\Git\bin\bash.exe",
        "$env:LOCALAPPDATA\Programs\Git\bin\bash.exe",
        "bash"
    )
    foreach ($path in $possibleBashPaths) {
        if (Get-Command $path -ErrorAction SilentlyContinue) {
            $bashPath = $path
            break
        }
    }
    
    if ($bashPath) {
        & "$bashPath" -c "cd '$ProjectRoot' && bash scripts/init-db.sh"
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ⚠ ADVERTENCIA: El script de migraciones reportó errores." -ForegroundColor Yellow
            Write-Host "    Puedes ejecutar las migraciones manualmente (ver docs/DEV_SETUP.md)." -ForegroundColor Yellow
        } else {
            Write-Host "  ✓ Migraciones ejecutadas." -ForegroundColor Green
        }
    } else {
        Write-Host "  ⚠ No se encontró bash. Ejecuta las migraciones manualmente:" -ForegroundColor Yellow
        Write-Host "    docker exec -i tienda_mvp_db psql -U postgres -d tienda_mvp < api/migrations/001_enums.sql" -ForegroundColor Yellow
        Write-Host "    docker exec -i tienda_mvp_db psql -U postgres -d tienda_mvp < api/migrations/002_tables.sql" -ForegroundColor Yellow
        Write-Host "    docker exec -i tienda_mvp_db psql -U postgres -d tienda_mvp < api/migrations/003_views.sql" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠ No se encontró scripts/init-db.sh" -ForegroundColor Yellow
}
Write-Host ""

# -----------------------------------------------------------------------------
# 6. Levantar todos los servicios
# -----------------------------------------------------------------------------
Write-Host "[6/6] Levantando todos los servicios..." -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ ERROR: No se pudieron iniciar todos los servicios." -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Todos los servicios iniciados." -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# Resumen final
# -----------------------------------------------------------------------------
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  ✓ Entorno de desarrollo listo               " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Servicios disponibles:" -ForegroundColor White
Write-Host "    • Frontend (Next.js):  http://localhost:3000" -ForegroundColor White
Write-Host "    • Backend  (FastAPI):  http://localhost:8000" -ForegroundColor White
Write-Host "    • API Docs (Swagger):  http://localhost:8000/api/v1/docs" -ForegroundColor White
Write-Host "    • Base de Datos (PG):  localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "  Credenciales de desarrollo:" -ForegroundColor White
Write-Host "    • Usuario BD: postgres" -ForegroundColor White
Write-Host "    • Password BD: postgres" -ForegroundColor White
Write-Host "    • Base de datos: tienda_mvp" -ForegroundColor White
Write-Host ""
Write-Host "  Para detener: docker compose down" -ForegroundColor Gray
Write-Host ""
