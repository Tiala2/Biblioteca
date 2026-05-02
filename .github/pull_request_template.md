## Resumo

- 

## Tipo de mudanca

- [ ] Bugfix
- [ ] Feature
- [ ] Refactor
- [ ] Testes
- [ ] Documentacao
- [ ] Infra/CI

## Checklist de validacao

- [ ] Revisei o diff completo e removi mudancas fora do escopo.
- [ ] Rodei `npm run lint`, `npm run test` e `npm run build` no frontend quando houve alteracao em `frontend/`.
- [ ] Rodei `./gradlew test --no-daemon` no backend quando houve alteracao em `backend/`.
- [ ] Rodei `./gradlew integrationTest --no-daemon` quando houve alteracao em contrato, seguranca, banco ou fluxo integrado.
- [ ] Rodei `npm run test:e2e` quando houve alteracao em rotas, autenticacao, navegacao ou fluxo critico.
- [ ] Atualizei docs/checklists quando houve mudanca de rota, endpoint, seguranca, deploy ou operacao.

## Seguranca e dados

- [ ] Nao adicionei segredo, token, senha, chave privada ou dado sensivel no repositorio.
- [ ] Mantive regras de acesso coerentes com `ProtectedRoute`, `RoleRoute` e permissoes do backend.
- [ ] Verifiquei CORS, headers, localStorage/session/token ou auditoria quando a mudanca tocou autenticacao/seguranca.
- [ ] Usuario comum nao ganha acesso admin por UI ou endpoint.

## Observacoes para revisao

- 

