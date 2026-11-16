import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import (
    audits,
    auth,
    documents,
    entities,
    expirations,
    folders,
    health,
    notifications,
    search,
    settings as settings_routes,
    vehicles,
)
from app.core.config import get_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)

app.include_router(health.router)
app.include_router(auth.router, prefix="/api/v1")
app.include_router(folders.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(vehicles.router, prefix="/api/v1")
app.include_router(expirations.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(audits.router, prefix="/api/v1")
app.include_router(entities.workers_router, prefix="/api/v1")
app.include_router(entities.companies_router, prefix="/api/v1")
app.include_router(entities.manifests_router, prefix="/api/v1")
app.include_router(entities.invoices_router, prefix="/api/v1")
app.include_router(settings_routes.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
