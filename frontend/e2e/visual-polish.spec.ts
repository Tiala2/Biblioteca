import { expect, test } from "@playwright/test";

test.setTimeout(120_000);

const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60, roles: ["ROLE_USER", "ROLE_ADMIN"] })).toString("base64url");

const auth = {
  token: `header.${payload}.sig`,
  email: "tiala@example.com",
  name: "Tiala Nobre",
  roles: ["ROLE_USER", "ROLE_ADMIN"],
};

const books = [
  { id: "book-1", title: "A Guerra dos Tronos", author: "George R. R. Martin", isbn: "9780553593716", numberOfPages: 694, hasPdf: true, hasNarrative: true, source: "LOCAL", coverUrl: null },
  { id: "book-2", title: "1984", author: "George Orwell", isbn: "9780451524935", numberOfPages: 328, hasPdf: false, hasNarrative: false, source: "OPEN", coverUrl: null },
  { id: "book-3", title: "Dom Casmurro", author: "Machado de Assis", isbn: "9788535910663", numberOfPages: 256, hasPdf: true, hasNarrative: true, source: "GUTENBERG", coverUrl: null },
];

const categories = [{ id: "cat-1", name: "Ficção", description: "Narrativas literárias e clássicos" }];
const tags = [{ id: "tag-1", name: "Narrativa" }];
const bookDetails = books.map((book) => ({
  ...book,
  publicationDate: "1996-08-06",
  averageRating: book.id === "book-1" ? 5 : 4.2,
  totalReviews: book.id === "book-1" ? 2 : 1,
  categories,
  tags,
}));
const collections = [{ id: "collection-1", title: "Clássicos essenciais", description: "Leituras para revisitar", coverUrl: null, books }];
const badges = [
  { id: "badge-1", code: "FIRST_BOOK_FINISHED", name: "Primeira jornada", description: "Concluiu o primeiro livro.", criteriaType: "FIRST_BOOK", criteriaValue: "1", active: true },
  { id: "badge-2", code: "STREAK_7_DAYS", name: "Ritmo constante", description: "Leu por 7 dias seguidos.", criteriaType: "STREAK_DAYS", criteriaValue: "7", active: true },
];
const adminUsers = [
  { id: "user-1", name: "Tiala Nobre", email: "tiala@example.com", active: true, leaderboardOptIn: true, alertsOptIn: true, role: "ADMIN", badges: [] },
  { id: "user-2", name: "Wansranier", email: "wansranier@email.com", active: true, leaderboardOptIn: true, alertsOptIn: true, role: "USER", badges: [] },
];
const alertDeliveries = [
  { id: "alert-1", userId: "user-1", email: "tiala@example.com", alertType: "NO_STREAK", channel: "EMAIL", status: "SENT", message: "Comece hoje para iniciar sua sequência de leitura.", createdAt: "2026-06-12T20:00:00" },
];

const reviews = [
  { id: "review-1", bookId: "book-1", rating: 5, comment: "Leitura envolvente.", updatedAt: "2026-06-12T20:00:00" },
  { id: "review-2", bookId: "book-1", rating: 4, comment: "Personagens fortes e conflitos bem construidos.", updatedAt: "2026-06-11T18:30:00" },
];

const narrativeInsight = {
  bookId: "book-1",
  currentPage: 42,
  phase: "BEGINNING",
  beatTitle: "Primeiros conflitos",
  plotState: "Aliancas instaveis com disputa politica entre casas.",
  knownCharacters: [
    { name: "Tyrion Lannister", role: "ALLY", note: "Atua com estrategia e adaptacao." },
    { name: "Cersei Lannister", role: "ANTAGONIST", note: "Move poder com calculo politico." },
  ],
  quizzes: [
    {
      id: "quiz-1",
      question: "O que mais marca o inicio da narrativa?",
      options: ["Estabilidade absoluta", "Aliancas instaveis", "Fim da guerra", "Ausencia de conflito"],
      correctOption: "Aliancas instaveis",
      explanation: "O trecho reforca disputas, interesses e riscos politicos.",
    },
  ],
  achievements: [
    { code: "CROWN", title: "Tabuleiro em movimento", description: "Compreendeu os principais conflitos iniciais entre as casas.", flashcardSymbol: "CROWN", unlockPage: 30, unlocked: true },
    { code: "WOLF", title: "Destino selado", description: "Chegou ao climax e concluiu os principais arcos da obra.", flashcardSymbol: "WOLF", unlockPage: 694, unlocked: false },
  ],
};

function pageOf<T>(content: T[]) {
  return { content, page: { size: 100, number: 0, totalElements: content.length, totalPages: 1 } };
}

async function mockApi(page: import("@playwright/test").Page) {
  await page.addInitScript((storedAuth) => {
    localStorage.setItem("library.auth", JSON.stringify(storedAuth));
  }, auth);

  await page.route("**/api/v1/home/resume", (route) =>
    route.fulfill({
      json: {
        userSummary: { totalInProgress: 1, totalFinished: 4, totalPagesRead: 820 },
        readings: [{ id: "reading-1", status: "IN_PROGRESS", currentPage: 42, progress: 38, book: books[0] }],
        readingProgress: {
          goal: { targetPages: 300, progressPages: 180, progressPercent: 60, remainingPages: 120, status: "ACTIVE" },
          streakDays: 6,
          pagesReadThisWeek: 95,
          sessionsThisWeek: 4,
          lastSessionAt: "2026-06-12T20:00:00",
        },
        collections: [{ id: "collection-1", title: "Clássicos essenciais", description: "Leituras para revisitar", books }],
        recommendations: books.map((book, index) => ({ ...book, favorite: index === 0, averageRating: 4.5 - index * 0.3 })),
        recentReviews: [{ bookTitle: "A Guerra dos Tronos", rating: 5 }],
      },
    })
  );

  await page.route(/.*\/api\/v1\/books(\?.*)?$/, (route) =>
    route.fulfill({ json: { content: books, page: { size: 12, number: 0, totalElements: books.length, totalPages: 1 } } })
  );
  await page.route(/.*\/api\/v1\/books\/([^/?]+)$/, (route) => {
    const id = route.request().url().match(/\/api\/v1\/books\/([^/?]+)$/)?.[1];
    return route.fulfill({ json: bookDetails.find((book) => book.id === id) ?? bookDetails[0] });
  });
  await page.route(/.*\/api\/v1\/books\/([^/?]+)\/pdf.*/, (route) =>
    route.fulfill({ status: 204, body: "" })
  );
  await page.route(/.*\/api\/v1\/books\/recommendations(\?.*)?$/, (route) => route.fulfill({ json: bookDetails }));
  await page.route(/.*\/api\/v1\/collections(\?.*)?$/, (route) => route.fulfill({ json: pageOf(collections) }));
  await page.route("**/api/admin/metrics", (route) =>
    route.fulfill({ json: { totalUsers: 2, totalBooks: books.length, totalReviews: 1, totalFavorites: 1, totalCollections: 1, totalTags: 1 } })
  );
  await page.route("**/api/admin/categories", (route) => route.fulfill({ json: categories }));
  await page.route("**/api/admin/tags", (route) => route.fulfill({ json: tags }));
  await page.route("**/api/admin/badges?**", (route) => route.fulfill({ json: pageOf(badges) }));
  await page.route("**/api/admin/favorites?**", (route) =>
    route.fulfill({ json: pageOf([{ bookId: "book-1", bookTitle: books[0].title, bookIsbn: books[0].isbn, coverUrl: null, source: "LOCAL", createdAt: "2026-06-12T20:00:00" }]) })
  );
  await page.route("**/api/admin/users?**", (route) => route.fulfill({ json: pageOf(adminUsers) }));
  await page.route("**/api/admin/alerts/deliveries?**", (route) => route.fulfill({ json: pageOf(alertDeliveries) }));
  await page.route("**/api/v1/categories", (route) => route.fulfill({ json: [{ id: "cat-1", name: "Ficção" }] }));
  await page.route("**/api/v1/tags", (route) => route.fulfill({ json: [{ id: "tag-1", name: "Narrativa" }] }));
  await page.route("**/api/v1/users/me/favorites", (route) =>
    route.fulfill({ json: [{ bookId: "book-1", bookTitle: books[0].title, bookIsbn: books[0].isbn, coverUrl: null, source: "LOCAL", createdAt: "2026-06-12T20:00:00" }] })
  );
  await page.route(/.*\/api\/v1\/reviews\/me(\?.*)?$/, (route) =>
    route.fulfill({ json: { content: [reviews[0]], page: { size: 10, number: 0, totalElements: 1, totalPages: 1 } } })
  );
  await page.route(/.*\/api\/v1\/reviews(\?.*)?$/, (route) => route.fulfill({ json: pageOf(reviews) }));
  await page.route(/.*\/api\/v1\/readings\/([^/?]+)\/narrative.*/, (route) => route.fulfill({ json: narrativeInsight }));
  await page.route("**/api/v1/users/me/favorites/*", (route) => route.fulfill({ json: true }));
  await page.route("**/api/v1/users/me/goals", (route) =>
    route.fulfill({ json: { period: "MONTHLY", targetPages: 300, progressPages: 180, remainingPages: 120, expiresInDays: 12, status: "ACTIVE", paceWarning: false } })
  );
  await page.route("**/api/v1/users/me/alerts", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/v1/users/me/streak", (route) => route.fulfill({ json: { streakDays: 6 } }));
  await page.route("**/api/v1/users/me/badges?**", (route) =>
    route.fulfill({
      json: pageOf([
        {
          id: "user-badge-1",
          code: "FIRST_BOOK_FINISHED",
          name: "Primeira jornada",
          description: "Concluiu o primeiro livro e abriu espaço para novas metas.",
          awardedAt: "2026-06-12T20:00:00",
        },
      ]),
    })
  );
  await page.route("**/api/v1/users/me", (route) =>
    route.fulfill({ json: { name: "Tiala Nobre", email: "tiala@example.com", leaderboardOptIn: true, alertsOptIn: true, badges: [] } })
  );
  await page.route("**/api/v1/users/leaderboard?**", (route) =>
    route.fulfill({ json: [{ userId: "user-1", name: "Tiala Nobre", value: 820, metric: "PAGES" }] })
  );
  await page.route("**/api/v1/**", (route) => {
    const url = route.request().url();
    if (url.includes("/api/v1/home/resume")) {
      return route.fulfill({
        json: {
          userSummary: { totalInProgress: 1, totalFinished: 4, totalPagesRead: 820 },
          readings: [{ id: "reading-1", status: "IN_PROGRESS", currentPage: 42, progress: 38, book: books[0] }],
          readingProgress: {
            goal: { targetPages: 300, progressPages: 180, progressPercent: 60, remainingPages: 120, status: "ACTIVE" },
            streakDays: 6,
            pagesReadThisWeek: 95,
            sessionsThisWeek: 4,
            lastSessionAt: "2026-06-12T20:00:00",
          },
          collections: [{ id: "collection-1", title: "Clássicos essenciais", description: "Leituras para revisitar", books }],
          recommendations: books.map((book, index) => ({ ...book, favorite: index === 0, averageRating: 4.5 - index * 0.3 })),
          recentReviews: [{ bookTitle: "A Guerra dos Tronos", rating: 5 }],
        },
      });
    }
    if (url.match(/\/api\/v1\/books(\?.*)?$/)) {
      return route.fulfill({ json: { content: books, page: { size: 12, number: 0, totalElements: books.length, totalPages: 1 } } });
    }
    if (url.match(/\/api\/v1\/books\/recommendations(\?.*)?$/)) return route.fulfill({ json: bookDetails });
    if (url.match(/\/api\/v1\/books\/([^/?]+)$/)) {
      const id = url.match(/\/api\/v1\/books\/([^/?]+)$/)?.[1];
      return route.fulfill({ json: bookDetails.find((book) => book.id === id) ?? bookDetails[0] });
    }
    if (url.match(/\/api\/v1\/collections(\?.*)?$/)) {
      return route.fulfill({ json: pageOf(collections) });
    }
    if (url.match(/\/api\/v1\/reviews\/me(\?.*)?$/)) {
      return route.fulfill({ json: { content: [reviews[0]], page: { size: 10, number: 0, totalElements: 1, totalPages: 1 } } });
    }
    if (url.match(/\/api\/v1\/reviews(\?.*)?$/)) return route.fulfill({ json: pageOf(reviews) });
    if (url.match(/\/api\/v1\/readings\/([^/?]+)\/narrative/)) return route.fulfill({ json: narrativeInsight });
    if (url.includes("/api/v1/categories")) return route.fulfill({ json: [{ id: "cat-1", name: "Ficção" }] });
    if (url.includes("/api/v1/tags")) return route.fulfill({ json: [{ id: "tag-1", name: "Narrativa" }] });
    if (url.includes("/api/v1/users/me/favorites")) {
      return route.fulfill({ json: [{ bookId: "book-1", bookTitle: books[0].title, bookIsbn: books[0].isbn, coverUrl: null, source: "LOCAL", createdAt: "2026-06-12T20:00:00" }] });
    }
    if (url.includes("/api/v1/reviews/me")) {
      return route.fulfill({ json: { content: [{ id: "review-1", bookId: "book-1", rating: 5, comment: "Leitura envolvente.", updatedAt: "2026-06-12T20:00:00" }], page: { size: 10, number: 0, totalElements: 1, totalPages: 1 } } });
    }
    if (url.includes("/api/v1/users/me/goals")) return route.fulfill({ json: { period: "MONTHLY", targetPages: 300, progressPages: 180, remainingPages: 120, expiresInDays: 12, status: "ACTIVE", paceWarning: false } });
    if (url.includes("/api/v1/users/me/alerts")) return route.fulfill({ json: [] });
    if (url.includes("/api/v1/users/me/streak")) return route.fulfill({ json: { streakDays: 6 } });
    if (url.includes("/api/v1/users/me/badges")) {
      return route.fulfill({
        json: pageOf([
          {
            id: "user-badge-1",
            code: "FIRST_BOOK_FINISHED",
            name: "Primeira jornada",
            description: "Concluiu o primeiro livro e abriu espaço para novas metas.",
            awardedAt: "2026-06-12T20:00:00",
          },
        ]),
      });
    }
    if (url.includes("/api/v1/users/me")) return route.fulfill({ json: { name: "Tiala Nobre", email: "tiala@example.com", leaderboardOptIn: true, alertsOptIn: true, badges: [] } });
    if (url.includes("/api/v1/users/leaderboard")) return route.fulfill({ json: [{ userId: "user-1", name: "Tiala Nobre", value: 820, metric: "PAGES" }] });
    return route.fulfill({ json: [] });
  });
}

async function expectVisualRouteReady(page: import("@playwright/test").Page, path: string) {
  const expectedTexts: Record<string, string[]> = {
    "/books/book-1": ["A Guerra dos Tronos", "Avaliação dos leitores", "Continue sua leitura"],
    "/books/book-1/read": ["Continue sua leitura", "Seu progresso", "Personagens deste trecho"],
    "/favorites": ["Minha Estante", "Livros salvos"],
    "/reviews": ["Suas percepções importam", "Minhas avaliações"],
    "/goals": ["Transforme leitura em constância", "Progresso da meta"],
    "/badges": ["Conquistas da sua jornada", "Progresso das próximas conquistas"],
    "/profile": ["Minha jornada de leitura", "Informações da conta"],
    "/leaderboard": ["Classificação dos leitores", "Pódio da semana"],
    "/admin/catalog": ["Gestão do Catálogo", "Acervo cadastrado"],
  };

  for (const text of expectedTexts[path] ?? []) {
    await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
  }
}

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const rootWidth = document.documentElement.scrollWidth;
    const bodyWidth = document.body.scrollWidth;
    const offenders = Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: element.className?.toString() ?? "",
          text: element.textContent?.trim().slice(0, 80) ?? "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((entry) => entry.width > 0 && (entry.left < -2 || entry.right > viewportWidth + 2))
      .slice(0, 5);

    return { viewportWidth, rootWidth, bodyWidth, offenders };
  });

  expect(overflow.rootWidth, JSON.stringify(overflow.offenders, null, 2)).toBeLessThanOrEqual(overflow.viewportWidth + 2);
  expect(overflow.bodyWidth, JSON.stringify(overflow.offenders, null, 2)).toBeLessThanOrEqual(overflow.viewportWidth + 2);
}

async function expectInteractiveControlsFit(page: import("@playwright/test").Page) {
  const crampedControls = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("button, a.btn-link, .card-actions a, .card-actions button"))
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: element.className?.toString() ?? "",
        text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) ?? "",
        width: element.clientWidth,
        scrollWidth: element.scrollWidth,
        height: element.clientHeight,
        scrollHeight: element.scrollHeight,
      }))
      .filter((entry) => entry.width > 0 && entry.height > 0 && (entry.scrollWidth > entry.width + 2 || entry.scrollHeight > entry.height + 2))
      .slice(0, 8)
  );

  expect(crampedControls, JSON.stringify(crampedControls, null, 2)).toEqual([]);
}

async function expectNoBrokenControlText(page: import("@playwright/test").Page) {
  const brokenControls = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("button:not(.book-list-row--action):not(.admin-row-action):not(.admin-book-picker__item), a.btn-link, .card-actions a, .card-actions button, .filter-chip, .import-badge, .favorite-badge, .role-pill, .pagination-row .section-sub"))
      .map((element) => {
        const text = element.textContent?.trim().replace(/\s+/g, " ") ?? "";
        const textNodes: Text[] = [];
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode();

        while (node) {
          if (node.textContent?.trim()) {
            textNodes.push(node as Text);
          }
          node = walker.nextNode();
        }

        const tops = textNodes.flatMap((textNode) => {
          const range = document.createRange();
          range.selectNodeContents(textNode);
          const rects = Array.from(range.getClientRects());
          range.detach();
          return rects.filter((rect) => rect.width > 0 && rect.height > 0).map((rect) => Math.round(rect.top));
        });
        const lineCount = new Set(tops).size;

        return {
          tag: element.tagName.toLowerCase(),
          className: element.className?.toString() ?? "",
          text: text.slice(0, 80),
          lineCount,
        };
      })
      .filter((entry) => entry.text.length > 0 && entry.lineCount > 1)
      .slice(0, 8)
  );

  expect(brokenControls, JSON.stringify(brokenControls, null, 2)).toEqual([]);
}

async function expectNoSplitWords(page: import("@playwright/test").Page) {
  const splitWords = await page.evaluate(() => {
    const selector = [
      "main h1",
      "main h2",
      "main h3",
      "main h4",
      "main p",
      "main label",
      "main .stat-box span",
      "main .stat-box strong",
      "main .section-sub",
      "main .kpi",
    ].join(", ");

    return Array.from(document.querySelectorAll<HTMLElement>(selector))
      .flatMap((element) => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const words: Array<{ word: string; lineCount: number }> = [];
        let node = walker.nextNode();

        while (node) {
          const text = node.textContent ?? "";

          for (const match of text.matchAll(/[A-Za-zÀ-ÖØ-öø-ÿ]{4,}/g)) {
            const start = match.index ?? 0;
            const range = document.createRange();
            range.setStart(node, start);
            range.setEnd(node, start + match[0].length);
            const lineCount = new Set(
              Array.from(range.getClientRects())
                .filter((rect) => rect.width > 0 && rect.height > 0)
                .map((rect) => Math.round(rect.top))
            ).size;
            range.detach();

            if (lineCount > 1) {
              words.push({ word: match[0], lineCount });
            }
          }

          node = walker.nextNode();
        }

        return words.map((entry) => ({
          ...entry,
          tag: element.tagName.toLowerCase(),
          className: element.className?.toString() ?? "",
          text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 100) ?? "",
          width: Math.round(element.getBoundingClientRect().width),
        }));
      })
      .slice(0, 8);
  });

  expect(splitWords, JSON.stringify(splitWords, null, 2)).toEqual([]);
}

test("captura telas principais para revisão visual", async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 1366, height: 768 });

  for (const path of ["/", "/books", "/books/book-1", "/books/book-1/read", "/favorites", "/reviews", "/goals", "/badges", "/profile", "/leaderboard", "/admin", "/admin/catalog", "/admin/engagement", "/admin/users", "/admin/alerts"]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    await expectVisualRouteReady(page, path);
    await expectNoHorizontalOverflow(page);
    await expectInteractiveControlsFit(page);
    await expectNoBrokenControlText(page);
    await expectNoSplitWords(page);
    const name = path === "/" ? "home" : path.slice(1).replace(/\//g, "-");
    await page.screenshot({ path: `test-results/visual-${name}.png`, fullPage: true });
  }
});

test("captura telas principais em largura mobile", async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 390, height: 844 });

  for (const path of ["/books", "/books/book-1", "/books/book-1/read", "/favorites", "/reviews", "/goals", "/badges", "/profile", "/leaderboard", "/admin/catalog"]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    await expectVisualRouteReady(page, path);
    await expectNoHorizontalOverflow(page);
    await expectInteractiveControlsFit(page);
    await expectNoBrokenControlText(page);
    await expectNoSplitWords(page);
    const name = path.slice(1).replace(/\//g, "-");
    await page.screenshot({ path: `test-results/visual-mobile-${name}.png`, fullPage: true });
  }
});

test("captura telas principais em modo noite", async ({ page }) => {
  await mockApi(page);
  await page.addInitScript(() => {
    localStorage.setItem("library.theme.mode", "night");
  });
  await page.setViewportSize({ width: 1366, height: 768 });

  for (const path of ["/", "/books", "/books/book-1", "/books/book-1/read", "/favorites", "/reviews", "/goals", "/badges", "/profile", "/leaderboard", "/admin/catalog"]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    await expectVisualRouteReady(page, path);
    await expectNoHorizontalOverflow(page);
    await expectInteractiveControlsFit(page);
    await expectNoBrokenControlText(page);
    await expectNoSplitWords(page);
    const name = path === "/" ? "home" : path.slice(1).replace(/\//g, "-");
    await page.screenshot({ path: `test-results/visual-night-${name}.png`, fullPage: true });
  }
});
