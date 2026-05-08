param(
  [switch]$Build,
  [ValidateSet("dev", "prod")]
  [string]$Mode = "dev"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$composeFile = if ($Mode -eq "prod") { "docker-compose.prod.yml" } else { "docker-compose.dev.yml" }

$requiredPorts = @(8080, 5437, 9000, 9001)
if ($Mode -eq "dev") {
  $requiredPorts += @(1025, 8025)
}
$busyPorts = @()

foreach ($port in $requiredPorts) {
  $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -ne $listener) {
    $ownerPid = $listener.OwningProcess
    $process = Get-Process -Id $ownerPid -ErrorAction SilentlyContinue
    $processName = if ($process) { $process.ProcessName } else { "unknown" }
    $busyPorts += [pscustomobject]@{
      Port = $port
      PID = $ownerPid
      Process = $processName
    }
  }
}

if ($busyPorts.Count -gt 0) {
  Write-Error "The backend stack cannot start because one or more required ports are already in use."
  $busyPorts | Format-Table -AutoSize | Out-String | Write-Host
  Write-Host "Close the listed process or stop the container using it, then run this script again."
  Write-Host "Docker containers currently running:"
  docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"
  exit 1
}

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
