# Plano Das 2 Semanas Finais

Data base: 2026-06-08

Este plano organiza o que ainda precisa ser feito ate a entrega. A prioridade e garantir demonstracao segura, documentacao alinhada ao template e banco bem documentado.

## Semana 1 - Fechamento Tecnico

### Prioridade 1 - Validacao do sistema

- Subir o projeto no computador principal.
- Confirmar backend, frontend, banco Docker, MinIO e Mailpit ativos.
- Validar login, cadastro e recuperacao de senha.
- Validar catalogo, detalhes, leitura interna, favoritos e progresso.
- Validar avaliacoes, metas, ranking, conquistas e perfil.
- Validar area admin: livros, capa, PDF, categorias, tags, colecoes, usuarios, engajamento e alertas.

### Prioridade 2 - Banco e dados

- Conferir o DDL consolidado em `docs/DDL_BANCO_DADOS.sql`.
- Garantir backup atualizado do banco Docker.
- Garantir livros de demonstracao com capa e leitura interna.
- Evitar depender de Open Library na apresentacao.
- Usar livros locais ou Project Gutenberg importados com PDF interno.

### Prioridade 3 - Testes

- Rodar backend: `.\gradlew.bat test`.
- Rodar frontend: `npm run lint`, `npm run test`, `npm run build`.
- Rodar smoke/check local quando o ambiente estiver de pe.
- Registrar qualquer resultado novo nos documentos de status.

## Semana 2 - Entrega e Apresentacao

### Prioridade 4 - Template e documentacao final

- Revisar `docs/TEMPLATE_CHECKLIST_FINAL.md`.
- Revisar `docs/DOCUMENTACAO_FINAL.md`.
- Revisar `docs/RELATORIO_PROJETO.md`.
- Conferir diagramas e descricoes de caso de uso.
- Conferir matriz de rastreabilidade.
- Anexar ou referenciar o DDL do banco.

### Prioridade 5 - Roteiro e evidencias

- Usar `docs/ROTEIRO_FALA_APRESENTACAO.md` para treinar a fala.
- Separar usuario comum e usuario administrador.
- Tirar prints finais das telas principais.
- Separar evidencias dos testes.
- Abrir previamente frontend, Swagger, Health e Mailpit no dia.

### Prioridade 6 - Git e entrega

- Conferir branch final.
- Conferir `git status`.
- Fazer commit final somente depois da validacao.
- Fazer merge para `main` somente quando o computador principal estiver validado.
- Confirmar que o colega consegue puxar o projeto, mas deixar ajustes de Linux como prioridade menor se o computador de apresentacao for o principal.

## O Que Falta De Verdade

- Ultima validacao manual completa no computador da apresentacao.
- Backup final do banco Docker.
- Prints/evidencias finais.
- Revisao final do template.
- Conferencia do DDL com a documentacao.
- Commit/merge final depois da validacao.

## O Que Ja Esta Bem Encaminhado

- Frontend principal revisado visualmente.
- Backend testado.
- Leitura interna funcionando para livros com PDF.
- Admin corrigido para selecionar livros existentes com busca.
- DDL consolidado criado.
- Roteiro de apresentacao criado.
- Checklist operacional atualizado.

