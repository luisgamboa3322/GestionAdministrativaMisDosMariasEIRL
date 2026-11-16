# MIS DOS MARÍAS E.I.R.L. — Document Manager (TransportDocs)

Sistema de gestión documental empresarial, control de flota, vencimientos y preparación automatizada de auditorías para **MIS DOS MARÍAS E.I.R.L.** (transporte de personal, La Libertad, Perú).

## Arquitectura del proyecto

- **Frontend (`src/`):** React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + Motion + Lucide React, con diseño responsive (desktop, tablet y móvil) y soporte PWA (`public/manifest.webmanifest`, `public/sw.js`).
- **Backend (`services/api/`):** Python + FastAPI + SQLAlchemy 2 + Alembic + PostgreSQL + almacenamiento privado compatible con S3 (MinIO en desarrollo).
- **Seguridad:**
  - Sesión única protegida mediante cookies `HttpOnly`, `SameSite=Lax` y verificación de origen CSRF.
  - Contraseñas cifradas con Argon2 (`pwdlib`).
  - Validación de extensiones, límite de tamaño (25 MB), verificación de firmas binarias (*magic bytes*), saneamiento contra *path traversal* y descarga autenticada (`X-Content-Type-Options: nosniff`).
  - El Service Worker PWA nunca almacena documentos privados ni respuestas de `/api/*`.

## Estructura principal

```text
├── docker-compose.yml          # PostgreSQL 16 + MinIO (S3 local privado)
├── .env.example                # Plantilla de variables de entorno
├── public/
│   ├── manifest.webmanifest    # Manifiesto PWA instalable
│   └── sw.js                   # Service Worker sin caché de documentos privados
├── src/
│   ├── components/             # Layout (Sidebar, Topbar, MobileNav) y UI base
│   ├── data/demo.ts            # Datos ficticios para modo demostración
│   ├── features/               # Módulos por dominio (auth, files, vehicles, workers, business, audits, expirations, settings)
│   ├── lib/api.ts              # Cliente HTTP tipado hacia /api/v1
│   ├── types/                  # Tipos TypeScript
│   └── utils/                  # Fechas y evaluación documental
└── services/api/
    ├── alembic/                # Migraciones de esquema PostgreSQL
    ├── app/api/v1/routes/      # auth, folders, documents, vehicles, audits, expirations, search, entities, health
    ├── app/core/               # config, database, security, storage
    ├── app/models/             # Modelo relacional normalizado (21 tablas)
    ├── app/services/seed.py    # Bootstrap inicial del Gerente General
    └── tests/                  # Suite Pytest + HTTPX
```

## Ejecución en Windows 11

### 1. Variables de entorno
```powershell
Copy-Item .env.example .env
```
Edita `.env` y define tus claves locales (`POSTGRES_PASSWORD`, `S3_SECRET_KEY`, `SESSION_SECRET_KEY` y `INITIAL_MANAGER_PASSWORD`).

### 2. Base de datos y almacenamiento privado (Docker Desktop)
```powershell
docker compose up -d
```

### 3. Migraciones, cuenta inicial del Gerente General y API Backend
```powershell
cd services/api
uv sync --python 3.13
uv run alembic upgrade head
uv run python -m app.services.seed
uv run uvicorn app.main:app --reload --port 8000
```

### 4. Frontend (Vite)
En la raíz del proyecto:
```powershell
pnpm install
pnpm run dev
```
Abre `http://localhost:8443/` en tu navegador. Puedes iniciar sesión con la cuenta real creada en el paso 3 o entrar al **Modo demostración** con datos ficticios.

## Pruebas y verificación

### Backend
```powershell
cd services/api
uv run pytest -v
```

### Frontend
```powershell
pnpm exec tsc --noEmit --noUnusedLocals
pnpm test
pnpm run build
```

### Copias de seguridad (PostgreSQL + MinIO)
```powershell
.\infrastructure\scripts\backup.ps1
# Restaurar desde una carpeta de respaldo:
.\infrastructure\scripts\restore.ps1 -BackupDir .\backups\<timestamp>
```
