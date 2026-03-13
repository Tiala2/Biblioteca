# Roteiro de Teste Manual (cURL)

Base URL: `http://localhost:8080`  
Data de referência: `2026-03-02`

## 1. Autenticação

### 1.1 Login Admin
```bash
curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"seu-admin@email.com","password":"sua-senha"}'
```
Esperado: `200 OK` com `token`, `type`, `userId`, `email`.

### 1.2 Login Usuário comum
```bash
curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"seu-usuario@email.com","password":"sua-senha"}'
```
Esperado: `200 OK` com JWT válido.

## 2. Usuário

> Defina variáveis no terminal:
```bash
ADMIN_TOKEN="SEU_TOKEN_ADMIN"
USER_TOKEN="SEU_TOKEN_USER"
```

### 2.1 Perfil do usuário logado
```bash
curl -X GET "http://localhost:8080/api/v1/users/me" \
  -H "Authorization: Bearer $USER_TOKEN"
```
Esperado: `200 OK`.

### 2.2 Criar/atualizar meta de leitura
```bash
curl -X PUT "http://localhost:8080/api/v1/users/me/goals" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"period":"MONTHLY","targetPages":120}'
```
Esperado: `200 OK`.

### 2.3 Buscar resumo da meta
```bash
curl -X GET "http://localhost:8080/api/v1/users/me/goals/summary?period=MONTHLY" \
  -H "Authorization: Bearer $USER_TOKEN"
```
Esperado: `200 OK`.

### 2.4 Registrar progresso de leitura
```bash
curl -X POST "http://localhost:8080/api/v1/readings" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bookId":"BOOK_ID","currentPage":10}'
```
Esperado: `200 OK`.

## 3. Narrativa / Gamificação

### 3.1 Estado da trama + personagens + quizzes + conquistas
```bash
curl -X GET "http://localhost:8080/api/v1/readings/BOOK_ID/narrative?currentPage=90" \
  -H "Authorization: Bearer $USER_TOKEN"
```
Esperado: `200 OK` com campos:
- `phase`
- `beatTitle`
- `plotState`
- `knownCharacters`
- `quizzes`
- `achievements`

### 3.2 Validação de página inválida
```bash
curl -X GET "http://localhost:8080/api/v1/readings/BOOK_ID/narrative?currentPage=9999" \
  -H "Authorization: Bearer $USER_TOKEN"
```
Esperado: `400 Bad Request` (`SEARCH_FILTER_INVALID`).

## 4. Catálogo Admin

### 4.1 Criar categoria
```bash
curl -X POST "http://localhost:8080/api/admin/categories" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Categoria TCC","description":"Categoria para evidência"}'
```
Esperado: `201 Created`.

### 4.2 Criar livro
```bash
curl -X POST "http://localhost:8080/api/admin/books" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Livro Evidência TCC",
    "isbn":"9789990001234",
    "numberOfPages":180,
    "publicationDate":"2020-01-01",
    "coverUrl":"https://example.com/capa.jpg",
    "categories":["CATEGORY_ID"]
  }'
```
Esperado: `201 Created`.

### 4.3 Upload de PDF no livro
```bash
curl -X POST "http://localhost:8080/api/admin/books/BOOK_ID/upload" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "file=@./seu-arquivo.pdf;type=application/pdf"
```
Esperado: `204 No Content` (ou `400` se arquivo inválido).

### 4.4 Listar badges
```bash
curl -X GET "http://localhost:8080/api/admin/badges?page=0&size=20&sort=code" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
Esperado: `200 OK`.

## 5. Evidências para o TCC

Registre prints (ou saída JSON) destes itens:
1. Login retornando JWT (`/api/v1/auth/login`)
2. Progresso de leitura (`/api/v1/readings`)
3. Endpoint narrativo (`/api/v1/readings/{bookId}/narrative`)
4. Criação de livro admin (`/api/admin/books`)
5. Relatorio automatizado: `docs/generated/ROUTE_COVERAGE_REPORT.md` com `PASS=56` e `FAIL=0`
