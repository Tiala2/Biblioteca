$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$scriptPath = Join-Path $root "scripts\check-local-stack.ps1"
$content = Get-Content $scriptPath -Raw

function Assert-Contains {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][string]$Expected
    )

    if (-not $content.Contains($Expected)) {
        throw "Local stack contract missing: $Label"
    }
}

Assert-Contains -Label "API_PORT fallback" -Expected '$apiPort = if ($env:API_PORT)'
Assert-Contains -Label "health uses API_PORT" -Expected '"http://localhost:$apiPort/actuator/health"'
Assert-Contains -Label "swagger uses API_PORT" -Expected '"http://localhost:$apiPort/swagger-ui/index.html"'
Assert-Contains -Label "frontend target" -Expected '@{ Name = "frontend"; Url = $FrontendUrl }'
Assert-Contains -Label "mailpit target" -Expected '@{ Name = "mailpit"; Url = $MailpitUrl }'

Write-Host "Local stack contract test passed." -ForegroundColor Green
