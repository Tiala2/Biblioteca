# Prontidao da API para o Frontend

Data de referencia: 2026-03-12

## Status geral

- Contrato API: **pronto para congelar** (via OpenAPI)
- Autenticacao JWT: **pronto**
- CORS para front local: **pronto**
- Erros padronizados: **pronto**
- Paginacao: **padronizada** (default 20, max 100)
- Seed para desenvolvimento frontend: **pronto**
- Refresh token: **nao implementado** (decisao atual: relogin ao expirar)

## Checklist tecnico para iniciar o frontend

1. Subir backend:
```powershell
docker compose up -d --build
```

2. Exportar contrato OpenAPI congelado:
```powershell
./scripts/export-openapi-lock.ps1
```

3. Gerar dados base para UI:
```powershell
$env:LIBRARY_ADMIN_EMAIL="seu-admin@email.com"
$env:LIBRARY_ADMIN_PASSWORD="sua-senha"
./scripts/seed-frontend-demo.ps1
```

4. Validar smoke:
```powershell
./scripts/e2e-smoke.ps1
```

## Contratos de erro para o front

- Erro padrao:
```json
{ "code": "Bad Request", "message": "..." }
```
- Erro de validacao:
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "fieldErrors": [{ "field": "name", "message": "must not be blank" }]
}
```
- Upload acima do limite:
```json
{ "code": "UPLOAD_SIZE_EXCEEDED", "message": "Arquivo excede o tamanho maximo permitido" }
```

## Decisoes para o frontend

- Endpoint raiz `/` pode retornar `403`; usar rotas da API e Swagger.
- Rotas paginadas devem enviar `page`, `size`, `sort` quando aplicavel.
- Token JWT deve ser enviado em `Authorization: Bearer <token>`.
- **Decisao formal**: sem refresh token nesta fase.
- Comportamento padrao no front: ao receber `401`, limpar sessao local e redirecionar para login.
- Evolucao futura planejada: refresh token com revogacao e rotacao segura.
