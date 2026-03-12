param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("mailpit", "brevo")]
  [string]$Mode
)

$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env"

if ($Mode -eq "mailpit") {
@'
APP_FRONTEND_BASE_URL=http://localhost:5173
APP_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
DB_URL=jdbc:postgresql://library:5432/library
DB_USERNAME=library
DB_PASSWORD=library
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
JWT_EXPIRATION_MILIS=86400000
MINIO_URL=http://minio:9000
MINIO_PUBLIC_URL=http://localhost:9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=password123
MINIO_MAX_SIZE_MB=50
MAX_FILE_SIZE=50MB
MAX_REQUEST_SIZE=50MB
ALERT_EMAIL_ENABLED=true
ALERT_EMAIL_FROM=no-reply@library.local
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_SMTP_AUTH=false
MAIL_SMTP_STARTTLS=false
'@ | Set-Content $envFile
  Write-Host "Modo email ativo: MAILPIT (local)." -ForegroundColor Green
  exit 0
}

Copy-Item (Join-Path $root ".env.brevo.example") $envFile -Force
Write-Host "Modo email ativo: BREVO (preencher CHANGE_ME no .env)." -ForegroundColor Yellow
