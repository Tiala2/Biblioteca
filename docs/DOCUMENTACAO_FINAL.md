# Documentacao Final - Library API

Data de referencia: 2026-04-28

## 1. Escopo do projeto

Backend de biblioteca virtual publica com foco em engajamento:

- RF01: autenticacao e cadastro
- RF02: busca e filtros de livros
- RF03: favoritos
- RF04: progresso de leitura
- RF05: metas, alertas e streak
- RF06: avaliacoes
- RF07: leaderboard
- RF08: catalogo administrativo

## 2. Arquitetura e stack

Arquitetura em camadas:

- `presentation`
- `application`
- `domain`
- `infrastructure`

Tecnologias:

- Java 21
- Spring Boot 3.5
- Spring Security + JWT
- Spring Data JPA
- PostgreSQL
- Liquibase
- OpenAPI/Swagger
- Docker Compose
- Mailpit (SMTP local sem custo)

## 3. Como executar

```powershell
docker compose up -d --build
```

URLs:

- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui/index.html`
- Health: `http://localhost:8080/actuator/health`
- Mailpit UI: `http://localhost:8025`
- MinIO Console: `http://localhost:9001`

## 4. Qualidade e testes

Executar testes:

```powershell
./gradlew.bat test integrationTest
```

Smoke E2E:

```powershell
$env:LIBRARY_ADMIN_EMAIL="seu-admin@email.com"
$env:LIBRARY_ADMIN_PASSWORD="sua-senha"
./scripts/e2e-smoke.ps1
```

Opcional (sem variaveis de ambiente):

- Defina `LIBRARY_ADMIN_EMAIL` e `LIBRARY_ADMIN_PASSWORD` no `backend/.env`
- Execute `./scripts/e2e-smoke.ps1`

Resultados mais recentes:

- Backend `./gradlew.bat test --no-daemon`: **BUILD SUCCESSFUL**
- Backend `./gradlew.bat integrationTest --no-daemon`: **BUILD SUCCESSFUL**
- Frontend `npm run build`: **PASS**
- Frontend `npm run test`: **32 passed**
- Frontend `npm run test:e2e`: **13 passed**
- Smoke API (`scripts/e2e-smoke.ps1`): **PASS**
- Checklist de rotas (`scripts/route-checklist-exec.ps1`): **PASS=56 / FAIL=0**

Cobertura de integracao inclui:

- auth/login
- books/search
- favorites
- reviews
- reading goals/alerts/streak
- leaderboard
- badges
- admin catalog (categories/tags/collections/books)
- admin users (list/get/delete)
- admin upload PDF (success/forbidden)
- audit de alertas admin
- smoke E2E frontend com cadastro/login, catalogo, leitura, metas, reviews, badges, ranking e admin
- observabilidade com `traceId` e mascaramento de campos sensiveis em logs
- seguranca HTTP/CORS e expiracao de sessao no front
- fallback global contra tela branca no frontend
- aviso visual quando a API fica indisponivel

## 5. Status por requisito

| Requisito | Status | Evidencia |
|---|---|---|
| RF01 | Concluido | `AuthIntegrationTest`, smoke |
| RF02 | Concluido | `BookIntegrationTest`, smoke |
| RF03 | Concluido | `FavoriteIntegrationTest`, smoke |
| RF04 | Concluido | `BadgeIntegrationTest`, `AlertNotificationIntegrationTest`, smoke |
| RF05 | Concluido | `ReadingGoalIntegrationTest`, `ReadingGoalServiceTest`, smoke |
| RF06 | Concluido | `ReviewIntegrationTest` |
| RF07 | Concluido | `LeaderboardIntegrationTest`, smoke |
| RF08 | Concluido | `AdminCatalogIntegrationTest`, `AdminUserManagementIntegrationTest`, `AdminBookUploadIntegrationTest` |
| RNF01 | Concluido | JWT + autorizacao por role |
| RNF02 | Concluido | PostgreSQL + Testcontainers |
| RNF03 | Concluido | Liquibase migrations |
| RNF04 | Concluido | Swagger em `/swagger-ui/index.html` |
| RNF05 | Concluido | Docker Compose stack |

## 6. Artefatos principais do projeto

- `docs/MATRIZ_RASTREABILIDADE.md`
- `docs/CHECKLIST_OPERACIONAL.md`
- `docs/generated/ROUTE_COVERAGE_REPORT.md`
- `docs/EVIDENCIAS_FRONT.md`
- `docs/API_FRONT_READINESS.md`
- `docs/UAT_CHECKLIST.md`
- `docs/SECURITY_DEPLOY_CHECKLIST.md`
- `docs/BACKEND_FINAL_VALIDACAO.md`
- `docs/RELATORIO_PROJETO.md`
- `docs/openapi-lock.json`

## 7. Limites conhecidos

- `GET /` retorna `403` (esperado pela seguranca).
- Badge code usa enum fixo.
- Upload PDF respeita limite de multipart.
- E-mail de recuperacao suporta Mailpit (local) e SMTP real (producao).
- Nesta fase nao ha refresh token; expiracao de JWT exige novo login.
- Logs de aplicacao mascaram senha, token e authorization; loggers verbosos de body do Spring permanecem em `INFO`.
- O front remove sessao local expirada e redireciona para login em `401`.
- CORS deve ser mantido restrito por ambiente via `APP_CORS_ALLOWED_ORIGINS`.
- Mutacoes administrativas em `/api/admin/**` geram log `ADMIN_AUDIT` com ator, rota, status e `traceId`.

## 8. Decisao de autenticacao para o front

- Estrategia adotada: JWT stateless com relogin no vencimento.
- Regra de UX/API: resposta `401` deve encerrar sessao local e redirecionar para tela de login.
- Justificativa: menor complexidade e menor risco para o escopo atual do projeto.
- Roadmap: refresh token com revogacao como evolucao futura.

## 9. Proximo passo tecnico recomendado

- A base atual esta pronta para fechamento de entrega no escopo do template.
- Antes de release formal, recomenda-se apenas revisao final do diff para commit.
