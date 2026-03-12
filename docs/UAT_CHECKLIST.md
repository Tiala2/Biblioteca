# Checklist UAT - Library API

Data base de execução: 27/02/2026

## Escopo

Este checklist cobre validação funcional (RF) e não funcional (RNF) do template do TCC.

## Funcionais (RF)

| ID | Cenário | Endpoint(s) | Resultado esperado | Status |
|---|---|---|---|---|
| RF01 | Cadastro e login com JWT | `POST /api/v1/users`, `POST /api/v1/auth/login` | Usuário cadastrado e token retornado | Concluído (terminal + integrationTest) |
| RF02 | Busca e filtros de livros | `GET /api/v1/books` | Lista paginada com filtros aplicados | Concluído (integrationTest) |
| RF03 | Favoritar e desfavoritar livro | `POST/DELETE /api/v1/users/me/favorites/{bookId}` | Livro entra e sai da lista de favoritos | Concluído (integrationTest) |
| RF04 | Sincronizar progresso de leitura | `POST /api/v1/readings` | Progresso atualizado e status coerente | Concluído (terminal) |
| RF05 | Definir e consultar meta de leitura | `PUT/GET /api/v1/users/me/goals` | Meta ativa com métricas de progresso | Concluído (terminal + integrationTest) |
| RF05 | Consultar alertas internos e streak | `GET /api/v1/users/me/alerts`, `GET /api/v1/users/me/streak` | Alertas coerentes com meta/ritmo e streak | Concluído (terminal) |
| RF06 | Avaliação única por livro | `POST /api/v1/reviews` | Primeira avaliação aceita, duplicada rejeitada | Concluído (integrationTest) |
| RF07 | Consultar leaderboard | `GET /api/v1/users/leaderboard` | Ranking retornado conforme regras | Concluído (terminal + integrationTest) |
| RF08 | CRUD admin de livros/categorias/tags/coleções/badges | `/api/admin/**` | Apenas ADMIN com acesso, operações funcionando | Concluído (terminal + integrationTest) |

## Não Funcionais (RNF)

| ID | Cenário | Evidência | Resultado esperado | Status |
|---|---|---|---|---|
| RNF01 | Segurança JWT e perfis USER/ADMIN | Acesso autenticado e bloqueios `403` | Rotas protegidas por perfil | Concluído (integrationTest) |
| RNF02 | Persistência PostgreSQL | Operações CRUD + consulta pós-restart | Dados persistidos corretamente | Concluído (Testcontainers + Docker) |
| RNF03 | Migrations com Liquibase | Startup sem erro e `databasechangelog` atualizado | Esquema versionado com sucesso | Concluído (logs de startup) |
| RNF04 | OpenAPI/Swagger | `GET /swagger-ui/index.html` | Documentação acessível e consistente | Concluído (HTTP 200) |
| RNF05 | Deployment Docker Compose | `docker compose up -d --build` | Stack completa no ar (API+DB+MinIO+Mailpit) | Concluído (ambiente ativo) |

## Critério de aceite

- Marcar `Concluído` quando o cenário executar sem erro e com evidência (print/log/curl).
- Se falhar, registrar causa, impacto e ação corretiva antes da banca.
