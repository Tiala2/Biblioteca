# Evolucao Sem Retrabalho

Este guia define onde criar novas funcionalidades para manter o projeto alinhado ao template atual. A regra principal e simples: seguir a organizacao existente antes de criar uma estrutura nova.

## Antes de comecar

- Confirme se a funcionalidade ja existe parcial ou totalmente em `docs/FRONT_ROUTES_MAP.md`.
- Verifique se ha regra parecida em `backend/src/main/java/com/unichristus/libraryapi/domain`.
- Procure telas parecidas em `frontend/src/features`.
- Prefira reaproveitar componentes de `frontend/src/shared` e utilitarios de API existentes.
- Atualize docs e testes junto com a mudanca, no mesmo escopo.

## Novas telas no frontend

Crie telas por feature:

- pagina: `frontend/src/features/<feature>/pages/<NomePage>.tsx`
- teste: `frontend/src/features/<feature>/pages/<NomePage>.test.tsx`
- estilo especifico: somente quando o design system global nao resolver
- rota: `frontend/src/app/router.tsx`

Padroes esperados:

- chamadas HTTP via `frontend/src/shared/api/http.ts`
- token/header via helpers compartilhados, sem montar `Authorization` manualmente
- erro de API via `extractApiErrorMessage`
- estados de loading, empty e error com componentes compartilhados quando possivel
- navegacao protegida com `ProtectedRoute` ou `RoleRoute`

Depois de criar ou alterar rota, atualize:

- `docs/FRONT_ROUTES_MAP.md`
- `docs/ROUTE_COVERAGE_REPORT.md`, se a cobertura mudar
- testes unitarios da pagina e do roteamento quando houver protecao de acesso

## Novos endpoints no backend

Siga as camadas atuais:

- URL centralizada em `presentation/common/ServiceURI.java`
- controller em `presentation/controller`
- request/response DTOs em `application/dto`
- regra de fluxo em `application/usecase`
- regra de negocio em `domain`
- persistencia concreta em `infrastructure/persistence`

Evite colocar regra de negocio no controller. Controller deve validar entrada, chamar use case e devolver DTO.

Para endpoints admin:

- proteger com role admin na configuracao de seguranca
- registrar auditoria quando a acao criar, editar, excluir, ativar ou desativar dados importantes
- adicionar teste de usuario comum recebendo acesso negado

Depois de criar ou alterar endpoint, atualize:

- `docs/FRONT_ROUTES_MAP.md`
- `docs/openapi-lock.json`, quando o contrato publico mudar
- testes de integracao em `backend/src/test/java/com/unichristus/libraryapi`

## Banco e migrations

Liquibase e a fonte de verdade do schema.

Crie migrations em:

- `backend/src/main/resources/db/migrations`

Padrao recomendado:

- nome com timestamp crescente e descricao clara, como `1764700000001-add-user-preferences.sql`
- uma mudanca logica por arquivo
- scripts idempotentes quando fizer sentido
- indices junto da feature quando houver busca, filtro ou ordenacao nova

Evite alterar migrations antigas que ja foram usadas. Para corrigir schema, crie uma nova migration.

## Testes esperados

Backend:

- regra pura: teste unitario no pacote do dominio ou use case
- endpoint/seguranca/contrato: integration test
- admin: teste para admin permitido e usuario comum negado

Frontend:

- pagina nova: teste de renderizacao feliz e erro importante
- fluxo protegido: teste de rota/layout quando mexer em permissoes
- fluxo critico: incluir no E2E quando representar jornada real do usuario

Antes de merge, rode conforme o tamanho da mudanca:

- `frontend`: `npm run lint`, `npm run test`, `npm run build`
- `backend`: `./gradlew test --no-daemon`, `./gradlew integrationTest --no-daemon`
- smoke/E2E: `npm run test:e2e` quando mexer em login, rotas, admin, leitura ou fluxo ponta a ponta

## Checklist de PR

Antes de abrir ou concluir PR:

- a feature segue a estrutura de `features`, `shared`, `presentation`, `application`, `domain` e `infrastructure`
- nao ha duplicacao desnecessaria de cliente HTTP, headers ou mensagens de erro
- rotas novas estao no mapa frontend x backend
- migrations novas nao alteram historico antigo
- testes cobrem sucesso, erro principal e permissao quando aplicavel
- docs de seguranca/deploy foram atualizadas quando a mudanca tocar auth, CORS, headers, token ou dados sensiveis

## Como decidir onde mexer

- Se muda experiencia visual, comece pelo frontend e confirme endpoint existente.
- Se muda regra de negocio, comece pelo domain/use case e depois exponha no controller.
- Se muda contrato da API, atualize backend, testes de integracao e depois o front.
- Se muda permissao, trate backend primeiro e depois esconda ou mostre a navegacao no front.
- Se muda dado persistido, crie migration antes de depender do campo em codigo.

Esse fluxo reduz retrabalho porque cada melhoria nasce no mesmo desenho do projeto e deixa testes/documentos acompanhando o codigo.
