param(
  [int]$Retries = 2,
  [ValidateSet("dev", "prod")]
  [string]$Mode = "dev"
)

$ErrorActionPreference = "Continue"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$composeFile = if ($Mode -eq "prod") { "docker-compose.prod.yml" } else { "docker-compose.dev.yml" }

for ($attempt = 1; $attempt -le $Retries; $attempt++) {
  Write-Host "Rebuild attempt $attempt/$Retries..."
  docker compose -f $composeFile up -d --build --remove-orphans
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Rebuild completed."
    docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"
    exit 0
  }

  Write-Warning "Build failed on attempt $attempt."
  Start-Sleep -Seconds 3
}

throw "Failed to rebuild stack after $Retries attempts."
