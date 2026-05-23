# Plano de Reta Final

Este guia resume o que precisa ser conferido antes da entrega e da apresentacao.

## Prioridade 1 - Validacao funcional

- Login, cadastro e recuperacao de senha no computador da apresentacao.
- Catalogo com busca, filtros, paginacao, capa e detalhes do livro.
- Favoritos: salvar, remover e abrir livro favorito.
- Leitura: abrir livro, ajustar pagina, salvar progresso e concluir fluxo.
- Avaliacoes: criar, editar e remover avaliacao.
- Metas, conquistas e ranking com dados carregando corretamente.
- Admin: criar, editar e remover livro, categoria, tag, colecao, conquista e usuario.
- Admin: atualizar capa e enviar arquivo PDF.

## Prioridade 2 - Validacao visual

- Verificar desktop e mobile nas telas principais.
- Conferir textos quebrados, cards vazando, botoes desalinhados e capas grandes demais.
- Conferir estados vazios: sem favoritos, sem avaliacoes, sem meta, sem conquistas e sem resultados no catalogo.
- Conferir tema escuro e tema claro no login, cadastro e telas autenticadas.

## Prioridade 3 - Docker e banco

- Confirmar que o projeto sobe pelo Docker sem usar banco local.
- Confirmar que o banco compartilhado esta em `localhost:5437`.
- Confirmar que a API funciona em `8080` e, se a porta estiver ocupada, em `8081`.
- Validar restauracao de backup quando outro integrante precisar dos mesmos dados.

Comandos uteis:

```bash
chmod +x start-all.sh backend/scripts/*.sh frontend/scripts/*.sh
./start-all.sh --build-backend
API_PORT=8081 ./start-all.sh --build-backend
```

## Prioridade 4 - Testes antes da entrega

Checagem rapida recomendada para repetir durante o polimento:

```powershell
cd C:\workspace\library-api-projeto
powershell -ExecutionPolicy Bypass -File .\scripts\pre-delivery-check.ps1 -SkipBackendIntegration -SkipFrontendE2E -SkipOperationalSmoke
```

Frontend:

```powershell
cd frontend
npm run test
npm run lint
npm run build
```

Backend:

```powershell
cd backend
.\gradlew.bat test
```

Linux/macOS:

```bash
cd backend
./gradlew test
```

## Prioridade 5 - Apresentacao

- Usar `docs/APRESENTACAO_COMPUTADOR_TIALA.md` como guia do ambiente principal.
- Seguir o roteiro em `docs/ROTEIRO_APRESENTACAO.md`.
- Conferir o checklist autenticado em `docs/CHECKLIST_VALIDACAO_AUTENTICADA.md`.
- Separar usuario e senha de demonstracao.
- Deixar backup pronto para restaurar, se necessario.
- Abrir previamente frontend, Swagger, Mailpit e banco Docker.
- Tirar prints finais das telas principais.
- Mostrar que o sistema tem CRUD, leitura, progresso, favoritos, avaliacoes, ranking, metas, conquistas e admin.
- Explicar que Docker padroniza o ambiente para evitar diferenca entre maquinas.

## Checklist final de Git

- Branch de melhorias validada.
- `npm run build` passando.
- `.\gradlew.bat test` passando no backend.
- Backup atualizado.
- Merge para `main` somente depois da validacao final autenticada.
