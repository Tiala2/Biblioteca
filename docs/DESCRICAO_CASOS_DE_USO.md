# Descricao De Casos De Uso

Data de referencia: 2026-04-04

## UC01 - Cadastro E Autenticacao

- Ator principal: Usuario
- Objetivo: criar conta e acessar a plataforma
- Pre-condicoes: usuario nao autenticado
- Fluxo principal:
  1. informar nome, email e senha
  2. sistema valida dados obrigatorios e unicidade do email
  3. conta e criada
  4. usuario realiza login
  5. sistema retorna token e libera acesso conforme perfil
- Pos-condicoes: usuario autenticado

## UC02 - Recuperacao De Senha

- Ator principal: Usuario
- Objetivo: redefinir senha esquecida
- Pre-condicoes: usuario possui email cadastrado
- Fluxo principal:
  1. usuario acessa fluxo de esqueci minha senha
  2. informa email cadastrado
  3. sistema gera token temporario e envia link
  4. usuario acessa o link
  5. define nova senha
- Pos-condicoes: senha atualizada e token invalidado

## UC03 - Consulta Ao Catalogo

- Ator principal: Usuario
- Objetivo: encontrar livros no acervo
- Pre-condicoes: nenhuma para listagem publica; autenticacao para fluxos internos complementares
- Fluxo principal:
  1. usuario abre o catalogo
  2. informa termo de busca e filtros
  3. sistema retorna lista paginada
  4. usuario abre detalhes do livro
- Pos-condicoes: livro selecionado para leitura, favorito ou review

## UC04 - Registro De Leitura

- Ator principal: Usuario autenticado
- Objetivo: acompanhar evolucao de leitura
- Pre-condicoes: usuario autenticado e livro existente
- Fluxo principal:
  1. usuario inicia ou continua leitura
  2. informa pagina atual ou sincroniza progresso
  3. sistema recalcula percentual e status
  4. historico de sessoes pode ser consultado
- Pos-condicoes: progresso persistido

## UC05 - Favoritos

- Ator principal: Usuario autenticado
- Objetivo: manter colecao pessoal de livros
- Pre-condicoes: usuario autenticado
- Fluxo principal:
  1. usuario seleciona um livro
  2. adiciona aos favoritos
  3. consulta lista pessoal
  4. remove item quando desejar
- Pos-condicoes: lista de favoritos atualizada sem duplicidade

## UC06 - Metas E Engajamento

- Ator principal: Usuario autenticado
- Objetivo: acompanhar desempenho de leitura
- Pre-condicoes: usuario autenticado
- Fluxo principal:
  1. usuario define meta por periodo
  2. sistema calcula progresso automaticamente
  3. usuario consulta resumo, alertas, streak, badges e ranking
- Pos-condicoes: estado de engajamento atualizado

## UC07 - Reviews

- Ator principal: Usuario autenticado
- Objetivo: avaliar livros e compartilhar percepcao
- Pre-condicoes: usuario autenticado e livro existente
- Fluxo principal:
  1. usuario cria review com nota e comentario opcional
  2. sistema valida faixa da nota e unicidade por usuario/livro
  3. usuario pode editar ou remover a propria review
  4. demais usuarios visualizam as avaliacoes organizadas
- Pos-condicoes: review persistida ou atualizada

## UC08 - Administracao Do Catalogo

- Ator principal: Administrador
- Objetivo: manter catalogo e dados operacionais
- Pre-condicoes: autenticacao com perfil ADMIN
- Fluxo principal:
  1. administrador acessa painel administrativo
  2. cria, atualiza ou remove categorias, tags, colecoes, livros e badges
  3. realiza upload de PDF, troca de capa e importacao da Open Library
  4. consulta usuarios, metricas e auditoria de alertas
- Pos-condicoes: catalogo administrativo atualizado
