# Roteiro de Apresentação da Banca (8-10 min)

## 1. Abertura (1 min)

Objetivo do projeto:

"O Library é uma API de biblioteca virtual pública com foco em engajamento de leitura, unindo catálogo digital e mecanismos como metas, alertas, streak, badges e leaderboard."

## 2. Arquitetura e stack (1 min)

Pontos para explicar:

1. Arquitetura em camadas: Presentation, Application, Domain e Infrastructure.
2. Stack: Java 21, Spring Boot, Security JWT, JPA, PostgreSQL, Liquibase, OpenAPI.
3. Deploy: Docker Compose com `api`, `library`, `minio`, `mailpit`.

## 3. Prova de ambiente no ar (1 min)

Abrir no navegador:

1. `http://localhost:8080/actuator/health`
2. `http://localhost:8080/swagger-ui/index.html`
3. `http://localhost:8025` (Mailpit)

## 4. Demo funcional (4-5 min)

### 4.1 Fluxo de usuário

1. Cadastro: `POST /api/v1/users`
2. Login: `POST /api/v1/auth/login`
3. Busca de livros: `GET /api/v1/books`
4. Definir meta: `PUT /api/v1/users/me/goals`
5. Registrar leitura: `POST /api/v1/readings`
6. Consultar alertas: `GET /api/v1/users/me/alerts`
7. Mostrar e-mail gerado no Mailpit (`Library - Alertas de leitura`)

### 4.2 Fluxo admin

1. Login admin
2. Acessar endpoint admin (ex.: `GET /api/admin/tags`)
3. Mostrar que operações administrativas exigem `ROLE_ADMIN`

## 5. Qualidade e rastreabilidade (1 min)

Mostrar rapidamente:

1. [MATRIZ_RASTREABILIDADE.md](C:/workspace/library-api-projeto/docs/MATRIZ_RASTREABILIDADE.md)
2. [UAT_CHECKLIST.md](C:/workspace/library-api-projeto/docs/UAT_CHECKLIST.md)
3. [EVIDENCIA_SMOKE_EXECUCAO.md](C:/workspace/library-api-projeto/docs/EVIDENCIA_SMOKE_EXECUCAO.md)
4. [EVIDENCIA_ROTAS_EXECUCAO.md](C:/workspace/library-api-projeto/docs/EVIDENCIA_ROTAS_EXECUCAO.md)

Mensagem:

"Cada requisito do template foi ligado a endpoint e teste, com evidência objetiva de execução."

## 6. Encerramento (30-45 s)

Conclusão sugerida:

"O projeto atende os objetivos de segurança, gestão de catálogo e engajamento de leitura. A solução está operacional em Docker, com testes automatizados e comprovação prática dos fluxos principais."

## 7. Plano B (se algo falhar ao vivo)

1. Se token expirar: refazer login.
2. Se porta ocupada: `docker compose up -d`.
3. Se e-mail não aparecer no instante: atualizar Mailpit após 2-3 segundos.
