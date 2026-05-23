# Relatorio De Tempo De Resposta

Data de referencia: 2026-04-04

Este relatorio resume a medicao automatizada dos fluxos prioritarios de API.

## Ambiente

- API base: `http://localhost:8080`
- Iteracoes por cenario: `5`
- Ferramenta: `scripts/measure-rnf-response-times.ps1`

## Resultados

| Cenario | Media | Minimo | Maximo |
|---|---:|---:|---:|
| `login` | `146.54 ms` | `100.11 ms` | `274.76 ms` |
| `books-list` | `131.07 ms` | `77.21 ms` | `328.68 ms` |
| `books-search` | `1156.59 ms` | `875.67 ms` | `1744.14 ms` |

## Conclusao

Todos os cenarios prioritarios medidos ficaram abaixo de `2 segundos` na media.
