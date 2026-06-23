# Checklist Operacional

Data de referencia: 2026-06-20

## 1) Subir ambiente

Fluxo recomendado no Windows:

```powershell
cd C:\workspace\library-api-projeto
powershell -ExecutionPolicy Bypass -File .\start-all.ps1 -BuildBackend
```

Fluxo recomendado no Linux/macOS:

```bash
cd library-api-projeto
chmod +x start-all.sh backend/scripts/*.sh frontend/scripts/*.sh
./start-all.sh --build-backend
```

Se a porta `8080` estiver ocupada:

```powershell
$env:API_PORT="8081"
powershell -ExecutionPolicy Bypass -File .\start-all.ps1 -BuildBackend
```

```bash
API_PORT=8081 ./start-all.sh --build-backend
```

Validar containers no diretorio `backend`:

```powershell
docker compose ps
```

## 2) URLs

- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui/index.html`
- Health: `http://localhost:8080/actuator/health`
- Mailpit UI: `http://localhost:8025`
- MinIO Console: `http://localhost:9001`

Se a porta `8080` estiver ocupada, subir a API com `API_PORT=8081` e usar:

- API: `http://localhost:8081`
- Swagger: `http://localhost:8081/swagger-ui/index.html`
- Health: `http://localhost:8081/actuator/health`

## 3) Rodar testes automatizados

Validar que o roteiro de pre-entrega ainda chama as etapas esperadas:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-pre-delivery-check.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\test-check-local-stack.ps1
```

```powershell
cd backend
.\gradlew.bat test
```

Validacao rapida usada na rodada final, sem depender de E2E autenticado:

```powershell
.\gradlew.bat test --no-daemon

cd ..\frontend
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

Validacao completa antes da entrega, quando backend/front estiverem de pe e houver credenciais admin:

```powershell
cd C:\workspace\library-api-projeto
powershell -ExecutionPolicy Bypass -File .\scripts\pre-delivery-check.ps1
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

- Status final registrado em `docs/STATUS_ENTREGA_2026_06_08.md`
- Roteiro de fala pronto em `docs/ROTEIRO_FALA_APRESENTACAO.md`
- Backend `test` verde
- Frontend `lint`, `test` e `build` verdes
- Teste E2E/smoke autenticado executado quando houver backend, frontend e credenciais admin disponiveis
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

## 7) Backup final validado

- Backup oficial: `backups/20260620-110534`
- PostgreSQL em UTF-8 com checksum validado
- MinIO com checksum validado e `959` entradas
- Restauracao comprovada em banco temporario isolado
- Evidencia completa: [STATUS_ENTREGA_2026_06_20.md](STATUS_ENTREGA_2026_06_20.md)
