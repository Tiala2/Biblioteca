# Compatibilidade Do Frontend

Data de referencia: 2026-04-08

## Navegadores alvo

- Chrome
- Edge
- Firefox
- Safari

## Checklist de validacao

1. Abrir login e validar campos, foco e envio.
2. Fazer cadastro e navegar para a area autenticada.
3. Abrir catalogo, aplicar filtros e paginar.
4. Abrir detalhes do livro e entrar na leitura.
5. Atualizar meta e revisar ranking.
6. Abrir painel admin e validar criacao/edicao/exclusao.

## Observacoes

- O frontend foi validado tecnicamente com `build`, testes unitarios e `E2E`.
- Para Safari, manter atencao especial a `backdrop-filter`, `focus-visible` e inputs de data.
- Em navegadores sem suporte visual equivalente, o comportamento funcional deve continuar preservado.
