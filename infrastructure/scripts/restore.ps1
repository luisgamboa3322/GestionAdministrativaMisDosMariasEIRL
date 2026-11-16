param(
    [Parameter(Mandatory = $true)]
    [string]$BackupDir
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupDir)) {
    throw "No existe la carpeta de respaldo: $BackupDir"
}

$dumpFile = Join-Path $BackupDir "postgres.dump"
$minioArchive = Join-Path $BackupDir "minio_data.tar.gz"
if (-not (Test-Path $dumpFile) -or -not (Test-Path $minioArchive)) {
    throw "La carpeta debe contener postgres.dump y minio_data.tar.gz"
}

$pgUser = "transportdocs"
$pgDb = "mis_dos_marias"
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^POSTGRES_USER=(.+)$") { $pgUser = $Matches[1].Trim() }
        if ($_ -match "^POSTGRES_DB=(.+)$") { $pgDb = $Matches[1].Trim() }
    }
}

Write-Host "Restaurando PostgreSQL ($pgDb)..."
Get-Content $dumpFile -Raw -Encoding Byte | docker exec -i mdm-postgres pg_restore -U $pgUser -d $pgDb --clean --if-exists

Write-Host "Restaurando volumen de MinIO..."
docker run --rm `
  -v gestionadministrativamisdosmariaseirl_mdm_minio_data:/data `
  -v "${PWD}/${BackupDir}:/backup:ro" `
  alpine sh -c "rm -rf /data/* && tar xzf /backup/minio_data.tar.gz -C /data"

Write-Host "Restauración completada desde $BackupDir"
