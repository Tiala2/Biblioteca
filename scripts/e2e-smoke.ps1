param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$AdminEmail = $env:LIBRARY_ADMIN_EMAIL,
    [string]$AdminPassword = $env:LIBRARY_ADMIN_PASSWORD,
    [string]$EnvFilePath = ".\backend\.env"
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

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

    $uri = "$BaseUrl$Path"
    $headers = @{ Accept = "application/json" }
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }

    if ($null -ne $Body) {
        $jsonBody = $Body | ConvertTo-Json -Depth 10
        return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -ContentType "application/json" -Body $jsonBody
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

Write-Step "Health check"
$health = Invoke-RestMethod -Method GET -Uri "$BaseUrl/actuator/health"
if ($health.status -ne "UP") {
    throw "API nao esta UP em $BaseUrl"
}

Write-Step "Login admin"
$adminAuth = Invoke-Api -Method POST -Path "/api/v1/auth/login" -Body @{
    email = $AdminEmail
    password = $AdminPassword
}
$adminToken = $adminAuth.token
if ([string]::IsNullOrWhiteSpace($adminToken)) {
    throw "Falha ao obter token admin"
}

Write-Step "Validar acesso admin"
$null = Invoke-Api -Method GET -Path "/api/admin/metrics" -Token $adminToken

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$categoryName = "SmokeCategory-$stamp"
$isbn = [string](9780000000000 + ($stamp % 1000000))
$userEmail = "smoke$stamp@email.com"
$userPassword = "StrongPass123"

Write-Step "Criar categoria admin"
$category = Invoke-Api -Method POST -Path "/api/admin/categories" -Token $adminToken -Body @{
    name = $categoryName
    description = "Categoria criada no smoke test"
}

Write-Step "Criar livro admin"
$book = Invoke-Api -Method POST -Path "/api/admin/books" -Token $adminToken -Body @{
    title = "Livro Smoke $stamp"
    isbn = $isbn
    numberOfPages = 320
    publicationDate = "2020-01-01"
    coverUrl = "https://example.com/smoke-$stamp.jpg"
    categories = @($category.id)
}

Write-Step "Selecionar livro com PDF para fluxo de leitura"
$booksPage = Invoke-Api -Method GET -Path "/api/v1/books?page=0&size=20"
$bookForReading = $booksPage.content | Where-Object { $_.hasPdf -eq $true } | Select-Object -First 1
if ($null -eq $bookForReading) {
    throw "Nenhum livro com hasPdf=true encontrado para teste de leitura."
}

Write-Step "Cadastrar usuario comum"
$user = Invoke-Api -Method POST -Path "/api/v1/users" -Body @{
    name = "Smoke User"
    email = $userEmail
    password = $userPassword
}

Write-Step "Login usuario comum"
$userAuth = Invoke-Api -Method POST -Path "/api/v1/auth/login" -Body @{
    email = $userEmail
    password = $userPassword
}
$userToken = $userAuth.token
if ([string]::IsNullOrWhiteSpace($userToken)) {
    throw "Falha ao obter token user"
}

Write-Step "Ativar opt-in"
$null = Invoke-Api -Method PUT -Path "/api/v1/users/me" -Token $userToken -Body @{
    leaderboardOptIn = $true
    alertsOptIn = $true
}

Write-Step "Favoritar livro"
$null = Invoke-Api -Method POST -Path "/api/v1/users/me/favorites" -Token $userToken -Body @{
    bookId = $bookForReading.id
}

Write-Step "Sincronizar leitura"
$null = Invoke-Api -Method POST -Path "/api/v1/readings" -Token $userToken -Body @{
    bookId = $bookForReading.id
    currentPage = 10
}

Write-Step "Configurar meta"
$null = Invoke-Api -Method PUT -Path "/api/v1/users/me/goals" -Token $userToken -Body @{
    period = "MONTHLY"
    targetPages = 120
}

Write-Step "Consultar alertas e leaderboard"
$alerts = Invoke-Api -Method GET -Path "/api/v1/users/me/alerts?period=MONTHLY" -Token $userToken
$leaderboard = Invoke-Api -Method GET -Path "/api/v1/users/leaderboard?limit=10&metric=PAGES" -Token $userToken

Write-Step "Consultar auditoria de envio de alertas"
$deliveries = Invoke-Api -Method GET -Path "/api/admin/alerts/deliveries?userId=$($user.id)&page=0&size=20" -Token $adminToken

Write-Host "`n========== RESUMO ==========" -ForegroundColor Green
Write-Host "Categoria criada: $($category.id)"
Write-Host "Livro criado:     $($book.id)"
Write-Host "Livro para leitura (hasPdf=true): $($bookForReading.id)"
Write-Host "Usuario criado:   $($user.id) ($userEmail)"
Write-Host "Alertas obtidos:  $($alerts.Count)"
Write-Host "Leaderboard top:  $($leaderboard.Count)"
Write-Host "Audit deliveries: $($deliveries.page.totalElements)"
Write-Host "Smoke test concluido com sucesso." -ForegroundColor Green
