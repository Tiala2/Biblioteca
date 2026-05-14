param(
  [switch]$BuildBackend,
  [ValidateSet("dev", "prod")]
  [string]$Mode = "dev"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$apiPort = if ($env:API_PORT) { [int]$env:API_PORT } else { 8080 }
$env:API_PORT = "$apiPort"
if (-not $env:API_PUBLIC_BASE_URL) {
  $env:API_PUBLIC_BASE_URL = "http://localhost:$apiPort"
}
if (-not $env:VITE_API_BASE_URL) {
  $env:VITE_API_BASE_URL = "http://localhost:$apiPort"
}

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
Write-Host "API URL: $env:VITE_API_BASE_URL"
$frontScript = Join-Path $root "frontend\scripts\front-dev-safe.ps1"
& powershell -ExecutionPolicy Bypass -File $frontScript
