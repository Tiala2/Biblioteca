param(
  [switch]$BuildBackend,
  [ValidateSet("dev", "prod")]
  [string]$Mode = "dev"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting backend stack ($Mode)..."
$backendScript = Join-Path $root "backend\scripts\docker-up-safe.ps1"
$backendArgs = @("-ExecutionPolicy", "Bypass", "-File", $backendScript, "-Mode", $Mode)
if ($BuildBackend) {
  $backendArgs += "-Build"
}

& powershell @backendArgs
if ($LASTEXITCODE -ne 0) {
  throw "Backend startup failed."
}

Write-Host ""
Write-Host "Starting frontend dev server..."
$frontScript = Join-Path $root "frontend\scripts\front-dev-safe.ps1"
& powershell -ExecutionPolicy Bypass -File $frontScript
