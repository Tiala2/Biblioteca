# Resumo Para Repassar Ao Colega

## Branch correta

Usar a branch:

```bash
feature/polimento-final-ui-textos
```

Comandos:

```bash
git fetch origin
git checkout feature/polimento-final-ui-textos
git pull origin feature/polimento-final-ui-textos
```

## Ambiente padrao

- Banco do Docker: `localhost:5437`
- API padrao: `http://localhost:8080`
- Frontend: `http://localhost:5173`
- Swagger: `http://localhost:8080/swagger-ui/index.html`
- Mailpit: `http://localhost:8025`

Se a porta `8080` estiver ocupada:

```bash
API_PORT=8081 ./start-all.sh --build-backend
```

No Windows:

```powershell
$env:API_PORT = "8081"
powershell -ExecutionPolicy Bypass -File .\start-all.ps1 -BuildBackend
```

## Linux/macOS

```bash
chmod +x start-all.sh backend/scripts/*.sh frontend/scripts/*.sh
./start-all.sh --build-backend
```

## Windows

```powershell
powershell -ExecutionPolicy Bypass -File .\start-all.ps1 -BuildBackend
```

## Arquivo `.env`

- Nao versionar nem compartilhar `backend/.env` com credenciais reais.
- Para teste local, copiar `backend/.env.example` para `backend/.env`.
- Para Brevo, usar `backend/.env.brevo.example` como modelo e preencher localmente.
- Se uma chave real foi exposta, gerar uma nova chave no Brevo.

## Validacao rapida

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\pre-delivery-check.ps1 -SkipBackendIntegration -SkipFrontendE2E -SkipOperationalSmoke
```

Resultado esperado:

- backend unitario passando
- frontend lint passando
- frontend unitario com `51` testes
- build do frontend passando

## Para a apresentacao

Usar:

- `docs/APRESENTACAO_COMPUTADOR_TIALA.md`
- `docs/ROTEIRO_APRESENTACAO.md`
- `docs/CHECKLIST_VALIDACAO_AUTENTICADA.md`

## Importante

Nao adaptar o projeto em cima de erro local sem antes conferir Docker, `.env`, porta usada e backup. A base ja esta preparada para Windows e Linux; diferencas locais devem ser resolvidas por configuracao.
