# Apresentacao No Computador Principal

Este guia assume que a demonstracao sera feita no computador principal do projeto.

## Antes de iniciar

- Confirmar que esta na branch `feature/polimento-final-ui-textos`.
- Confirmar que o Git esta limpo.
- Confirmar que o banco usado e o Docker em `localhost:5437`.
- Confirmar que o arquivo `backend/.env` local esta correto.
- Nao compartilhar o `backend/.env` com credenciais reais.

## Subir sistema

No PowerShell:

```powershell
cd C:\workspace\library-api-projeto
powershell -ExecutionPolicy Bypass -File .\start-all.ps1 -BuildBackend
```

Usar `8081` apenas se a porta `8080` estiver ocupada:

```powershell
cd C:\workspace\library-api-projeto
$env:API_PORT = "8081"
powershell -ExecutionPolicy Bypass -File .\start-all.ps1 -BuildBackend
```

## Abrir antes da fala

- Frontend: `http://localhost:5173`
- API Health: `http://localhost:8080/actuator/health`
- Swagger: `http://localhost:8080/swagger-ui/index.html`
- Mailpit: `http://localhost:8025`

Se usar `API_PORT=8081`, trocar as URLs de Health e Swagger para `8081`.

Para conferir tudo pelo terminal:

```powershell
cd C:\workspace\library-api-projeto
powershell -ExecutionPolicy Bypass -File .\scripts\check-local-stack.ps1
```

Se estiver usando `8081`:

```powershell
cd C:\workspace\library-api-projeto
powershell -ExecutionPolicy Bypass -File .\scripts\check-local-stack.ps1 -BackendHealthUrl "http://localhost:8081/actuator/health" -SwaggerUrl "http://localhost:8081/swagger-ui/index.html"
```

## Validar rapidamente

```powershell
cd C:\workspace\library-api-projeto
powershell -ExecutionPolicy Bypass -File .\scripts\pre-delivery-check.ps1 -SkipBackendIntegration -SkipFrontendE2E -SkipOperationalSmoke
```

Resultado esperado:

- Backend unit tests: `BUILD SUCCESSFUL`
- Frontend lint: `PASS`
- Frontend unit tests: `51 passed`
- Frontend build: `PASS`

## Fluxo de demonstracao

Seguir:

- `docs/ROTEIRO_APRESENTACAO.md`
- `docs/CHECKLIST_VALIDACAO_AUTENTICADA.md`

## Plano B

- Se o frontend acusar API indisponivel, verificar Health e porta usada.
- Se a porta `8080` estiver ocupada, usar `API_PORT=8081`.
- Se recuperacao por email real falhar, explicar que o projeto tambem suporta Mailpit local.
- Se algum dado sumir, restaurar backup do banco Docker.
- Se a Open Library falhar, demonstrar livros locais e PDFs cadastrados.
