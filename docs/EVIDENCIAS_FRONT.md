# Evidencias Front

Data de referencia: `2026-03-12`

## 1. Acessibilidade aplicada

- Skip link para conteudo principal.
- `aria-label` na navegacao principal.
- foco visivel (`:focus-visible`) para links, botoes e campos.
- `aria-live` no stack de toasts.

Arquivos:
- `frontend/src/shared/layout/AppLayout.tsx`
- `frontend/src/shared/styles/index.css`
- `frontend/src/shared/ui/toast/ToastContext.tsx`

## 2. Testes Frontend (unitarios)

Scripts:
- `npm run test`
- `npm run test:watch`

Cobertura inicial implementada:
- `frontend/src/shared/ui/toast/ToastContext.test.tsx`
- `frontend/src/features/books/pages/BooksPage.test.tsx`

## 3. Teste ponta a ponta (E2E)

Script:
- `npm run test:e2e`

Config e caso inicial:
- `frontend/playwright.config.ts`
- `frontend/e2e/smoke.spec.ts`

Pre-requisito:
- Front rodando em `http://localhost:5173` (ou `FRONT_BASE_URL` configurado).

## 4. Fluxos UX finalizados

- Toasts globais de sucesso/erro:
  - login
  - salvar meta
  - salvar leitura
  - acoes admin (criar/excluir/importar)
- Pagina de leitura narrativa com quiz interativo.
- Paginas de favoritos e reviews.
- Paginacao real em books, badges e reviews.

## 5. Comandos de validacao tecnica

No diretorio `frontend`:

```bash
npm install
npm run test
npm run build
```

E2E (com app rodando):

```bash
npm run test:e2e
```
