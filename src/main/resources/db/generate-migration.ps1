# Script: generate-migration.ps1
# Uso: .\generate-migration.ps1 nome-da-migration
# Descrição: Gera um arquivo de migration Liquibase com timestamp e template padrão

param (
    [Parameter(Mandatory = $true)]
    [string]$MigrationName
)

# Diretório fixo das migrations
$MigrationsDir = ".\migrations"

# Garante que o diretório exista
if (-not (Test-Path $MigrationsDir)) {
    New-Item -ItemType Directory -Path $MigrationsDir | Out-Null
}

# Gera timestamp em milissegundos
$Timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

# Nome e caminho do arquivo
$Filename = "$Timestamp-$MigrationName.sql"
$FilePath = Join-Path $MigrationsDir $Filename

# Conteúdo do arquivo
$Content = @"
--liquibase formatted sql
--changeset author:$Timestamp
"@

# Cria o arquivo
Set-Content -Path $FilePath -Value $Content -Encoding UTF8

Write-Host "✅ Migration criada com sucesso!"