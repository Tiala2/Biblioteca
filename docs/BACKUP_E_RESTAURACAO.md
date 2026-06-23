# Backup E Restauracao

Data de referencia: 2026-06-05

## Objetivo

Documentar o procedimento de backup e recuperacao de dados do projeto `Library`, cobrindo banco PostgreSQL e arquivos armazenados no volume do MinIO.

## Escopo

O procedimento cobre:

- dump do banco PostgreSQL
- copia do volume de arquivos do MinIO
- restauracao do banco
- restauracao do volume de arquivos

## Gerar Backup No Windows

No diretorio raiz do projeto:

```powershell
cd C:\workspace\library-api-projeto
powershell -ExecutionPolicy Bypass -File backend\scripts\backup-volumes.ps1 -OutputDir ..\backups
```

## Gerar Backup No Linux/macOS

No diretorio raiz do projeto:

```bash
cd backend
chmod +x scripts/backup-volumes.sh scripts/restore-volumes.sh
./scripts/backup-volumes.sh --output-dir ../backups
```

Saida esperada:

- `backups/<timestamp>/postgres-library.sql`
- `backups/<timestamp>/minio-data.tar.gz`
- `backups/<timestamp>/checksums.sha256`
- `backups/<timestamp>/backup-metadata.json` no Windows
- `backups/<timestamp>/backup-metadata.txt` no Linux/macOS

Tambem e possivel gerar dentro da pasta `backend` usando o padrao do script:

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File .\scripts\backup-volumes.ps1
```

Nesse caso, a saida sera:

- `backend\backups\<timestamp>\postgres-library.sql`
- `backend\backups\<timestamp>\minio-data.tar.gz`

## Restaurar Backup

No diretorio `backend`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restore-volumes.ps1 -BackupDir .\backups\<timestamp> -Force
```

No Linux, com a stack do backend ja iniciada:

```bash
chmod +x ./scripts/restore-volumes.sh
./scripts/restore-volumes.sh --backup-dir ../backups/<timestamp> --force
```

## Cuidados Operacionais

- usar restauracao apenas com a stack parada ou em janela controlada
- o parametro `-Force` existe para evitar restauracao acidental
- a restauracao substitui o schema atual do banco
- a restauracao do MinIO substitui os arquivos atuais do volume
- os scripts validam containers, volume, tamanho dos arquivos e checksums antes de concluir/restaurar

## Periodicidade Recomendada

Para o contexto atual de uso e laboratorio:

- backup antes de validacoes importantes
- backup antes de qualquer demonstracao importante
- backup antes de rodar mudancas estruturais em banco ou arquivos

## Evidencia No Projeto

- script de backup: [backup-volumes.ps1](../backend/scripts/backup-volumes.ps1)
- script de backup Linux/macOS: [backup-volumes.sh](../backend/scripts/backup-volumes.sh)
- script de restauracao: [restore-volumes.ps1](../backend/scripts/restore-volumes.ps1)
- volumes persistentes: [docker-compose.dev.yml](../backend/docker-compose.dev.yml)
