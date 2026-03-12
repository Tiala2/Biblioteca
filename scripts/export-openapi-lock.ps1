param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$Output = "docs/openapi-lock.json"
)

$ErrorActionPreference = "Stop"

$uri = "$BaseUrl/v3/api-docs"
Write-Host "Exportando contrato OpenAPI de $uri ..."

$json = Invoke-RestMethod -Method GET -Uri $uri
$serialized = $json | ConvertTo-Json -Depth 100
Set-Content -Path $Output -Value $serialized -Encoding UTF8

Write-Host "Contrato exportado com sucesso para $Output"
