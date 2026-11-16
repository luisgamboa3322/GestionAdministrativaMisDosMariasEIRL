param(
    [string]$OutputDir = "backups"
)

$ErrorActionPreference = "Stop"

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$targetDir = Join-Path $OutputDir $timestamp
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

# Cargar variables de .env si existe
$pgUser = "transportdocs"
$pgDb = "mis_dos_marias"
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^POSTGRES_USER=(.+)$") { $pgUser = $Matches[1].Trim() }
        if ($_ -match "^POSTGRES_DB=(.+)$") { $pgDb = $Matches[1].Trim() }
    }
}

Write-Host "Respaldando PostgreSQL ($pgDb)..."
docker exec mdm-postgres pg_dump -U $pgUser -Fc $pgDb > (Join-Path $targetDir "postgres.dump")

Write-Host "Respaldando volumen de MinIO..."
docker run --rm `
  -v gestionadministrativamisdosmariaseirl_mdm_minio_data:/data:ro `
  -v "${PWD}/${targetDir}:/backup" `
  alpine tar czf /backup/minio_data.tar.gz -C /data .

Write-Host "Backup completado en: $targetDir"
