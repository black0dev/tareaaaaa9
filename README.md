# Tienda de Camisetas MVP 🛒

Tienda online de camisetas con catálogo, carrito de compras como invitado, checkout transaccional y panel administrativo.

## Stack Tecnológico

| Capa          | Tecnología              |
|---------------|-------------------------|
| Frontend      | Next.js 16 + Tailwind CSS |
| Backend       | FastAPI (Python 3.11)     |
| Base de datos | PostgreSQL 16             |
| Auth          | JWT + bcrypt              |
| Infraestructura | Docker + Docker Compose |

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Node.js 20+](https://nodejs.org/) (para desarrollo local del frontend)
- [Git](https://git-scm.com/)

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/black0dev/tareaaaaa9.git
cd tareaaaaa9
```

### 2. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
copy .env.example .env
```

> ⚠️ **Importante**: Cambia `SECRET_KEY` en `.env` por un valor seguro en producción.

### 3. Levantar los servicios

```bash
# Iniciar base de datos
docker compose up -d db

# Ejecutar migraciones (Windows PowerShell)
Get-Content api/migrations/001_enums.sql -Raw | docker exec -i tienda_mvp_db psql -U postgres -d tienda_mvp
Get-Content api/migrations/002_tables.sql -Raw | docker exec -i tienda_mvp_db psql -U postgres -d tienda_mvp
Get-Content api/migrations/003_views.sql -Raw | docker exec -i tienda_mvp_db psql -U postgres -d tienda_mvp
Get-Content api/migrations/004_seed.sql -Raw | docker exec -i tienda_mvp_db psql -U postgres -d tienda_mvp

# Construir y levantar backend
docker compose up -d --build api

# Instalar dependencias del frontend
cd web
npm install
npm run dev
```

### 4. Acceder a la aplicación

| Servicio                     | URL                                      |
|------------------------------|------------------------------------------|
| 🛒 Tienda pública             | [http://localhost:3000](http://localhost:3000) |
| 🔐 Panel administrador       | [http://localhost:3000/admin/login](http://localhost:3000/admin/login) |
| 🔧 API REST                  | [http://localhost:8000/api/v1](http://localhost:8000/api/v1) |
| 📖 Swagger Docs              | [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs) |
| 🩺 Health Check              | [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health) |

## Credenciales de desarrollo

| Rol         | Email              | Contraseña |
|-------------|--------------------|------------|
| Administrador | admin@tienda.com   | admin123   |

> ⚠️ Cambia estas credenciales antes de desplegar en producción.

## Estructura del proyecto

```
├── api/                     # Backend FastAPI
│   ├── app/
│   │   ├── models/          # Modelos SQLAlchemy
│   │   ├── routers/         # Endpoints REST
│   │   ├── schemas/         # Esquemas Pydantic
│   │   └── services/        # Lógica de negocio
│   └── migrations/          # Migraciones SQL
├── web/                     # Frontend Next.js
│   └── src/
│       ├── app/             # Páginas (App Router)
│       ├── components/      # Componentes reutilizables
│       └── lib/             # Utilidades y contextos
├── scripts/                 # Scripts de utilidad
├── docs/                    # Documentación
├── docker-compose.yml       # Orquestación de servicios
└── .env.example             # Plantilla de variables de entorno
```

## Endpoints principales

### Públicos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/products` | Lista de productos |
| GET | `/api/v1/products/{slug}` | Detalle de producto |
| GET | `/api/v1/categories` | Lista de categorías |
| GET | `/api/v1/config` | Configuración pública |
| POST | `/api/v1/checkout/orders` | Crear pedido (invitado) |

### Admin (requiere JWT)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/admin/auth/login` | Iniciar sesión |
| GET/POST/PUT/DELETE | `/api/v1/admin/products` | CRUD productos |
| POST | `/api/v1/admin/products/{id}/variants` | Crear variante |
| POST | `/api/v1/admin/products/{id}/images` | Subir imagen |
| GET | `/api/v1/admin/orders` | Listar pedidos |
| GET | `/api/v1/admin/orders/{id}` | Detalle de pedido |
| POST | `/api/v1/admin/orders/{id}/status-transitions` | Cambiar estado |
| POST | `/api/v1/admin/orders/{id}/payments/manual-confirmation` | Confirmar pago |
| POST | `/api/v1/admin/stock/adjustments` | Ajustar stock |

## Comandos útiles

```bash
# Ver logs
docker compose logs -f api
docker compose logs -f db

# Reiniciar servicios
docker compose restart api

# Detener todo
docker compose down

# Detener y borrar datos
docker compose down -v
```

## Licencia

Este proyecto es para uso educativo y demostración.
