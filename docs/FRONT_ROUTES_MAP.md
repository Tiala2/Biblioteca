# Mapa de Rotas do Frontend

Projeto: **Library**  
Objetivo: mapear rotas do front (usuÃ¡rio/admin), relacionar com endpoints reais e priorizar implementaÃ§Ã£o.

## 1. Regras de Acesso

- PÃºblico:
  - `/login`
- Autenticado (`USER` e `ADMIN`):
  - `/`
  - `/books`
  - `/goals`
  - `/badges`
  - `/leaderboard`
- Somente `ADMIN`:
  - `/admin`
  - subrotas administrativas propostas (abaixo)

## 2. Mapa de Rotas - UsuÃ¡rio

| Rota Front | Tela | Objetivo (RF) | Endpoint(s) |
|---|---|---|---|
| `/` | Home | Resumo de engajamento | `GET /api/v1/home/resume`, `GET /api/v1/users/leaderboard` |
| `/books` | Biblioteca | Busca e descoberta (RF02) | `GET /api/v1/books`, `GET /api/v1/books/{bookId}`, `GET /api/v1/books/recommendations` |
| `/books/:bookId/read` | Leitura (novo) | Progresso (RF04) | `POST /api/v1/readings`, `GET /api/v1/readings/{bookId}/narrative` |
| `/goals` | Metas | Metas + alertas (RF05) | `PUT /api/v1/users/me/goals`, `GET /api/v1/users/me/goals`, `GET /api/v1/users/me/goals/summary`, `GET /api/v1/users/me/alerts`, `GET /api/v1/users/me/streak` |
| `/badges` | Badges/Flashcards | Conquistas (RF07) | `GET /api/v1/users/me/badges` |
| `/leaderboard` | Ranking | Ranking (RF07) | `GET /api/v1/users/leaderboard` |
| `/favorites` | Favoritos (novo) | Favoritar livros (RF03) | `GET /api/v1/users/me/favorites`, `POST /api/v1/users/me/favorites`, `DELETE /api/v1/users/me/favorites/{bookId}` |
| `/reviews` | Minhas avaliaÃ§Ãµes (novo) | AvaliaÃ§Ã£o (RF06) | `GET /api/v1/reviews/me`, `POST /api/v1/reviews`, `PATCH /api/v1/reviews/{reviewId}`, `DELETE /api/v1/reviews/{reviewId}` |
| `/profile` | Perfil (novo) | PreferÃªncias do usuÃ¡rio | `GET /api/v1/users/me`, `PUT /api/v1/users/me` |

## 3. Mapa de Rotas - Admin

| Rota Front | Tela | Objetivo (RF08) | Endpoint(s) |
|---|---|---|---|
| `/admin` | Dashboard Admin | MÃ©tricas gerais | `GET /api/admin/metrics` |
| `/admin/books` | GestÃ£o de livros (novo) | CRUD de catÃ¡logo | `POST /api/admin/books`, `PATCH /api/admin/books/{bookId}`, `DELETE /api/admin/books/{bookId}`, `POST /api/admin/books/{bookId}/upload`, `POST /api/admin/books/import/open-library` |
| `/admin/categories` | GestÃ£o de categorias (novo) | CRUD categoria | `GET /api/v1/categories`, `POST /api/admin/categories`, `PUT /api/admin/categories/{categoryId}`, `DELETE /api/admin/categories/{categoryId}` |
| `/admin/tags` | GestÃ£o de tags (novo) | CRUD tags | `GET /api/v1/tags`, `POST /api/admin/tags`, `PUT /api/admin/tags/{tagId}`, `DELETE /api/admin/tags/{tagId}` |
| `/admin/collections` | GestÃ£o de coleÃ§Ãµes (novo) | CRUD coleÃ§Ãµes | `GET /api/v1/collections`, `POST /api/admin/collections`, `PUT /api/admin/collections/{id}`, `DELETE /api/admin/collections/{id}` |
| `/admin/badges` | CatÃ¡logo de badges (novo) | CRUD badges | `GET /api/admin/badges`, `POST /api/admin/badges`, `PUT /api/admin/badges/{id}`, `DELETE /api/admin/badges/{id}` |
| `/admin/users` | GestÃ£o de usuÃ¡rios (novo) | Auditoria e gestÃ£o | `GET /api/admin/users`, `GET /api/admin/users/{userId}`, `DELETE /api/admin/users/{userId}` |
| `/admin/alerts` | Auditoria alertas (novo) | Log de entrega | `GET /api/admin/alerts/deliveries` |

## 4. Estrutura TÃ©cnica de Rotas (React)

Implementar com nested routes:

```txt
/login
/
  /books
  /books/:bookId/read
  /goals
  /badges
  /leaderboard
  /favorites
  /reviews
  /profile
  /admin
    /books
    /categories
    /tags
    /collections
    /badges
    /users
    /alerts
```

## 5. Prioridade de Entrega (execuÃ§Ã£o)

## Fase 1 (obrigatÃ³ria)
1. `/login`
2. `/`
3. `/books`
4. `/goals`
5. `/badges`
6. `/leaderboard`
7. `/admin` (dashboard mÃ­nimo)

## Fase 2 (reforco de experiencia)
1. `/books/:bookId/read` com:
   - estado da trama
   - quem Ã© quem
   - quizzes
   - conquistas/flashcards
2. `/favorites`
3. `/reviews`

## Fase 3 (admin completo)
1. `/admin/books`
2. `/admin/categories`
3. `/admin/tags`
4. `/admin/collections`
5. `/admin/badges`
6. `/admin/users`
7. `/admin/alerts`

## 6. Requisitos do template cobertos no frontend

| Requisito | Cobertura Front |
|---|---|
| RF01 AutenticaÃ§Ã£o | `/login`, guardas de rota |
| RF02 Busca de livros | `/books` |
| RF03 Favoritos | `/favorites`, aÃ§Ãµes em cards de livros |
| RF04 Progresso de leitura | `/books/:bookId/read` |
| RF05 Metas | `/goals` |
| RF06 AvaliaÃ§Ãµes | `/reviews` |
| RF07 Ranking e badges | `/leaderboard`, `/badges` |
| RF08 CatÃ¡logo admin | rotas `/admin/*` |

## 7. Criterio de pronto (frontend)

1. Todas as rotas Fase 1 e Fase 2 funcionando com API real.
2. Tokens JWT e regras de perfil aplicadas em navegaÃ§Ã£o e chamadas.
3. Erros e carregamento tratados sem tela quebrada.
4. Visual consistente com os componentes e estilos compartilhados do frontend.


