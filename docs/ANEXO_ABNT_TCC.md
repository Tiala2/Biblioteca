# APÊNDICE A - MATRIZ DE RASTREABILIDADE E VALIDAÇÃO

## A.1 Matriz de rastreabilidade

Relação entre requisitos funcionais (RF), requisitos não funcionais (RNF), endpoints e testes executados.

Referência técnica detalhada: [MATRIZ_RASTREABILIDADE.md](C:/workspace/library-api-projeto/docs/MATRIZ_RASTREABILIDADE.md)

### A.1.1 Requisitos funcionais

| Requisito | Evidência de implementação |
|---|---|
| RF01 - Autenticação | Endpoints de cadastro/login com JWT e testes de integração |
| RF02 - Busca/Filtros | Endpoints públicos de livros, categorias, coleções e tags |
| RF03 - Favoritos | Endpoints de adicionar/remover favoritos por usuário |
| RF04 - Progresso | Endpoint de sincronização de leitura e atualização de progresso |
| RF05 - Metas | Endpoints de metas, resumo, alertas internos e streak |
| RF06 - Avaliações | Endpoint de avaliação com regra de avaliação única |
| RF07 - Ranking | Endpoint de leaderboard |
| RF08 - Catálogo admin | Endpoints administrativos para livros, categorias, tags, coleções e badges |

### A.1.2 Requisitos não funcionais

| Requisito | Evidência de implementação |
|---|---|
| RNF01 - Segurança | Spring Security + JWT + perfis USER/ADMIN |
| RNF02 - Persistência | PostgreSQL com JPA |
| RNF03 - Versionamento | Liquibase com histórico de migrations |
| RNF04 - Documentação | OpenAPI/Swagger habilitado |
| RNF05 - Deploy | Docker Compose com API + PostgreSQL + MinIO + Mailpit |

## A.2 Evidências de validação por terminal

As evidências práticas de execução da API e fluxos de negócio foram registradas em:

[EVIDENCIA_SMOKE_EXECUCAO.md](C:/workspace/library-api-projeto/docs/EVIDENCIA_SMOKE_EXECUCAO.md)

[EVIDENCIA_ROTAS_EXECUCAO.md](C:/workspace/library-api-projeto/docs/EVIDENCIA_ROTAS_EXECUCAO.md)

Resumo das validações realizadas:

1. Ambiente Docker ativo com todos os serviços necessários.
2. Health check da API com status `UP`.
3. Acesso ao Swagger com retorno HTTP `200`.
4. Fluxo de usuário comum validado (cadastro, login, meta, leitura, alertas).
5. Fluxo administrativo validado (acesso a endpoint admin com papel ADMIN).
6. Envio de alerta real por e-mail em ambiente gratuito local (Mailpit).

## A.3 Critério de aceite

Considera-se aprovado quando:

1. O endpoint retorna código HTTP esperado.
2. O comportamento de negócio ocorre conforme regra definida.
3. Existe evidência objetiva de execução (resposta, log ou mensagem de e-mail).

## A.4 Observações metodológicas

1. Os testes automatizados foram executados por `test` e `integrationTest`.
2. Os cenários manuais seguiram checklist UAT.
3. O envio de e-mail foi validado com infraestrutura local sem custo, preservando o objetivo acadêmico do projeto.
