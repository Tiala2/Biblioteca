param(
  [switch]$Build,
  [ValidateSet("dev", "prod")]
  [string]$Mode = "dev"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$composeFile = if ($Mode -eq "prod") { "docker-compose.prod.yml" } else { "docker-compose.dev.yml" }

# Persisted named volumes (never removed by normal workflow)
$requiredVolumes = @(
  "library-api-projeto_library-data",
  "library-api-projeto_minio-data"
)

foreach ($volume in $requiredVolumes) {
  docker volume inspect $volume *> $null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating missing volume: $volume"
    docker volume create $volume | Out-Null
  }
}

$args = @("compose", "-f", $composeFile, "up", "-d", "--remove-orphans")
if ($Build) {
  $args += "--build"
}

Write-Host "Starting stack..."
docker @args
if ($LASTEXITCODE -ne 0) {
  throw "docker compose up failed"
}

Write-Host ""
Write-Host "Current containers:"
docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"

Write-Host ""
Write-Host "Tip: wait until API is healthy in logs before testing:"
Write-Host "docker logs -f backend-api-1"
