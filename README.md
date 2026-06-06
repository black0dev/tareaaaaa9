# Tienda de Camisetas MVP 🛒

Tienda online de camisetas con catálogo, carrito de compras como invitado, checkout transaccional y panel administrativo.

## Stack Tecnológico

| Capa          | Tecnología              |
|---------------|-------------------------|
| Frontend      | Next.js 16 + Tailwind CSS |
| Backend       | FastAPI (Python 3.11+)    |
| Base de datos | SQLite                    |
| Auth          | JWT + bcrypt              |

## Requisitos

- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 20+](https://nodejs.org/)
- [Git](https://git-scm.com/)

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/black0dev/tareaaaaa9.git
cd tareaaaaa9
```

### 2. Backend (FastAPI + SQLite)

```bash
cd api

# Instalar dependencias
py -m pip install -r requirements.txt

# Inicializar base de datos (crea tablas y datos de prueba)
py init_db.py

# Iniciar servidor
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend (Next.js)

En otra terminal:

```bash
cd web

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
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
│   │   ├── models/          # Modelos SQLAlchemy (SQLite)
│   │   ├── routers/         # Endpoints REST
│   │   ├── schemas/         # Esquemas Pydantic
│   │   └── services/        # Lógica de negocio
│   ├── init_db.py           # Inicialización de BD y seed
│   └── tienda.db            # Archivo SQLite (autogenerado)
├── web/                     # Frontend Next.js
│   └── src/
│       ├── app/             # Páginas (App Router)
│       ├── components/      # Componentes reutilizables
│       └── lib/             # Utilidades y contextos
└── README.md
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
| GET/POST | `/api/v1/admin/products/{id}/variants` | Gestionar variantes |
| POST | `/api/v1/admin/products/{id}/images` | Subir imagen |
| GET | `/api/v1/admin/orders` | Listar pedidos |
| GET | `/api/v1/admin/orders/{id}` | Detalle de pedido |
| POST | `/api/v1/admin/orders/{id}/status-transitions` | Cambiar estado |
| POST | `/api/v1/admin/orders/{id}/payments/manual-confirmation` | Confirmar pago |
| POST | `/api/v1/admin/stock/adjustments` | Ajustar stock |

## Solución de problemas

```bash
# Si hay errores de BD, reiniciar desde cero:
cd api
del tienda.db
py init_db.py

# Verificar que la BD tiene datos:
py test_db.py

# Limpiar caché de Next.js:
cd web
del /s /q .next
npm run dev
```

## Licencia

Este proyecto es para uso educativo y demostración.

