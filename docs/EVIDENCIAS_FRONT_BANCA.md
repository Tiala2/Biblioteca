# Evidencias Front - Banca

Data de referencia: `2026-03-12`

## 1. Acessibilidade aplicada

- Skip link para conteÃºdo principal.
- `aria-label` na navegaÃ§Ã£o principal.
- foco visÃ­vel (`:focus-visible`) para links, botÃµes e campos.
- `aria-live` no stack de toasts.

Arquivos:
- `frontend/src/shared/layout/AppLayout.tsx`
- `frontend/src/shared/styles/index.css`
- `frontend/src/shared/ui/toast/ToastContext.tsx`

## 2. Testes Frontend (unitÃ¡rios)

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

PrÃ©-requisito:
- Front rodando em `http://localhost:5173` (ou `FRONT_BASE_URL` configurado).

## 4. Fluxos UX finalizados

- Toasts globais de sucesso/erro:
  - login
  - salvar meta
  - salvar leitura
  - aÃ§Ãµes admin (criar/excluir/importar)
- PÃ¡gina de leitura narrativa com quiz interativo.
- PÃ¡ginas de favoritos e reviews.
- PaginaÃ§Ã£o real em books, badges e reviews.

## 5. Comandos de validaÃ§Ã£o tÃ©cnica

No diretÃ³rio `frontend`:

```bash
npm install
npm run test
npm run build
```

E2E (com app rodando):

```bash
npm run test:e2e
```

