param(
    [switch]$SkipBackendIntegration,
    [switch]$SkipFrontendE2E,
    [switch]$SkipOperationalSmoke
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$BackendGradleHome = Join-Path $Root "backend\.gradle-home"

if ([string]::IsNullOrWhiteSpace($env:GRADLE_USER_HOME)) {
    $env:GRADLE_USER_HOME = $BackendGradleHome
}

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$WorkingDirectory,
        [Parameter(Mandatory = $true)][string[]]$Command
    )

    Write-Host ""
    Write-Host "==> $Name" -ForegroundColor Cyan
    Push-Location $WorkingDirectory
    try {
        & $Command[0] $Command[1..($Command.Length - 1)]
        if ($LASTEXITCODE -ne 0) {
            throw "$Name falhou com exit code $LASTEXITCODE."
        }
    } finally {
        Pop-Location
    }
}

Invoke-Step -Name "Backend unit tests" -WorkingDirectory (Join-Path $Root "backend") -Command @(".\gradlew.bat", "test", "--no-daemon")

if (-not $SkipBackendIntegration) {
    Invoke-Step -Name "Backend integration tests" -WorkingDirectory (Join-Path $Root "backend") -Command @(".\gradlew.bat", "integrationTest", "--no-daemon")
}

Invoke-Step -Name "Frontend lint" -WorkingDirectory (Join-Path $Root "frontend") -Command @("npm.cmd", "run", "lint")
Invoke-Step -Name "Frontend unit tests" -WorkingDirectory (Join-Path $Root "frontend") -Command @("npm.cmd", "run", "test")
Invoke-Step -Name "Frontend build" -WorkingDirectory (Join-Path $Root "frontend") -Command @("npm.cmd", "run", "build")

if (-not $SkipFrontendE2E) {
    Invoke-Step -Name "Frontend E2E" -WorkingDirectory (Join-Path $Root "frontend") -Command @("npm.cmd", "run", "test:e2e")
}

if (-not $SkipOperationalSmoke) {
    Invoke-Step -Name "Operational smoke" -WorkingDirectory $Root -Command @("powershell", "-ExecutionPolicy", "Bypass", "-File", ".\scripts\e2e-smoke.ps1")
    Invoke-Step -Name "Route checklist" -WorkingDirectory $Root -Command @("powershell", "-ExecutionPolicy", "Bypass", "-File", ".\scripts\route-checklist-exec.ps1")
}

Write-Host ""
Write-Host "Pre-delivery checks completed successfully." -ForegroundColor Green
