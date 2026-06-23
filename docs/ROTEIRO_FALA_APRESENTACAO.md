# Roteiro De Fala Da Apresentacao

Use este roteiro como base para apresentar sem precisar improvisar toda a ordem. A ideia e falar como uma historia: problema, solucao, experiencia do usuario, administracao e validacao tecnica.

## 1) Abertura

O nosso projeto se chama Library. Ele e uma biblioteca digital com engajamento, leitura interna, progresso, favoritos, avaliacoes, metas, ranking e area administrativa.

A ideia principal nao foi criar apenas um catalogo de livros. A proposta foi construir uma experiencia narrativa inteligente, em que o usuario consegue ler, acompanhar sua evolucao e interagir com recursos que deixam a leitura mais motivadora.

## 2) Problema Que O Sistema Resolve

Muitos sistemas de biblioteca mostram apenas uma lista de livros. O usuario encontra o livro, mas nao tem acompanhamento de leitura, nao tem motivacao para continuar e nao tem uma experiencia integrada.

No Library, a leitura vira uma jornada. O usuario pode buscar livros, salvar favoritos, registrar progresso, avaliar obras, cumprir metas e acompanhar sua posicao no ranking.

## 3) Login E Sessao

Aqui temos o fluxo de login. O sistema usa autenticacao com JWT, entao as rotas protegidas so podem ser acessadas por usuarios autenticados.

Tambem existe controle por perfil. O usuario comum acessa as telas de leitura e engajamento, enquanto o administrador acessa as telas de gestao.

## 4) Catalogo E Busca

No catalogo, o usuario consegue pesquisar livros, filtrar informacoes e abrir os detalhes de uma obra.

A tela foi pensada para funcionar bem em desktop e mobile, com cards organizados, capas padronizadas e botoes alinhados. Quando o livro possui leitura interna, o usuario consegue abrir direto dentro da plataforma.

## 5) Detalhes Do Livro

Na tela de detalhes, mostramos as informacoes principais do livro, como titulo, autor, paginas, origem, disponibilidade de leitura e acoes do usuario.

O usuario pode favoritar, iniciar leitura e acompanhar a situacao do livro dentro da propria plataforma.

## 6) Leitura E Progresso

Esta e uma das partes mais importantes do projeto. O usuario consegue ler dentro do app quando o livro possui PDF ou conteudo interno.

Ele tambem pode registrar a pagina atual, salvar progresso e continuar depois. Isso evita que a plataforma seja apenas um catalogo e transforma o sistema em uma experiencia real de leitura.

Quando existe dinamica narrativa cadastrada, o sistema mostra contexto da narrativa, personagens, quiz do trecho, conquistas e flashcards. Quando nao existe, aparecem fallbacks mais humanos para nao deixar a tela vazia.

## 7) Avaliacoes

O usuario pode avaliar livros com nota e comentario. Essa funcionalidade conecta a leitura com a opiniao do usuario e ajuda a criar engajamento.

A tela tambem mostra estatisticas das avaliacoes, como media das notas, maior nota e quantidade de comentarios.

## 8) Metas, Ranking E Conquistas

As metas ajudam o usuario a acompanhar quantas paginas pretende ler em determinado periodo.

O ranking incentiva engajamento de forma saudavel, e as conquistas funcionam como reconhecimento do progresso do usuario.

Esses recursos foram pensados com conceitos de UX, motivacao, design emocional e gamificacao leve.

## 9) Perfil

No perfil, o usuario visualiza seus dados, preferencias e indicadores da propria jornada.

Essa parte e importante porque personaliza a experiencia e aproxima o sistema do usuario final.

## 10) Area Administrativa

Na area administrativa, o admin consegue gerenciar o catalogo, livros, categorias, tags, colecoes, usuarios, engajamento e alertas.

Um ponto importante e que o admin consegue associar capa e arquivo de leitura a livros ja existentes. A selecao de livro e pesquisavel, entao nao precisa procurar manualmente em uma lista grande.

Tambem e possivel acompanhar auditoria de alertas e entregas, o que melhora rastreabilidade.

## 11) Swagger E Backend

O backend foi desenvolvido com Spring Boot, PostgreSQL, Docker, JWT, Liquibase, MinIO para arquivos e Mailpit ou SMTP para e-mail.

As rotas principais estao documentadas no Swagger, facilitando teste e validacao dos endpoints.

## 12) Validacao

Antes da entrega, foram executados testes automatizados no frontend e backend.

No frontend, passaram lint, build e testes unitarios. No backend, os testes Gradle passaram. Tambem foi feita uma rodada visual autenticada em telas de usuario e administrador para verificar responsividade, overflow, botoes, textos e integracao com API.

## 13) Encerramento

Como resultado, o Library entrega uma biblioteca digital funcional e mais completa que um catalogo tradicional.

Ele combina leitura, progresso, engajamento, administracao e uma interface premium, mantendo foco em usabilidade, organizacao e experiencia do usuario.

