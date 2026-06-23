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
$checksumsFile = Join-Path $resolvedBackupDir "checksums.sha256"
$databaseContainer = "backend-library-1"
$containerDumpPath = "/tmp/library-restore.sql"

if (-not (Test-Path $dbFile)) {
  throw "Arquivo nao encontrado: $dbFile"
}

if (-not (Test-Path $minioArchive)) {
  throw "Arquivo nao encontrado: $minioArchive"
}

if ((Get-Item -LiteralPath $dbFile).Length -le 0) {
  throw "Dump PostgreSQL vazio: $dbFile"
}

if ((Get-Item -LiteralPath $minioArchive).Length -le 0) {
  throw "Backup MinIO vazio: $minioArchive"
}

if (Test-Path -LiteralPath $checksumsFile) {
  $expectedHashes = @{}
  foreach ($line in Get-Content -LiteralPath $checksumsFile) {
    if ($line -match "^([a-fA-F0-9]{64})\s{2}(.+)$") {
      $expectedHashes[$matches[2]] = $matches[1].ToLowerInvariant()
    }
  }

  foreach ($file in @($dbFile, $minioArchive)) {
    $fileName = [System.IO.Path]::GetFileName($file)
    if (-not $expectedHashes.ContainsKey($fileName)) {
      throw "Checksum ausente para $fileName."
    }

    $actualHash = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualHash -ne $expectedHashes[$fileName]) {
      throw "Checksum invalido para $fileName."
    }
  }

  Write-Host "Checksums do backup validados."
}

Write-Host "Restaurando banco de dados a partir de $dbFile"
docker exec $databaseContainer sh -lc 'psql -U "$POSTGRES_USER" "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"'
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao preparar o banco para restauracao."
}

docker cp $dbFile "${databaseContainer}:${containerDumpPath}"
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao copiar o dump para o container PostgreSQL."
}

try {
  docker exec $databaseContainer sh -lc 'psql -U "$POSTGRES_USER" "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f /tmp/library-restore.sql'
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao restaurar o dump PostgreSQL."
  }
} finally {
  docker exec $databaseContainer rm -f $containerDumpPath | Out-Null
}

Write-Host "Restaurando arquivos do MinIO a partir de $minioArchive"
docker run --rm `
  -v library-api-projeto_minio-data:/data `
  -v "${resolvedBackupDir}:/backup" `
  alpine sh -c "rm -rf /data/* && tar -xzf /backup/minio-data.tar.gz -C /data"

Write-Host "Restauracao concluida com sucesso."
