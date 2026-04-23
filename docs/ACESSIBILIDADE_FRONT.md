# Acessibilidade Do Frontend

Data de referencia: 2026-04-08

## Praticas aplicadas

- `skip-link` para o conteudo principal
- foco visivel em links, botoes e campos
- estados com `aria-live` em feedbacks e mensagens
- labels explicitas nos campos principais
- navegacao por teclado nas rotas centrais

## Checklist de revisao

1. Validar ordem de foco no login, cadastro e recuperacao de senha.
2. Conferir filtros do catalogo apenas com teclado.
3. Validar leitura, metas e perfil com foco visivel.
4. Conferir formulários do admin com labels e feedback de erro.
5. Revisar contraste dos textos secundarios e KPIs.

## Pontos de atencao

- Fluxos com muitos botoes em cards devem ser revisados em telas pequenas.
- Tabelas nao existem hoje; se forem adicionadas, devem receber navegacao semantica.
- Novos componentes devem reutilizar o padrao de `StateCard` e foco visivel do tema global.
