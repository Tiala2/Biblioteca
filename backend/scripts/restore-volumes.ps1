param(
  [Parameter(Mandatory = $true)]
  [string]$BackupDir,
  [switch]$Force
)

$ErrorActionPreference = "Stop"

if (-not $Force) {
  throw "Use -Force para confirmar a restauracao. O processo substitui banco e arquivos atuais."
}

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$resolvedBackupDir = Resolve-Path $BackupDir -ErrorAction Stop
$dbFile = Join-Path $resolvedBackupDir "postgres-library.sql"
$minioArchive = Join-Path $resolvedBackupDir "minio-data.tar.gz"

if (-not (Test-Path $dbFile)) {
  throw "Arquivo nao encontrado: $dbFile"
}

if (-not (Test-Path $minioArchive)) {
  throw "Arquivo nao encontrado: $minioArchive"
}

Write-Host "Restaurando banco de dados a partir de $dbFile"
docker exec backend-library-1 sh -lc 'psql -U "$POSTGRES_USER" "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"'
Get-Content $dbFile | docker exec -i backend-library-1 sh -lc 'psql -U "$POSTGRES_USER" "$POSTGRES_DB" -v ON_ERROR_STOP=1'

Write-Host "Restaurando arquivos do MinIO a partir de $minioArchive"
docker run --rm `
  -v library-api-projeto_minio-data:/data `
  -v "${resolvedBackupDir}:/backup" `
  alpine sh -c "rm -rf /data/* && tar -xzf /backup/minio-data.tar.gz -C /data"

Write-Host "Restauracao concluida com sucesso."
