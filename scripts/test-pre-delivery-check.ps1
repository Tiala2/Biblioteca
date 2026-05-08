$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$scriptPath = Join-Path $root "scripts\pre-delivery-check.ps1"
$content = Get-Content $scriptPath -Raw

function Assert-Contains {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][string]$Expected
    )

    if (-not $content.Contains($Expected)) {
        throw "Pre-delivery contract missing: $Label"
    }
}

Assert-Contains -Label "local Gradle cache" -Expected '$env:GRADLE_USER_HOME = $BackendGradleHome'
Assert-Contains -Label "backend unit tests" -Expected 'Invoke-Step -Name "Backend unit tests"'
Assert-Contains -Label "backend integration tests" -Expected 'Invoke-Step -Name "Backend integration tests"'
Assert-Contains -Label "frontend lint" -Expected 'Invoke-Step -Name "Frontend lint"'
Assert-Contains -Label "frontend unit tests" -Expected 'Invoke-Step -Name "Frontend unit tests"'
Assert-Contains -Label "frontend build" -Expected 'Invoke-Step -Name "Frontend build"'
Assert-Contains -Label "frontend e2e" -Expected 'Invoke-Step -Name "Frontend E2E"'
Assert-Contains -Label "operational smoke" -Expected 'Invoke-Step -Name "Operational smoke"'
Assert-Contains -Label "route checklist" -Expected 'Invoke-Step -Name "Route checklist"'
Assert-Contains -Label "skip backend integration flag" -Expected 'if (-not $SkipBackendIntegration)'
Assert-Contains -Label "skip frontend e2e flag" -Expected 'if (-not $SkipFrontendE2E)'
Assert-Contains -Label "skip operational smoke flag" -Expected 'if (-not $SkipOperationalSmoke)'

Write-Host "Pre-delivery contract test passed." -ForegroundColor Green
