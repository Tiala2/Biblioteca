param(
  [Parameter(Mandatory = $false)]
  [string]$Email = "seu-usuario@email.com"
)

$ErrorActionPreference = "Stop"

Write-Host "== Forgot Password Smoke Test ==" -ForegroundColor Cyan
Write-Host "API: http://localhost:8080/api/v1/auth/forgot-password"
Write-Host "Email target: $Email"

try {
  $before = Invoke-RestMethod -Method GET -Uri "http://localhost:8025/api/v1/messages" -ErrorAction Stop
  $beforeCount = @($before.messages).Count
} catch {
  $beforeCount = -1
}

$payload = @{ email = $Email } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "http://localhost:8080/api/v1/auth/forgot-password" -ContentType "application/json" -Body $payload | Out-Null
Write-Host "Request sent with success (expected HTTP 204)." -ForegroundColor Green

Start-Sleep -Seconds 2

try {
  $after = Invoke-RestMethod -Method GET -Uri "http://localhost:8025/api/v1/messages" -ErrorAction Stop
  $afterCount = @($after.messages).Count
  Write-Host "Mailpit message count: $beforeCount -> $afterCount"
  if ($afterCount -gt $beforeCount) {
    $latest = $after.messages[0]
    Write-Host "Latest subject: $($latest.Subject)" -ForegroundColor Green
    Write-Host "Latest to: $($latest.To[0].Address)" -ForegroundColor Green
  } else {
    Write-Host "No new message found in Mailpit." -ForegroundColor Yellow
    Write-Host "If using Brevo/Gmail SMTP, check your real inbox and spam folder."
  }
} catch {
  Write-Host "Mailpit is not reachable at http://localhost:8025." -ForegroundColor Yellow
  Write-Host "If you are using Brevo/Gmail SMTP, this is expected."
}
