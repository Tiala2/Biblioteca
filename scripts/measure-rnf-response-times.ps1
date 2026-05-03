param(
  [string]$ApiBase = "http://localhost:8080",
  [int]$Iterations = 5,
  [string]$OutputFile = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot "..")) "docs\generated\response-time-report.json")
)

$ErrorActionPreference = "Stop"

function Measure-Endpoint {
  param(
    [string]$Name,
    [scriptblock]$Action,
    [int]$Times
  )

  $samples = @()
  for ($i = 0; $i -lt $Times; $i++) {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    & $Action | Out-Null
    $stopwatch.Stop()
    $samples += [math]::Round($stopwatch.Elapsed.TotalMilliseconds, 2)
  }

  return [pscustomobject]@{
    name = $Name
    averageMs = [math]::Round((($samples | Measure-Object -Average).Average), 2)
    minMs = ($samples | Measure-Object -Minimum).Minimum
    maxMs = ($samples | Measure-Object -Maximum).Maximum
    samples = $samples
  }
}

$stamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "perf-$stamp@example.com"
$password = "Senha@123"
$name = "Perf User $stamp"

Invoke-RestMethod -Method POST -Uri "$ApiBase/api/v1/users" -ContentType "application/json" -Body (@{
  name = $name
  email = $email
  password = $password
} | ConvertTo-Json) | Out-Null

$loginPayload = @{ email = $email; password = $password } | ConvertTo-Json

$results = @(
  Measure-Endpoint -Name "login" -Times $Iterations -Action {
    Invoke-RestMethod -Method POST -Uri "$ApiBase/api/v1/auth/login" -ContentType "application/json" -Body $loginPayload
  }
  Measure-Endpoint -Name "books-list" -Times $Iterations -Action {
    Invoke-RestMethod -Method GET -Uri "$ApiBase/api/v1/books?page=0&size=12"
  }
  Measure-Endpoint -Name "books-search" -Times $Iterations -Action {
    Invoke-RestMethod -Method GET -Uri "$ApiBase/api/v1/books?page=0&size=12&q=clean"
  }
)

$report = [pscustomobject]@{
  generatedAt = (Get-Date).ToString("s")
  apiBase = $ApiBase
  iterations = $Iterations
  results = $results
}

$reportJson = $report | ConvertTo-Json -Depth 6
$outputDir = Split-Path -Parent $OutputFile
if (-not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}
$reportJson | Set-Content -Path $OutputFile -Encoding UTF8

$results | Format-Table -AutoSize
Write-Host "Relatorio salvo em $OutputFile"
