# Mapa de Rotas Frontend x Endpoints Backend

Projeto: **Library**

Objetivo: manter um mapa simples das telas do frontend, suas regras de acesso e os endpoints backend consumidos. Use este arquivo antes de criar novas features, alterar rotas ou renomear endpoints.

Fontes revisadas:
- `frontend/src/app/router.tsx`
- chamadas `api.get/post/put/patch/delete` em `frontend/src`

## Regras de Acesso

| Escopo | Rotas |
|---|---|
| Publico | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/reset-password/:token`, `/auth/reset-password/:token`, `/forbidden` |
| Autenticado | `/`, `/profile`, `/books`, `/books/:bookId`, `/books/:bookId/read`, `/favorites`, `/reviews`, `/goals`, `/badges`, `/leaderboard` |
| Admin | `/admin`, `/admin/catalog`, `/admin/engagement`, `/admin/users`, `/admin/alerts` |

## Rotas Publicas

| Rota frontend | Tela | Endpoints principais |
|---|---|---|
| `/login` | Login | `POST /api/v1/auth/login` |
| `/register` | Cadastro | `POST /api/v1/users` |
| `/forgot-password` | Solicitar recuperacao | `POST /api/v1/auth/forgot-password` |
| `/reset-password` | Redefinir senha | `POST /api/v1/auth/reset-password` |
| `/reset-password/:token` | Redefinir senha com token | `POST /api/v1/auth/reset-password` |
| `/auth/reset-password/:token` | Compatibilidade de link de email | `POST /api/v1/auth/reset-password` |
| `/forbidden` | Acesso negado | Sem chamada direta |

## Rotas Autenticadas

| Rota frontend | Tela | Endpoints principais |
|---|---|---|
| `/` | Home | `GET /api/v1/home/resume` |
| `/profile` | Perfil | `GET /api/v1/users/me`, `PUT /api/v1/users/me`, `GET /api/v1/home/resume`, `GET /api/v1/readings/me`, `GET /api/v1/reviews/me` |
| `/books` | Catalogo | `GET /api/v1/books`, `GET /api/v1/categories`, `GET /api/v1/tags`, `GET /api/v1/users/me/favorites`, `POST /api/v1/users/me/favorites`, `DELETE /api/v1/users/me/favorites/{bookId}` |
| `/books/:bookId` | Detalhes do livro | `GET /api/v1/books/{bookId}`, `GET /api/v1/users/me/favorites/{bookId}`, `GET /api/v1/reviews/me`, `GET /api/v1/reviews`, `GET /api/v1/books/recommendations`, `POST /api/v1/users/me/favorites`, `DELETE /api/v1/users/me/favorites/{bookId}` |
| `/books/:bookId/read` | Experiencia de leitura | `GET /api/v1/books/{bookId}`, `GET /api/v1/home/resume`, `GET /api/v1/users/me/favorites`, `GET /api/v1/readings/{bookId}/narrative`, `POST /api/v1/readings`, `POST /api/v1/users/me/favorites`, `DELETE /api/v1/users/me/favorites/{bookId}` |
| `/favorites` | Favoritos | `GET /api/v1/users/me/favorites`, `DELETE /api/v1/users/me/favorites/{bookId}` |
| `/reviews` | Reviews | `GET /api/v1/reviews/me`, `GET /api/v1/books`, `GET /api/v1/readings/me`, `POST /api/v1/reviews`, `PATCH /api/v1/reviews/{reviewId}`, `DELETE /api/v1/reviews/{reviewId}` |
| `/goals` | Metas | `GET /api/v1/users/me/goals`, `PUT /api/v1/users/me/goals`, `GET /api/v1/users/me/alerts`, `GET /api/v1/users/me/streak` |
| `/badges` | Badges | `GET /api/v1/users/me/badges`, `GET /api/v1/home/resume` |
| `/leaderboard` | Ranking | `GET /api/v1/users/leaderboard`, `GET /api/v1/users/me` |

## Rotas Admin

As rotas admin usam `RoleRoute` com `ROLE_ADMIN`. A tela `/admin` mostra a visao completa; as subrotas exibem recortes do mesmo painel.

| Rota frontend | Secao | Endpoints principais |
|---|---|---|
| `/admin` | Visao geral admin | Todos os grupos abaixo, conforme secoes visiveis |
| `/admin/catalog` | Catalogo | `GET /api/admin/metrics`, `GET /api/admin/categories`, `GET /api/admin/tags`, `GET /api/v1/books`, `GET /api/v1/collections`, `POST /api/admin/books`, `PATCH /api/admin/books/{bookId}`, `DELETE /api/admin/books/{bookId}`, `POST /api/admin/books/{bookId}/upload`, `POST /api/admin/books/import/open-library`, `POST /api/admin/categories`, `PUT /api/admin/categories/{categoryId}`, `DELETE /api/admin/categories/{categoryId}`, `POST /api/admin/tags`, `PUT /api/admin/tags/{tagId}`, `DELETE /api/admin/tags/{tagId}`, `POST /api/admin/collections`, `PUT /api/admin/collections/{collectionId}`, `DELETE /api/admin/collections/{collectionId}` |
| `/admin/engagement` | Engajamento | `GET /api/admin/badges`, `GET /api/admin/favorites`, `POST /api/admin/badges`, `PUT /api/admin/badges/{badgeId}`, `DELETE /api/admin/badges/{badgeId}` |
| `/admin/users` | Usuarios | `GET /api/admin/users`, `PUT /api/admin/users/{userId}`, `DELETE /api/admin/users/{userId}`, `PATCH /api/admin/users/{userId}/reactivate` |
| `/admin/alerts` | Auditoria de alertas | `GET /api/admin/alerts/deliveries` |

## Endpoints Compartilhados Entre Telas

| Endpoint | Usado em |
|---|---|
| `GET /api/v1/home/resume` | Home, Perfil, Badges, Leitura |
| `GET /api/v1/books` | Catalogo, Reviews, Admin catalogo |
| `GET /api/v1/users/me/favorites` | Catalogo, Favoritos, Leitura |
| `POST /api/v1/users/me/favorites` | Catalogo, Detalhes do livro, Leitura |
| `DELETE /api/v1/users/me/favorites/{bookId}` | Catalogo, Detalhes do livro, Favoritos, Leitura |
| `GET /api/v1/reviews/me` | Perfil, Reviews, Detalhes do livro |
| `GET /api/v1/readings/me` | Perfil, Reviews |

## Checklist Para Evoluir Sem Quebrar Rotas

1. Ao criar nova tela, adicionar a rota em `frontend/src/app/router.tsx`.
2. Se a rota exigir login, coloca-la dentro de `ProtectedRoute`.
3. Se a rota for admin, protege-la com `RoleRoute role="ROLE_ADMIN"`.
4. Registrar aqui os endpoints consumidos pela tela.
5. Adicionar teste de rota ou teste da pagina quando houver regra de permissao, chamada API ou redirecionamento.
6. Rodar `npm run lint`, `npm run test` e `npm run build` antes de merge.
