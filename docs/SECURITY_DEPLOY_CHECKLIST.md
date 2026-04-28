# Checklist De Seguranca Pre-Deploy

Data de referencia: 2026-04-28

## Identidade e acesso

- Confirmar `JWT_SECRET` forte e diferente dos exemplos.
- Confirmar `JWT_EXPIRATION_MILIS` adequado para o ambiente.
- Validar que usuario comum recebe `403` em rotas `/api/admin/**`.
- Conferir se usuario admin real e necessario para operacao.

## Segredos e ambiente

- Nao commitar `.env`, chaves SMTP, credenciais de banco, JWT ou MinIO.
- Preencher `APP_CORS_ALLOWED_ORIGINS` em producao somente com o dominio oficial.
- Manter Swagger desativado em producao (`springdoc.*.enabled=false`).
- Confirmar SMTP/MinIO/banco por variaveis de ambiente, nao por valores fixos.

## HTTP e navegador

- Validar headers `Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy` e `Permissions-Policy`.
- Confirmar CORS negando origem nao permitida.
- Confirmar front limpando sessao expirada e exibindo mensagem ao usuario.
- Confirmar aviso visual quando a API estiver indisponivel.

## Logs e auditoria

- Confirmar que logs mascaram senha, token, authorization e secret.
- Confirmar presenca de `X-Trace-Id` nas respostas.
- Conferir logs `ADMIN_AUDIT` para mutacoes em `/api/admin/**`.
- Nao ativar DEBUG de body HTTP em producao.

## Validacao final

```powershell
cd backend
.\gradlew.bat test --no-daemon
.\gradlew.bat integrationTest --no-daemon

cd ..\frontend
npm.cmd run test
npm.cmd run build
npm.cmd run test:e2e

cd ..
powershell -ExecutionPolicy Bypass -File .\scripts\route-checklist-exec.ps1
```

Resultado esperado:

- backend unitario e integracao verdes
- frontend unitario, build e E2E verdes
- checklist de rotas com `56 PASS / 0 FAIL`
