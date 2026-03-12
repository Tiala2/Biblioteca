param(
  [ValidateSet("dev", "prod")]
  [string]$Mode = "dev"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$composeFile = if ($Mode -eq "prod") { "docker-compose.prod.yml" } else { "docker-compose.dev.yml" }

Write-Host "Stopping containers without removing data..."
docker compose -f $composeFile stop

Write-Host ""
Write-Host "Stopped. Data remains in volumes:"
Write-Host "- library-api-projeto_library-data"
Write-Host "- library-api-projeto_minio-data"
