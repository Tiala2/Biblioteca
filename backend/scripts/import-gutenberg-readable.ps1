param(
  [Parameter(Mandatory = $false)]
  [string]$ApiUrl = "http://localhost:8080",

  [Parameter(Mandatory = $false)]
  [string]$Email = $env:ADMIN_EMAIL,

  [Parameter(Mandatory = $false)]
  [string]$Password = $env:ADMIN_PASSWORD,

  [Parameter(Mandatory = $false)]
  [string]$Query = "fiction",

  [Parameter(Mandatory = $false)]
  [int]$Pages = 10,

  [Parameter(Mandatory = $false)]
  [int]$TargetCount = 10,

  [Parameter(Mandatory = $false)]
  [ValidateSet("pt", "en")]
  [string]$Language = "pt"
)

$ErrorActionPreference = "Stop"

if (-not $Email) {
  $Email = Read-Host "Admin email"
}

if (-not $Password) {
  $securePassword = Read-Host "Admin password" -AsSecureString
  $credential = New-Object System.Management.Automation.PSCredential("admin", $securePassword)
  $Password = $credential.GetNetworkCredential().Password
}

$ApiUrl = $ApiUrl.TrimEnd("/")

Write-Host "== Project Gutenberg internal reader import ==" -ForegroundColor Cyan
Write-Host "API: $ApiUrl"
Write-Host "Query: $Query"
Write-Host "Language: $Language"
Write-Host "Target: $TargetCount book(s) with internal reading"

$loginBody = @{
  email = $Email
  password = $Password
} | ConvertTo-Json

$login = Invoke-RestMethod -Method POST -Uri "$ApiUrl/api/v1/auth/login" -ContentType "application/json" -Body $loginBody

if (-not $login.token) {
  throw "Login response did not include a token."
}

$headers = @{
  Authorization = "Bearer $($login.token)"
}

$importBody = @{
  query = $Query
  pages = $Pages
  pageSize = 100
  readableOnly = $true
  targetImportCount = $TargetCount
  language = $Language
} | ConvertTo-Json

$result = Invoke-RestMethod -Method POST -Uri "$ApiUrl/api/admin/books/import/gutenberg" -Headers $headers -ContentType "application/json" -Body $importBody

Write-Host ""
Write-Host "Import finished." -ForegroundColor Green
Write-Host "Fetched:  $($result.fetched)"
Write-Host "Imported: $($result.imported)"
Write-Host "Skipped:  $($result.skipped)"
Write-Host "Failed:   $($result.failed)"

if ($result.imported -eq 0) {
  Write-Host ""
  Write-Host "No books were imported. Try a broader query, more pages, or a smaller target count for a quick validation." -ForegroundColor Yellow
}

if ($result.messages -and @($result.messages).Count -gt 0) {
  Write-Host ""
  Write-Host "Messages:" -ForegroundColor Yellow
  foreach ($message in $result.messages) {
    Write-Host "- $message"
  }
}
