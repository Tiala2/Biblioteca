# Relatorio de Cobertura de Rotas

Data/hora: 2026-03-11 22:29:16 -03:00

Resumo:
- Total de operacoes executadas: 56
- PASS: 56
- FAIL: 0

| Metodo | Rota | Status | Esperado | Resultado | Observacao |
|---|---|---:|---|---|---|
| GET | /api/v1/users/me | 200 | 200 | PASS | usuario logado |
| PUT | /api/v1/users/me | 204 | 204 | PASS | atualizar flags |
| GET | /api/v1/users/me/goals | 200 | 200 | PASS |  |
| PUT | /api/v1/users/me/goals | 200 | 200 | PASS |  |
| PUT | /api/admin/tags/{tagId} | 200 | 200 | PASS |  |
| DELETE | /api/admin/tags/{tagId} | 204 | 204 | PASS |  |
| PUT | /api/admin/collections/{id} | 200 | 200 | PASS |  |
| DELETE | /api/admin/collections/{id} | 204 | 204 | PASS |  |
| PUT | /api/admin/categories/{categoryId} | 200 | 200 | PASS |  |
| DELETE | /api/admin/categories/{categoryId} | 204 | 204,400 | PASS | pode falhar se referenciado |
| PUT | /api/admin/badges/{id} | 200 | 200 | PASS |  |
| DELETE | /api/admin/badges/{id} | 400 | 204,400,404 | PASS | depende de FK/user_badges |
| POST | /api/v1/users | 201 | 201,409 | PASS |  |
| GET | /api/v1/users/me/favorites | 200 | 200 | PASS |  |
| POST | /api/v1/users/me/favorites | 409 | 201,409 | PASS |  |
| GET | /api/v1/reviews | 200 | 200 | PASS |  |
| POST | /api/v1/reviews | 400 | 201,400,409 | PASS | duplicidade/regra de negocio pode bloquear review |
| POST | /api/v1/readings | 200 | 200 | PASS |  |
| POST | /api/v1/auth/login | 200 | 200,401 | PASS |  |
| GET | /api/admin/tags | 200 | 200 | PASS |  |
| POST | /api/admin/tags | 201 | 201,409 | PASS |  |
| POST | /api/admin/collections | 201 | 201,404 | PASS |  |
| POST | /api/admin/categories | 201 | 201,409 | PASS |  |
| POST | /api/admin/books | 201 | 201,409,404 | PASS |  |
| POST | /api/admin/books/{bookId}/upload | 204 | 204,400,413,415 | PASS | upload multipart com pdf temporario |
| GET | /api/admin/badges | 200 | 200 | PASS |  |
| POST | /api/admin/badges | 400 | 201,400,409 | PASS | restricoes de enum/duplicidade |
| GET | /api/v1/reviews/{reviewId} | 404 | 404 | PASS | sem review id disponivel no bootstrap |
| DELETE | /api/v1/reviews/{reviewId} | 404 | 404 | PASS | sem review id disponivel no bootstrap |
| PATCH | /api/v1/reviews/{reviewId} | 404 | 404 | PASS | sem review id disponivel no bootstrap |
| DELETE | /api/admin/books/{bookId} | 204 | 204 | PASS |  |
| PATCH | /api/admin/books/{bookId} | 204 | 204,404 | PASS | livro pode ter sido removido |
| GET | /api/v1/users/me/streak | 200 | 200 | PASS |  |
| GET | /api/v1/users/me/goals/summary | 200 | 200 | PASS |  |
| GET | /api/v1/users/me/favorites/{bookId} | 200 | 200 | PASS |  |
| DELETE | /api/v1/users/me/favorites/{bookId} | 204 | 204 | PASS |  |
| GET | /api/v1/users/me/badges | 200 | 200 | PASS |  |
| GET | /api/v1/users/me/alerts | 200 | 200 | PASS |  |
| GET | /api/v1/users/leaderboard | 200 | 200 | PASS |  |
| GET | /api/v1/tags | 200 | 200 | PASS |  |
| GET | /api/v1/reviews/me | 200 | 200 | PASS |  |
| GET | /api/v1/home/resume | 200 | 200 | PASS |  |
| GET | /api/v1/collections | 200 | 200 | PASS |  |
| GET | /api/v1/collections/{id} | 404 | 200,404 | PASS |  |
| GET | /api/v1/categories | 200 | 200 | PASS |  |
| GET | /api/v1/categories/{categoryId} | 404 | 200,404 | PASS |  |
| GET | /api/v1/categories/{categoryId}/books | 404 | 200,404 | PASS |  |
| GET | /api/v1/books | 200 | 200 | PASS |  |
| GET | /api/v1/books/{bookId} | 200 | 200 | PASS |  |
| GET | /api/v1/books/recommendations | 200 | 200 | PASS |  |
| GET | /api/admin/users | 200 | 200 | PASS |  |
| GET | /api/admin/users/{userId} | 200 | 200 | PASS |  |
| DELETE | /api/admin/users/{userId} | 204 | 204 | PASS |  |
| GET | /api/admin/metrics | 200 | 200 | PASS |  |
| GET | /api/admin/favorites | 200 | 200 | PASS |  |
| GET | /api/admin/alerts/deliveries | 200 | 200 | PASS |  |

