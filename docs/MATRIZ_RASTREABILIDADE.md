# Matriz de Rastreabilidade (RF/RNF -> Endpoint -> Teste)

Data de referencia: 2026-02-27

## RF (Funcionais)

| Requisito | Endpoints principais | Testes automatizados | Evidencia terminal |
|---|---|---|---|
| RF01 - Autenticacao | `POST /api/v1/users`, `POST /api/v1/auth/login` | `AuthIntegrationTest` | `scripts/e2e-smoke.ps1` |
| RF02 - Busca e filtros | `GET /api/v1/books`, `GET /api/v1/books/{bookId}`, `GET /api/v1/books/recommendations` | `BookIntegrationTest` | `scripts/e2e-smoke.ps1` |
| RF03 - Favoritos | `GET /api/v1/users/me/favorites`, `POST /api/v1/users/me/favorites`, `DELETE /api/v1/users/me/favorites/{bookId}` | `FavoriteIntegrationTest` | `scripts/e2e-smoke.ps1` |
| RF04 - Progresso de leitura | `POST /api/v1/readings` | `BadgeIntegrationTest` (cobertura indireta), `AlertNotificationIntegrationTest` | `scripts/e2e-smoke.ps1` |
| RF05 - Metas e alertas | `PUT /api/v1/users/me/goals`, `GET /api/v1/users/me/goals`, `GET /api/v1/users/me/goals/summary`, `GET /api/v1/users/me/alerts`, `GET /api/v1/users/me/streak` | `ReadingGoalIntegrationTest`, `ReadingGoalServiceTest`, `AlertNotificationIntegrationTest` | `scripts/e2e-smoke.ps1` |
| RF06 - Avaliacoes | `GET/POST/DELETE /api/v1/reviews`, `GET /api/v1/reviews/{reviewId}` | `ReviewIntegrationTest` | Manual/Swagger |
| RF07 - Ranking | `GET /api/v1/users/leaderboard` | `LeaderboardIntegrationTest` | `scripts/e2e-smoke.ps1` |
| RF08 - Catalogo admin | `POST/PATCH/DELETE /api/admin/books`, `POST/PUT/DELETE /api/admin/categories`, `POST/PUT/DELETE /api/admin/tags`, `POST/PUT/DELETE /api/admin/collections`, `GET/POST/PUT/DELETE /api/admin/badges` | `AdminCatalogIntegrationTest`, `BadgeIntegrationTest` | `scripts/e2e-smoke.ps1` |

## RNF (Nao Funcionais)

| Requisito | Evidencia tecnica | Como validar |
|---|---|---|
| RNF01 - Seguranca JWT | Spring Security + filtro JWT + roles USER/ADMIN | `AuthIntegrationTest` e acesso em `/api/admin/**` |
| RNF02 - Persistencia PostgreSQL | Spring Data JPA + PostgreSQL | `integrationTest` (Testcontainers) e Docker compose |
| RNF03 - Versionamento de banco | Liquibase (`src/main/resources/db/migrations`) | startup sem erro + tabela `databasechangelog` |
| RNF04 - Documentacao OpenAPI | Springdoc/Swagger UI | `GET /swagger-ui/index.html` |
| RNF05 - Deployment Docker Compose | `docker-compose.yml` com `api`, `library`, `mailpit`, `minio` | `docker compose up -d --build` + `GET /actuator/health` |

## Observacoes

- O endpoint admin de auditoria de alertas (`GET /api/admin/alerts/deliveries`) reforca governanca e evidencia de regra de opt-in.
- O codigo de badge e enum fixo (nao aceita valores livres fora do enum).
- Upload de PDF respeita limite configurado em Spring Multipart.
