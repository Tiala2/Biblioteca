# Recuperacao de senha com email (gratis)

Este projeto suporta 2 modos:

1. `Mailpit` (gratis/local): email fake para teste no navegador.
2. `Brevo SMTP` (gratis/real): entrega email na caixa real do usuario.

## 1) Configurar Brevo (recomendado)

1. Crie conta em Brevo.
2. Valide um remetente (sender).
3. Copie as credenciais SMTP.

Crie `backend/.env` (copie de `.env.example`) e preencha:

```env
APP_FRONTEND_BASE_URL=https://library.seudominio.com
APP_FRONTEND_ALLOWED_RESET_BASE_URLS=https://library.seudominio.com,http://localhost:5173,http://127.0.0.1:5173

MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=SEU_LOGIN_SMTP_BREVO
MAIL_PASSWORD=SUA_CHAVE_SMTP_BREVO
MAIL_SMTP_AUTH=true
MAIL_SMTP_STARTTLS=true
ALERT_EMAIL_FROM=SEU_EMAIL_VALIDADO_NO_BREVO
```

## 2) Subir ambiente

```powershell
cd C:\workspace\library-api-projeto\backend
Copy-Item .env.example .env -Force
docker compose down
docker compose up -d --build
```

### Troca rapida de modo de email

```powershell
cd C:\workspace\library-api-projeto\backend
.\scripts\switch-email-mode.ps1 -Mode mailpit
.\scripts\switch-email-mode.ps1 -Mode brevo
```

No modo `brevo`, abra `backend/.env` e substitua os campos `CHANGE_ME`.
O script preserva as demais configuracoes do `.env` e altera apenas as chaves relacionadas ao envio de email.

## 3) Testar endpoint

```powershell
$payload = @{
  email = "seu-usuario@email.com"
  baseUrl = "https://library.seudominio.com"
} | ConvertTo-Json
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:8080/api/v1/auth/forgot-password" `
  -ContentType "application/json" `
  -Body $payload
```

Esperado: HTTP `204`.

Observacao:
- `baseUrl` e opcional.
- Quando enviado, o backend so usa esse valor se ele estiver em `APP_FRONTEND_ALLOWED_RESET_BASE_URLS`.
- Se nao enviar `baseUrl` (ou se for invalido), o backend usa `APP_FRONTEND_BASE_URL`.

## 4) Validar entrega

- Se `MAIL_HOST=mailpit`: abra `http://localhost:8025`.
- Se `MAIL_HOST=smtp-relay.brevo.com`: verifique inbox/spam do email real.

## 5) Teste de fumaca automatico

```powershell
cd C:\workspace\library-api-projeto\backend
.\scripts\test-forgot-password.ps1 -Email "seu-usuario@email.com"
```
