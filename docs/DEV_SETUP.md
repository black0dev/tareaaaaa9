# Guía de Setup para Desarrollo — Tienda de Camisetas MVP

## Requisitos Previos

| Herramienta | Versión mínima | Instalación |
|-------------|---------------|-------------|
| **Docker** | 24.0+ | [docker.com](https://www.docker.com/products/docker-desktop) |
| **Docker Compose** | v2.20+ | Incluido con Docker Desktop |
| **Git** | 2.40+ | [git-scm.com](https://git-scm.com/) |
| **Node.js** (opcional) | 20 LTS | [nodejs.org](https://nodejs.org/) — solo si trabajas fuera de Docker |
| **Python** (opcional) | 3.11+ | [python.org](https://www.python.org/) — solo si trabajas fuera de Docker |

> **Nota**: Docker es el único requisito obligatorio. Todo el stack se ejecuta en contenedores.

---

## Estructura del Proyecto

```
tienda-camisetas-mvp/
├── api/                    # Backend FastAPI
│   ├── app/                # Código fuente de la API
│   │   ├── config.py       # Configuración (pydantic-settings)
│   │   ├── database.py     # Conexión a BD (SQLAlchemy async)
│   │   ├── models/         # Modelos ORM
│   │   ├── routers/        # Endpoints REST
│   │   ├── schemas/        # Schemas Pydantic
│   │   └── services/       # Lógica de negocio
│   ├── migrations/         # Migraciones SQL (orden numérico)
│   ├── Dockerfile          # Imagen de desarrollo
│   └── requirements.txt    # Dependencias Python
├── web/                    # Frontend Next.js
│   ├── src/                # Código fuente React/Next.js
│   │   ├── app/            # App Router (Next.js 14)
│   │   ├── components/     # Componentes reutilizables
│   │   └── lib/            # Utilidades y helpers
│   └── Dockerfile          # Imagen de desarrollo
├── scripts/
│   ├── dev-setup.ps1       # Setup automático (PowerShell / Windows)
│   └── init-db.sh          # Inicialización de base de datos (Bash)
├── docs/
│   └── DEV_SETUP.md        # Este archivo
├── docker-compose.yml      # Orquestación de desarrollo
├── docker-compose.prod.yml # Override para producción
├── .env.example            # Plantilla de variables de entorno
└── .env                    # Variables de entorno locales (NO commitear)
```

---

## Pasos para Levantar el Proyecto

### Opción A: Setup Automático (PowerShell — Windows)

```powershell
.\scripts\dev-setup.ps1
```

Este script:
1. Verifica que Docker esté instalado
2. Crea el archivo `.env` (si no existe)
3. Inicia PostgreSQL
4. Espera a que esté listo
5. Ejecuta las migraciones
6. Levanta todos los servicios

### Opción B: Setup Manual (Paso a Paso)

#### 1. Clonar y configurar variables de entorno

```bash
cd tienda-camisetas-mvp
cp .env.example .env
# Editar .env si es necesario (las credenciales por defecto sirven para desarrollo)
```

#### 2. Iniciar solo la base de datos

```bash
docker compose up -d db
```

#### 3. Esperar a que PostgreSQL esté listo

```bash
docker ps  # Verificar que tienda_mvp_db tenga status "healthy"
```

#### 4. Ejecutar migraciones

**En Windows (PowerShell):**
```powershell
Get-Content api\migrations\001_enums.sql | docker exec -i tienda_mvp_db psql -U postgres -d tienda_mvp
Get-Content api\migrations\002_tables.sql | docker exec -i tienda_mvp_db psql -U postgres -d tienda_mvp
Get-Content api\migrations\003_views.sql | docker exec -i tienda_mvp_db psql -U postgres -d tienda_mvp
```

**En Linux/macOS (o Git Bash en Windows):**
```bash
bash scripts/init-db.sh
```

#### 5. Levantar todos los servicios

```bash
docker compose up -d
```

#### 6. Verificar que todo esté corriendo

```bash
docker compose ps
```

Deberías ver 3 servicios con estado `Up` (o `healthy`):
- `tienda_mvp_db`
- `tienda_mvp_api`
- `tienda_mvp_web`

---

## Acceso a los Servicios

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | [http://localhost:3000](http://localhost:3000) | Aplicación Next.js |
| **Backend API** | [http://localhost:8000](http://localhost:8000) | FastAPI |
| **API Docs (Swagger)** | [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs) | Documentación interactiva |
| **API Health** | [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health) | Healthcheck de la API |
| **Base de Datos** | `localhost:5432` | PostgreSQL 16 |

### Credenciales de Desarrollo

| Campo | Valor |
|-------|-------|
| **Usuario BD** | `postgres` |
| **Contraseña BD** | `postgres` |
| **Base de Datos** | `tienda_mvp` |
| **Host BD** (desde host) | `localhost:5432` |
| **Host BD** (entre contenedores) | `db:5432` |

---

## Comandos Útiles

### Ver logs de un servicio

```bash
docker compose logs -f api     # Backend
docker compose logs -f web     # Frontend
docker compose logs -f db      # Base de datos
```

### Reiniciar un servicio

```bash
docker compose restart api
```

### Reconstruir imágenes tras cambios en Dockerfile

```bash
docker compose build --no-cache api
docker compose up -d api
```

### Detener todos los servicios

```bash
docker compose down
```

### Detener y eliminar volúmenes (⚠ borra la BD)

```bash
docker compose down -v
```

### Conectarse a la base de datos

```bash
docker exec -it tienda_mvp_db psql -U postgres -d tienda_mvp
```

---

## Ejecutar Migraciones Manualmente

Las migraciones se encuentran en `api/migrations/` y deben ejecutarse en orden:

1. `001_enums.sql` — Tipos ENUM
2. `002_tables.sql` — Creación de 14 tablas
3. `003_views.sql` — Vistas

```bash
# Ejecutar una migración específica
docker exec -i tienda_mvp_db psql -U postgres -d tienda_mvp < api/migrations/001_enums.sql
```

---

## Trabajar Fuera de Docker (Opcional)

Si prefieres ejecutar los servicios directamente en tu máquina:

### Backend (FastAPI)

```bash
cd api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Asegúrate de tener PostgreSQL corriendo (puedes usar solo el contenedor db)
docker compose up -d db

# Iniciar API
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (Next.js)

```bash
cd web
npm install
npm run dev
```

---

## Solución de Problemas

### Error: "port is already allocated"
Algún servicio ya está usando los puertos 3000, 8000 o 5432. Detén esos procesos o cambia los puertos en `docker-compose.yml`.

### Error: "dependency failed to start: container tienda_mvp_db is unhealthy"
La base de datos no inició correctamente. Revisa los logs:
```bash
docker compose logs db
```

### La API no puede conectarse a la BD
Verifica que `DATABASE_URL` en `.env` use `db` como host (no `localhost`):
```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/tienda_mvp
```

### Cambios en el código no se reflejan
- **Backend**: El código se monta con hot-reload. Si no se actualiza, reinicia el contenedor: `docker compose restart api`
- **Frontend**: Igual, Next.js tiene hot-reload. Si falla, `docker compose restart web`

---

## Variables de Entorno

Todas las variables están documentadas en `.env.example`. Las más importantes:

| Variable | Descripción | Default (dev) |
|----------|-------------|---------------|
| `POSTGRES_USER` | Usuario de BD | `postgres` |
| `POSTGRES_PASSWORD` | Contraseña de BD | `postgres` |
| `POSTGRES_DB` | Nombre de BD | `tienda_mvp` |
| `DATABASE_URL` | URL async para SQLAlchemy | `postgresql+asyncpg://...` |
| `SECRET_KEY` | Llave para JWT | (aleatoria, 64 chars) |
| `CORS_ORIGINS` | Orígenes permitidos para CORS | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | URL de la API para el frontend | `http://localhost:8000/api/v1` |
