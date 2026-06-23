param(
  [string]$OutputDir = "backups"
)

$ErrorActionPreference = "Stop"
$databaseContainer = "backend-library-1"
$minioVolume = "library-api-projeto_minio-data"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker nao foi encontrado no PATH."
}

$runningContainers = docker ps --format "{{.Names}}"
if ($LASTEXITCODE -ne 0) {
  throw "Nao foi possivel consultar os containers Docker."
}

if ($runningContainers -notcontains $databaseContainer) {
  throw "Container $databaseContainer nao esta em execucao."
}

docker volume inspect $minioVolume *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Volume $minioVolume nao foi encontrado."
}

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
$dbDump = docker exec $databaseContainer sh -lc 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"'
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao gerar o dump do PostgreSQL."
}
$utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($dbFile, [string[]]$dbDump, $utf8WithoutBom)

# MinIO volume dump
Write-Host "Backing up MinIO volume..."
docker run --rm `
  -v "${minioVolume}:/data" `
  -v "${target}:/backup" `
  alpine sh -c "tar -czf /backup/minio-data.tar.gz -C /data ."
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao gerar o backup do volume MinIO."
}

$minioFile = Join-Path $target "minio-data.tar.gz"
$backupFiles = @($dbFile, $minioFile)

foreach ($file in $backupFiles) {
  if (-not (Test-Path -LiteralPath $file)) {
    throw "Arquivo de backup nao foi criado: $file"
  }

  if ((Get-Item -LiteralPath $file).Length -le 0) {
    throw "Arquivo de backup vazio: $file"
  }
}

if (-not (Select-String -Path $dbFile -Pattern "PostgreSQL database dump" -Quiet)) {
  throw "O dump PostgreSQL nao possui o cabecalho esperado."
}

$dbPrefix = [System.IO.File]::ReadAllBytes($dbFile)
if ($dbPrefix.Length -ge 2 -and $dbPrefix[0] -eq 0xFF -and $dbPrefix[1] -eq 0xFE) {
  throw "O dump PostgreSQL foi gravado em UTF-16; o formato esperado e UTF-8."
}

$checksumsFile = Join-Path $target "checksums.sha256"
$checksumLines = foreach ($file in $backupFiles) {
  $hash = Get-FileHash -LiteralPath $file -Algorithm SHA256
  "$($hash.Hash.ToLowerInvariant())  $([System.IO.Path]::GetFileName($file))"
}
$checksumLines | Set-Content -LiteralPath $checksumsFile -Encoding ascii

$metadataFile = Join-Path $target "backup-metadata.json"
$metadata = [ordered]@{
  createdAt = (Get-Date).ToString("o")
  databaseContainer = $databaseContainer
  minioVolume = $minioVolume
  files = foreach ($file in $backupFiles) {
    $item = Get-Item -LiteralPath $file
    [ordered]@{
      name = $item.Name
      sizeBytes = $item.Length
      sha256 = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()
    }
  }
}
$metadata | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $metadataFile -Encoding utf8

Write-Host "Backup completed:"
Write-Host "- $dbFile"
Write-Host "- $minioFile"
Write-Host "- $checksumsFile"
Write-Host "- $metadataFile"
