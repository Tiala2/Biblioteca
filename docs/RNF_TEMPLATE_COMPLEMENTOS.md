# RNF Complementos Do Template

Data de referencia: 2026-04-04

Este documento reforca os requisitos nao funcionais adicionais do template que exigem evidencia mais explicita no projeto.

## RNF004 - Protecao De Dados E LGPD

Status: `Atendido para o escopo atual do projeto`

Evidencias:

- o sistema coleta apenas dados essenciais de conta: nome, email, senha e preferencias basicas
- senhas nao sao armazenadas em texto puro; usam hash forte no backend
- o frontend permite configuracao de preferencias como `alertsOptIn` e `leaderboardOptIn`
- operacoes administrativas sensiveis possuem rastreabilidade por endpoints administrativos e auditoria de alertas

Referencias:

- [UserUpdateRequest.java](/c:/workspace/library-api-projeto/backend/src/main/java/com/unichristus/libraryapi/application/dto/request/UserUpdateRequest.java)
- [AuthenticationController.java](/c:/workspace/library-api-projeto/backend/src/main/java/com/unichristus/libraryapi/presentation/controller/AuthenticationController.java)
- [AlertAdminController.java](/c:/workspace/library-api-projeto/backend/src/main/java/com/unichristus/libraryapi/presentation/controller/admin/AlertAdminController.java)

## RNF005 - Tempo De Resposta Ate 2 Segundos

Status: `Validado`

Relatorio automatizado gerado em:

- [response-time-report.json](/c:/workspace/library-api-projeto/docs/generated/response-time-report.json)

Resultados medidos:

- `login`: media `146.54 ms`
- `books-list`: media `131.07 ms`
- `books-search`: media `1156.59 ms`

Todos os cenarios prioritarios medidos ficaram abaixo de `2 segundos` na media.

Ferramenta usada:

- [measure-rnf-response-times.ps1](/c:/workspace/library-api-projeto/scripts/measure-rnf-response-times.ps1)

## RNF006 - Otimizacao Para Internet Limitada

Status: `Atendido`

Evidencias:

- paginacao obrigatoria no catalogo
- respostas compactadas no backend por `server.compression`
- carregamento progressivo no frontend com `lazy` e `Suspense`
- payloads enxutos em listagens e filtros

Referencias:

- [BookController.java](/c:/workspace/library-api-projeto/backend/src/main/java/com/unichristus/libraryapi/presentation/controller/BookController.java)
- [application-dev.yaml](/c:/workspace/library-api-projeto/backend/src/main/resources/application-dev.yaml)
- [application-prod.yaml](/c:/workspace/library-api-projeto/backend/src/main/resources/application-prod.yaml)
- [router.tsx](/c:/workspace/library-api-projeto/frontend/src/app/router.tsx)

## RNF007 - Disponibilidade Minima De 99,5%

Status: `Documentado para operacao do projeto`

Evidencias de suporte operacional:

- healthcheck de API, PostgreSQL e MinIO
- reinicio automatico com `restart: on-failure`
- startup controlado por dependencias saudaveis
- script unico de subida do ambiente

Referencias:

- [docker-compose.dev.yml](/c:/workspace/library-api-projeto/backend/docker-compose.dev.yml)
- [start-all.ps1](/c:/workspace/library-api-projeto/start-all.ps1)

Observacao:

No contexto atual do projeto, este requisito foi tratado como estrategia operacional documentada. Nao ha monitoramento historico mensal no repositorio para provar SLA continuo.

## RNF008 - Compatibilidade E Responsividade

Status: `Atendido para o escopo web atual`

Evidencias:

- layout responsivo com navegacao lateral, cards e grid adaptavel
- validacao automatizada do frontend com build, testes e E2E
- execucao alvo em navegadores modernos

Referencias:

- [AppLayout.tsx](/c:/workspace/library-api-projeto/frontend/src/shared/layout/AppLayout.tsx)
- [BooksPage.tsx](/c:/workspace/library-api-projeto/frontend/src/features/books/pages/BooksPage.tsx)
- [playwright.config.ts](/c:/workspace/library-api-projeto/frontend/playwright.config.ts)

Observacao:

A base esta preparada para navegadores atuais. Para uma validacao formal em Chrome, Edge, Firefox e Safari, recomenda-se um checklist manual de homologacao.

## RNF009 - Usabilidade Da Interface

Status: `Atendido`

Evidencias:

- fluxos diretos para login, busca, leitura, favoritos, metas e admin
- feedback de sucesso, erro e carregamento
- pagina de detalhes do livro e perfil para melhorar compreensao de contexto

## RNF010 - Acessibilidade Da Interface

Status: `Atendido com boas praticas principais`

Evidencias:

- `skip-link` para conteudo principal
- labels em formularios de login, cadastro e recuperacao
- navegacao semantica por `nav`, `main` e `button`
- tabs com atributos de acessibilidade no ranking

Referencias:

- [AppLayout.tsx](/c:/workspace/library-api-projeto/frontend/src/shared/layout/AppLayout.tsx)
- [LoginPage.tsx](/c:/workspace/library-api-projeto/frontend/src/features/auth/pages/LoginPage.tsx)
- [ForgotPasswordPage.tsx](/c:/workspace/library-api-projeto/frontend/src/features/auth/pages/ForgotPasswordPage.tsx)
- [LeaderboardPage.tsx](/c:/workspace/library-api-projeto/frontend/src/features/leaderboard/pages/LeaderboardPage.tsx)

## RNF011 - Manutenibilidade Do Codigo

Status: `Atendido`

Evidencias:

- arquitetura em camadas no backend
- frontend organizado por features
- versionamento Git
- testes unitarios, integracao e E2E
- documentacao tecnica de apoio

## RNF012 - Backup E Recuperacao De Dados

Status: `Atendido`

Evidencias:

- script de backup para banco e MinIO
- script de restauracao para banco e MinIO
- procedimento documentado

Referencias:

- [backup-volumes.ps1](/c:/workspace/library-api-projeto/backend/scripts/backup-volumes.ps1)
- [restore-volumes.ps1](/c:/workspace/library-api-projeto/backend/scripts/restore-volumes.ps1)
- [BACKUP_E_RESTAURACAO.md](/c:/workspace/library-api-projeto/docs/BACKUP_E_RESTAURACAO.md)
