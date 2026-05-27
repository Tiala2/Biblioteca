param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$Output = "docs/openapi-lock.json",
    [string]$Email = $env:LIBRARY_ADMIN_EMAIL,
    [string]$Password = $env:LIBRARY_ADMIN_PASSWORD,
    [string]$EnvFilePath = ".\backend\.env"
)

$ErrorActionPreference = "Stop"

function Get-DotEnvValue {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Key
    )

    if (-not (Test-Path -Path $Path)) {
        return $null
    }

    $line = Get-Content -Path $Path |
        Where-Object { $_ -match "^\s*$Key\s*=" } |
        Select-Object -First 1

    if ([string]::IsNullOrWhiteSpace($line)) {
        return $null
    }

    $parts = $line -split "=", 2
    if ($parts.Count -lt 2) {
        return $null
    }

    return $parts[1].Trim().Trim('"').Trim("'")
}

$BaseUrl = $BaseUrl.TrimEnd("/")
$uri = "$BaseUrl/v3/api-docs"
Write-Host "Exportando contrato OpenAPI de $uri ..."

if ([string]::IsNullOrWhiteSpace($Email)) {
    $Email = Get-DotEnvValue -Path $EnvFilePath -Key "LIBRARY_ADMIN_EMAIL"
}

if ([string]::IsNullOrWhiteSpace($Password)) {
    $Password = Get-DotEnvValue -Path $EnvFilePath -Key "LIBRARY_ADMIN_PASSWORD"
}

try {
    $json = Invoke-RestMethod -Method GET -Uri $uri
} catch {
    if (-not $Email -or -not $Password) {
        throw
    }

    Write-Host "Contrato protegido. Tentando autenticar com credenciais administrativas..."
    $loginBody = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json

    $login = Invoke-RestMethod -Method POST -Uri "$BaseUrl/api/v1/auth/login" -ContentType "application/json" -Body $loginBody
    if (-not $login.token) {
        throw "Login response did not include a token."
    }

    $headers = @{
        Authorization = "Bearer $($login.token)"
    }
    $json = Invoke-RestMethod -Method GET -Uri $uri -Headers $headers
}

$serialized = $json | ConvertTo-Json -Depth 100
Set-Content -Path $Output -Value $serialized -Encoding UTF8

Write-Host "Contrato exportado com sucesso para $Output"
