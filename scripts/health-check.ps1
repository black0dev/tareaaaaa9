# =============================================================================
# health-check.ps1 — Verifica el estado de todos los servicios (PowerShell)
# =============================================================================
# Uso: .\scripts\health-check.ps1 [-Json]
#   -Json: Salida en formato JSON para integracion con herramientas de monitoreo
#
# Servicios verificados:
#   - Web (Next.js) en puerto 3000
#   - API (FastAPI) en puerto 8000 /api/v1/health
#   - BD (PostgreSQL) en contenedor tienda_mvp_db
# =============================================================================

param(
    [switch]$Json
)

# ─── Configuracion ────────────────────────────────────────────────────────────

$WebUrl = if ($env:HEALTH_WEB_URL) { $env:HEALTH_WEB_URL } else { "http://localhost:3000" }
$ApiUrl = if ($env:HEALTH_API_URL) { $env:HEALTH_API_URL } else { "http://localhost:8000" }
$DbContainer = if ($env:HEALTH_DB_CONTAINER) { $env:HEALTH_DB_CONTAINER } else { "tienda_mvp_db" }
$DbUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" }
$DbName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "tienda_mvp" }
$TimeoutSec = 10

# ─── Estados ──────────────────────────────────────────────────────────────────

$WebStatus = "unknown"
$WebMessage = ""
$ApiStatus = "unknown"
$ApiMessage = ""
$DbStatus = "unknown"
$DbMessage = ""

$AllOk = $true

# ─── Funciones auxiliares ─────────────────────────────────────────────────────

function Check-Web {
    try {
        $response = Invoke-WebRequest -Uri $using:WebUrl -TimeoutSec $using:TimeoutSec -UseBasicParsing -ErrorAction Stop
        $script:WebStatus = "healthy"
        $script:WebMessage = "HTTP $($response.StatusCode)"
    } catch {
        $script:WebStatus = "unhealthy"
        $script:WebMessage = "No respondio — $($_.Exception.Message)"
        $script:AllOk = $false
    }
}

function Check-Api {
    try {
        $response = Invoke-RestMethod -Uri "$using:ApiUrl/api/v1/health" -TimeoutSec $using:TimeoutSec -ErrorAction Stop
        if ($response.ok -and $response.data.status -eq "healthy") {
            $script:ApiStatus = "healthy"
            $script:ApiMessage = "Endpoint /api/v1/health responde ok"
        } else {
            $script:ApiStatus = "unhealthy"
            $script:ApiMessage = "Endpoint /api/v1/health responde pero status != healthy"
            $script:AllOk = $false
        }
    } catch {
        $script:ApiStatus = "unhealthy"
        $script:ApiMessage = "Sin respuesta — $($_.Exception.Message)"
        $script:AllOk = $false
    }
}

function Check-Db {
    $containerRunning = docker ps --format '{{.Names}}' 2>$null | Select-String -Pattern "^$([regex]::Escape($using:DbContainer))$"
    if (-not $containerRunning) {
        $script:DbStatus = "unhealthy"
        $script:DbMessage = "Contenedor $using:DbContainer no encontrado o no esta corriendo"
        $script:AllOk = $false
        return
    }

    $result = docker exec $using:DbContainer pg_isready -U $using:DbUser -d $using:DbName -q 2>&1
    if ($LASTEXITCODE -eq 0) {
        $script:DbStatus = "healthy"
        $script:DbMessage = "pg_isready reporta conexion aceptada"
    } else {
        $script:DbStatus = "unhealthy"
        $script:DbMessage = "pg_isready rechazo la conexion"
        $script:AllOk = $false
    }
}

# ─── Ejecutar verificaciones ──────────────────────────────────────────────────

Check-Web
Check-Api
Check-Db

# ─── Salida ───────────────────────────────────────────────────────────────────

if ($Json) {
    $overall = if ($AllOk) { "healthy" } else { "unhealthy" }
    $timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

    $result = @{
        overall   = $overall
        timestamp = $timestamp
        services  = @{
            web = @{
                status  = $WebStatus
                message = $WebMessage
                url     = $WebUrl
            }
            api = @{
                status  = $ApiStatus
                message = $ApiMessage
                url     = "$ApiUrl/api/v1/health"
            }
            db  = @{
                status    = $DbStatus
                message   = $DbMessage
                container = $DbContainer
            }
        }
    }

    $result | ConvertTo-Json -Depth 3
} else {
    Write-Host ""
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host "  Health Check — Tienda de Camisetas MVP" -ForegroundColor Cyan
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host ""

    # Web
    if ($WebStatus -eq "healthy") {
        Write-Host "  [✓] Web (Next.js)   : $WebStatus — $WebMessage" -ForegroundColor Green
    } else {
        Write-Host "  [✗] Web (Next.js)   : $WebStatus — $WebMessage" -ForegroundColor Red
    }

    # API
    if ($ApiStatus -eq "healthy") {
        Write-Host "  [✓] API (FastAPI)   : $ApiStatus — $ApiMessage" -ForegroundColor Green
    } else {
        Write-Host "  [✗] API (FastAPI)   : $ApiStatus — $ApiMessage" -ForegroundColor Red
    }

    # DB
    if ($DbStatus -eq "healthy") {
        Write-Host "  [✓] DB (PostgreSQL) : $DbStatus — $DbMessage" -ForegroundColor Green
    } else {
        Write-Host "  [✗] DB (PostgreSQL) : $DbStatus — $DbMessage" -ForegroundColor Red
    }

    Write-Host ""
    if ($AllOk) {
        Write-Host "  Todos los servicios estan saludables." -ForegroundColor Green
    } else {
        Write-Host "  ATENCION: Uno o mas servicios no responden." -ForegroundColor Yellow
    }
    Write-Host ""
}

# ─── Codigo de salida ────────────────────────────────────────────────────────

if ($AllOk) {
    exit 0
} else {
    exit 1
}
