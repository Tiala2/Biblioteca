# Guia Rapido Para Repassar O Projeto

## 1. O que e este projeto

O nome do projeto e `library-api-projeto`.

Ele e uma biblioteca digital com:

- backend em `Spring Boot`
- frontend em `React + TypeScript + Vite`
- banco `PostgreSQL`
- armazenamento de arquivos em `MinIO`
- ambiente local com `Docker Compose`
- foco em leitura, progresso, metas, badges, ranking e administracao do catalogo

Em resumo:

- o frontend mostra as telas para o usuario
- o backend expoe a API, aplica as regras de negocio e conversa com banco/MinIO
- o banco guarda usuarios, livros, leituras, reviews, metas e badges
- o MinIO guarda PDFs dos livros

## 2. Estrutura da raiz

### `README.md`

Arquivo principal do projeto. Explica a estrutura, a subida rapida e os links locais.

### `start-all.ps1`

Atalho para subir tudo de uma vez.

Ele:

1. sobe o backend com Docker
2. espera a API ficar disponivel
3. inicia o frontend na porta `5173`

### `backend/`

Tudo que pertence a API Java.

### `frontend/`

Tudo que pertence a interface web em React.

### `docs/`

Documentacao de apoio, roteiros operacionais, evidencias, mapa de rotas, checklist e guias.

### `scripts/`

Scripts de apoio do projeto raiz, usados para smoke test, validacao de rotas, export da OpenAPI e seed de demo.

## 3. Como o sistema funciona de ponta a ponta

Fluxo simples:

1. O usuario abre o frontend em `http://localhost:5173`
2. O React chama a API em `http://localhost:8080`
3. Os controllers do backend recebem a requisicao HTTP
4. Os controllers chamam os `use cases`
5. Os `use cases` coordenam a regra de negocio
6. Os `services` de dominio aplicam regras centrais
7. Os `repositories` salvam e leem dados do banco
8. Quando existe PDF, o backend pode buscar ou salvar o arquivo no MinIO
9. O backend devolve um DTO de resposta para o frontend
10. O frontend renderiza a tela

## 4. Backend: mapa mental rapido

O backend segue arquitetura em camadas:

- `presentation`: entrada e saida HTTP
- `application`: casos de uso e DTOs
- `domain`: entidades e regras de negocio
- `infrastructure`: banco, seguranca, integracoes, storage e config

### Arquivo principal

#### `backend/src/main/java/com/unichristus/libraryapi/LibraryApiApplication.java`

Classe que inicia a aplicacao Spring Boot.

Tambem habilita:

- agendamento (`@EnableScheduling`)
- suporte melhor para paginacao do Spring Data

## 5. Backend: `presentation`

Essa camada recebe chamadas HTTP e entrega respostas.

### `presentation/common/ServiceURI.java`

Centraliza as URLs da API, por exemplo:

- `/api/v1/auth`
- `/api/v1/books`
- `/api/admin/books`

Serve para evitar string solta espalhada pelo projeto.

### `presentation/advice/GlobalExceptionHandler.java`

Traduz excecoes de dominio e validacao para respostas HTTP padronizadas.

Exemplo:

- erro de validacao vira `400`
- item nao encontrado vira `404`
- conflito vira `409`

### `presentation/mapper/HttpErrorMapper.java`

Ajuda a transformar erros internos em payload HTTP coerente.

### Controllers publicos

#### `AuthenticationController`

Controla autenticacao:

- login
- esqueci minha senha
- redefinir senha

#### `BookController`

Exibe e consulta livros:

- detalhe do livro
- PDF do livro
- busca paginada
- recomendacoes

#### `CategoryController`

Lista categorias, detalhe de categoria e livros por categoria.

#### `CollectionController`

Lista colecoes e detalhe de colecao.

#### `FavoriteController`

Gerencia favoritos do usuario autenticado:

- listar
- consultar por livro
- adicionar
- remover

#### `HomeController`

Entrega o resumo da home com informacoes agregadas do usuario.

#### `LeaderboardController`

Entrega ranking de usuarios.

#### `ReadingController`

Controla progresso de leitura e os dados narrativos da leitura.

#### `ReadingGoalController`

Controla metas, resumo de metas, alertas e streak do usuario.

#### `ReviewController`

Controla reviews:

- listar reviews do proprio usuario
- listar reviews gerais
- buscar uma review
- criar
- editar
- excluir

#### `TagController`

Lista tags publicas.

#### `UserController`

Controla usuario:

- cadastro
- perfil do usuario logado
- badges do usuario
- atualizacao do proprio perfil

### Controllers admin

#### `AdminMetricsController`

Mostra metricas gerais do sistema para a area admin.

#### `AlertAdminController`

Mostra auditoria de entregas de alertas.

#### `BookAdminController`

CRUD administrativo de livros e upload/importacao:

- criar livro
- importar do Open Library
- editar
- subir PDF
- excluir/inativar

#### `CategoryAdminController`

CRUD administrativo de categorias.

#### `CollectionAdminController`

CRUD administrativo de colecoes.

#### `FavoriteAdminController`

Consulta dados administrativos relacionados a favoritos.

#### `TagAdminController`

CRUD administrativo de tags.

#### `UserAdminController`

Consulta, lista e remove usuarios.

#### `BadgeAdminController`

CRUD administrativo de badges.

## 6. Backend: `application`

Essa camada coordena o que o sistema faz. Aqui mora a "orquestracao".

### `application/annotation/UseCase.java`

Anotacao customizada usada para marcar classes de caso de uso.

### `application/usecase/auth`

#### `AuthenticationUseCase`

Executa o login e monta o token JWT de resposta.

#### `ForgotPasswordUseCase`

Gera token de recuperacao, registra o pedido e dispara o email.

#### `ResetPasswordUseCase`

Valida token de recuperacao e troca a senha do usuario.

### `application/usecase/book`

#### `BookUseCase`

Caso de uso principal de livros.

Responsabilidades principais:

- busca com filtros
- recomendacoes
- criacao e atualizacao de livros
- fallback de busca em tempo real no Open Library quando nao acha nada localmente

#### `BookImportUseCase`

Importa livros externos, principalmente do Open Library.

#### `BookPdfUseCase`

Coordena regras ligadas a PDF do livro.

#### `OpenLibraryBookMetadataSupport`

Classe utilitaria para normalizar metadados vindos do Open Library.

#### `OpenLibraryCacheCleanupJob`

Job agendado para limpar cache local de livros importados do Open Library.

### `application/usecase/category`

#### `CategoryUseCase`

Orquestra leitura e manutencao de categorias.

### `application/usecase/collection`

#### `CollectionUseCase`

Entrega colecoes para consumo publico.

#### `CollectionAdminUseCase`

Executa criacao, alteracao e remocao de colecoes.

### `application/usecase/engagement`

#### `LeaderboardUseCase`

Monta ranking para a API.

#### `BadgeAdminUseCase`

Gerencia catalogo administrativo de badges.

### `application/usecase/favorite`

#### `FavoriteBookUseCase`

Centraliza adicionar, listar e remover favoritos.

### `application/usecase/home`

#### `HomeResumeUseCase`

Monta os dados agregados da home:

- recomendacoes
- progresso
- leituras
- ranking ou widgets relacionados

### `application/usecase/reading`

#### `ReadingUseCase`

Sincroniza progresso de leitura.

#### `ReadingGoalUseCase`

Cria e consulta metas, alertas e streak.

#### `ReadingNarrativeInsightUseCase`

Entrega a camada "inteligente/narrativa" da leitura:

- fase da historia
- personagens
- quizzes
- achievements narrativos

### `application/usecase/review`

#### `ReviewUseCase`

Executa CRUD e validacoes de review.

### `application/usecase/tag`

#### `TagUseCase`

Consulta tags publicas.

#### `TagAdminUseCase`

CRUD admin de tags.

### `application/usecase/user`

#### `UserUseCase`

Cadastro, consulta do perfil, atualizacao e consulta de badges do usuario.

### `application/notification`

#### `ReadingAlertNotifier`

Contrato para notificar alertas de leitura.

#### `EmailReadingAlertNotifier`

Implementacao real via email.

#### `NoOpReadingAlertNotifier`

Implementacao vazia, usada quando email nao esta habilitado.

### `application/mapper`

Essas classes convertem entidades de dominio para DTOs de resposta:

- `BookResponseMapper`
- `CategoryResponseMapper`
- `CollectionResponseMapper`
- `FavoriteResponseMapper`
- `ReadingResponseMapper`
- `ReviewResponseMapper`
- `TagResponseMapper`
- `UserResponseMapper`

### `application/dto/request`

Essas classes representam o corpo das requisicoes HTTP.

- `LoginRequest`: login
- `ForgotPasswordRequest`: pedido de recuperacao
- `ResetPasswordRequest`: troca de senha com token
- `UserRegisterRequest`: cadastro
- `UserUpdateRequest`: atualizacao de perfil
- `BookCreateRequest`: criacao de livro
- `BookUpdateRequest`: atualizacao de livro
- `ExternalBooksImportRequest`: importacao externa
- `FavoriteBookRequest`: favoritar livro
- `ReadingRequest`: sincronizacao de leitura
- `ReadingGoalRequest`: meta de leitura
- `ReviewCreateRequest`: criar review
- `ReviewUpdateRequest`: editar review
- `CategoryRequest`: criar/editar categoria
- `CollectionUpsertRequest`: criar/editar colecao
- `TagRequest`: criar/editar tag
- `BadgeUpsertRequest`: criar/editar badge

### `application/dto/response`

Essas classes sao os payloads devolvidos pela API.

- `AuthResponse`: token e dados minimos do usuario
- `UserResponse` e `UserSummaryResponse`: dados do usuario
- `BookResponse`, `BookListResponse`, `BookPdfResponse`, `BookHomeResponse`: varias visoes de livro
- `CategoryResponse` e `CategoryLowResponse`: categoria detalhada ou reduzida
- `CollectionResponse`: colecao
- `FavoriteResponse`: favorito
- `ReviewResponse` e `ReviewHomeResponse`: review completa ou resumida
- `ReadingResponse`, `ReadingProgressResponse`, `ReadingHomeResponse`: dados da leitura
- `ReadingGoalResponse` e `ReadingGoalSummaryResponse`: metas
- `AlertResponse`, `AlertDeliveryResponse`, `AlertSeverity`, `AlertType`: alertas
- `HomeResponse`: dados agregados da home
- `LeaderboardEntryResponse`: ranking
- `BadgeResponse` e `BadgeDefinitionResponse`: badges
- `NarrativeAchievementResponse`, `NarrativeCharacterResponse`, `NarrativeQuizResponse`, `ReadingNarrativeInsightResponse`: camada narrativa
- `AdminMetricsResponse`: metricas administrativas
- `ErrorResponse`, `FieldErrorResponse`, `ValidationErrorResponse`: respostas de erro
- `ExternalBooksImportResponse`: resultado da importacao externa
- `StreakResponse`: sequencia de leitura
- `TagResponse`: tag

## 7. Backend: `domain`

Essa camada representa o coracao do negocio.

Regra pratica:

- entidades modelam o negocio
- `Service` aplica regras
- `Repository` define contratos
- `exception` define erros de negocio

### `domain/book`

- `Book`: entidade principal do livro
- `BookRepository`: contrato para persistencia de livros
- `BookSearchHit`: resultado otimizado de busca
- `BookService`: regra de negocio de livros
- `BookSort`: tipos de ordenacao da busca
- `BookSource`: origem do livro (`LOCAL` ou `OPEN`)
- `BookIsbnConflict`: erro de ISBN duplicado
- `BookNotFoundException`: livro nao encontrado
- `BookPdfNotFoundException`: PDF nao encontrado
- `BookPdfSizeExceeded`: PDF excedeu limite

### `domain/category`

- `Category`: entidade de categoria
- `CategoryRepository`: contrato de persistencia
- `CategoryService`: regra de negocio de categoria
- `CategoryAlreadyExistsException`: categoria duplicada
- `CategoryNotFoundException`: categoria nao encontrada

### `domain/collection`

- `BookCollection`: entidade de colecao tematica
- `BookCollectionRepository`: contrato da colecao
- `BookCollectionService`: regra de negocio da colecao

### `domain/favorite`

- `Favorite`: entidade de favorito
- `FavoriteId`: chave composta do favorito
- `FavoriteRepository`: contrato de persistencia
- `FavoriteService`: regra de favoritos
- `FavoriteAlreadyExistsException`: impede duplicidade

### `domain/review`

- `Review`: entidade de avaliacao
- `BookAverageRating`: objeto de apoio para media das notas
- `ReviewRepository`: contrato
- `ReviewService`: regra de reviews
- `ReviewAlreadyExists`: impede review duplicada por usuario/livro
- `ReviewBelongsToAnotherUserException`: impede alterar review de outra pessoa
- `ReviewNotAllowedException`: regra de permissao
- `ReviewNotFoundException`: review nao encontrada

### `domain/reading`

- `Reading`: entidade de progresso de leitura por livro
- `ReadingGoal`: entidade de meta
- `ReadingGoalMetrics`: calculos das metas
- `ReadingSession`: sessoes de leitura
- `ReadingRepository`, `ReadingGoalRepository`, `ReadingSessionRepository`: contratos de persistencia
- `ReadingService`, `ReadingGoalService`, `ReadingSessionService`: regras de leitura
- `ReadingStatus`: status da leitura
- `GoalPeriod`: periodo da meta
- `GoalStatus`: situacao da meta
- `PageExceededException`: pagina acima do total
- `PageLowerException`: pagina menor que a atual
- `PdfNotAvailableException`: leitura sem PDF disponivel
- `ReadingAlreadyFinishedException`: leitura ja encerrada
- `ReadingBelongsToAnotherUserException`: protege dados por usuario
- `ReadingInProgressException`: evita fluxo invalido
- `ReadingNotFoundException`: leitura nao encontrada

### `domain/narrative`

- `BookNarrativeBeat`: representa marcos narrativos do livro
- `BookNarrativeBeatRepository`: contrato de persistencia narrativa
- `BookNarrativeBeatService`: regra que interpreta os beats
- `StoryPhase`: fases da historia usadas na experiencia de leitura

### `domain/engagement`

- `Badge`: definicao de badge
- `BadgeCode`: codigos de badge
- `BadgeCriteriaType`: tipo de criterio para ganhar badge
- `BadgeDefinitionRepository`: contrato das badges
- `BadgeService`: regra de badges
- `UserBadge`: badge conquistada por usuario
- `UserBadgeRepository`: persistencia das conquistas
- `LeaderboardEntry`: linha do ranking
- `LeaderboardMetric`: tipo de metrica do ranking
- `LeaderboardService`: calcula ranking
- `EngagementEventPublisher`: contrato para publicar eventos de engajamento
- `InMemoryEngagementEventPublisher`: implementacao simples em memoria

### `domain/alert`

- `AlertChannel`: canal do alerta
- `AlertDelivery`: registro da tentativa de entrega
- `AlertDeliveryRepository`: contrato
- `AlertDeliveryService`: regra de auditoria e entrega
- `AlertDeliveryStatus`: status de envio

### `domain/tag`

- `Tag`: entidade de tag
- `TagRepository`: contrato
- `TagService`: regra das tags
- `TagAlreadyExistsException`: tag duplicada
- `TagNotFoundException`: tag nao encontrada

### `domain/user`

- `User`: entidade principal do usuario
- `UserRepository`: contrato
- `UserRole`: papeis do usuario
- `UserService`: regras do usuario
- `PasswordHasher`: contrato de hash de senha
- `PasswordResetToken`: token de recuperacao de senha
- `PasswordResetTokenRepository`: persistencia dos tokens
- `EmailConflictException`: email duplicado
- `UserNotFoundException`: usuario nao encontrado

### `domain/exception`

- `DomainError`: catalogo de tipos de erro de negocio
- `DomainException`: excecao padrao do dominio

## 8. Backend: `infrastructure`

Essa camada faz a ponte com o mundo externo.

### `infrastructure/config`

- `SecurityConfig`: regras do Spring Security, JWT, CORS e rotas publicas/admin
- `OpenAPIConfig`: configuracao do Swagger/OpenAPI
- `MinioConfig`: cria e configura cliente do MinIO

### `infrastructure/security`

- `JwtService`: cria e valida tokens JWT
- `JwtAuthenticationFilter`: intercepta requests e autentica via token
- `CustomUserDetails`: adaptador do usuario para o Spring Security
- `CustomUserDetailsService`: busca usuario para autenticacao
- `BCryptPasswordHasher`: implementacao real de hash de senha
- `LoggedUser`: representa o usuario autenticado no contexto da request

### `infrastructure/storage`

- `MinioFileStorageService`: envia, busca e gerencia arquivos no MinIO
- `FileStorageException`: erro de storage

### `infrastructure/integration/openlibrary`

- `OpenLibraryClient`: cliente HTTP que consulta o Open Library e Archive.org

### `infrastructure/tracing`

- `LoggingFilter`: loga requests/responses e pode expor trace id
- `TraceAspect`: rastreia chamadas internas importantes

### `infrastructure/persistence`

Padrao usado nessa pasta:

- `*JpaRepository`: interface Spring Data/JPA
- `*RepositoryImpl`: implementacao concreta do contrato do dominio

Arquivos por modulo:

- `alert/AlertDeliveryJpaRepository` e `AlertDeliveryRepositoryImpl`: persistencia dos alertas
- `book/BookJpaRepository`, `BookRepositoryImpl`, `projection/BookSearchProjection`: persistencia e projecao de busca de livros
- `category/CategoryJpaRepository`, `CategoryRepositoryImpl`: persistencia de categorias
- `collection/BookCollectionJpaRepository`, `BookCollectionRepositoryImpl`: persistencia de colecoes
- `engagement/BadgeJpaRepository`, `BadgeRepositoryImpl`, `UserBadgeJpaRepository`: persistencia de badges e conquistas
- `favorite/FavoriteJpaRepository`, `FavoriteRepositoryImpl`: persistencia de favoritos
- `narrative/BookNarrativeBeatJpaRepository`, `BookNarrativeBeatRepositoryImpl`: persistencia narrativa
- `reading/ReadingJpaRepository`, `ReadingRepositoryImpl`, `ReadingGoalJpaRepository`, `ReadingGoalRepositoryImpl`, `ReadingSessionJpaRepository`, `ReadingSessionRepositoryImpl`: persistencia da leitura
- `review/ReviewJpaRepository`, `ReviewRepositoryImpl`: persistencia de reviews
- `tag/TagJpaRepository`, `TagRepositoryImpl`: persistencia de tags
- `user/UserJpaRepository`, `UserRepositoryImpl`, `PasswordResetTokenJpaRepository`, `PasswordResetTokenRepositoryImpl`: persistencia de usuarios e tokens de senha

## 9. Backend: configuracao e banco

### `backend/src/main/resources/application.yaml`

Configuracao comum:

- perfil ativo
- multipart
- datasource
- Liquibase
- paginacao
- logging
- MinIO
- CORS
- alertas
- integracao Open Library

### `application-dev.yaml`

Configuracoes do ambiente de desenvolvimento.

### `application-prod.yaml`

Configuracoes do ambiente de producao.

### `db/changelog/db.changelog-master.yaml`

Arquivo mestre do Liquibase.

### `db/migrations/*.sql`

Historico de criacao e evolucao do banco.

Migracoes principais:

- setup inicial
- tabelas de livros, usuarios, favoritos, leituras e reviews
- categorias, tags e colecoes
- metas, sessoes e engajamento
- badges e alertas
- narrativa
- password reset
- cache local do Open Library
- indices de performance

## 10. Backend: arquivos operacionais

### `backend/build.gradle`

Dependencias e build do projeto Java.

Pontos importantes:

- Java 21
- Spring Boot
- Spring Security
- JPA
- Liquibase
- MinIO
- OpenAPI
- testes com JUnit e Testcontainers

### `backend/Dockerfile`

Imagem do backend.

### `backend/docker-compose.dev.yml`

Ambiente dev com:

- API
- PostgreSQL
- MinIO
- Mailpit

### `backend/docker-compose.prod.yml`

Ambiente sem Mailpit, voltado a producao/local produtivo.

### `backend/docker-compose.yml`

Atalho para o compose principal.

### `backend/.env.example`

Exemplo de variaveis de ambiente.

### `backend/.env.brevo.example`

Exemplo alternativo para email via Brevo.

### `backend/scripts`

- `docker-up-safe.ps1`: sobe o backend com seguranca
- `docker-stop-safe.ps1`: para sem apagar dados
- `docker-rebuild-safe.ps1`: rebuild seguro
- `backup-volumes.ps1`: backup dos volumes
- `switch-email-mode.ps1`: alterna email local/Brevo
- `test-forgot-password.ps1`: ajuda a testar recuperacao de senha

## 11. Backend: testes

### `src/test/java`

Os testes estao divididos por comportamento.

- `AbstractIntegrationTest`: base de testes de integracao
- `IntegrationTestSupport`: utilitarios comuns dos testes
- `LibraryApiApplicationTests`: sobe o contexto Spring
- `AuthIntegrationTest`: autenticacao
- `BookIntegrationTest` e `BookRealtimeSearchIntegrationTest`: livros e busca com fallback
- `FavoriteIntegrationTest`: favoritos
- `ReviewIntegrationTest`: reviews
- `ReadingGoalIntegrationTest`, `ReadingNarrativeIntegrationTest`: metas e camada narrativa
- `LeaderboardIntegrationTest`: ranking
- `AlertAuditIntegrationTest` e `AlertNotificationIntegrationTest`: auditoria/envio de alertas
- `AdminCatalogIntegrationTest`, `AdminBookImportIntegrationTest`, `AdminBookUploadIntegrationTest`, `AdminUserManagementIntegrationTest`: area admin
- `BadgeIntegrationTest`: conquistas
- `ForgotPasswordUseCaseTest`: recuperacao de senha
- `ReadingGoalServiceTest` e `ReadingServiceTest`: regras unitarias da leitura

### `src/test/resources`

- `application-test.yaml`: configuracao de teste
- `docker-java.properties`: apoio ao ambiente de testes

## 12. Frontend: mapa mental rapido

O frontend segue organizacao por feature:

- `app`: bootstrap e roteamento
- `features`: telas de negocio
- `shared`: codigo reutilizavel
- `test`: configuracao dos testes

### Arquivos de entrada

#### `frontend/src/main.tsx`

Entrada minima que importa a app real.

#### `frontend/src/App.tsx`

Componente raiz simplificado.

#### `frontend/src/app/main.tsx`

Monta o React com providers, router e estilos.

#### `frontend/src/app/providers.tsx`

Envolve a aplicacao com:

- `ToastProvider`
- `ThemeProvider`
- `AuthProvider`

#### `frontend/src/app/router.tsx`

Define todas as rotas.

Rotas principais:

- `/login`
- `/register`
- `/forgot-password`
- `/`
- `/books`
- `/books/:bookId/read`
- `/favorites`
- `/reviews`
- `/goals`
- `/badges`
- `/leaderboard`
- `/admin`

Tambem usa:

- `ProtectedRoute` para exigir login
- `RoleRoute` para exigir role admin

## 13. Frontend: `features/auth`

### `context/AuthContext.tsx`

Guarda login em memoria/localStorage, faz login e logout e decodifica roles do JWT.

### `pages/LoginPage.tsx`

Tela de login.

### `pages/RegisterPage.tsx`

Tela de cadastro de usuario.

### `pages/ForgotPasswordPage.tsx`

Tela de pedir reset e tambem de redefinir senha com token.

### `pages/LoginPage.css`

Estilo especifico da tela de login.

### `routes/ProtectedRoute.tsx`

Bloqueia rotas para usuarios nao autenticados.

### `routes/RoleRoute.tsx`

Bloqueia rotas para quem nao tem a role exigida.

## 14. Frontend: telas de negocio

### `features/home/pages/HomePage.tsx`

Tela inicial do usuario autenticado. Busca resumo da API e mostra recomendacoes, progresso e informacoes de engajamento.

### `features/books/pages/BooksPage.tsx`

Tela principal da biblioteca. Faz busca, filtros, paginacao e acoes de favorito.

### `features/books/pages/BooksPage.test.tsx`

Teste da tela de livros.

### `features/reading/pages/ReadingExperiencePage.tsx`

Tela mais rica do sistema.

Responsabilidades:

- carregar detalhe do livro
- sincronizar progresso
- mostrar experiencia narrativa
- favoritar/desfavoritar durante a leitura

### `features/favorites/pages/FavoritesPage.tsx`

Lista favoritos do usuario e permite remover.

### `features/reviews/pages/ReviewsPage.tsx`

Lista, cria e remove reviews do usuario.

### `features/goals/pages/GoalsPage.tsx`

Tela de metas, alertas e streak.

### `features/badges/pages/BadgesPage.tsx`

Mostra conquistas e badges do usuario.

### `features/leaderboard/pages/LeaderboardPage.tsx`

Mostra ranking de usuarios.

### `features/admin/pages/AdminPage.tsx`

Painel administrativo.

Concentra:

- metricas
- categorias
- tags
- livros
- colecoes
- badges
- importacao de Open Library
- upload de PDF

### `features/system/pages/ForbiddenPage.tsx`

Tela simples para acesso negado.

## 15. Frontend: `shared`

### `shared/api/http.ts`

Cliente Axios central.

Responsabilidades:

- definir URL base da API
- anexar token JWT
- tratar `401` limpando sessao e redirecionando para login

### `shared/api/errors.ts`

Funcoes/tipos auxiliares para padronizar mensagens de erro no front.

### `shared/layout/AppLayout.tsx`

Layout principal da area autenticada:

- sidebar
- navegacao
- topbar
- area admin
- botao de logout

### `shared/ui/theme/ThemeContext.tsx`

Gerencia tema visual.

### `shared/ui/toast/ToastContext.tsx`

Gerencia notificacoes toast no frontend.

### `shared/ui/toast/ToastContext.test.tsx`

Teste do contexto de toast.

### `shared/ui/books/BookCover.tsx`

Componente reutilizavel para capa de livro.

### `shared/styles/design-system.css`

Variaveis e tokens visuais.

### `shared/styles/index.css`

Estilo global principal do frontend.

## 16. Frontend: outros arquivos

### `vite.config.ts`

Configuracao do Vite.

### `package.json`

Dependencias e scripts do frontend.

Scripts principais:

- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run test:e2e`

### `playwright.config.ts`

Configuracao de testes E2E.

### `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`

Configuracao TypeScript.

### `eslint.config.js`

Regras de lint.

### `.env.example`

Exemplo de variaveis do frontend.

### `scripts/front-dev-safe.ps1`

Script que espera a API subir antes de iniciar o frontend.

### `e2e/smoke.spec.ts`

Teste E2E de smoke.

### `src/test/setup.ts`

Setup dos testes do frontend.

### `public/vite.svg` e `src/assets/react.svg`

Assets padrao/base do projeto.

## 17. `docs/`: o que cada arquivo ajuda a fazer

- `ARCHITECTURE_OVERVIEW.md`: visao de arquitetura
- `FRONT_ROUTES_MAP.md`: mapa das rotas do frontend e endpoints
- `API_FRONT_READINESS.md`: alinhamento API x frontend
- `CHECKLIST_OPERACIONAL.md`: checklist final de validacao
- `DOCUMENTACAO_FINAL.md`: consolidado final do projeto
- `RECUPERACAO_SENHA_EMAIL.md`: fluxo de recuperacao de senha
- `ROUTE_COVERAGE_REPORT.md`: cobertura de rotas
- `MATRIZ_RASTREABILIDADE.md`: liga requisitos, telas e endpoints
- `UAT_CHECKLIST.md`: checklist de validacao de uso
- `EVIDENCIAS_FRONT.md`: evidencias de execucao do frontend
- `EVOLUCAO_SEM_RETRABALHO.md`: guia para criar features, endpoints, testes e migrations sem quebrar o template
- `openapi-lock.json`: snapshot da especificacao da API

## 18. `scripts/` da raiz

- `e2e-smoke.ps1`: smoke geral do sistema
- `route-checklist-exec.ps1`: validacao de rotas
- `export-openapi-lock.ps1`: export da especificacao OpenAPI
- `seed-frontend-demo.ps1`: ajuda a popular demo do frontend

## 19. Ordem ideal para uma pessoa nova entender o projeto

Se seu amigo for estudar o projeto, a melhor ordem e:

1. ler `README.md`
2. ler `docs/ARCHITECTURE_OVERVIEW.md`
3. abrir `start-all.ps1`
4. abrir `frontend/src/app/router.tsx`
5. abrir `backend/src/main/java/com/unichristus/libraryapi/presentation/common/ServiceURI.java`
6. abrir `backend/src/main/java/com/unichristus/libraryapi/presentation/controller`
7. abrir `backend/src/main/java/com/unichristus/libraryapi/application/usecase`
8. abrir `backend/src/main/java/com/unichristus/libraryapi/domain`
9. por fim olhar `infrastructure`, `resources/db/migrations` e os testes

## 20. Resumo em uma frase por camada

- `frontend`: mostra a experiencia do usuario e chama a API
- `presentation`: recebe HTTP
- `application`: decide o fluxo
- `domain`: aplica a regra de negocio
- `infrastructure`: fala com banco, JWT, MinIO e integracoes externas
- `db/migrations`: constroi o banco
- `tests`: provam que o comportamento funciona

## 21. Resumo final para voce repassar por mensagem

Se quiser explicar em poucas linhas para seu amigo, pode mandar isso:

> O projeto e uma biblioteca digital com frontend React e backend Spring Boot. O frontend tem telas de login, home, livros, leitura, metas, badges, ranking, favoritos, reviews e admin. O backend e organizado em presentation, application, domain e infrastructure. Os controllers recebem as rotas, os use cases coordenam o fluxo, o domain guarda as regras de negocio, e a infrastructure conversa com PostgreSQL, MinIO, JWT e Open Library. O banco e controlado por Liquibase. O projeto roda localmente com Docker no backend e Vite no frontend.
