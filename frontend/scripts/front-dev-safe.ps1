$ErrorActionPreference = "Continue"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$apiUrl = "http://localhost:8080/actuator/health"
Write-Host "Checking API at $apiUrl ..."

# Loop de verificação de saúde da API
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
      Start-Sleep -Seconds 5
    }
  }
}

$port = 5173

# LÓGICA MULTIPLATAFORMA PARA VERIFICAR A PORTA
if ($IsLinux) {
    # No Linux (Pop!_OS), usamos o comando 'ss' para ver as portas
    $portBusy = bash -c "ss -tuln | grep :$port"
    if ($portBusy) {
        Write-Warning "Porta $port parece estar em uso. Se o Vite falhar, verifique se ja existe um processo rodando."
    }
} else {
    # No Windows, mantém a lógica original
    $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $listener) {
        Stop-Process -Id $listener.OwningProcess -Force
    }
}

# Execução do NPM agnóstica (funciona em ambos)
npm run dev -- --port 5173 --strictPort