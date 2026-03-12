$ErrorActionPreference = "Continue"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$apiUrl = "http://localhost:8080/actuator/health"
Write-Host "Checking API at $apiUrl ..."

for ($i = 0; $i -lt 15; $i++) {
  try {
    $resp = Invoke-RestMethod -Method GET -Uri $apiUrl -TimeoutSec 4
    if ($resp.status -eq "UP") {
      Write-Host "API is UP. Starting frontend..."
      break
    }
  } catch {
    if ($i -eq 14) {
      Write-Warning "API not ready yet. Frontend will start, but requests may fail for a moment."
    } else {
      Start-Sleep -Seconds 2
    }
  }
}

$port = 5173
$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($null -ne $listener) {
  $ownerPid = $listener.OwningProcess
  $proc = Get-Process -Id $ownerPid -ErrorAction SilentlyContinue
  if ($proc -and $proc.ProcessName -like "node*") {
    Write-Warning "Port 5173 already in use by node (PID $ownerPid). Closing old frontend process..."
    Stop-Process -Id $ownerPid -Force
    Start-Sleep -Seconds 1
  } else {
    Write-Error "Port 5173 is busy by another app (PID $ownerPid). Close it and run again."
    exit 1
  }
}

npm.cmd run dev -- --port 5173 --strictPort
