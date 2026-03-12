param(
  [string]$OutputDir = "backups"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Resolve-Path $OutputDir -ErrorAction SilentlyContinue
if (-not $backupRoot) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
  $backupRoot = Resolve-Path $OutputDir
}

$target = Join-Path $backupRoot $timestamp
New-Item -ItemType Directory -Path $target | Out-Null

Write-Host "Backup folder: $target"

# DB dump
$dbFile = Join-Path $target "postgres-library.sql"
Write-Host "Backing up PostgreSQL..."
docker exec backend-library-1 sh -lc 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > $dbFile

# MinIO volume dump
Write-Host "Backing up MinIO volume..."
docker run --rm `
  -v library-api-projeto_minio-data:/data `
  -v "${target}:/backup" `
  alpine sh -c "tar -czf /backup/minio-data.tar.gz -C /data ."

Write-Host "Backup completed:"
Write-Host "- $dbFile"
Write-Host "- $(Join-Path $target 'minio-data.tar.gz')"
