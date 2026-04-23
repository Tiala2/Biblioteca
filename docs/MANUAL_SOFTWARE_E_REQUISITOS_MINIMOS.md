# Manual Do Software E Requisitos Minimos

Data de referencia: 2026-04-04

## Hardware Minimo

- Processador: 2 nucleos
- Memoria RAM: 8 GB
- Armazenamento livre: 10 GB
- Rede: acesso a internet para dependencias e integracoes

## Software Necessario

- Windows 10/11, Linux ou macOS
- Java 21
- Node.js 20+
- Docker Desktop ou Docker + Docker Compose
- Git
- Navegador moderno: Chrome, Edge, Firefox ou Safari

## Estrutura Do Projeto

- `backend/`: API REST em Spring Boot
- `frontend/`: aplicacao web React + TypeScript + Vite
- `docs/`: documentacao, evidencias e roteiros
- `scripts/`: automacoes de execucao e validacao

## Configuracao Do Ambiente

1. clonar o repositorio
2. ajustar `backend/.env` quando necessario
3. subir infraestrutura com Docker
4. iniciar backend e frontend

## Execucao Recomendada

```powershell
cd C:\workspace\library-api-projeto
powershell -ExecutionPolicy Bypass -File .\start-all.ps1
```

## Execucao Manual

Backend:

```powershell
cd C:\workspace\library-api-projeto\backend
.\gradlew.bat bootRun
```

Frontend:

```powershell
cd C:\workspace\library-api-projeto\frontend
npm install
npm run dev
```

## Acessos Principais

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui/index.html`
- Health: `http://localhost:8080/actuator/health`
- Mailpit: `http://localhost:8025`

## Perfis De Usuario

- `USER`: catalogo, leitura, metas, favoritos, reviews, badges, ranking e perfil
- `ADMIN`: tudo do usuario mais gestao administrativa

## Funcionalidades Principais

1. cadastro, login e recuperacao de senha
2. catalogo com busca, filtros e detalhes
3. progresso de leitura e historico
4. favoritos
5. metas, alertas e streak
6. reviews
7. badges e leaderboard
8. painel administrativo

## Recuperacao De Senha

1. abrir tela de login
2. selecionar `Esqueci minha senha`
3. informar email
4. acessar link recebido
5. definir nova senha
6. autenticar novamente

## Testes E Validacao

Backend:

```powershell
cd C:\workspace\library-api-projeto\backend
.\gradlew.bat test integrationTest
```

Frontend:

```powershell
cd C:\workspace\library-api-projeto\frontend
npm run test
npm run test:e2e
```

Checklist de rotas:

```powershell
cd C:\workspace\library-api-projeto
.\scripts\route-checklist-exec.ps1
```

## Boas Praticas Operacionais

- evitar `docker compose down -v` em ambiente com dados relevantes
- usar Liquibase como fonte de verdade do schema
- manter backups antes de demonstracoes importantes
- validar permissoes de perfil em toda funcionalidade nova
- monitorar health e logs durante a validacao do sistema

## Documentos De Apoio

- [RELATORIO_PROJETO.md](/c:/workspace/library-api-projeto/docs/RELATORIO_PROJETO.md)
- [BACKUP_E_RESTAURACAO.md](/c:/workspace/library-api-projeto/docs/BACKUP_E_RESTAURACAO.md)
- [TEMPLATE_CHECKLIST_FINAL.md](/c:/workspace/library-api-projeto/docs/TEMPLATE_CHECKLIST_FINAL.md)
