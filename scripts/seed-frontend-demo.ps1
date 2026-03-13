param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$AdminEmail = $env:LIBRARY_ADMIN_EMAIL,
    [string]$AdminPassword = $env:LIBRARY_ADMIN_PASSWORD,
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

function Invoke-Api {
    param(
        [Parameter(Mandatory = $true)][string]$Method,
        [Parameter(Mandatory = $true)][string]$Path,
        [string]$Token,
        $Body
    )
    $headers = @{ Accept = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    $uri = "$BaseUrl$Path"

    if ($null -ne $Body) {
        $json = $Body | ConvertTo-Json -Depth 10
        return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -ContentType "application/json" -Body $json
    }
    return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
}

if ([string]::IsNullOrWhiteSpace($AdminEmail)) {
    $AdminEmail = Get-DotEnvValue -Path $EnvFilePath -Key "LIBRARY_ADMIN_EMAIL"
}

if ([string]::IsNullOrWhiteSpace($AdminPassword)) {
    $AdminPassword = Get-DotEnvValue -Path $EnvFilePath -Key "LIBRARY_ADMIN_PASSWORD"
}

if ([string]::IsNullOrWhiteSpace($AdminEmail) -or [string]::IsNullOrWhiteSpace($AdminPassword)) {
    throw "Informe credenciais admin por parametro, variaveis LIBRARY_ADMIN_EMAIL/LIBRARY_ADMIN_PASSWORD ou no arquivo $EnvFilePath."
}

Write-Host "Login admin..."
$auth = Invoke-Api -Method POST -Path "/api/v1/auth/login" -Body @{
    email = $AdminEmail
    password = $AdminPassword
}
$token = $auth.token

if ([string]::IsNullOrWhiteSpace($token)) {
    throw "Falha ao obter token admin."
}

$categoryName = "Frontend Demo"

Write-Host "Buscando categoria '$categoryName'..."
$categories = Invoke-Api -Method GET -Path "/api/v1/categories"
$existingCategory = $categories | Where-Object { $_.name -eq $categoryName } | Select-Object -First 1

if ($null -eq $existingCategory) {
    Write-Host "Criando categoria '$categoryName'..."
    $existingCategory = Invoke-Api -Method POST -Path "/api/admin/categories" -Token $token -Body @{
        name = $categoryName
        description = "Categoria base para desenvolvimento do front"
    }
}

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$isbn = [string](9781110000000 + ($stamp % 1000000))

Write-Host "Criando livro demo..."
$book = Invoke-Api -Method POST -Path "/api/admin/books" -Token $token -Body @{
    title = "Livro Front Demo $stamp"
    isbn = $isbn
    numberOfPages = 180
    publicationDate = "2021-01-01"
    coverUrl = "https://example.com/front-demo-$stamp.jpg"
    categories = @($existingCategory.id)
}

Write-Host ""
Write-Host "Seed concluido."
Write-Host "Categoria: $($existingCategory.id) - $($existingCategory.name)"
Write-Host "Livro:     $($book.id) - $($book.title)"
Write-Host ""
Write-Host "Observacao: para fluxo de leitura, use um livro com hasPdf=true (seed inicial) ou realize upload de PDF no admin."
