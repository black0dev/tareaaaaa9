# Guia de Despliegue — Tienda de Camisetas MVP

## Requisitos

| Herramienta | Version minima | Notas |
|-------------|---------------|-------|
| **Docker** | 24.0+ | [docker.com](https://www.docker.com/products/docker-desktop) |
| **Docker Compose** | v2.20+ | Incluido con Docker Desktop |
| **Node.js** | 20 LTS | Solo si se compila el frontend fuera de Docker |
| **Python** | 3.11+ | Solo si se ejecuta la API fuera de Docker |
| **Git** | 2.40+ | Para clonar el repositorio |

## Arquitectura de Servicios

```
                    ┌──────────┐
                    │  Nginx   │  (recomendado, no incluido)
                    │  :80/443 │
                    └────┬─────┘
                         │
            ┌────────────┼────────────┐
            ▼            │            ▼
     ┌──────────┐        │     ┌──────────┐
     │  Next.js  │        │     │  FastAPI  │
     │  Web      │        │     │  API      │
     │  :3000    │        │     │  :8000    │
     └──────────┘        │     └────┬─────┘
                          │          │
                          │     ┌────▼─────┐
                          │     │ PostgreSQL│
                          │     │   :5432   │
                          │     └──────────┘
                          │
         (Internet) ──────┘

   Notas de seguridad en produccion:
   - db no expone puerto al host (docker-compose.prod.yml usa `ports: !reset []`)
   - api y web solo deben exponerse via proxy reverso (Nginx, Traefik, Caddy)
   - CORS_ORIGINS debe contener el dominio real de produccion
```

## Paso 1: Clonar el Repositorio

```bash
git clone <repo-url> tienda-camisetas
cd tienda-camisetas
git checkout main
```

## Paso 2: Configurar Variables de Entorno

### 2.1 Crear archivo `.env` para produccion

```bash
cp .env.production.example .env
```

### 2.2 Editar `.env` con valores reales

**Variables criticas que DEBEN cambiarse:**

| Variable | Proposito | Como generar |
|----------|-----------|-------------|
| `SECRET_KEY` | Firma de tokens JWT | `openssl rand -hex 32` |
| `POSTGRES_PASSWORD` | Contrasena de base de datos | `openssl rand -base64 24` |
| `POSTGRES_USER` | Usuario de base de datos | Usar algo distinto a `postgres` |

**Variables de conexion:**

| Variable | Formato |
|----------|---------|
| `DATABASE_URL` | `postgresql+asyncpg://USER:PASSWORD@db:5432/DB_NAME` |
| `DATABASE_URL_SYNC` | `postgresql://USER:PASSWORD@db:5432/DB_NAME` |
| `CORS_ORIGINS` | `https://tu-dominio.com` (separado por comas si es multiple) |
| `NEXT_PUBLIC_API_URL` | `https://tu-dominio.com/api/v1` |

> **IMPORTANTE**: Dentro de Docker, el host de la base de datos es `db` (nombre del servicio), NO `localhost`.

Ver archivo `.env.production.example` para la lista completa de variables con comentarios.

## Paso 3: Levantar Servicios

```bash
# Construir imagenes de produccion y levantar en segundo plano
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Esto inicia:
- `tienda_mvp_db` — PostgreSQL 16 (sin puerto expuesto al host)
- `tienda_mvp_api` — FastAPI con gunicorn + uvicorn workers
- `tienda_mvp_web` — Next.js compilado (`next build && next start`)

## Paso 4: Ejecutar Migraciones

```bash
# Opcion A: Usar script bash
bash scripts/init-db.sh

# Opcion B: Ejecutar manualmente (PowerShell)
Get-Content api\migrations\001_enums.sql | docker exec -i tienda_mvp_db psql -U $env:POSTGRES_USER -d $env:POSTGRES_DB
Get-Content api\migrations\002_tables.sql | docker exec -i tienda_mvp_db psql -U $env:POSTGRES_USER -d $env:POSTGRES_DB
Get-Content api\migrations\003_views.sql | docker exec -i tienda_mvp_db psql -U $env:POSTGRES_USER -d $env:POSTGRES_DB
```

Las migraciones crean:
1. `001_enums.sql` — Tipos ENUM (order_status, payment_method, etc.)
2. `002_tables.sql` — 14 tablas principales
3. `003_views.sql` — Vistas para consultas frecuentes
4. `004_seed.sql` — Datos semilla (categorias, admin default, productos demo) — **opcional para produccion**

## Paso 5: Verificar Health Checks

```bash
# Usar script de health check
bash scripts/health-check.sh

# O en PowerShell
.\scripts\health-check.ps1

# Verificar manualmente
curl -s http://localhost:8000/api/v1/health
# Esperado: {"ok":true,"data":{"status":"healthy"},...}

curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Esperado: 200
```

Tambien puedes verificar el estado de los contenedores:

```bash
docker compose ps
# Los 3 servicios deben mostrar estado "Up" o "healthy"
```

## URLs de Acceso

| Servicio | URL | Descripcion |
|----------|-----|-------------|
| **Frontend (tienda)** | `http://localhost:3000` | Tienda publica |
| **Admin** | `http://localhost:3000/admin/login` | Panel de administracion |
| **API** | `http://localhost:8000` | Backend FastAPI |
| **API Docs (Swagger)** | `http://localhost:8000/api/v1/docs` | Documentacion interactiva |
| **API Health** | `http://localhost:8000/api/v1/health` | Healthcheck |
| **Base de Datos** | `localhost:5432` | Solo en desarrollo (no expuesto en prod) |

## Credenciales Admin por Defecto

Si ejecutaste `004_seed.sql`, existe un admin pre-cargado:

| Campo | Valor |
|-------|-------|
| **Email** | `admin@tienda.local` |
| **Password** | `admin123` |

> **CAMBIAR INMEDIATAMENTE EN PRODUCCION**: Despues del primer login, cambia la contrasena.
> La tabla `profile` contiene el hash de la contrasena (bcrypt). Puedes generar un nuevo hash con:
> ```python
> from passlib.context import CryptContext
> pwd_context = CryptContext(schemes=["bcrypt"])
> print(pwd_context.hash("nueva-password-segura"))
> ```
> Luego actualiza la BD:
> ```sql
> UPDATE profile SET password_hash = '<hash-generado>' WHERE email = 'admin@tienda.local';
> ```

## Comandos de Mantenimiento

### Ver logs

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f db
```

### Reiniciar un servicio

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart api
```

### Actualizar a nueva version

```bash
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
bash scripts/init-db.sh  # Si hay nuevas migraciones
```

### Backup de base de datos

```bash
docker exec tienda_mvp_db pg_dump -U $POSTGRES_USER -d $POSTGRES_DB -F c > backup_$(date +%Y%m%d_%H%M%S).dump
```

### Restaurar backup

```bash
docker exec -i tienda_mvp_db pg_restore -U $POSTGRES_USER -d $POSTGRES_DB < backup.dump
```

### Detener todo

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

### Detener y eliminar datos (IRREVERSIBLE)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v
```

## Configuracion de Proxy Reverso (Nginx)

Se recomienda poner Nginx delante de los servicios en produccion:

```nginx
server {
    listen 443 ssl http2;
    server_name tu-dominio.com;

    ssl_certificate     /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

    # Frontend Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API FastAPI
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Archivos estaticos (imagenes de productos)
    location /static/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }
}
```

## Checklist de Puesta en Produccion

- [ ] `.env` configurado con valores seguros (no defaults)
- [ ] `SECRET_KEY` cambiada (minimo 32 caracteres aleatorios)
- [ ] `POSTGRES_PASSWORD` cambiada y segura
- [ ] `POSTGRES_USER` diferente a `postgres`
- [ ] `CORS_ORIGINS` contiene solo los dominios reales
- [ ] Migraciones ejecutadas exitosamente (14+ tablas)
- [ ] Health checks responden correctamente
- [ ] Contrasena del admin por defecto cambiada
- [ ] HTTPS configurado (via proxy reverso o CDN)
- [ ] Puerto de BD no expuesto al exterior
- [ ] Firewall configurado (solo puertos 80/443 abiertos)
- [ ] Backup automatico de BD configurado
- [ ] Monitoreo configurado (logs, uptime, alertas)

## Solucion de Problemas

### Error: "SCRAM authentication requires libpq version 10 or above"

Asegurate de que `DATABASE_URL` use el formato correcto:
```
postgresql+asyncpg://USER:PASSWORD@db:5432/DB_NAME
```

### Error: "relation does not exist"

Las migraciones no se ejecutaron. Corre `bash scripts/init-db.sh`.

### La API no se conecta a la BD

Verifica que en `.env` el host sea `db` (no `localhost`):
```
DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/tienda_mvp
```

### Next.js no carga imagenes

Verifica que `NEXT_PUBLIC_API_URL` sea accesible desde el navegador del cliente. Si usas proxy reverso, debe apuntar a la URL publica.
