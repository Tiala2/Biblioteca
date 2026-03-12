# Checklist de Prontidao da Banca

Data de referencia: 2026-03-12

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

## 5) Evidencias minimas para apresentar

- Build verde (`test` + `integrationTest`)
- Health `UP`
- Login JWT funcionando
- Criacao de categoria e livro por admin
- Registro de leitura e meta por usuario
- Leaderboard retornando dados
- Auditoria de alertas em `/api/admin/alerts/deliveries`

## 6) Limites e decisoes conhecidas

- `GET /` retorna `403` por configuracao de seguranca; usar Swagger/rotas da API.
- Badge code e enum fixo; para novos codigos e necessario evolucao do enum e regra.
- Upload PDF pode falhar com `Maximum upload size exceeded` para arquivos acima do limite.
- Alertas por e-mail sao sem custo usando Mailpit local (nao envia e-mail real para internet).

