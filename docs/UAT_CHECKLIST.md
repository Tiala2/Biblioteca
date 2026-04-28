# Checklist UAT - Library API

Data base de execucao: 28/04/2026

## Escopo

Este checklist cobre validacao funcional (RF) e nao funcional (RNF) do projeto.

## Funcionais (RF)

| ID | Cenario | Endpoint(s) | Resultado esperado | Status |
|---|---|---|---|---|
| RF01 | Cadastro e login com JWT | `POST /api/v1/users`, `POST /api/v1/auth/login` | Usuario cadastrado e token retornado | Concluido (terminal + integrationTest) |
| RF02 | Busca e filtros de livros | `GET /api/v1/books` | Lista paginada com filtros aplicados | Concluido (integrationTest + E2E) |
| RF03 | Favoritar e desfavoritar livro | `POST/DELETE /api/v1/users/me/favorites/{bookId}` | Livro entra e sai da lista de favoritos | Concluido (integrationTest) |
| RF04 | Sincronizar progresso de leitura | `POST /api/v1/readings` | Progresso atualizado e status coerente | Concluido (E2E + integrationTest) |
| RF05 | Definir e consultar meta de leitura | `PUT/GET /api/v1/users/me/goals` | Meta ativa com metricas de progresso | Concluido (E2E + integrationTest) |
| RF05 | Consultar alertas internos e streak | `GET /api/v1/users/me/alerts`, `GET /api/v1/users/me/streak` | Alertas coerentes com meta/ritmo e streak | Concluido (terminal + integrationTest) |
| RF06 | Avaliacao unica por livro | `POST /api/v1/reviews` | Primeira avaliacao aceita, duplicada rejeitada | Concluido (E2E + integrationTest) |
| RF07 | Consultar leaderboard | `GET /api/v1/users/leaderboard` | Ranking retornado conforme regras | Concluido (E2E + integrationTest) |
| RF08 | CRUD admin de livros/categorias/tags/colecoes/badges | `/api/admin/**` | Apenas ADMIN com acesso, operacoes funcionando | Concluido (E2E + integrationTest) |
| RF09 | Smoke frontend completo | `npm run test:e2e` | Jornada principal de usuario e admin validada no navegador | Concluido (13 E2E passed) |
| RF10 | Aviso de API indisponivel | `ApiStatusBanner.test.tsx` | Front sinaliza falha de conexao com backend sem tela branca | Concluido (unitario) |
| RNF09 | Checklist de seguranca pre-deploy | `docs/SECURITY_DEPLOY_CHECKLIST.md` | Seguranca operacional revisada antes de publicacao | Concluido (documentado) |

## Nao Funcionais (RNF)

| ID | Cenario | Evidencia | Resultado esperado | Status |
|---|---|---|---|---|
| RNF01 | Seguranca JWT e perfis USER/ADMIN | Acesso autenticado e bloqueios `403` | Rotas protegidas por perfil | Concluido (integrationTest + E2E admin) |
| RNF02 | Persistencia PostgreSQL | Operacoes CRUD + consulta pos-restart | Dados persistidos corretamente | Concluido (Testcontainers + Docker) |
| RNF03 | Migrations com Liquibase | Startup sem erro e `databasechangelog` atualizado | Esquema versionado com sucesso | Concluido (logs de startup) |
| RNF04 | OpenAPI/Swagger | `GET /swagger-ui/index.html` | Documentacao acessivel e consistente | Concluido (HTTP 200) |
| RNF05 | Deployment Docker Compose | `docker compose up -d --build` | Stack completa no ar (API+DB+MinIO+Mailpit) | Concluido (ambiente ativo) |
| RNF06 | Resiliencia operacional | testes unitarios e integracao critica | Falhas externas degradam sem derrubar fluxo principal | Concluido |

## Evidencia da retomada final

- Backend `.\gradlew.bat test --no-daemon`: PASS
- Backend `.\gradlew.bat integrationTest --no-daemon`: PASS
- Frontend `npm run test`: 32 passed
- Frontend `npm run build`: PASS
- Frontend `npm run test:e2e`: 13 passed
- Checklist de rotas: 56 PASS / 0 FAIL

## Criterio de aceite

- Marcar `Concluido` quando o cenario executar sem erro e com evidencia.
- Se falhar, registrar causa, impacto e acao corretiva antes de nova validacao.
