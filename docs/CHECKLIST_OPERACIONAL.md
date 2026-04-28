# Checklist Operacional

Data de referencia: 2026-04-28

## 1) Subir ambiente

```powershell
docker compose up -d --build
```

Validar containers:

```powershell
docker compose ps
```

## 2) URLs

- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui/index.html`
- Health: `http://localhost:8080/actuator/health`
- Mailpit UI: `http://localhost:8025`
- MinIO Console: `http://localhost:9001`

## 3) Rodar testes automatizados

```powershell
./gradlew.bat test integrationTest
```

Validacao rapida usada na rodada final:

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

## 4) Rodar smoke E2E no terminal

Definir credenciais admin:

```powershell
$env:LIBRARY_ADMIN_EMAIL="seu-admin@email.com"
$env:LIBRARY_ADMIN_PASSWORD="sua-senha"
```

Executar:

```powershell
./scripts/e2e-smoke.ps1
```

Opcao alternativa:

- Colocar `LIBRARY_ADMIN_EMAIL` e `LIBRARY_ADMIN_PASSWORD` no arquivo `backend/.env`
- Rodar `./scripts/e2e-smoke.ps1` sem parametros

## 5) Evidencias minimas para validar

- Backend `test` verde
- Frontend `test`, `build` e `test:e2e` verdes
- Checklist de rotas com `56 PASS / 0 FAIL`
- Health `UP`
- Login JWT funcionando
- Expiracao de JWT limpando sessao local do front
- Erro inesperado do front exibindo fallback recuperavel
- API indisponivel exibindo aviso global no front
- Criacao de categoria e livro por admin
- Registro de leitura e meta por usuario
- Leaderboard retornando dados
- Auditoria de alertas em `/api/admin/alerts/deliveries`
- Logs com `traceId` e sem exposicao de senha, token ou authorization
- Logs `ADMIN_AUDIT` em mutacoes administrativas
- CORS aceitando apenas origens configuradas
- Fluxos resilientes de e-mail, PDF externo e Open Library sem derrubar o fluxo principal

## 6) Limites e decisoes conhecidas

- `GET /` retorna `403` por configuracao de seguranca; usar Swagger/rotas da API.
- Badge code e enum fixo; para novos codigos e necessario evolucao do enum e regra.
- Upload PDF pode falhar com `Maximum upload size exceeded` para arquivos acima do limite.
- Alertas por e-mail sao sem custo usando Mailpit local ou SMTP configurado no ambiente.
