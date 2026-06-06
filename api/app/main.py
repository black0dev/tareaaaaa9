from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.exceptions import AppError
from app.routers import admin_auth, admin_orders, admin_stock, catalog, checkout, health

app = FastAPI(
    title="Tienda de Camisetas MVP API",
    version="1.0.0",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    openapi_url="/api/v1/openapi.json",
)

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1")
app.include_router(catalog.router, prefix="/api/v1")
app.include_router(checkout.router, prefix="/api/v1")
app.include_router(admin_auth.router, prefix="/api/v1")
app.include_router(admin_orders.router, prefix="/api/v1")
app.include_router(admin_stock.router, prefix="/api/v1")

HTTP_STATUS_TO_CODE: dict[int, str] = {
    400: "bad_request",
    401: "invalid_credentials",
    403: "forbidden",
    404: "not_found",
    409: "conflict",
    422: "validation_error",
}


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "ok": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    code = HTTP_STATUS_TO_CODE.get(exc.status_code, "error")
    detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "ok": False,
            "error": {
                "code": code,
                "message": detail,
                "details": None,
            },
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "ok": False,
            "error": {
                "code": "internal_error",
                "message": "Error interno del servidor.",
                "details": None,
            },
        },
    )
