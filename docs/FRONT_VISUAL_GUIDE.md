# Guia Visual do Frontend

Projeto: **Library - Biblioteca Virtual PÃºblica com foco em engajamento**  
Objetivo do guia: definir uma direÃ§Ã£o visual forte, memorÃ¡vel e executÃ¡vel para a implementaÃ§Ã£o do front.

## 1. DireÃ§Ã£o Criativa

Conceito: **â€œAventura de Leituraâ€**  
TraduÃ§Ã£o visual:
- A interface deve parecer uma jornada (nÃ£o apenas um dashboard administrativo).
- Cada progresso do usuÃ¡rio precisa virar narrativa visual: fase da histÃ³ria, conquistas e evoluÃ§Ã£o.
- O visual precisa ser claro para banca e atrativo para uso real.

Tom: moderno, editorial, caloroso, com identidade de biblioteca digital gamificada.

## 2. Design Tokens (base tÃ©cnica de UI)

## 2.1 Cores (sem roxo padrÃ£o)
```css
:root {
  --bg-0: #f5f7fb;
  --bg-1: #ffffff;
  --bg-2: #edf2f7;

  --ink-strong: #10243e;
  --ink: #1d3557;
  --ink-soft: #4b6078;

  --brand-700: #0f4c81;
  --brand-600: #1769aa;
  --brand-500: #1f7ac2;
  --brand-accent: #f4a259;

  --success: #2d936c;
  --warning: #f2a900;
  --danger: #c44536;

  --line: #d9e2ec;
  --shadow: 0 10px 30px rgba(15, 47, 82, 0.12);
}
```

## 2.2 Tipografia
- TÃ­tulos: `Sora` (Google Fonts), pesos 600/700.
- Texto corrido: `Source Sans 3`, pesos 400/500/600.
- Trechos narrativos (beat/estado da trama): `Lora` itÃ¡lico para clima editorial.

## 2.3 EspaÃ§amento e raio
- Escala: 4, 8, 12, 16, 24, 32, 48.
- Raio: `12px` (cards), `999px` (chips/pills), `16px` (hero blocks).

## 3. Estilo de Componentes

## 3.1 Card base
- Fundo branco, borda suave (`--line`), sombra `--shadow`.
- Header com tÃ­tulo + status (chip).
- Corpo com informaÃ§Ã£o objetiva.

## 3.2 BotÃµes
- PrimÃ¡rio: `--brand-600`.
- SecundÃ¡rio: fundo claro com borda `--line`.
- Destrutivo: `--danger`.

## 3.3 Feedback visual
- Loading: skeleton com shimmer discreto.
- Sucesso/erro: banners com Ã­cone e texto curto.
- Estado vazio: ilustraÃ§Ã£o simples + CTA claro.

## 4. Motion (com significado)

- Entrada de pÃ¡gina: fade + slide curto (`180ms`).
- Cards da home: stagger (`40ms` entre itens).
- Conquista desbloqueada: pulse curto + brilho no flashcard.
- Respeitar `prefers-reduced-motion`.

## 5. Layout por Ãrea

## 5.1 Ãrea UsuÃ¡rio
- Home com hero narrativo (meta atual + streak + prÃ³ximo objetivo).
- Biblioteca com busca/filtro claros.
- Leitura com painel â€œEstado da tramaâ€ fixo.
- GamificaÃ§Ã£o em cards colecionÃ¡veis (badges + flashcards).

## 5.2 Ãrea Admin
- Interface mais enxuta e funcional.
- MÃ©tricas no topo, CRUD em seÃ§Ãµes tabulares com formulÃ¡rios laterais.
- Mesma identidade visual, porÃ©m menor carga decorativa.

## 6. Diretrizes de UX para objetivos do TCC

- Evitar foco em porcentagem fria: priorizar **resumo narrativo de progresso**.
- Mostrar â€œquem Ã© quemâ€ como bloco contextual apÃ³s cada avanÃ§o de leitura.
- Quizzes opcionais com feedback imediato e linguagem simples.
- Conquistas por livro devem virar coleÃ§Ã£o visual real (flashcards).

## 7. Acessibilidade e Responsividade

- Contraste mÃ­nimo AA em texto e botÃµes.
- NavegaÃ§Ã£o por teclado em todos os controles.
- Breakpoints:
  - Mobile: `<= 768px` (menu colapsado e cards em 1 coluna)
  - Tablet: `769-1024px` (2 colunas)
  - Desktop: `>= 1025px` (3-4 colunas)

## 8. ImplementaÃ§Ã£o inicial recomendada

1. Extrair tokens para `frontend/src/styles/tokens.css`.
2. Criar componentes base: `AppCard`, `StatCard`, `SectionHeader`, `BadgeChip`, `Flashcard`.
3. Aplicar tema primeiro em: `HomePage`, `BooksPage`, `GoalsPage`, `BadgesPage`.
4. SÃ³ depois evoluir para refinamento de motion e microinteraÃ§Ãµes.

## 9. CritÃ©rio de â€œvisual aprovadoâ€

O front serÃ¡ considerado visualmente aprovado quando:
1. Tiver identidade consistente em todas as pÃ¡ginas.
2. Comunicar claramente progresso + narrativa + gamificaÃ§Ã£o.
3. Ficar atraente em mobile e desktop.
4. Sustentar demonstraÃ§Ã£o de banca sem parecer template genÃ©rico.

