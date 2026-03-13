# Evidencia de Execucao - Rotas Backend

Data/Hora: 2026-03-02 (America/Sao_Paulo)

## Ambiente
- API: `http://localhost:8080`
- Banco: PostgreSQL via Docker Compose
- Servicos ativos: `api`, `library`, `minio`, `mailpit`

## Comandos executados
```powershell
$env:LIBRARY_ADMIN_EMAIL="seu-admin@email.com"
$env:LIBRARY_ADMIN_PASSWORD="sua-senha"
./scripts/route-checklist-exec.ps1 -BaseUrl "http://localhost:8080" -ReportPath "docs/ROUTE_COVERAGE_REPORT.md"
./scripts/e2e-smoke.ps1 -BaseUrl "http://localhost:8080" -AdminEmail "seu-admin@email.com" -AdminPassword "sua-senha"
```

## Resultado
- Checklist de rotas: `PASS=56`, `FAIL=0`, `TOTAL=56`
- Smoke E2E de API: concluido com sucesso

## Arquivos gerados
- `docs/ROUTE_COVERAGE_REPORT.md`
- `docs/EVIDENCIA_ROTAS_EXECUCAO.md`

## Observacoes
- O checklist cobre rotas publicas, autenticadas (USER) e administrativas (ADMIN), incluindo cenarios de negocio com respostas esperadas `400/404/409` em casos de duplicidade, FK e recursos inexistentes.
- A API foi validada na porta `8080`, conforme padrao do projeto.
