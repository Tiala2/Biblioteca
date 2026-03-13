# Roteiro de Apresentacao do Projeto (8-10 min)

Este roteiro foi pensado para a avaliacao pratica do sistema `Library`, priorizando demonstracao funcional, clareza tecnica e baixo risco durante a execucao ao vivo.

## 1. Abertura (40-60 s)

Mensagem sugerida:

"O Library e uma biblioteca virtual publica com foco em engajamento. Alem do catalogo digital, o sistema incentiva a continuidade da leitura por meio de progresso, metas, badges, ranking e area administrativa."

## 2. Prova de ambiente no ar (40-60 s)

Abrir rapidamente:

1. `http://localhost:5173` para mostrar o frontend
2. `http://localhost:8080/actuator/health` para mostrar a API saudavel
3. `http://localhost:8080/swagger-ui/index.html` para mostrar a documentacao da API
4. `http://localhost:8025` se quiser demonstrar o fluxo de e-mail em ambiente local

## 3. Fluxo de usuario (3-4 min)

Ordem recomendada:

1. Fazer login com usuario comum
2. Mostrar a home com resumo de leitura, metas e engajamento
3. Ir para o catalogo e buscar um livro
4. Abrir a experiencia de leitura
5. Atualizar a pagina atual e salvar o progresso
6. Mostrar quiz, contexto narrativo e conquistas
7. Ir para metas e mostrar acompanhamento automatico
8. Mostrar favoritos, badges ou leaderboard

Mensagem tecnica curta:

"Aqui mostramos os requisitos centrais do projeto: autenticacao, consulta de livros, progresso, metas e engajamento."

## 4. Fluxo administrativo (2-3 min)

Ordem recomendada:

1. Entrar com conta admin
2. Abrir o painel administrativo
3. Mostrar indicadores do sistema
4. Criar ou listar categoria
5. Criar ou listar tag
6. Criar ou listar colecao
7. Criar livro ou importar da Open Library
8. Mostrar badges e controle administrativo

Mensagem tecnica curta:

"A area admin concentra o controle do catalogo e dos elementos de engajamento, respeitando autorizacao por perfil."

## 5. Evidencias tecnicas (1-2 min)

Mostrar rapidamente:

1. [GUIA_AVALIACAO_PROJETO.md](C:\workspace\library-api-projeto\docs\GUIA_AVALIACAO_PROJETO.md)
2. [EVIDENCIA_SMOKE_EXECUCAO.md](C:\workspace\library-api-projeto\docs\EVIDENCIA_SMOKE_EXECUCAO.md)
3. [EVIDENCIA_ROTAS_EXECUCAO.md](C:\workspace\library-api-projeto\docs\EVIDENCIA_ROTAS_EXECUCAO.md)
4. `docs/generated/ROUTE_COVERAGE_REPORT.md`

Mensagem sugerida:

"O projeto nao ficou apenas implementado. Tambem deixamos validacoes automatizadas para smoke, rotas principais e testes de frontend e backend."

## 6. Fechamento (30-40 s)

Mensagem sugerida:

"O sistema esta operacional, com autenticacao, catalogo, leitura, metas, engajamento e administracao. Alem da entrega funcional, a aplicacao foi organizada com testes, scripts de validacao e documentacao de apoio."

## 7. Plano B (se algo falhar ao vivo)

1. Se o token expirar, refazer login
2. Se a API nao responder, executar `powershell -ExecutionPolicy Bypass -File .\start-all.ps1`
3. Se o e-mail nao aparecer na hora, atualizar o Mailpit apos alguns segundos
4. Se algum fluxo visual falhar, mostrar Swagger + evidencias automatizadas
