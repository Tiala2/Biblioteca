# Guia de Avaliacao do Projeto

Data de referencia: 2026-03-13

Este guia concentra o fluxo minimo para subir, acessar e validar o projeto `Library` durante a avaliacao da cadeira.

## 1. O que o projeto entrega

- cadastro e autenticacao de usuarios
- recuperacao de senha por email
- catalogo de livros com busca
- favoritos
- progresso de leitura
- metas de leitura
- avaliacoes
- leaderboard e badges
- area administrativa

## 2. Requisitos para executar

- Docker Desktop ativo
- Node.js instalado
- Java 21 instalado
- PowerShell no Windows

## 3. Configuracao inicial

No arquivo `backend/.env`, confirme:

- `APP_FRONTEND_BASE_URL=http://localhost:5173`
- `LIBRARY_ADMIN_EMAIL=seu-admin@email.com`
- `LIBRARY_ADMIN_PASSWORD=sua-senha`

Se for testar recuperacao de senha real, configure tambem o SMTP.

## 4. Como subir o projeto

Na raiz:

```powershell
cd C:\workspace\library-api-projeto
powershell -ExecutionPolicy Bypass -File .\start-all.ps1
```

Esse comando:

- sobe o backend com Docker
- espera a API responder
- inicia o frontend na porta `5173`

## 5. URLs de acesso

- Frontend: `http://localhost:5173`
- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui/index.html`
- Health: `http://localhost:8080/actuator/health`
- Mailpit: `http://localhost:8025`
- MinIO Console: `http://localhost:9001`

## 6. Validacao automatica

### Smoke principal

```powershell
cd C:\workspace\library-api-projeto
.\scripts\e2e-smoke.ps1
```

Valida:

- health check
- login admin
- criacao admin de categoria e livro
- cadastro/login de usuario comum
- favoritos
- progresso de leitura
- meta
- alertas
- leaderboard
- auditoria administrativa

### Checklist de rotas

```powershell
cd C:\workspace\library-api-projeto
.\scripts\route-checklist-exec.ps1
```

Gera o relatorio em:

- `docs/generated/ROUTE_COVERAGE_REPORT.md`

### Seed para demonstracao do frontend

```powershell
cd C:\workspace\library-api-projeto
.\scripts\seed-frontend-demo.ps1
```

## 7. Fluxo manual sugerido para avaliacao

1. Abrir o frontend em `http://localhost:5173`
2. Fazer login
3. Buscar livros
4. Favoritar um livro
5. Registrar progresso de leitura
6. Consultar metas
7. Consultar leaderboard
8. Entrar na area administrativa

## 8. Observacoes importantes

- os scripts de validacao leem `LIBRARY_ADMIN_EMAIL` e `LIBRARY_ADMIN_PASSWORD` do `backend/.env` quando necessario
- os arquivos `.env` reais estao protegidos no `.gitignore`
- o script `backend/scripts/switch-email-mode.ps1` agora altera apenas as chaves de email e preserva o resto do `.env`

## 9. Arquivos mais importantes para avaliacao

- [README.md](C:\workspace\library-api-projeto\README.md)
- [GUIA_AVALIACAO_PROJETO.md](C:\workspace\library-api-projeto\docs\GUIA_AVALIACAO_PROJETO.md)
- [RECUPERACAO_SENHA_EMAIL.md](C:\workspace\library-api-projeto\docs\RECUPERACAO_SENHA_EMAIL.md)
- [ROTEIRO_TESTE_MANUAL_CURL.md](C:\workspace\library-api-projeto\docs\ROTEIRO_TESTE_MANUAL_CURL.md)
- [ROTEIRO_BANCA_10_MIN.md](C:\workspace\library-api-projeto\docs\ROTEIRO_BANCA_10_MIN.md)
