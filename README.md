# library-api-projeto

Projeto de biblioteca virtual publica com foco em engajamento, com backend em Spring Boot e frontend em React.

## Estrutura

- `backend/`: API Java, banco, Docker e scripts operacionais
- `frontend/`: interface web em React + TypeScript
- `docs/`: guias, evidencias e material de apoio
- `scripts/`: validacoes e automacoes do projeto

## Documentacao principal

- [Documentacao Final](C:\workspace\library-api-projeto\docs\DOCUMENTACAO_FINAL.md)
- [Architecture Overview](C:\workspace\library-api-projeto\docs\ARCHITECTURE_OVERVIEW.md)
- [Relatorio do Projeto](C:\workspace\library-api-projeto\docs\RELATORIO_PROJETO.md)

## Subida rapida

```powershell
cd C:\workspace\library-api-projeto
powershell -ExecutionPolicy Bypass -File .\start-all.ps1
```

## URLs principais

- Frontend: `http://localhost:5173`
- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui/index.html`
- Health: `http://localhost:8080/actuator/health`
- Mailpit: `http://localhost:8025`

## Validacoes

```powershell
cd C:\workspace\library-api-projeto
.\scripts\e2e-smoke.ps1
.\scripts\route-checklist-exec.ps1
```

Os scripts podem usar `LIBRARY_ADMIN_EMAIL` e `LIBRARY_ADMIN_PASSWORD` definidos no `backend/.env`.
