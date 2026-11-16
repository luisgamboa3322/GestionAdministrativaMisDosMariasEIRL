# Despliegue en la Nube ($0/mes) — Supabase + Cloudflare R2 + Render + Vercel

Esta guía prepara **MIS DOS MARÍAS E.I.R.L. Document Manager** para producción en la nube con una base de datos limpia y almacenamiento privado escalable para PDF, JPG, PNG, Word, Excel y ZIP.

---

## Arquitectura en la Nube
- **Frontend + Proxy (`same-origin`):** **Vercel** ([vercel.json](file:///d:/GestionAdministrativaMisDosMariasEIRL/vercel.json))
- **Backend FastAPI:** **Render Free** ([render.yaml](file:///d:/GestionAdministrativaMisDosMariasEIRL/render.yaml), [Dockerfile](file:///d:/GestionAdministrativaMisDosMariasEIRL/services/api/Dockerfile))
- **Base de datos PostgreSQL:** **Supabase** (solo tablas/metadatos, limpia desde cero)
- **Almacenamiento privado de archivos (PDF, JPG, PNG, Word, Excel, ZIP):** **Cloudflare R2** (recomendado por sus 10 GB/mes gratuitos y descarga sin costo de egreso) o **Supabase Storage S3**

---

## Paso 1 — Base de datos limpia en Supabase
1. Crea un proyecto nuevo en [Supabase](https://supabase.com/).
2. Ve a **Connect** → elige **Session pooler** (puerto `5432`, compatible con IPv4).
3. Copia la URL y reemplaza el prefijo `postgresql://` por `postgresql+psycopg://` agregando `?sslmode=require` al final:
   ```text
   postgresql+psycopg://postgres.<tu_ref>:<tu_password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
   ```

---

## Paso 2 — Almacenamiento privado de archivos (Cloudflare R2 o Supabase Storage)

### Opción recomendada: Cloudflare R2 (para muchos PDF, fotos, Word y Excel)
1. En [Cloudflare](https://dash.cloudflare.com/) → **R2 Object Storage** → crea un bucket privado llamado `misdosmarias-docs` (sin acceso público).
2. Ve a **Manage R2 API Tokens** → **Create API token** con permiso **Object Read & Write** sobre `misdosmarias-docs`.
3. Guarda:
   - `S3_ENDPOINT_URL`: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
   - `S3_REGION`: `auto`
   - `S3_ACCESS_KEY`: tu Access Key ID
   - `S3_SECRET_KEY`: tu Secret Access Key
   - `S3_BUCKET_NAME`: `misdosmarias-docs`
   - `S3_USE_SSL`: `true`
   - `S3_AUTO_CREATE_BUCKET`: `false`

*(Si prefieres usar **Supabase Storage** en lugar de R2, crea un bucket privado en Supabase → Storage, activa **S3 Access Keys** en Project Settings → Storage, y usa tu `S3_ENDPOINT_URL` de Supabase con `S3_REGION` igual a la región de tu proyecto).*

---

## Paso 3 — Inicializar tablas limpias y cuenta única de la Gerente General
Desde tu PC (sin subir secretos al repositorio), ejecuta una única vez apuntando a tu `DATABASE_URL` de Supabase:

```powershell
cd services/api
$env:DATABASE_URL="postgresql+psycopg://postgres.<tu_ref>:<tu_password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require"
$env:INITIAL_MANAGER_EMAIL="gerencia@misdosmarias.pe"
$env:INITIAL_MANAGER_PASSWORD="CAMBIA_POR_CLAVE_SEGURA_REAL"

uv run alembic upgrade head
uv run python -m app.services.seed
```

Esto crea únicamente:
- Las 21 tablas vacías (sin datos ficticios).
- La organización `MIS DOS MARÍAS E.I.R.L.`.
- Las 12 categorías documentales y 3 plantillas base.
- La cuenta real de la Gerente General.

---

## Paso 4 — Desplegar Backend en Render
1. Sube tus últimos cambios a tu repositorio de GitHub (`git add . && git commit && git push`).
2. En [Render](https://render.com/) → **New +** → **Blueprint** (o **Web Service** con Docker apuntando a `services/api/Dockerfile`).
3. Configura las variables de entorno en Render:
   - `APP_ENV=production`
   - `TIMEZONE=America/Lima`
   - `SESSION_COOKIE_SECURE=true`
   - `S3_USE_SSL=true`
   - `S3_AUTO_CREATE_BUCKET=false`
   - `S3_REGION=auto`
   - `DATABASE_URL` (la de Supabase Session Pooler)
   - `S3_ENDPOINT_URL`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET_NAME`
   - `SESSION_SECRET_KEY` (cadena aleatoria de 64+ caracteres)
   - `FRONTEND_ORIGINS=https://tu-proyecto.vercel.app` (la actualizarás con tu URL final de Vercel)
4. Cuando Render termine el deploy, copia tu URL `https://tu-backend.onrender.com` y verifica `https://tu-backend.onrender.com/health`.

---

## Paso 5 — Desplegar Frontend en Vercel
1. En [vercel.json](file:///d:/GestionAdministrativaMisDosMariasEIRL/vercel.json), reemplaza `https://REEMPLAZA-TU-BACKEND.onrender.com` por la URL real de tu servicio en Render y haz `git push`.
2. En [Vercel](https://vercel.com/) → **Add New Project** → importa tu repositorio de GitHub (Framework: **Vite**).
3. En **Environment Variables** de Vercel agrega:
   - `VITE_ENABLE_DEMO=false` *(oculta el botón "Modo demostración" para que la gerente solo vea su inicio de sesión real)*.
4. Despliega, copia tu URL `https://tu-proyecto.vercel.app` y actualiza `FRONTEND_ORIGINS` en Render con esa URL exacta.

---

## Recomendaciones operativas
- **Respaldo:** Programa respaldos periódicos de tu PostgreSQL en Supabase con `pg_dump` antes de acumular documentación crítica.
- **Render Free:** Si la app estuvo sin uso >15 min, el primer acceso del día tardará ~30–50 segundos en despertar; los archivos en R2/Supabase no se ven afectados.
- **Supabase Free:** Si pasan más de 7 días sin actividad, Supabase puede pausar la base (se reactiva en 1 clic desde su dashboard).
