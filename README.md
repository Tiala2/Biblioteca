# library-api-projeto

Projeto de biblioteca virtual publica com foco em engajamento, com backend em Spring Boot e frontend em React.

## Estrutura

- `backend/`: API Java, banco, Docker e scripts operacionais
- `frontend/`: interface web em React + TypeScript
- `docs/`: guias, evidencias e material de apoio
- `scripts/`: validacoes e automacoes do projeto

## Documentacao principal

- [Documentacao Final](docs/DOCUMENTACAO_FINAL.md)
- [Plano de Reta Final](docs/PLANO_RETA_FINAL.md)
- [Roteiro de Apresentacao](docs/ROTEIRO_APRESENTACAO.md)
- [Checklist Operacional](docs/CHECKLIST_OPERACIONAL.md)
- [Checklist UAT](docs/UAT_CHECKLIST.md)
- [Checklist de Validacao Autenticada](docs/CHECKLIST_VALIDACAO_AUTENTICADA.md)
- [Validacao Final 2026-05-23](docs/VALIDACAO_FINAL_2026_05_23.md)
- [Mapa de Rotas Frontend x Backend](docs/FRONT_ROUTES_MAP.md)
- [Matriz de Rastreabilidade](docs/MATRIZ_RASTREABILIDADE.md)
- [Architecture Overview](docs/ARCHITECTURE_OVERVIEW.md)
- [Relatorio do Projeto](docs/RELATORIO_PROJETO.md)

## Subida rapida

Linux/macOS:

```bash
git fetch origin
git checkout feature/polimento-final-ui-textos
git pull origin feature/polimento-final-ui-textos

cd library-api-projeto
chmod +x start-all.sh backend/scripts/*.sh frontend/scripts/*.sh
./start-all.sh --build-backend
```

Se a porta `8080` estiver ocupada no Linux, use `8081` sem alterar arquivos:

```bash
API_PORT=8081 ./start-all.sh --build-backend
```

Comandos uteis no Linux/macOS:

```bash
# Rebuild do backend/Docker sem apagar dados
cd backend
./scripts/docker-rebuild-safe.sh --mode dev

# Rebuild usando API em http://localhost:8081
API_PORT=8081 ./scripts/docker-rebuild-safe.sh --mode dev

# Parar containers sem remover banco/arquivos
./scripts/docker-stop-safe.sh --mode dev

# Rodar testes do backend no Linux/macOS
./gradlew test
```

Windows/PowerShell:

```powershell
cd C:\workspace\library-api-projeto
powershell -ExecutionPolicy Bypass -File .\start-all.ps1 -BuildBackend
```

Se a porta `8080` estiver ocupada no Windows:

```powershell
cd C:\workspace\library-api-projeto
$env:API_PORT = "8081"
powershell -ExecutionPolicy Bypass -File .\start-all.ps1 -BuildBackend
```

## URLs principais

- Frontend: `http://localhost:5173`
- API: `http://localhost:8080` ou `http://localhost:8081` se usar `API_PORT=8081`
- Swagger: `http://localhost:8080/swagger-ui/index.html` ou `http://localhost:8081/swagger-ui/index.html`
- Health: `http://localhost:8080/actuator/health` ou `http://localhost:8081/actuator/health`
- Mailpit: `http://localhost:8025`

## Validacoes

```powershell
cd C:\workspace\library-api-projeto
.\scripts\e2e-smoke.ps1
.\scripts\route-checklist-exec.ps1
```

Os scripts podem usar `LIBRARY_ADMIN_EMAIL` e `LIBRARY_ADMIN_PASSWORD` definidos no `backend/.env`.

Para uma checagem completa antes de entrega:

```powershell
cd C:\workspace\library-api-projeto
powershell -ExecutionPolicy Bypass -File .\scripts\pre-delivery-check.ps1
```

Para uma checagem rapida, sem depender do navegador E2E nem do smoke autenticado:

```powershell
cd C:\workspace\library-api-projeto
powershell -ExecutionPolicy Bypass -File .\scripts\pre-delivery-check.ps1 -SkipBackendIntegration -SkipFrontendE2E -SkipOperationalSmoke
```
