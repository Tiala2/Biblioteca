# Guia De Merge Para Main

Use este guia somente depois que a validacao autenticada passar no computador da apresentacao.

## Antes do merge

Confirmar:

- `docs/CHECKLIST_VALIDACAO_AUTENTICADA.md` passou.
- `docs/APRESENTACAO_COMPUTADOR_TIALA.md` foi seguido.
- Prints finais foram guardados.
- Backup final do banco Docker foi separado.
- Branch `feature/polimento-final-ui-textos` esta limpa e sincronizada.

## Conferir branch atual

```powershell
git status --short --branch
git rev-list --left-right --count main...HEAD
```

Esperado:

- branch atual: `feature/polimento-final-ui-textos`
- `0` commits atras da `main`
- nenhuma alteracao pendente

## Fazer merge local

```powershell
git checkout main
git pull origin main
git merge --no-ff feature/polimento-final-ui-textos
```

## Validar depois do merge

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\pre-delivery-check.ps1 -SkipBackendIntegration -SkipFrontendE2E -SkipOperationalSmoke
```

## Enviar main

```powershell
git push origin main
```

## Se aparecer conflito

- Nao usar `git reset --hard`.
- Parar e revisar os arquivos em conflito.
- Priorizar a versao da branch `feature/polimento-final-ui-textos` para docs e polimentos recentes.
- Rodar validacao novamente antes de enviar.
