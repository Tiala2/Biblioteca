# Checklist De Validacao Autenticada

Use este checklist com backend, banco e frontend rodando. Ele complementa a checagem automatizada de 2026-05-24.

## Preparacao

- Frontend aberto em `http://localhost:5173`.
- API com `Health` em `UP`.
- Swagger aberto.
- Usuario comum disponivel.
- Usuario administrador disponivel.
- Banco confirmado no Docker.
- Backup recente separado.

## Usuario comum

- Login com sucesso.
- Home carrega resumo, leitura atual e recomendacoes.
- Catalogo abre com busca, filtros e paginacao.
- Detalhes do livro mostram capa, autor, paginas e acoes.
- Favoritar e remover favorito funciona.
- Tela de leitura abre e salva pagina/progresso.
- Dinamica narrativa aparece quando o livro tem dados cadastrados.
- Avaliacao cria, edita e remove nota/comentario.
- Metas salvam nova configuracao.
- Conquistas carregam progresso.
- Ranking carrega e troca metrica.
- Perfil salva preferencias e nao quebra email/nome em tela pequena.

## Administrador

- Login admin redireciona corretamente.
- Painel admin abre sem erro.
- Catalogo admin lista livros, categorias, tags e colecoes.
- Criar ou editar livro funciona.
- Atualizar capa por URL/ISBN funciona.
- Enviar PDF para livro funciona.
- Criar ou editar categoria funciona.
- Criar ou editar tag funciona.
- Criar ou editar colecao funciona.
- Conquistas aparecem na area de engajamento.
- Usuarios aparecem na area administrativa.
- Auditoria de alertas carrega.

## Evidencias para guardar

- Print do Health.
- Print do Swagger.
- Print do login/home.
- Print do catalogo.
- Print da leitura com progresso.
- Print das avaliacoes.
- Print das metas/conquistas/ranking.
- Print do painel admin.
- Resultado do comando de validacao final em `docs/VALIDACAO_FINAL_2026_05_24.md`.

## Criterio de fechamento

Considerar pronto para merge quando:

- todos os itens essenciais acima passarem;
- nao houver erro visual grave em desktop;
- nao houver quebra grave em tela pequena;
- usuario comum e admin conseguirem concluir seus fluxos principais.
