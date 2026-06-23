# Roteiro de Apresentacao

Este roteiro ajuda a demonstrar o projeto em uma sequencia segura, sem pular funcionalidades importantes.

Para uma fala mais pronta, use tambem: `docs/ROTEIRO_FALA_APRESENTACAO.md`.

## Antes de apresentar

- Subir backend, banco e frontend.
- Confirmar `Health` como `UP`.
- Abrir Swagger, frontend e Mailpit antes de iniciar a fala.
- Deixar um usuario comum e um usuario administrador prontos.
- Confirmar que o banco usado e o do Docker, nao o PostgreSQL local.

URLs principais:

- Frontend: `http://localhost:5173`
- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui/index.html`
- Health: `http://localhost:8080/actuator/health`
- Mailpit: `http://localhost:8025`

Se a porta `8080` estiver ocupada, usar `API_PORT=8081` e trocar as URLs da API, Swagger e Health para `8081`.

## Ordem sugerida

1. Apresentar a ideia do sistema

Falar que o Library e uma biblioteca digital com foco em leitura, progresso, engajamento e administracao de catalogo.

2. Mostrar login e sessao

Entrar com um usuario comum, explicar JWT, sessao protegida e redirecionamento por perfil.

3. Mostrar catalogo e detalhes

Abrir catalogo, usar busca/filtros, entrar em detalhes de um livro, mostrar capa, informacoes e acoes.

4. Mostrar leitura e progresso

Abrir a tela de leitura, salvar pagina atual, mostrar progresso, favoritos e dinamica narrativa quando existir.

5. Mostrar avaliacoes

Criar ou editar uma avaliacao com nota e comentario. Explicar que a avaliacao depende do usuario ter iniciado a leitura.

6. Mostrar engajamento

Abrir metas, conquistas e ranking. Explicar que essas telas conectam leitura com acompanhamento do usuario.

7. Mostrar area administrativa

Entrar com administrador e demonstrar rapidamente:

- criar ou editar livro
- atualizar capa
- enviar PDF
- gerenciar categoria, tag ou colecao
- visualizar usuarios
- visualizar auditoria de alertas

8. Mostrar Swagger

Abrir o Swagger e mostrar que as rotas estao documentadas, incluindo autenticacao, livros, reviews, leitura e admin.

9. Fechar com arquitetura

Explicar que o backend usa Spring Boot, PostgreSQL, Docker, JWT, Liquibase e MinIO/Mailpit no ambiente local. Explicar que o frontend usa React, TypeScript e Vite.

## Frase curta para encerrar

O projeto entrega uma biblioteca digital funcional, com autenticacao, catalogo, leitura, progresso, favoritos, avaliacoes, metas, ranking, conquistas e painel administrativo. O uso de Docker padroniza o ambiente para reduzir problemas entre maquinas diferentes.

## Plano B

- Se a API nao abrir na porta `8080`, subir com `API_PORT=8081`.
- Se o email real nao funcionar, demonstrar recuperacao pelo ambiente local/Mailpit ou explicar a configuracao Brevo.
- Se algum dado sumir no ambiente de outro integrante, restaurar o backup do banco Docker.
- Se a internet falhar, priorizar livros locais e fluxos que nao dependem de Open Library.
