# library-api-projeto

Estrutura do repositorio:

- `backend/`: API Java (Spring Boot + Gradle + Docker)
- `frontend/`: aplicacao React (Vite + TypeScript)
- `docs/`: documentacao e evidencias
- `scripts/`: automacoes utilitarias

## Como rodar

### Tudo junto (recomendado)

```powershell
cd C:\workspace\library-api-projeto
powershell -ExecutionPolicy Bypass -File .\start-all.ps1
```

### Backend

No Windows (PowerShell):

```powershell
cd backend
.\gradlew.bat bootRun
```

No Linux/macOS:

```bash
cd backend
./gradlew bootRun
```

Com Docker:

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File .\scripts\docker-up-safe.ps1 -Mode dev
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```
