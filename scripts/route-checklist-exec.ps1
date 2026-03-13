param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$AdminEmail = $env:LIBRARY_ADMIN_EMAIL,
    [string]$AdminPassword = $env:LIBRARY_ADMIN_PASSWORD,
    [string]$ReportPath = "docs/generated/ROUTE_COVERAGE_REPORT.md",
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

function Invoke-ApiStatus {
    param(
        [Parameter(Mandatory = $true)][string]$Method,
        [Parameter(Mandatory = $true)][string]$Path,
        [string]$Token,
        $Body,
        [string]$ContentType = "application/json"
    )
    $uri = "$BaseUrl$Path"
    $headers = @{ Accept = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }

    try {
        if ($null -ne $Body) {
            $payload = if ($Body -is [string]) { $Body } else { $Body | ConvertTo-Json -Depth 20 }
            $response = Invoke-WebRequest -Method $Method -Uri $uri -Headers $headers -ContentType $ContentType -Body $payload -UseBasicParsing
        } else {
            $response = Invoke-WebRequest -Method $Method -Uri $uri -Headers $headers -UseBasicParsing
        }
        return @{
            status = [int]$response.StatusCode
            body = $response.Content
        }
    } catch {
        $status = 0
        $content = ""
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode.value__
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $content = $reader.ReadToEnd()
                $reader.Close()
            } catch {}
        }
        return @{
            status = $status
            body = $content
        }
    }
}

function Expect {
    param(
        [Parameter(Mandatory = $true)][string]$Method,
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][int[]]$Expected,
        [string]$Note = "",
        [scriptblock]$Call
    )
    $result = & $Call
    $ok = $Expected -contains [int]$result.status
    $script:rows += [PSCustomObject]@{
        Method = $Method
        Path = $Path
        Status = [int]$result.status
        Expected = ($Expected -join ",")
        Result = if ($ok) { "PASS" } else { "FAIL" }
        Note = $Note
    }
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

$rows = @()

# Base health + admin login
$health = Invoke-ApiStatus -Method GET -Path "/actuator/health"
if ($health.status -ne 200) {
    throw "API nao esta saudavel em $BaseUrl (status=$($health.status))."
}

$adminAuth = Invoke-ApiStatus -Method POST -Path "/api/v1/auth/login" -Body @{
    email = $AdminEmail
    password = $AdminPassword
}
if ($adminAuth.status -ne 200) {
    throw "Falha no login admin (status=$($adminAuth.status))."
}
$adminToken = (ConvertFrom-Json $adminAuth.body).token

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$userEmail = "route-check-$stamp@email.com"
$userPwd = "StrongPass123"
$targetEmail = "route-target-$stamp@email.com"

# bootstrap users
$reg1 = Invoke-ApiStatus -Method POST -Path "/api/v1/users" -Body @{ name="Route User"; email=$userEmail; password=$userPwd }
if ($reg1.status -ne 201) { throw "Falha ao criar user base: $($reg1.status)" }
$userId = (ConvertFrom-Json $reg1.body).id

$reg2 = Invoke-ApiStatus -Method POST -Path "/api/v1/users" -Body @{ name="Target User"; email=$targetEmail; password=$userPwd }
if ($reg2.status -ne 201) { throw "Falha ao criar user target: $($reg2.status)" }
$targetUserId = (ConvertFrom-Json $reg2.body).id

$userAuth = Invoke-ApiStatus -Method POST -Path "/api/v1/auth/login" -Body @{ email=$userEmail; password=$userPwd }
if ($userAuth.status -ne 200) { throw "Falha no login user base: $($userAuth.status)" }
$userToken = (ConvertFrom-Json $userAuth.body).token

# bootstrap shared entities
$books = Invoke-ApiStatus -Method GET -Path "/api/v1/books?page=0&size=20"
$booksJson = ConvertFrom-Json $books.body
$publicBook = $booksJson.content | Where-Object { $_.hasPdf -eq $true } | Select-Object -First 1
if ($null -eq $publicBook) { throw "Nenhum livro com hasPdf=true encontrado." }
$bookId = $publicBook.id

$categoryCreate = Invoke-ApiStatus -Method POST -Path "/api/admin/categories" -Token $adminToken -Body @{ name="RouteCat-$stamp"; description="route test" }
if ($categoryCreate.status -ne 201) { throw "Falha ao criar categoria admin: $($categoryCreate.status)" }
$categoryId = (ConvertFrom-Json $categoryCreate.body).id

$bookAdminCreate = Invoke-ApiStatus -Method POST -Path "/api/admin/books" -Token $adminToken -Body @{
    title = "Route Book $stamp"
    isbn = [string](9782220000000 + ($stamp % 1000000))
    numberOfPages = 210
    publicationDate = "2020-01-01"
    coverUrl = "https://example.com/route-$stamp.jpg"
    categories = @($categoryId)
}
if ($bookAdminCreate.status -ne 201) { throw "Falha ao criar livro admin: $($bookAdminCreate.status)" }
$adminBookId = (ConvertFrom-Json $bookAdminCreate.body).id

$tagCreate = Invoke-ApiStatus -Method POST -Path "/api/admin/tags" -Token $adminToken -Body @{ name = "RouteTag-$stamp" }
if ($tagCreate.status -ne 201) { throw "Falha ao criar tag admin: $($tagCreate.status)" }
$tagId = (ConvertFrom-Json $tagCreate.body).id

$collectionCreate = Invoke-ApiStatus -Method POST -Path "/api/admin/collections" -Token $adminToken -Body @{
    title = "Route Collection $stamp"
    description = "route test"
    coverUrl = "https://example.com/collection-$stamp.jpg"
    bookIds = @($bookId)
}
if ($collectionCreate.status -ne 201) { throw "Falha ao criar collection admin: $($collectionCreate.status)" }
$collectionId = (ConvertFrom-Json $collectionCreate.body).id

$reviewId = $null
$reviewCreate = Invoke-ApiStatus -Method POST -Path "/api/v1/reviews" -Token $userToken -Body @{
    bookId = $bookId
    rating = 4
    comment = "review route check"
}
if ($reviewCreate.status -eq 201) {
    $reviewId = (ConvertFrom-Json $reviewCreate.body).id
} else {
    $reviewListBootstrap = Invoke-ApiStatus -Method GET -Path "/api/v1/reviews?page=0&size=10"
    if ($reviewListBootstrap.status -eq 200) {
        $reviewListBootstrapJson = ConvertFrom-Json $reviewListBootstrap.body
        if ($reviewListBootstrapJson.content.Count -gt 0) {
            $reviewId = $reviewListBootstrapJson.content[0].id
        }
    }
}

$favoriteCreate = Invoke-ApiStatus -Method POST -Path "/api/v1/users/me/favorites" -Token $userToken -Body @{ bookId = $bookId }
if ($favoriteCreate.status -notin 201,409) { throw "Falha ao criar favorito base: $($favoriteCreate.status)" }

$badgesList = Invoke-ApiStatus -Method GET -Path "/api/admin/badges?page=0&size=20&sort=code" -Token $adminToken
$badgeId = $null
if ($badgesList.status -eq 200) {
    $badgeJson = ConvertFrom-Json $badgesList.body
    if ($badgeJson.content.Count -gt 0) { $badgeId = $badgeJson.content[0].id }
}

# 56 operations
Expect "GET" "/api/v1/users/me" @(200) "usuario logado" { Invoke-ApiStatus -Method GET -Path "/api/v1/users/me" -Token $userToken }
Expect "PUT" "/api/v1/users/me" @(204) "atualizar flags" { Invoke-ApiStatus -Method PUT -Path "/api/v1/users/me" -Token $userToken -Body @{ leaderboardOptIn = $true; alertsOptIn = $true } }
Expect "GET" "/api/v1/users/me/goals" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/v1/users/me/goals?period=MONTHLY" -Token $userToken }
Expect "PUT" "/api/v1/users/me/goals" @(200) "" { Invoke-ApiStatus -Method PUT -Path "/api/v1/users/me/goals" -Token $userToken -Body @{ period="MONTHLY"; targetPages=120 } }
Expect "PUT" "/api/admin/tags/{tagId}" @(200) "" { Invoke-ApiStatus -Method PUT -Path "/api/admin/tags/$tagId" -Token $adminToken -Body @{ name = "RouteTagUpdated-$stamp" } }
Expect "DELETE" "/api/admin/tags/{tagId}" @(204) "" { Invoke-ApiStatus -Method DELETE -Path "/api/admin/tags/$tagId" -Token $adminToken }
Expect "PUT" "/api/admin/collections/{id}" @(200) "" { Invoke-ApiStatus -Method PUT -Path "/api/admin/collections/$collectionId" -Token $adminToken -Body @{ title="Route Collection Updated"; description="updated"; coverUrl="https://example.com/u.jpg"; bookIds=@($bookId) } }
Expect "DELETE" "/api/admin/collections/{id}" @(204) "" { Invoke-ApiStatus -Method DELETE -Path "/api/admin/collections/$collectionId" -Token $adminToken }
Expect "PUT" "/api/admin/categories/{categoryId}" @(200) "" { Invoke-ApiStatus -Method PUT -Path "/api/admin/categories/$categoryId" -Token $adminToken -Body @{ name="RouteCatUpdated-$stamp"; description="updated" } }
Expect "DELETE" "/api/admin/categories/{categoryId}" @(204,400) "pode falhar se referenciado" { Invoke-ApiStatus -Method DELETE -Path "/api/admin/categories/$categoryId" -Token $adminToken }
if ($badgeId) {
    $badgeData = (ConvertFrom-Json $badgesList.body).content | Where-Object { $_.id -eq $badgeId } | Select-Object -First 1
    Expect "PUT" "/api/admin/badges/{id}" @(200) "" { Invoke-ApiStatus -Method PUT -Path "/api/admin/badges/$badgeId" -Token $adminToken -Body @{ code=$badgeData.code; name=$badgeData.name; description=$badgeData.description; criteriaType=$badgeData.criteriaType; criteriaValue=$badgeData.criteriaValue; active=$badgeData.active } }
    Expect "DELETE" "/api/admin/badges/{id}" @(204,400,404) "depende de FK/user_badges" { Invoke-ApiStatus -Method DELETE -Path "/api/admin/badges/$badgeId" -Token $adminToken }
} else {
    $unknown = [guid]::NewGuid().ToString()
    Expect "PUT" "/api/admin/badges/{id}" @(404) "nenhum badge encontrado na lista" { Invoke-ApiStatus -Method PUT -Path "/api/admin/badges/$unknown" -Token $adminToken -Body @{ code="TOTAL_BOOKS_10"; name="x"; description="x"; criteriaType="BOOKS_FINISHED"; criteriaValue="10"; active=$true } }
    Expect "DELETE" "/api/admin/badges/{id}" @(404) "nenhum badge encontrado na lista" { Invoke-ApiStatus -Method DELETE -Path "/api/admin/badges/$unknown" -Token $adminToken }
}
Expect "POST" "/api/v1/users" @(201,409) "" { Invoke-ApiStatus -Method POST -Path "/api/v1/users" -Body @{ name="Extra User"; email="extra-$stamp@email.com"; password=$userPwd } }
Expect "GET" "/api/v1/users/me/favorites" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/v1/users/me/favorites" -Token $userToken }
Expect "POST" "/api/v1/users/me/favorites" @(201,409) "" { Invoke-ApiStatus -Method POST -Path "/api/v1/users/me/favorites" -Token $userToken -Body @{ bookId=$bookId } }
Expect "GET" "/api/v1/reviews" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/v1/reviews?page=0&size=10" -Token $userToken }
Expect "POST" "/api/v1/reviews" @(201,400,409) "duplicidade/regra de negocio pode bloquear review" { Invoke-ApiStatus -Method POST -Path "/api/v1/reviews" -Token $userToken -Body @{ bookId=$bookId; rating=5; comment="dup" } }
Expect "POST" "/api/v1/readings" @(200) "" { Invoke-ApiStatus -Method POST -Path "/api/v1/readings" -Token $userToken -Body @{ bookId=$bookId; currentPage=10 } }
Expect "POST" "/api/v1/auth/login" @(200,401) "" { Invoke-ApiStatus -Method POST -Path "/api/v1/auth/login" -Body @{ email=$userEmail; password=$userPwd } }
Expect "GET" "/api/admin/tags" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/admin/tags" -Token $adminToken }
Expect "POST" "/api/admin/tags" @(201,409) "" { Invoke-ApiStatus -Method POST -Path "/api/admin/tags" -Token $adminToken -Body @{ name="RouteTagPost-$stamp" } }
Expect "POST" "/api/admin/collections" @(201,404) "" { Invoke-ApiStatus -Method POST -Path "/api/admin/collections" -Token $adminToken -Body @{ title="Route Collection Post"; description="x"; coverUrl="https://example.com/x.jpg"; bookIds=@($bookId) } }
Expect "POST" "/api/admin/categories" @(201,409) "" { Invoke-ApiStatus -Method POST -Path "/api/admin/categories" -Token $adminToken -Body @{ name="RouteCategoryPost-$stamp"; description="x" } }
Expect "POST" "/api/admin/books" @(201,409,404) "" { Invoke-ApiStatus -Method POST -Path "/api/admin/books" -Token $adminToken -Body @{ title="Route Book Post $stamp"; isbn=[string](9783330000000 + ($stamp % 1000000)); numberOfPages=120; publicationDate="2020-01-01"; coverUrl="https://example.com/p.jpg"; categories=@() } }
Expect "POST" "/api/admin/books/{bookId}/upload" @(204,400,413,415) "upload multipart com pdf temporario" {
    $tempFile = Join-Path $env:TEMP "route-upload-$stamp.pdf"
    $tempOut = Join-Path $env:TEMP "route-upload-response-$stamp.json"
    try {
        [System.IO.File]::WriteAllBytes($tempFile, [System.Text.Encoding]::UTF8.GetBytes("%PDF-1.4`n%route-check`n"))
        $uri = "$BaseUrl/api/admin/books/$adminBookId/upload"
        $statusText = & curl.exe -s -o $tempOut -w "%{http_code}" `
            -X POST $uri `
            -H "Accept: application/json" `
            -H "Authorization: Bearer $adminToken" `
            -F "file=@$tempFile;type=application/pdf"
        $status = 0
        if ($statusText -match '^\d+$') {
            $status = [int]$statusText
        }
        $body = ""
        if (Test-Path $tempOut) {
            $body = Get-Content $tempOut -Raw
        }
        @{
            status = $status
            body = $body
        }
    } catch {
        $status = 0
        $content = ""
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode.value__
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $content = $reader.ReadToEnd()
                $reader.Close()
            } catch {}
        }
        @{
            status = $status
            body = $content
        }
    } finally {
        if (Test-Path $tempFile) {
            Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
        }
        if (Test-Path $tempOut) {
            Remove-Item $tempOut -Force -ErrorAction SilentlyContinue
        }
    }
}
Expect "GET" "/api/admin/badges" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/admin/badges?page=0&size=20&sort=code" -Token $adminToken }
Expect "POST" "/api/admin/badges" @(201,400,409) "restricoes de enum/duplicidade" { Invoke-ApiStatus -Method POST -Path "/api/admin/badges" -Token $adminToken -Body @{ code="TOTAL_BOOKS_10"; name="Books10"; description="d"; criteriaType="BOOKS_FINISHED"; criteriaValue="10"; active=$true } }
if ($reviewId) {
    Expect "GET" "/api/v1/reviews/{reviewId}" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/v1/reviews/$reviewId" -Token $userToken }
    Expect "DELETE" "/api/v1/reviews/{reviewId}" @(204,403) "regra de ownership pode bloquear exclusao" { Invoke-ApiStatus -Method DELETE -Path "/api/v1/reviews/$reviewId" -Token $userToken }
    Expect "PATCH" "/api/v1/reviews/{reviewId}" @(200,403,404) "regras de ownership/review removida" { Invoke-ApiStatus -Method PATCH -Path "/api/v1/reviews/$reviewId" -Token $userToken -Body @{ rating=4; comment="updated" } }
} else {
    $dummyReviewId = [guid]::NewGuid().ToString()
    Expect "GET" "/api/v1/reviews/{reviewId}" @(404) "sem review id disponivel no bootstrap" { Invoke-ApiStatus -Method GET -Path "/api/v1/reviews/$dummyReviewId" -Token $userToken }
    Expect "DELETE" "/api/v1/reviews/{reviewId}" @(404) "sem review id disponivel no bootstrap" { Invoke-ApiStatus -Method DELETE -Path "/api/v1/reviews/$dummyReviewId" -Token $userToken }
    Expect "PATCH" "/api/v1/reviews/{reviewId}" @(404) "sem review id disponivel no bootstrap" { Invoke-ApiStatus -Method PATCH -Path "/api/v1/reviews/$dummyReviewId" -Token $userToken -Body @{ rating=4; comment="updated" } }
}
Expect "DELETE" "/api/admin/books/{bookId}" @(204) "" { Invoke-ApiStatus -Method DELETE -Path "/api/admin/books/$adminBookId" -Token $adminToken }
Expect "PATCH" "/api/admin/books/{bookId}" @(204,404) "livro pode ter sido removido" { Invoke-ApiStatus -Method PATCH -Path "/api/admin/books/$adminBookId" -Token $adminToken -Body @{ title="PatchAfterDelete" } }
Expect "GET" "/api/v1/users/me/streak" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/v1/users/me/streak" -Token $userToken }
Expect "GET" "/api/v1/users/me/goals/summary" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/v1/users/me/goals/summary?period=MONTHLY" -Token $userToken }
Expect "GET" "/api/v1/users/me/favorites/{bookId}" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/v1/users/me/favorites/$bookId" -Token $userToken }
Expect "DELETE" "/api/v1/users/me/favorites/{bookId}" @(204) "" { Invoke-ApiStatus -Method DELETE -Path "/api/v1/users/me/favorites/$bookId" -Token $userToken }
Expect "GET" "/api/v1/users/me/badges" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/v1/users/me/badges?page=0&size=10" -Token $userToken }
Expect "GET" "/api/v1/users/me/alerts" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/v1/users/me/alerts?period=MONTHLY" -Token $userToken }
Expect "GET" "/api/v1/users/leaderboard" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/v1/users/leaderboard?limit=10&metric=PAGES" }
Expect "GET" "/api/v1/tags" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/v1/tags" }
Expect "GET" "/api/v1/reviews/me" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/v1/reviews/me?page=0&size=10" -Token $userToken }
Expect "GET" "/api/v1/home/resume" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/v1/home/resume" -Token $userToken }
Expect "GET" "/api/v1/collections" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/v1/collections?page=0&size=10" }
Expect "GET" "/api/v1/collections/{id}" @(200,404) "" { Invoke-ApiStatus -Method GET -Path "/api/v1/collections/$collectionId" }
Expect "GET" "/api/v1/categories" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/v1/categories" }
Expect "GET" "/api/v1/categories/{categoryId}" @(200,404) "" { Invoke-ApiStatus -Method GET -Path "/api/v1/categories/$categoryId" }
Expect "GET" "/api/v1/categories/{categoryId}/books" @(200,404) "" { Invoke-ApiStatus -Method GET -Path "/api/v1/categories/$categoryId/books?page=0&size=10" }
Expect "GET" "/api/v1/books" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/v1/books?page=0&size=10" }
Expect "GET" "/api/v1/books/{bookId}" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/v1/books/$bookId" }
Expect "GET" "/api/v1/books/recommendations" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/v1/books/recommendations?limit=5" -Token $userToken }
Expect "GET" "/api/admin/users" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/admin/users?page=0&size=10&sort=name,asc" -Token $adminToken }
Expect "GET" "/api/admin/users/{userId}" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/admin/users/$targetUserId" -Token $adminToken }
Expect "DELETE" "/api/admin/users/{userId}" @(204) "" { Invoke-ApiStatus -Method DELETE -Path "/api/admin/users/$targetUserId" -Token $adminToken }
Expect "GET" "/api/admin/metrics" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/admin/metrics" -Token $adminToken }
Expect "GET" "/api/admin/favorites" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/admin/favorites?page=0&size=10" -Token $adminToken }
Expect "GET" "/api/admin/alerts/deliveries" @(200) "" { Invoke-ApiStatus -Method GET -Path "/api/admin/alerts/deliveries?page=0&size=10" -Token $adminToken }

$total = $rows.Count
$passed = @($rows | Where-Object { $_.Result -eq "PASS" }).Count
$failed = @($rows | Where-Object { $_.Result -eq "FAIL" }).Count

$lines = @()
$lines += "# Relatorio de Cobertura de Rotas"
$lines += ""
$lines += "Data/hora: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')"
$lines += ""
$lines += "Resumo:"
$lines += "- Total de operacoes executadas: $total"
$lines += "- PASS: $passed"
$lines += "- FAIL: $failed"
$lines += ""
$lines += "| Metodo | Rota | Status | Esperado | Resultado | Observacao |"
$lines += "|---|---|---:|---|---|---|"
foreach ($r in $rows) {
    $lines += "| $($r.Method) | $($r.Path) | $($r.Status) | $($r.Expected) | $($r.Result) | $($r.Note) |"
}

$lines += ""
if ($failed -gt 0) {
    $lines += "## Falhas"
    foreach ($f in ($rows | Where-Object { $_.Result -eq "FAIL" })) {
        $lines += "- $($f.Method) $($f.Path): status=$($f.Status), esperado=$($f.Expected)"
    }
}

$reportDirectory = Split-Path -Path $ReportPath -Parent
if (-not [string]::IsNullOrWhiteSpace($reportDirectory) -and -not (Test-Path -Path $reportDirectory)) {
    New-Item -ItemType Directory -Path $reportDirectory -Force | Out-Null
}

Set-Content -Path $ReportPath -Value ($lines -join "`r`n") -Encoding UTF8

Write-Host "Relatorio gerado em $ReportPath"
Write-Host "PASS=$passed FAIL=$failed TOTAL=$total"

if ($failed -gt 0) {
    exit 1
}

