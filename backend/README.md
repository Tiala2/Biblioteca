# Backend - Operacao Segura com Docker

## Objetivo
Manter banco e arquivos sempre persistidos, evitando perda de dados e erros ao subir os containers.

## Ambientes
- `docker-compose.dev.yml`: desenvolvimento (com Mailpit)
- `docker-compose.prod.yml`: producao (sem Mailpit)
- `docker-compose.yml`: atalho para desenvolvimento

## Banco padrao de desenvolvimento
- O banco compartilhado do projeto roda no Docker em `localhost:5437`.
- Evite usar `localhost:5432`, porque essa porta costuma ser de um PostgreSQL instalado na maquina.
- No perfil `dev`, a API bloqueia `jdbc:postgresql://localhost:5432/...` por seguranca para impedir que dados sejam salvos no banco errado.
- Se for realmente necessario usar `5432`, defina `ALLOW_LOCAL_DB_5432=true` de forma consciente e temporaria.

## Regras para nao perder dados
- Nao use `docker compose down -v`.
- Nao use `docker volume prune`.
- Para uso diario: `stop` e `up-safe`.

## Comandos recomendados (Windows / PowerShell)
No diretorio `backend`:

```powershell
# DEV sem rebuild
powershell -ExecutionPolicy Bypass -File .\scripts\docker-up-safe.ps1 -Mode dev

# DEV com rebuild
powershell -ExecutionPolicy Bypass -File .\scripts\docker-up-safe.ps1 -Mode dev -Build

# PROD (sem mailpit)
powershell -ExecutionPolicy Bypass -File .\scripts\docker-up-safe.ps1 -Mode prod -Build

# Retry de rebuild (falhas temporarias)
powershell -ExecutionPolicy Bypass -File .\scripts\docker-rebuild-safe.ps1 -Mode dev

# Parar sem apagar dados
powershell -ExecutionPolicy Bypass -File .\scripts\docker-stop-safe.ps1 -Mode dev
```

## Comandos recomendados (Linux/macOS)
No diretorio `backend`:

```bash
# DEV sem rebuild
./scripts/docker-up-safe.sh --mode dev

# DEV com rebuild
./scripts/docker-up-safe.sh --mode dev --build

# PROD (sem mailpit)
./scripts/docker-up-safe.sh --mode prod --build

# Parar sem apagar dados
./scripts/docker-stop-safe.sh --mode dev
```

## Healthcheck e startup confiavel
A API agora espera banco, MinIO e Mailpit (no dev) ficarem saudaveis antes de iniciar.

## Backup
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup-volumes.ps1
```
Backups sao gravados em `backend\backups\<timestamp>`:
- `postgres-library.sql`
- `minio-data.tar.gz`

## Restauracao
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restore-volumes.ps1 -BackupDir .\backups\<timestamp> -Force
```

## Observacao
No primeiro start, aguarde `Started LibraryApiApplication` nos logs:

```powershell
docker logs -f backend-api-1
```
