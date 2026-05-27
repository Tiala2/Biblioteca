# Importacao de livros com leitura interna

Este fluxo usa o Project Gutenberg/Gutendex para importar livros que podem ser lidos dentro do app. Ele e o caminho recomendado quando a entrega precisa demonstrar leitura interna, progresso, favoritos, metas e avaliacoes sem depender de leitor externo.

## Quando usar

- Use Gutenberg para livros com leitura interna no app.
- Use Open Library apenas para ampliar catalogo/metadados quando a leitura externa for aceitavel.
- Para apresentacao, priorize livros `LOCAL` e `GUTENBERG`, pois eles nao dependem de embed externo.

## Windows PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File backend\scripts\import-gutenberg-readable.ps1 `
  -ApiUrl http://localhost:8080 `
  -Email "EMAIL_ADMIN" `
  -Password "SENHA_ADMIN" `
  -Query "fiction" `
  -Pages 5 `
  -TargetCount 100
```

Se a API estiver rodando na porta alternativa:

```powershell
powershell -ExecutionPolicy Bypass -File backend\scripts\import-gutenberg-readable.ps1 `
  -ApiUrl http://localhost:8081 `
  -Email "EMAIL_ADMIN" `
  -Password "SENHA_ADMIN" `
  -Query "fiction" `
  -Pages 5 `
  -TargetCount 100
```

## Linux/macOS

```bash
chmod +x backend/scripts/import-gutenberg-readable.sh
backend/scripts/import-gutenberg-readable.sh \
  --api-url http://localhost:8080 \
  --email "EMAIL_ADMIN" \
  --password "SENHA_ADMIN" \
  --query "fiction" \
  --pages 5 \
  --target-count 100
```

Para porta alternativa:

```bash
backend/scripts/import-gutenberg-readable.sh \
  --api-url http://localhost:8081 \
  --email "EMAIL_ADMIN" \
  --password "SENHA_ADMIN" \
  --query "fiction" \
  --pages 5 \
  --target-count 100
```

## Teste rapido

Para validar sem esperar muitos minutos:

```powershell
powershell -ExecutionPolicy Bypass -File backend\scripts\import-gutenberg-readable.ps1 `
  -ApiUrl http://localhost:8080 `
  -Email "EMAIL_ADMIN" `
  -Password "SENHA_ADMIN" `
  -Query "fiction" `
  -Pages 2 `
  -TargetCount 10
```

## Observacoes

- Importar 100 livros pode demorar alguns minutos.
- O backend baixa o texto, gera um PDF interno e salva no MinIO.
- Textos muito curtos, indices e entradas de catalogo sao ignorados para manter a qualidade do acervo.
- Depois de importar, os livros aparecem no front como `Project Gutenberg` e modo `Leitura interna`.
