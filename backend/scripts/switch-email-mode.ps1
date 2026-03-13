param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("mailpit", "brevo")]
  [string]$Mode,
  [string]$EnvFilePath
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$envFile = if ([string]::IsNullOrWhiteSpace($EnvFilePath)) { Join-Path $root ".env" } else { $EnvFilePath }
$envExample = Join-Path $root ".env.example"

function Get-EnvMap {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  $map = [ordered]@{}
  if (-not (Test-Path -Path $Path)) {
    return $map
  }

  foreach ($line in Get-Content -Path $Path) {
    if ([string]::IsNullOrWhiteSpace($line)) {
      continue
    }
    if ($line.TrimStart().StartsWith("#")) {
      continue
    }
    if ($line -notmatch "=") {
      continue
    }

    $parts = $line -split "=", 2
    $key = $parts[0].Trim()
    $value = if ($parts.Count -gt 1) { $parts[1] } else { "" }
    if (-not [string]::IsNullOrWhiteSpace($key)) {
      $map[$key] = $value
    }
  }

  return $map
}

function Set-EnvValue {
  param(
    [Parameter(Mandatory = $true)]
    [System.Collections.IDictionary]$Map,
    [Parameter(Mandatory = $true)]
    [string]$Key,
    [Parameter(Mandatory = $true)]
    [AllowEmptyString()]
    [string]$Value
  )

  $Map[$Key] = $Value
}

if (-not (Test-Path -Path $envFile)) {
  Copy-Item $envExample $envFile -Force
}

$envMap = Get-EnvMap -Path $envFile

if ($Mode -eq "mailpit") {
  Set-EnvValue -Map $envMap -Key "ALERT_EMAIL_ENABLED" -Value "true"
  Set-EnvValue -Map $envMap -Key "ALERT_EMAIL_FROM" -Value "no-reply@library.local"
  Set-EnvValue -Map $envMap -Key "MAIL_HOST" -Value "mailpit"
  Set-EnvValue -Map $envMap -Key "MAIL_PORT" -Value "1025"
  Set-EnvValue -Map $envMap -Key "MAIL_USERNAME" -Value ""
  Set-EnvValue -Map $envMap -Key "MAIL_PASSWORD" -Value ""
  Set-EnvValue -Map $envMap -Key "MAIL_SMTP_AUTH" -Value "false"
  Set-EnvValue -Map $envMap -Key "MAIL_SMTP_STARTTLS" -Value "false"
} else {
  Set-EnvValue -Map $envMap -Key "ALERT_EMAIL_ENABLED" -Value "true"
  if (-not $envMap.Contains("ALERT_EMAIL_FROM") -or [string]::IsNullOrWhiteSpace($envMap["ALERT_EMAIL_FROM"]) -or $envMap["ALERT_EMAIL_FROM"] -eq "no-reply@library.local") {
    Set-EnvValue -Map $envMap -Key "ALERT_EMAIL_FROM" -Value "CHANGE_ME_VALIDATED_SENDER@yourdomain.com"
  }
  Set-EnvValue -Map $envMap -Key "MAIL_HOST" -Value "smtp-relay.brevo.com"
  Set-EnvValue -Map $envMap -Key "MAIL_PORT" -Value "587"
  if (-not $envMap.Contains("MAIL_USERNAME") -or [string]::IsNullOrWhiteSpace($envMap["MAIL_USERNAME"])) {
    Set-EnvValue -Map $envMap -Key "MAIL_USERNAME" -Value "CHANGE_ME_BREVO_SMTP_LOGIN"
  }
  if (-not $envMap.Contains("MAIL_PASSWORD") -or [string]::IsNullOrWhiteSpace($envMap["MAIL_PASSWORD"])) {
    Set-EnvValue -Map $envMap -Key "MAIL_PASSWORD" -Value "CHANGE_ME_BREVO_SMTP_KEY"
  }
  Set-EnvValue -Map $envMap -Key "MAIL_SMTP_AUTH" -Value "true"
  Set-EnvValue -Map $envMap -Key "MAIL_SMTP_STARTTLS" -Value "true"
}

$lines = foreach ($entry in $envMap.GetEnumerator()) {
  "$($entry.Key)=$($entry.Value)"
}

[System.IO.File]::WriteAllLines($envFile, $lines)

if ($Mode -eq "mailpit") {
  Write-Host "Modo email ativo: MAILPIT (local)." -ForegroundColor Green
} else {
  Write-Host "Modo email ativo: BREVO (preencha os campos CHANGE_ME no .env)." -ForegroundColor Yellow
}
