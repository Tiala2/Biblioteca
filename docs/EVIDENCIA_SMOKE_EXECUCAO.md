# Evidencia Smoke - Execucao

Data/Hora: 2026-02-27 13:37:07 -03:00

## Comandos executados

```powershell
docker compose up -d --build
./scripts/e2e-smoke.ps1 -AdminEmail "tialanobre23@gmail.com" -AdminPassword "******"
```

## Estado dos containers

```text
NAME                            IMAGE                     COMMAND                  SERVICE   CREATED              STATUS                 PORTS
library-api-projeto-api-1       library-api-projeto-api   "/__cacert_entrypoin…"   api       About a minute ago   Up About a minute      0.0.0.0:8080->8080/tcp, [::]:8080->8080/tcp
library-api-projeto-library-1   postgres:18-alpine        "docker-entrypoint.s…"   library   2 weeks ago          Up 4 hours             0.0.0.0:5437->5432/tcp, [::]:5437->5432/tcp
library-api-projeto-mailpit-1   axllent/mailpit           "/mailpit"               mailpit   3 hours ago          Up 3 hours (healthy)   0.0.0.0:1025->1025/tcp, [::]:1025->1025/tcp, 0.0.0.0:8025->8025/tcp, [::]:8025->8025/tcp
minio                           quay.io/minio/minio       "/usr/bin/docker-ent…"   minio     2 weeks ago          Up 3 hours             0.0.0.0:9000-9001->9000-9001/tcp, [::]:9000-9001->9000-9001/tcp
```

## Saida do smoke

```text
==> Health check

==> Login admin

==> Validar acesso admin

==> Criar categoria admin

==> Criar livro admin

==> Selecionar livro com PDF para fluxo de leitura

==> Cadastrar usuario comum

==> Login usuario comum

==> Ativar opt-in

==> Favoritar livro

==> Sincronizar leitura

==> Configurar meta

==> Consultar alertas e leaderboard

==> Consultar auditoria de envio de alertas

========== RESUMO ==========
Categoria criada: 13d0bfce-5501-417b-9fee-2e11f912aa8d
Livro criado:     4ad28f5b-aa6a-484f-ac89-6a93c7ff96b9
Livro para leitura (hasPdf=true): 07bdc547-1160-42bb-a34f-5d6016ba20b3
Usuario criado:   74aaf789-7058-482e-a53f-f6a0295844a3 (smoke1772210214@email.com)
Alertas obtidos:  2
Leaderboard top:  2
Audit deliveries: 2
Smoke test concluido com sucesso.
```

## Resultado

- Status geral: SUCESSO
- Fluxos validados: login admin, criacao de categoria/livro, cadastro/login user, favoritos, leitura, meta, alertas, leaderboard e auditoria de alertas.
